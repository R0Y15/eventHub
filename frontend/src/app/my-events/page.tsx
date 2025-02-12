'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getCurrentUser, getEvents, unregisterFromEvent } from '@/lib/api';
import EventCard from '@/components/events/EventCard';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import CreateEventForm from '@/components/events/CreateEventForm';
import io from 'socket.io-client';

interface User {
  email: string;
  name: string;
  role: string;
}

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  category: string;
  status: string;
  maxAttendees: number;
  imageUrl: string;
  attendees: Array<{
    name: string;
    email: string;
  }>;
  organizer: {
    name: string;
    email: string;
    role: string;
  };
  isApproved: boolean;
  isDisabled?: boolean;
}

export default function MyEventsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [registeredEvents, setRegisteredEvents] = useState<Event[]>([]);
  const [createdEvents, setCreatedEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateEventDialog, setShowCreateEventDialog] = useState(false);
  const [showRegisteredEvents, setShowRegisteredEvents] = useState(true);
  const [showCreatedEvents, setShowCreatedEvents] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const socket = io();

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.push('/login');
      return;
    }
    setToken(storedToken);
    fetchUserAndEvents(storedToken);
  }, [router]);

  const fetchUserAndEvents = async (authToken: string) => {
    try {
      const userData = await getCurrentUser(authToken);
      setUser(userData);
      const allEvents = await getEvents({}, authToken);

      // Filter registered events
      const registered = allEvents.filter((event: Event) => 
        event.attendees.some(attendee => attendee.email === userData.email)
      );
      setRegisteredEvents(registered);

      // Filter created events
      const created = allEvents.filter((event: Event) => 
        event.organizer.email === userData.email
      );
      setCreatedEvents(created);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch events',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnregister = async (eventId: string) => {
    if (!token) return;

    try {
      await unregisterFromEvent(eventId, token);
      
      // Update registered events locally
      setRegisteredEvents(prevEvents => 
          prevEvents.filter(event => event._id !== eventId)
      );

      toast({
        title: 'Success',
        description: 'Successfully unregistered from event',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to unregister from event',
        variant: 'destructive',
      });
    }
  };

  // Update socket event handlers to maintain real-time updates
  useEffect(() => {
    if (socket) {
      socket.on('attendeeUpdate', ({ event }: { event: Event }) => {
        // Update registered events if user is an attendee
        setRegisteredEvents(prevEvents => {
          const isUserAttendee = event.attendees.some(a => a.email === user?.email);
          const eventExists = prevEvents.some(e => e._id === event._id);
          
          // Ensure unique attendees
          const uniqueAttendees = event.attendees.filter((attendee, index, self) =>
            index === self.findIndex(a => a.email === attendee.email)
          );
          event.attendees = uniqueAttendees;

          if (isUserAttendee && !eventExists) {
            return [...prevEvents, event];
          } else if (!isUserAttendee && eventExists) {
            return prevEvents.filter(e => e._id !== event._id);
          } else if (isUserAttendee && eventExists) {
            return prevEvents.map(e => e._id === event._id ? event : e);
          }
          return prevEvents;
        });

        // Update created events if user is the organizer
        setCreatedEvents(prevEvents => {
          if (event.organizer.email === user?.email) {
            // Ensure unique attendees here too
            const uniqueAttendees = event.attendees.filter((attendee, index, self) =>
              index === self.findIndex(a => a.email === attendee.email)
            );
            event.attendees = uniqueAttendees;
            return prevEvents.map(e => e._id === event._id ? event : e);
          }
          return prevEvents;
        });
      });

      return () => {
        socket.off('attendeeUpdate');
      };
    }
  }, [socket, user?.email]);

  const handleCreateEventSuccess = () => {
    if (token) {
      setShowCreateEventDialog(false);
      fetchUserAndEvents(token);
    }
  };

  if (isLoading) {
    return (
      <Layout token={token || undefined} userName={user?.name}>
        <div className="text-center py-8">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout token={token || undefined} userName={user?.name}>
      <div className="space-y-8">
        {/* Create Event Button */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">My Events</h1>
          <Button 
            onClick={() => setShowCreateEventDialog(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Create New Event
          </Button>
        </div>

        {/* Events I'm Registered For */}
        <section>
          <div 
            className="flex items-center justify-between cursor-pointer mb-4 hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200"
            onClick={() => setShowRegisteredEvents(!showRegisteredEvents)}
          >
            <h2 className="text-2xl font-bold">Registered Events</h2>
            {showRegisteredEvents ? (
              <ChevronUp className="h-6 w-6 transition-transform duration-200" />
            ) : (
              <ChevronDown className="h-6 w-6 transition-transform duration-200" />
            )}
          </div>
          <div className={`transition-all duration-300 ease-in-out ${showRegisteredEvents ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            {registeredEvents.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">You haven't registered for any events yet.</p>
                <Button 
                  variant="link" 
                  onClick={() => router.push('/')}
                  className="mt-2"
                >
                  Browse Events
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {registeredEvents.map(event => (
                  <EventCard
                    key={event._id}
                    event={event}
                    token={token || undefined}
                    currentUserEmail={user?.email}
                    onUnregister={handleUnregister}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Events I've Created */}
        <section>
          <div 
            className="flex items-center justify-between cursor-pointer mb-4 hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200"
            onClick={() => setShowCreatedEvents(!showCreatedEvents)}
          >
            <h2 className="text-2xl font-bold">Events Created</h2>
            {showCreatedEvents ? (
              <ChevronUp className="h-6 w-6 transition-transform duration-200" />
            ) : (
              <ChevronDown className="h-6 w-6 transition-transform duration-200" />
            )}
          </div>
          <div className={`transition-all duration-300 ease-in-out ${showCreatedEvents ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            {createdEvents.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">You haven't created any events yet.</p>
                <Button 
                  variant="link" 
                  onClick={() => setShowCreateEventDialog(true)}
                  className="mt-2"
                >
                  Create Your First Event
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {createdEvents.map(event => (
                  <EventCard
                    key={event._id}
                    event={event}
                    token={token || undefined}
                    currentUserEmail={user?.email}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Create Event Dialog */}
        <Dialog open={showCreateEventDialog} onOpenChange={setShowCreateEventDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            {token && (
              <CreateEventForm 
                token={token} 
                onSuccess={handleCreateEventSuccess} 
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
} 