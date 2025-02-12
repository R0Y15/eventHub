const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Conference', 'Meetup', 'Workshop', 'Social', 'Other']
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  attendees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxAttendees: {
    type: Number,
    required: true
  },
  imageUrl: {
    type: String,
    default: '/default-event.jpg'
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isDisabled: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Virtual for checking if event is full
eventSchema.virtual('isFull').get(function() {
  return this.attendees.length >= this.maxAttendees;
});

// Add pre-save middleware to update status based on date
eventSchema.pre('save', function(next) {
  const now = new Date();
  const eventDate = new Date(this.date);
  const eventEndDate = new Date(eventDate);
  eventEndDate.setHours(eventDate.getHours() + 24); // Event is considered ongoing for 24 hours
  
  if (eventDate > now) {
    this.status = 'upcoming';
  } else if (now >= eventDate && now <= eventEndDate) {
    this.status = 'ongoing';
  } else {
    this.status = 'completed';
  }
  
  next();
});

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;