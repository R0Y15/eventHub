'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getEvents, getCurrentUser, deleteEvent, approveEvent, toggleEventStatus, unregisterFromEvent } from '@/lib/api';
import { ChevronDown, ChevronUp, Grid, List, Bell } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EditEventForm from '@/components/events/EditEventForm';
import EventCard from '@/components/events/EventCard';
import CreateEventForm from '@/components/events/CreateEventForm';
import { useSocket } from '@/hooks/useSocket';

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
    isDisabled: boolean;
}

export default function AdminDashboard() {
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showCreateEventDialog, setShowCreateEventDialog] = useState(false);
    const [eventToDelete, setEventToDelete] = useState<string | null>(null);
    const [shouldRefresh, setShouldRefresh] = useState(0);
    const [showApprovedEvents, setShowApprovedEvents] = useState(true);
    const [showPendingEvents, setShowPendingEvents] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [editingEventId, setEditingEventId] = useState<string | null>(null);
    const router = useRouter();
    const { toast } = useToast();
    const socket = useSocket(true);
    const [token, setToken] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            checkUserRole(storedToken);
        } else {
            router.push('/admin/login');
        }
    }, []);

    const checkUserRole = async (token: string) => {
        try {
            const user = await getCurrentUser(token);
            if (user.role !== 'admin') {
                localStorage.removeItem('token');
                toast({
                    title: 'Error',
                    description: 'Access denied. Admin privileges required.',
                    variant: 'destructive',
                });
                router.push('/admin/login');
                return;
            }
            setIsAdmin(true);
            fetchEvents();
        } catch (error) {
            console.error('Failed to get user role:', error);
            localStorage.removeItem('token');
            router.push('/admin/login');
        }
    };

    useEffect(() => {
        if (socket && isAdmin) {
            console.log('Admin socket connected, joining admin room...');
            socket.emit('joinAdminRoom');

            // Listen for new events
            socket.on('newEvent', ({ event }) => {
                console.log('New event received:', event);
                setEvents(prev => {
                    const exists = prev.some(e => e._id === event._id);
                    if (!exists) {
                        return [...prev, event];
                    }
                    return prev.map(e => e._id === event._id ? event : e);
                });
            });

            // Listen for event updates
            socket.on('eventUpdated', ({ event }) => {
                console.log('Event updated:', event);
                setEvents(prev => prev.map(e => e._id === event._id ? event : e));
            });

            // Listen for event deletions
            socket.on('eventDeleted', ({ eventId }) => {
                console.log('Event deleted:', eventId);
                setEvents(prev => prev.filter(e => e._id !== eventId));
            });

            // Listen for attendee updates
            socket.on('attendeeUpdate', ({ event }) => {
                console.log('Attendee update received:', event);
                setEvents(prev => prev.map(e => e._id === event._id ? event : e));
            });

            // Listen for admin-specific updates
            socket.on('adminEventsUpdate', ({ events }) => {
                console.log('Admin events update:', events);
                if (Array.isArray(events)) {
                    setEvents(events);
                }
            });

            return () => {
                socket.off('newEvent');
                socket.off('eventUpdated');
                socket.off('eventDeleted');
                socket.off('attendeeUpdate');
                socket.off('adminEventsUpdate');
            };
        }
    }, [socket, isAdmin]);

    const fetchEvents = async () => {
        setIsLoading(true);
        try {
            if (!token) return;
            console.log('Fetching events with token:', token);
            const data = await getEvents({}, token);
            console.log('Fetched events:', data);
            if (Array.isArray(data)) {
                setEvents(data);
            } else {
                console.error('Invalid events data received:', data);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch events. Please try refreshing the page.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token && isAdmin) {
            fetchEvents();
        }
    }, [token, isAdmin]);

    const handleDeleteConfirm = async () => {
        if (!eventToDelete) return;
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            await deleteEvent(eventToDelete, token);
            setEvents(prevEvents => prevEvents.filter(event => event._id !== eventToDelete));
            toast({
                title: 'Success',
                description: 'Event deleted successfully!',
            });
            setShowDeleteDialog(false);
            setEventToDelete(null);
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to delete event',
                variant: 'destructive',
            });
        }
    };

    const handleApproveEvent = async (eventId: string) => {
        try {
            if (!token) {
                toast({
                    title: 'Error',
                    description: 'Authentication token not found',
                    variant: 'destructive',
                });
                return;
            }

            console.log('Approving event:', eventId);
            const response = await approveEvent(eventId, token);
            console.log('Approval response:', response);

            // Refresh events immediately after approval
            await fetchEvents();

            toast({
                title: 'Success',
                description: 'Event approved successfully!',
            });
        } catch (error) {
            console.error('Error approving event:', error);
            toast({
                title: 'Error',
                description: error instanceof Error
                    ? error.message
                    : 'Failed to approve event. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handleToggleStatus = async (eventId: string) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await toggleEventStatus(eventId, token);

            // Update the events state with the updated event from the response
            setEvents(prevEvents => prevEvents.map(event =>
                event._id === eventId ? response : event
            ));

            toast({
                title: 'Success',
                description: 'Event status updated successfully!',
            });
        } catch (error) {
            console.error('Error toggling event status:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to update event status',
                variant: 'destructive',
            });
        }
    };

    const handleEditSuccess = () => {
        const currentPosition = window.scrollY;
        fetchEvents().then(() => {
            window.scrollTo(0, currentPosition);
        });
    };

    const handleEventCreated = () => {
        const currentPosition = window.scrollY;
        setShouldRefresh(prev => prev + 1);
        fetchEvents().then(() => {
            window.scrollTo(0, currentPosition);
        });
    };

    const handleCreateEventSuccess = () => {
        const currentPosition = window.scrollY;
        setShowCreateEventDialog(false);
        fetchEvents().then(() => {
            window.scrollTo(0, currentPosition);
        });
    };

    const handleUnregister = async (eventId: string, attendeeEmail: string) => {
        try {
            if (!token) return;
            console.log('Admin removing attendee:', attendeeEmail, 'from event:', eventId);
            const response = await unregisterFromEvent(eventId, token, attendeeEmail);
            console.log('Unregister response:', response);

            // Update the events state with the updated event
            setEvents(prevEvents => prevEvents.map(event =>
                event._id === eventId ? response : event
            ));

            toast({
                title: 'Success',
                description: 'Successfully removed attendee from event',
            });
        } catch (error) {
            console.error('Error removing attendee:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to remove attendee',
                variant: 'destructive',
            });
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/admin/login');
        toast({
            title: 'Success',
            description: 'Logged out successfully!',
        });
    };

    return (
        <Layout token={token || undefined} onLogout={handleLogout} isAdmin={isAdmin} onEventCreated={handleEventCreated}>
            <div className="space-y-6">
                {token ? (
                    <>
                        <div className="flex justify-between items-center">
                            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                            <div className="flex gap-4 items-center">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="icon" className="w-10 h-10 relative">
                                            <Bell className="h-5 w-5" />
                                            {events.filter(event => !event.isApproved).length > 0 && (
                                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                    {events.filter(event => !event.isApproved).length}
                                                </span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[450px] p-0" align="end">
                                        <div className="p-4 border-b border-gray-200">
                                            <h3 className="font-semibold">Pending Approvals</h3>
                                        </div>
                                        <div className="max-h-[600px] overflow-y-auto">
                                            {events.filter(event => !event.isApproved).length === 0 ? (
                                                <div className="p-4 text-center text-gray-500">
                                                    No events pending approval
                                                </div>
                                            ) : (
                                                <div className="p-2 space-y-2">
                                                    {events.filter(event => !event.isApproved).map(event => (
                                                        <div key={event._id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                                                            {event.imageUrl && (
                                                                <img
                                                                    src={event.imageUrl}
                                                                    alt={event.title}
                                                                    className="w-full h-32 object-cover rounded-md"
                                                                />
                                                            )}
                                                            <div className="font-medium text-lg">{event.title}</div>
                                                            <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
                                                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                                                                <div>
                                                                    <span className="font-medium">Date: </span>
                                                                    {new Date(event.date).toLocaleDateString()}
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium">Location: </span>
                                                                    {event.location}
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium">Category: </span>
                                                                    {event.category}
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium">Capacity: </span>
                                                                    {event.maxAttendees}
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2 pt-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="w-full bg-green-50 text-green-600 hover:bg-green-100"
                                                                    onClick={() => handleApproveEvent(event._id)}
                                                                >
                                                                    Approve
                                                                </Button>
                                                                <Dialog
                                                                    open={editingEventId === event._id}
                                                                    onOpenChange={(open) => {
                                                                        if (!open) setEditingEventId(null);
                                                                    }}
                                                                >
                                                                    <DialogTrigger asChild>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="w-full"
                                                                            onClick={() => setEditingEventId(event._id)}
                                                                        >
                                                                            Edit
                                                                        </Button>
                                                                    </DialogTrigger>
                                                                    <DialogContent>
                                                                        <DialogHeader>
                                                                            <DialogTitle>Edit Event</DialogTitle>
                                                                        </DialogHeader>
                                                                        {token && (
                                                                            <EditEventForm
                                                                                event={event}
                                                                                token={token}
                                                                                onSuccess={() => {
                                                                                    setEditingEventId(null);
                                                                                    fetchEvents();
                                                                                }}
                                                                                onCancel={() => setEditingEventId(null)}
                                                                            />
                                                                        )}
                                                                    </DialogContent>
                                                                </Dialog>
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    className="w-full"
                                                                    onClick={() => {
                                                                        setEventToDelete(event._id);
                                                                        setShowDeleteDialog(true);
                                                                    }}
                                                                >
                                                                    Delete
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                                    className="w-10 h-10"
                                >
                                    {viewMode === 'grid' ? <List className="h-5 w-5" /> : <Grid className="h-5 w-5" />}
                                </Button>
                                <Button onClick={() => setShowCreateEventDialog(true)}>Create New Event</Button>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="text-center py-8">Loading...</div>
                        ) : (
                            <div className="space-y-8">
                                {/* Upcoming Events */}
                                <section>
                                    <div
                                        className="flex items-center justify-between cursor-pointer mb-4 hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200"
                                        onClick={() => setShowApprovedEvents(!showApprovedEvents)}
                                    >
                                        <h2 className="text-2xl font-bold">Events</h2>
                                        {showApprovedEvents ? (
                                            <ChevronUp className="h-6 w-6 transition-transform duration-200" />
                                        ) : (
                                            <ChevronDown className="h-6 w-6 transition-transform duration-200" />
                                        )}
                                    </div>
                                    <div className={`transition-all duration-300 ease-in-out ${showApprovedEvents ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                                        <div className={viewMode === 'grid' ?
                                            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" :
                                            "space-y-4"
                                        }>
                                            {events.filter(event => event.isApproved).map(event => (
                                                <EventCard
                                                    key={`${event._id}-${shouldRefresh}`}
                                                    event={event}
                                                    isAdmin={true}
                                                    token={token}
                                                    onDelete={(eventId) => {
                                                        setEventToDelete(eventId);
                                                        setShowDeleteDialog(true);
                                                    }}
                                                    onEdit={handleEditSuccess}
                                                    onApprove={handleApproveEvent}
                                                    onToggleStatus={handleToggleStatus}
                                                    onUnregister={handleUnregister}
                                                    viewMode={viewMode}
                                                />
                                            ))}
                                        </div>
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
                                {localStorage.getItem('token') && (
                                    <CreateEventForm
                                        token={localStorage.getItem('token') || ''}
                                        onSuccess={handleCreateEventSuccess}
                                    />
                                )}
                            </DialogContent>
                        </Dialog>

                        {/* Delete Confirmation Dialog */}
                        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Confirm Delete</DialogTitle>
                                </DialogHeader>
                                <p>Are you sure you want to delete this event? This action cannot be undone.</p>
                                <div className="flex justify-end space-x-2 mt-4">
                                    <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                                        Cancel
                                    </Button>
                                    <Button variant="destructive" onClick={handleDeleteConfirm}>
                                        Delete
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </>
                ) : (
                    <div>Loading...</div>
                )}
            </div>
        </Layout>
    );
} 