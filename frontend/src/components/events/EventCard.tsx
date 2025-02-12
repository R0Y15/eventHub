'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import EditEventForm from './EditEventForm';
import { useState, useEffect } from 'react';
// import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

// Separate client component for date formatting
function FormattedDate({ date }: { date: string }) {
    const [formattedDate, setFormattedDate] = useState(date);

    useEffect(() => {
        try {
            const formatted = new Date(date).toLocaleDateString();
            setFormattedDate(formatted);
        } catch (error) {
            console.error('Date formatting error:', error);
            setFormattedDate(date);
        }
    }, [date]);

    // Return a placeholder during SSR
    if (typeof window === 'undefined') {
        return <span className="whitespace-nowrap">{date}</span>;
    }

    return <span className="whitespace-nowrap">{formattedDate}</span>;
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

interface EventCardProps {
    event: Event;
    token?: string;
    isAdmin?: boolean;
    onRegister?: (eventId: string) => void;
    onUnregister?: (eventId: string, email: string) => void;
    onDelete?: (eventId: string) => void;
    onEdit?: (eventId: string) => void;
    onApprove?: (eventId: string) => void;
    onToggleStatus?: (eventId: string) => void;
    currentUserEmail?: string;
    viewMode?: 'grid' | 'list';
}

export default function EventCard({
    event,
    token,
    isAdmin,
    onRegister,
    onUnregister,
    onDelete,
    onEdit,
    onApprove,
    onToggleStatus,
    currentUserEmail,
    viewMode = 'grid'
}: EventCardProps) {
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showAttendeesDialog, setShowAttendeesDialog] = useState(false);

    const handleEditSuccess = () => {
        setShowEditDialog(false);
        onEdit?.(event._id);
    };

    const isRegistered = currentUserEmail && event.attendees.some(a => a.email === currentUserEmail);

    const AttendeesList = () => (
        <Dialog open={showAttendeesDialog} onOpenChange={setShowAttendeesDialog}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Event Attendees</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                    {event.attendees.length === 0 ? (
                        <p className="text-center text-gray-500">No attendees yet</p>
                    ) : (
                        <div className="space-y-4">
                            {event.attendees.map((attendee, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                    <div>
                                        <p className="font-medium">{attendee.name}</p>
                                        <p className="text-sm text-gray-500">{attendee.email}</p>
                                    </div>
                                    {isAdmin && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                if (onUnregister) {
                                                    onUnregister(event._id, attendee.email);
                                                    setShowAttendeesDialog(false);
                                                }
                                            }}
                                            className="hover:bg-red-100 hover:text-red-600"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="mt-4 text-sm text-gray-500 text-center">
                    Total Attendees: {event.attendees.length}/{event.maxAttendees}
                </div>
            </DialogContent>
        </Dialog>
    );

    if (viewMode === 'list') {
        return (
            <div className="w-full p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-2 flex-grow">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold">{event.title}</h3>
                            {event.isDisabled && (
                                <span className="text-sm text-red-600 bg-red-100 px-2 py-1 rounded whitespace-nowrap">
                                    Disabled
                                </span>
                            )}
                            {!event.isApproved && !isAdmin && (
                                <span className="text-sm text-yellow-600 bg-yellow-100 px-2 py-1 rounded whitespace-nowrap">
                                    Pending Approval
                                </span>
                            )}
                        </div>
                        <div className="text-sm text-gray-500 flex flex-wrap gap-2">
                            <FormattedDate date={event.date} />
                            <span className="hidden md:inline">•</span>
                            <span className="whitespace-nowrap">{event.location}</span>
                            <span className="hidden md:inline">•</span>
                            <span className="whitespace-nowrap">Category: {event.category}</span>
                            <span className="hidden md:inline">•</span>
                            <span className="whitespace-nowrap">Attendees: {event.attendees.length}/{event.maxAttendees}</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-start">
                        {isAdmin ? (
                            <>
                                {!event.isApproved && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onApprove?.(event._id)}
                                        className="bg-green-50 text-green-600 hover:bg-green-100 whitespace-nowrap"
                                    >
                                        Approve
                                    </Button>
                                )}
                                {event.isApproved && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onToggleStatus?.(event._id)}
                                        className={event.isDisabled ?
                                            "bg-blue-50 text-blue-600 hover:bg-blue-100" :
                                            "bg-orange-50 text-orange-600 hover:bg-orange-100"
                                        }
                                    >
                                        {event.isDisabled ? 'Enable' : 'Disable'}
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowAttendeesDialog(true)}
                                    className="whitespace-nowrap"
                                >
                                    View Attendees
                                </Button>
                                <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            Edit
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Edit Event</DialogTitle>
                                        </DialogHeader>
                                        {token && <EditEventForm
                                            event={event}
                                            token={token}
                                            onSuccess={handleEditSuccess}
                                            onCancel={() => setShowEditDialog(false)}
                                        />}
                                    </DialogContent>
                                </Dialog>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => onDelete?.(event._id)}
                                >
                                    Delete
                                </Button>
                            </>
                        ) : (
                            event.status === 'upcoming' && event.isApproved && !event.isDisabled && (
                                isRegistered ? (
                                    <Button
                                        variant="destructive"
                                        onClick={() => onUnregister?.(event._id, currentUserEmail!)}
                                    >
                                        Unregister
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => onRegister?.(event._id)}
                                        disabled={!token || event.attendees.length >= event.maxAttendees}
                                    >
                                        {event.attendees.length >= event.maxAttendees ? 'Full' : 'Register'}
                                    </Button>
                                )
                            )
                        )}
                    </div>
                </div>
                {event.imageUrl && (
                    <img
                        src={event.imageUrl || '/default.png'}
                        alt={event.title}
                        className="w-full h-32 object-cover rounded-md"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/default.png';
                        }}
                    />
                )}
                <AttendeesList />
            </div>
        );
    }

    // Grid view (default)
    return (
        <Card className={`overflow-hidden w-full ${event.isDisabled ? 'opacity-75' : ''}`}>
            <img
                src={event.imageUrl || '/default.png'}
                alt={event.title}
                className="w-full h-48 object-cover"
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/default.png';
                }}
            />
            <CardHeader className="space-y-2">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-2">
                        <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                        {(event.isDisabled || (!event.isApproved && !isAdmin)) && (
                            <div className="flex flex-wrap gap-2">
                                {event.isDisabled && (
                                    <span className="text-sm text-red-600 bg-red-100 px-2 py-1 rounded">
                                        Disabled
                                    </span>
                                )}
                                {!event.isApproved && !isAdmin && (
                                    <span className="text-sm text-yellow-600 bg-yellow-100 px-2 py-1 rounded">
                                        Pending Approval
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    {isAdmin && (
                        <div className="flex flex-wrap gap-2">
                            {!event.isApproved && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onApprove?.(event._id)}
                                    className="bg-green-50 text-green-600 hover:bg-green-100"
                                >
                                    Approve
                                </Button>
                            )}
                            {event.isApproved && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onToggleStatus?.(event._id)}
                                    className={event.isDisabled ?
                                        "bg-blue-50 text-blue-600 hover:bg-blue-100" :
                                        "bg-orange-50 text-orange-600 hover:bg-orange-100"
                                    }
                                >
                                    {event.isDisabled ? 'Enable' : 'Disable'}
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAttendeesDialog(true)}
                            >
                                View Attendees
                            </Button>
                            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        Edit
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Edit Event</DialogTitle>
                                    </DialogHeader>
                                    {token && <EditEventForm
                                        event={event}
                                        token={token}
                                        onSuccess={handleEditSuccess}
                                        onCancel={() => setShowEditDialog(false)}
                                    />}
                                </DialogContent>
                            </Dialog>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => onDelete?.(event._id)}
                            >
                                Delete
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <p className="text-sm text-gray-500 line-clamp-2">{event.description}</p>
                    <div className="flex flex-col gap-1 text-sm">
                        <div className="flex justify-between">
                            <FormattedDate date={event.date} />
                            <span>{event.location}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Category: {event.category}</span>
                            <span>
                                Attendees: {event.attendees.length}/{event.maxAttendees}
                            </span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm">
                            Organized by: {event.organizer.role === 'admin' ? 'Community Owner' : event.organizer.name}
                        </span>
                        {!isAdmin && event.status === 'upcoming' && event.isApproved && !event.isDisabled && (
                            isRegistered ? (
                                <Button
                                    variant="destructive"
                                    onClick={() => onUnregister?.(event._id, currentUserEmail!)}
                                >
                                    Unregister
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => onRegister?.(event._id)}
                                    disabled={!token || event.attendees.length >= event.maxAttendees}
                                >
                                    {event.attendees.length >= event.maxAttendees ? 'Full' : 'Register'}
                                </Button>
                            )
                        )}
                    </div>
                </div>
            </CardContent>
            <AttendeesList />
        </Card>
    );
} 