const Event = require('../models/Event');
const User = require('../models/User');

// Create new event
const createEvent = async (req, res) => {
  try {
    const event = new Event({
      ...req.body,
      organizer: req.user._id,
      isApproved: req.user.role === 'admin' // Auto-approve if admin creates event
    });

    await event.save();
    
    // Add event to user's created events
    await User.findByIdAndUpdate(req.user._id, {
      $push: { createdEvents: event._id }
    });

    // Emit real-time update for new event
    const populatedEvent = await Event.findById(event._id)
      .populate('organizer', 'name email role')
      .populate('attendees', 'name email');

    const io = req.app.get('io');
    if (event.isApproved) {
      io.to('user-room').to('admin-room').emit('newEvent', {
        event: populatedEvent,
        timestamp: Date.now()
      });
    } else {
      io.to('admin-room').emit('newEvent', {
        event: populatedEvent,
        timestamp: Date.now()
      });
    }

    res.status(201).json(populatedEvent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all events with filters
const getEvents = async (req, res) => {
  try {
    const { category, status, search } = req.query;
    const query = {};

    if (category) query.category = category;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // If not admin, show only approved and non-disabled events
    if (req.user?.role !== 'admin') {
      query.isApproved = true;
      query.isDisabled = { $ne: true };
    }

    let events = await Event.find(query)
      .populate('organizer', 'name email role')
      .populate('attendees', 'name email')
      .sort({ date: 1 });

    // Update event statuses before sending response
    const now = new Date();
    const updatedEvents = await Promise.all(events.map(async (event) => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0); // Set to start of day
      const eventEndDate = new Date(eventDate);
      eventEndDate.setHours(23, 59, 59, 999); // Set to end of day

      let statusChanged = false;
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0); // Set to start of day

      // Compare dates without time
      if (eventDate.getTime() === currentDate.getTime()) {
        event.status = 'ongoing';
        statusChanged = true;
      } else if (eventDate > now) {
        event.status = 'upcoming';
        statusChanged = true;
      } else if (now > eventEndDate) {
        event.status = 'completed';
        statusChanged = true;
      }

      if (statusChanged) {
        await event.save();
      }
      return event;
    }));

    // Sort events: ongoing first, then upcoming, then completed
    const sortedEvents = updatedEvents.sort((a, b) => {
      const statusOrder = { 'ongoing': 0, 'upcoming': 1, 'completed': 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return new Date(a.date) - new Date(b.date);
    });

    // Emit real-time update for admin dashboard
    if (req.user?.role === 'admin') {
      req.app.get('io').to('admin-room').emit('adminEventsUpdate', {
        events: sortedEvents
      });
    }

    res.json(sortedEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(400).json({ error: error.message });
  }
};

// Get single event
const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email')
      .populate('attendees', 'name email');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update event
const updateEvent = async (req, res) => {
  try {
    let event;
    
    // If admin, can edit any event
    if (req.user.role === 'admin') {
      event = await Event.findById(req.params.id);
    } else {
      // Regular users can only edit their own events
      event = await Event.findOne({
        _id: req.params.id,
        organizer: req.user._id
      });
    }

    if (!event) {
      return res.status(404).json({ error: 'Event not found or unauthorized' });
    }

    Object.assign(event, req.body);
    await event.save();

    const populatedEvent = await Event.findById(event._id)
      .populate('organizer', 'name email role')
      .populate('attendees', 'name email');

    // Emit real-time update for event update
    const io = req.app.get('io');
    io.to('admin-room').to('user-room').emit('eventUpdated', {
      event: populatedEvent,
      timestamp: Date.now()
    });

    res.json(populatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(400).json({ error: error.message });
  }
};

// Delete event
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Allow admin to delete any event, but regular users can only delete their own events
    if (req.user.role !== 'admin' && event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized to delete this event' });
    }

    await event.deleteOne();

    // Remove event from user's created events
    await User.findByIdAndUpdate(event.organizer, {
      $pull: { createdEvents: event._id }
    });

    // Remove event from all attendees' attending events
    await User.updateMany(
      { attendingEvents: event._id },
      { $pull: { attendingEvents: event._id } }
    );

    // Emit real-time update for event deletion
    const io = req.app.get('io');
    io.to('admin-room').to('user-room').volatile.emit('eventDeleted', {
      eventId: event._id,
      timestamp: Date.now()
    });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Register for event
const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.attendees.includes(req.user._id)) {
      return res.status(400).json({ error: 'Already registered for this event' });
    }

    if (event.attendees.length >= event.maxAttendees) {
      return res.status(400).json({ error: 'Event is full' });
    }

    event.attendees.push(req.user._id);
    await event.save();

    // Add event to user's attending events
    await User.findByIdAndUpdate(req.user._id, {
      $push: { attendingEvents: event._id }
    });

    const populatedEvent = await Event.findById(event._id)
      .populate('organizer', 'name email role')
      .populate('attendees', 'name email');

    // Emit real-time update
    const io = req.app.get('io');
    io.to('admin-room').to('user-room').emit('attendeeUpdate', {
      eventId: event._id,
      attendeeCount: event.attendees.length,
      event: populatedEvent
    });

    res.json(populatedEvent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Unregister from event
const unregisterFromEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // If admin is removing an attendee
    if (req.user.role === 'admin' && req.body.attendeeEmail) {
      // Find the user by email
      const attendeeToRemove = await User.findOne({ email: req.body.attendeeEmail });
      if (!attendeeToRemove) {
        return res.status(404).json({ error: 'Attendee not found' });
      }

      // Remove attendee from event
      event.attendees = event.attendees.filter(
        attendee => attendee.toString() !== attendeeToRemove._id.toString()
      );

      // Remove event from attendee's attending events
      await User.findByIdAndUpdate(attendeeToRemove._id, {
        $pull: { attendingEvents: event._id }
      });
    } else {
      // Regular user unregistering themselves
      if (!event.attendees.includes(req.user._id)) {
        return res.status(400).json({ error: 'Not registered for this event' });
      }

      event.attendees = event.attendees.filter(
        attendee => attendee.toString() !== req.user._id.toString()
      );

      // Remove event from user's attending events
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { attendingEvents: event._id }
      });
    }

    await event.save();

    const populatedEvent = await Event.findById(event._id)
      .populate('organizer', 'name email role')
      .populate('attendees', 'name email');

    // Emit real-time update
    const io = req.app.get('io');
    io.to('admin-room').to('user-room').emit('attendeeUpdate', {
      eventId: event._id,
      attendeeCount: event.attendees.length,
      event: populatedEvent
    });

    res.json(populatedEvent);
  } catch (error) {
    console.error('Error in unregisterFromEvent:', error);
    res.status(400).json({ error: error.message });
  }
};

// Approve event
const approveEvent = async (req, res) => {
  try {
    console.log('Approving event:', req.params.id, 'by user:', req.user._id);
    
    if (req.user.role !== 'admin') {
      console.log('Non-admin tried to approve event');
      return res.status(403).json({ error: 'Only admins can approve events' });
    }

    const event = await Event.findById(req.params.id);
    console.log('Found event:', event);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Update the event
    event.isApproved = true;
    const updatedEvent = await event.save();
    console.log('Event approved successfully:', updatedEvent);

    // Populate the event data
    const populatedEvent = await Event.findById(updatedEvent._id)
      .populate('organizer', 'name email role')
      .populate('attendees', 'name email');

    // Emit real-time update for event approval
    const io = req.app.get('io');
    console.log('Emitting event approval update');
    
    try {
      // Emit to admin room
      io.to('admin-room').emit('eventUpdated', {
        event: populatedEvent,
        timestamp: Date.now()
      });

      // Emit to user room
      io.to('user-room').emit('newEvent', {
        event: populatedEvent,
        timestamp: Date.now()
      });
      
      console.log('Socket events emitted successfully');
    } catch (socketError) {
      console.error('Error emitting socket events:', socketError);
      // Continue with the response even if socket emission fails
    }

    return res.status(200).json(populatedEvent);
  } catch (error) {
    console.error('Error approving event:', error);
    return res.status(500).json({ error: 'Internal server error while approving event' });
  }
};

// Toggle event status (enable/disable)
const toggleEventStatus = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can toggle event status' });
    }

    event.isDisabled = !event.isDisabled;
    await event.save();

    const populatedEvent = await Event.findById(event._id)
      .populate('organizer', 'name email role')
      .populate('attendees', 'name email');

    // Emit real-time update for event status change
    req.app.get('io').emit('eventUpdated', {
      event: populatedEvent
    });

    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
  approveEvent,
  toggleEventStatus
};