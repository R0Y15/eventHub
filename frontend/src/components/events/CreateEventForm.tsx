import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock, ImagePlus, X, Loader2 } from 'lucide-react';
import { createEvent } from '@/lib/api';
import { useToast } from '../ui/use-toast';

interface CreateEventFormProps {
  onSuccess: () => void;
  token: string;
}

export default function CreateEventForm({ onSuccess, token }: CreateEventFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date(),
    time: format(new Date(), 'HH:mm'),
    location: '',
    category: '',
    maxAttendees: '',
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const [hours, minutes] = formData.time.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes);
      setFormData(prev => ({ ...prev, date: newDate }));
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    setFormData(prev => {
      const [hours, minutes] = time.split(':').map(Number);
      const newDate = new Date(prev.date);
      newDate.setHours(hours, minutes);
      return { ...prev, time, date: newDate };
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const uploadImage = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) throw new Error('Failed to upload image');
      
      const data = await response.json();
      return data.imageUrl;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let imageUrl = '';
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      await createEvent({
        ...formData,
        maxAttendees: parseInt(formData.maxAttendees),
        date: formData.date.toISOString(),
        imageUrl: imageUrl || undefined
      }, token);

      toast({
        title: 'Success',
        description: 'Event created successfully!',
      });
      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create event',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create New Event</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              name="title"
              placeholder="Event Title"
              value={formData.title}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Textarea
              name="description"
              placeholder="Event Description"
              value={formData.description}
              onChange={handleChange}
              required
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                  <div className="p-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <Input
                        type="time"
                        value={formData.time}
                        onChange={handleTimeChange}
                        className="w-full"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Input
                name="location"
                placeholder="Location"
                value={formData.location}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Select onValueChange={handleCategoryChange} required disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Conference">Conference</SelectItem>
                  <SelectItem value="Meetup">Meetup</SelectItem>
                  <SelectItem value="Workshop">Workshop</SelectItem>
                  <SelectItem value="Social">Social</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Input
                type="number"
                name="maxAttendees"
                placeholder="Maximum Attendees"
                value={formData.maxAttendees}
                onChange={handleChange}
                min="1"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('image-upload')?.click()}
                disabled={isLoading}
                className="w-full"
              >
                <ImagePlus className="mr-2 h-4 w-4" />
                {imagePreview ? 'Change Image' : 'Upload Image'}
              </Button>
              {imagePreview && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreview(null);
                  }}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={isLoading}
              className="hidden"
            />
            {imagePreview && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || isUploading}
          >
            {(isLoading || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUploading ? 'Uploading Image...' : isLoading ? 'Creating...' : 'Create Event'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}