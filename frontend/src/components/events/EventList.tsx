import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getEvents, registerForEvent, unregisterFromEvent, getCurrentUser } from '@/lib/api';
import { useToast } from '../ui/use-toast';
import EventCard from './EventCard';
import CreateEventForm from './CreateEventForm';

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
}

interface EventListProps {
    token?: string;
    isAdmin?: boolean;
}

interface SocketEvent {
    event: Event;
    eventId: string;
    attendeeCount: number;
}

export default function EventList({ token, isAdmin }: EventListProps) {
    const [events, setEvents] = useState<Event[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [filters, setFilters] = useState({
        category: 'all',
        status: 'all',
        search: '',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateEventDialog, setShowCreateEventDialog] = useState(false);
    const socket = useSocket(false);
    const { toast } = useToast();
    const [showUpcomingEvents, setShowUpcomingEvents] = useState(true);
    const [showPastEvents, setShowPastEvents] = useState(true);

    useEffect(() => {
        if (token) {
            getCurrentUser(token)
                .then(user => setCurrentUser(user))
                .catch(console.error);
        }
    }, [token]);

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            const data = await getEvents({}, token);
            // Filter out unapproved events for regular users
            const filteredData = isAdmin ? data : data.filter((event: Event) => event.isApproved);
            setEvents(filteredData);
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

    useEffect(() => {
        fetchEvents();
    }, [token, isAdmin]);

    useEffect(() => {
        if (socket) {
            // Listen for new events
            socket.on('newEvent', ({ event }) => {
                if (event.isApproved) {
                    setEvents(prev => {
                        const exists = prev.some(e => e._id === event._id);
                        if (!exists) {
                            return [...prev, event];
                        }
                        return prev;
                    });
                }
            });

            // Listen for event updates
            socket.on('eventUpdated', ({ event }) => {
                setEvents(prev => prev.map(e => e._id === event._id ? event : e));
            });

            // Listen for event deletions
            socket.on('eventDeleted', ({ eventId }) => {
                setEvents(prev => prev.filter(e => e._id !== eventId));
            });

            // Listen for attendee updates
            socket.on('attendeeUpdate', ({ event }) => {
                setEvents(prev => prev.map(e => e._id === event._id ? event : e));
            });

            return () => {
                socket.off('newEvent');
                socket.off('eventUpdated');
                socket.off('eventDeleted');
                socket.off('attendeeUpdate');
            };
        }
    }, [socket]);

    const handleRegister = async (eventId: string) => {
        if (!token) {
            toast({
                title: 'Error',
                description: 'Please login to register for events',
                variant: 'destructive',
            });
            return;
        }

        try {
            console.log('Attempting to register for event:', eventId);
            const updatedEvent = await registerForEvent(eventId, token);
            console.log('Registration successful:', updatedEvent);
            
            // Update the events state with the response from the server
            setEvents(prevEvents => prevEvents.map(event => 
                event._id === eventId ? updatedEvent : event
            ));

            toast({
                title: 'Success',
                description: 'Successfully registered for event!',
            });
        } catch (error) {
            console.error('Registration error:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to register for event',
                variant: 'destructive',
            });
        }
    };

    const handleUnregister = async (eventId: string, attendeeEmail?: string) => {
        if (!token) {
            toast({
                title: 'Error',
                description: 'Please login to unregister from events',
                variant: 'destructive',
            });
            return;
        }

        try {
            console.log('Attempting to unregister from event:', eventId);
            const updatedEvent = await unregisterFromEvent(eventId, token, attendeeEmail);
            console.log('Unregistration successful:', updatedEvent);
            
            // Update the events state with the response from the server
            setEvents(prevEvents => prevEvents.map(event => 
                event._id === eventId ? updatedEvent : event
            ));

            toast({
                title: 'Success',
                description: isAdmin ? 'Successfully removed attendee from event' : 'Successfully unregistered from event',
            });
        } catch (error) {
            console.error('Unregistration error:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to unregister from event',
                variant: 'destructive',
            });
        }
    };

    const filteredEvents = events.filter(event => {
        if (!isAdmin && !event.isApproved) {
            return false;
        }

        if (filters.category !== 'all' && event.category !== filters.category) {
            return false;
        }
        if (filters.status !== 'all' && event.status !== filters.status) {
            return false;
        }
        if (filters.search && !event.title.toLowerCase().includes(filters.search.toLowerCase())) {
            return false;
        }
        return true;
    });

    const upcomingEvents = filteredEvents.filter(event => event.status === 'upcoming');
    const pastEvents = filteredEvents.filter(event => ['completed', 'cancelled'].includes(event.status));

    const handleCreateEventSuccess = () => {
        setShowCreateEventDialog(false);
        fetchEvents();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex flex-col md:flex-row gap-4 w-full">
                    <Input
                        placeholder="Search events..."
                        value={filters.search}
                        onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="md:w-1/3"
                        disabled={isLoading}
                    />
                    <Select
                        value={filters.category}
                        onValueChange={value => setFilters(prev => ({ ...prev, category: value }))}
                        disabled={isLoading}
                    >
                        <SelectTrigger className="md:w-1/4">
                            <SelectValue placeholder="Filter by category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            <SelectItem value="Conference">Conference</SelectItem>
                            <SelectItem value="Meetup">Meetup</SelectItem>
                            <SelectItem value="Workshop">Workshop</SelectItem>
                            <SelectItem value="Social">Social</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                    {isAdmin && (
                        <Select
                            value={filters.status}
                            onValueChange={value => setFilters(prev => ({ ...prev, status: value }))}
                            disabled={isLoading}
                        >
                            <SelectTrigger className="md:w-1/4">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="upcoming">Upcoming</SelectItem>
                                <SelectItem value="ongoing">Ongoing</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <div className="flex">
                    {token && (
                        <div className="flex justify-between items-center ">
                            <Button
                                onClick={() => setShowCreateEventDialog(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white w-full md:w-auto"
                            >
                                Create New Event
                            </Button>
                        </div>
                    )}
                </div>

            </div>

            {isLoading ? (
                <div className="text-center py-8">Loading...</div>
            ) : (
                <div className="space-y-8">
                    {/* Upcoming Events Section */}
                    <section>
                        <div
                            className="flex items-center justify-between cursor-pointer mb-4 hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200"
                            onClick={() => setShowUpcomingEvents(!showUpcomingEvents)}
                        >
                            <h2 className="text-2xl font-bold">Upcoming Events</h2>
                            {showUpcomingEvents ? (
                                <ChevronUp className="h-6 w-6 transition-transform duration-200" />
                            ) : (
                                <ChevronDown className="h-6 w-6 transition-transform duration-200" />
                            )}
                        </div>
                        <div className={`transition-all duration-300 ease-in-out ${showUpcomingEvents ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                            {upcomingEvents.length === 0 ? (
                                <p className="text-center text-gray-500">No upcoming events found</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {upcomingEvents.map(event => (
                                        <EventCard
                                            key={event._id}
                                            event={event}
                                            token={token}
                                            isAdmin={isAdmin}
                                            currentUserEmail={currentUser?.email}
                                            onRegister={handleRegister}
                                            onUnregister={handleUnregister}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Past Events Section */}
                    <section>
                        <div
                            className="flex items-center justify-between cursor-pointer mb-4 hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200"
                            onClick={() => setShowPastEvents(!showPastEvents)}
                        >
                            <h2 className="text-2xl font-bold">Past Events</h2>
                            {showPastEvents ? (
                                <ChevronUp className="h-6 w-6 transition-transform duration-200" />
                            ) : (
                                <ChevronDown className="h-6 w-6 transition-transform duration-200" />
                            )}
                        </div>
                        <div className={`transition-all duration-300 ease-in-out ${showPastEvents ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                            {pastEvents.length === 0 ? (
                                <p className="text-center text-gray-500">No past events found</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {pastEvents.map(event => (
                                        <EventCard
                                            key={event._id}
                                            event={event}
                                            token={token}
                                            isAdmin={isAdmin}
                                            currentUserEmail={currentUser?.email}
                                            onRegister={handleRegister}
                                            onUnregister={handleUnregister}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            )}

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
    );
} 