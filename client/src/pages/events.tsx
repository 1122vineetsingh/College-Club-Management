import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, Clock, MapPin, Users, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEventSchema, type Event, type InsertEvent, type Club } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function Events() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
// API base is handled by apiRequest; use relative paths starting with '/api'
  const { data: events, isLoading } = useQuery<Event[]>({
  queryKey: ['/api/events'],
  });

  const { data: clubs } = useQuery<Club[]>({
  queryKey: ['/api/clubs'],
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData: InsertEvent) => {
  const res = await apiRequest("POST", `/api/events`, eventData);
      return await res.json();
    },
    onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setIsCreateModalOpen(false);
      toast({
        title: "Success",
        description: "Event created successfully!",
      });
      form.reset();
    },
    onError: (error: Error) => {
      console.error("Error creating event:", error); // Debugging line
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<InsertEvent>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
      title: "",
      description: "",
      clubId: "",
      date: new Date(),
      time: "",
      location: "",
      maxParticipants: undefined,
      isActive: true,
    },
  });

  const editForm = useForm<InsertEvent>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
      title: "",
      description: "",
      clubId: "",
      date: new Date(),
      time: "",
      location: "",
      maxParticipants: undefined,
      isActive: true,
    },
  });
const onSubmit = (data: InsertEvent) => {
  // Ensure date is a Date object and handle null/undefined safely
  const dateValue = data.date ?? new Date();
  const formattedData = {
    ...data,
    date: new Date(dateValue),
  };
  createEventMutation.mutate(formattedData);
};

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertEvent> }) => {
  const res = await apiRequest("PUT", `/api/events/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      setIsEditModalOpen(false);
      setSelectedEvent(null);
      toast({
        title: "Success",
        description: "Event updated successfully!",
      });
      editForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
  const res = await apiRequest("DELETE", `/api/events/${id}`);
      return await res.json();
    },
    onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Success",
        description: "Event deleted successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onEditSubmit = (data: InsertEvent) => {
    if (selectedEvent) {
      updateEventMutation.mutate({ id: selectedEvent.id, data });
    }
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    editForm.reset({
      title: event.title,
      description: event.description,
      clubId: event.clubId,
      date: new Date(event.date),
      time: event.time,
      location: event.location,
      maxParticipants: event.maxParticipants || undefined,
      isActive: event.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    deleteEventMutation.mutate(eventId);
  };

  const canCreateEvent = user?.role === 'admin' || user?.role === 'faculty' || user?.role === 'club_head';

  const getClubName = (clubId: string) => {
    return clubs?.find(club => club.id === clubId)?.name || "Unknown Club";
  };

  const isUpcoming = (eventDate: Date) => {
    return new Date(eventDate) >= new Date();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Events</h1>
          <p className="text-muted-foreground mt-2">Manage and organize club events</p>
        </div>
        {canCreateEvent && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-event">
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Title</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter event title" 
                              data-testid="input-event-title"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="clubId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Club</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-event-club">
                                <SelectValue placeholder="Select a club" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clubs?.map((club) => (
                                <SelectItem key={club.id} value={club.id}>
                                  {club.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the event"
                            data-testid="textarea-event-description"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input 
          type="date"
          data-testid="input-event-date"
          value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
          onChange={(e) => field.onChange(new Date(e.target.value))}
        />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Time</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., 9:00 AM - 6:00 PM"
                              data-testid="input-event-time"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="maxParticipants"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Participants</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="Optional"
                              data-testid="input-event-max-participants"
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter event location"
                            data-testid="input-event-location"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateModalOpen(false)}
                      data-testid="button-cancel-event"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createEventMutation.isPending}
                      data-testid="button-submit-event"
                    >
                      {createEventMutation.isPending ? "Creating..." : "Create Event"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Edit Event Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter event title" 
                          data-testid="input-edit-event-title"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="clubId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Club</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-event-club">
                            <SelectValue placeholder="Select a club" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clubs?.map((club) => (
                            <SelectItem key={club.id} value={club.id}>
                              {club.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the event"
                        data-testid="textarea-edit-event-description"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input 
                          type="date"
                          data-testid="input-edit-event-date"
                          value={field.value ? format(new Date(field.value), 'yyyy-MM-dd') : ''}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 9:00 AM - 6:00 PM"
                          data-testid="input-edit-event-time"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="maxParticipants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Participants</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          placeholder="Optional"
                          data-testid="input-edit-event-max-participants"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Event location"
                        data-testid="input-edit-event-location"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  data-testid="button-cancel-edit-event"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateEventMutation.isPending}
                  data-testid="button-save-edit-event"
                >
                  {updateEventMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Events List */}
      <div className="space-y-6">
        {events?.map((event) => (
          <Card key={event.id} className="p-6" data-testid={`card-event-${event.id}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-primary rounded-lg flex flex-col items-center justify-center text-primary-foreground">
                    <span className="text-xs font-medium">
                      {format(new Date(event.date), 'MMM').toUpperCase()}
                    </span>
                    <span className="text-lg font-bold">
                      {format(new Date(event.date), 'd')}
                    </span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-2" data-testid={`text-event-title-${event.id}`}>
                    {event.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                    <span>
                      <Users className="inline mr-1 h-4 w-4" />
                      {getClubName(event.clubId)}
                    </span>
                    <span>
                      <Clock className="inline mr-1 h-4 w-4" />
                      {event.time}
                    </span>
                    <span>
                      <MapPin className="inline mr-1 h-4 w-4" />
                      {event.location}
                    </span>
                  </div>
                  <p className="text-muted-foreground" data-testid={`text-event-description-${event.id}`}>
                    {event.description}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={isUpcoming(event.date) ? "default" : "secondary"}
                  data-testid={`badge-event-status-${event.id}`}
                >
                  {isUpcoming(event.date) ? "Upcoming" : "Past"}
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>
                  <span className="font-medium">23</span> registered
                </span>
                {event.maxParticipants && (
                  <span>Max: {event.maxParticipants}</span>
                )}
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  data-testid={`button-view-event-${event.id}`}
                >
                  View Details
                </Button>
                {canCreateEvent && (
                  <>
                    <Button 
                      variant="outline"
                      onClick={() => handleEditEvent(event)}
                      data-testid={`button-edit-event-${event.id}`}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive"
                          data-testid={`button-delete-event-${event.id}`}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Event</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{event.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid={`button-cancel-delete-event-${event.id}`}>
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteEvent(event.id)}
                            data-testid={`button-confirm-delete-event-${event.id}`}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
                <Button data-testid={`button-manage-event-${event.id}`}>
                  Manage
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {events?.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No events yet</h3>
          <p className="text-muted-foreground mb-4">Create your first event to get started</p>
          {canCreateEvent && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Event
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
