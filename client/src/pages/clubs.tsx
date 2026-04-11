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
import { Plus, Users, Calendar, Edit, Trash2, Eye } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertClubSchema, type Club, type InsertClub, type Membership } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Clubs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  // fetch clubs
 // fetch clubs
  const { data: clubs, isLoading } = useQuery<Club[]>({
    queryKey: ['/api/clubs'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/clubs');
      if (!res.ok) throw new Error('Failed to fetch clubs');
      return res.json();
    },
  });

    // fetch all memberships once and compute counts per club
  const { data: memberships } = useQuery<Membership[]>({
    queryKey: ['/api/memberships'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/memberships');
      if (!res.ok) throw new Error('Failed to fetch memberships');
      return res.json();
    },
  });
  // fetch all events once (used for counts and upcoming events)
  const { data: events } = useQuery<any[]>({
    queryKey: ['/api/events'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/events');
      if (!res.ok) throw new Error('Failed to fetch events');
      return res.json();
    },
  });
  // user's memberships (to show join state)
  const { data: userMemberships } = useQuery<Membership[]>({
    queryKey: [`/api/memberships/user/${user?.id}`],
    enabled: !!user,
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/memberships/user/${user?.id}`);
      if (!res.ok) return [];
      return res.json();
    },
  });
  // helper to compute member count for a club (approved members)
  const getMembersCount = (clubId: string) => {
    if (!memberships) return 0;
    return memberships.filter(m => m.clubId === clubId && m.status === 'approved').length;
  };

  // helper to compute events count for a club
  const getEventsCount = (clubId: string) => {
    if (!events) return 0;
    return events.filter(e => e.clubId === clubId && e.isActive).length;
  };
   // upcoming events across all clubs (from events data)
  const upcomingEvents = (events ?? [])
    .filter(e => {
      try {
        return new Date(e.date) >= new Date();
      } catch {
        return false;
      }
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);
 const joinClubMutation = useMutation({
    mutationFn: async (clubId: string) => {
      if (!user) throw new Error("You must be logged in to join a club.");
      const res = await apiRequest("POST", `/api/memberships`, {
        clubId,
        userId: user.id,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to join club");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/memberships'] });
      queryClient.invalidateQueries({ queryKey: [`/api/memberships/user/${user?.id}`] });
      toast({
        title: "Request Sent",
        description: "Your request to join the club has been sent for approval.",
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


  const createClubMutation = useMutation({
    mutationFn: async (clubData: InsertClub) => {
      const res = await apiRequest("POST", `/api/clubs`, clubData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs'] });
      setIsCreateModalOpen(false);
      toast({
        title: "Success",
        description: "Club created successfully!",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
   // update/delete mutations: ensure invalidation of memberships/events if needed
  const updateClubMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertClub> }) => {
      const res = await apiRequest("PUT", `/api/clubs/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs'] });
      setIsEditModalOpen(false);
      setSelectedClub(null);
      toast({
        title: "Success",
        description: "Club updated successfully!",
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

  const deleteClubMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/clubs/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clubs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/memberships'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Success",
        description: "Club deleted successfully!",
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
  const form = useForm<InsertClub>({
    resolver: zodResolver(insertClubSchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      isActive: true,
    },
  });

  const editForm = useForm<InsertClub>({
    resolver: zodResolver(insertClubSchema),
    defaultValues: {
      name: "",
      description: "",
      imageUrl: "",
      isActive: true,
    },
  });

  const onSubmit = (data: InsertClub) => {
    createClubMutation.mutate(data);
  };

  const onEditSubmit = (data: InsertClub) => {
    if (selectedClub) {
      updateClubMutation.mutate({ id: selectedClub.id, data });
    }
  };

  const handleEditClub = (club: Club) => {
    setSelectedClub(club);
    editForm.reset({
      name: club.name,
      description: club.description,
      imageUrl: club.imageUrl || "",
      isActive: club.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleJoinClub = (club: Club) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to join a club.",
        variant: "destructive",
      });
      return;
    }
    joinClubMutation.mutate(club.id);
  };

  const handleDeleteClub = (clubId: string) => {
    deleteClubMutation.mutate(clubId);
  };

  const canCreateClub = user?.role === 'admin' || user?.role === 'faculty';

  const getMembershipStatus = (clubId: string) => {
    if (!user || !userMemberships) return null;
    return userMemberships.find(m => m.clubId === clubId);
  };

  const getJoinButtonText = (clubId: string) => {
    const membership = getMembershipStatus(clubId);
    if (!membership) return "Join";
    if (membership.status === "pending") return "Pending...";
    if (membership.status === "approved") return "Joined";
    return "Join";
  };

  const isJoinButtonDisabled = (clubId: string) => {
    const membership = getMembershipStatus(clubId);
    return membership?.status === "pending" || membership?.status === "approved" || joinClubMutation.isPending;
  };
   if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clubs</h1>
          <p className="text-muted-foreground mt-2">Manage and organize student clubs</p>
        </div>
        {canCreateClub && (
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-club">
                <Plus className="mr-2 h-4 w-4" />
                Create Club
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Club</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Club Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter club name" 
                            data-testid="input-club-name"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the club's purpose and activities"
                            data-testid="textarea-club-description"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image URL (optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/image.jpg"
                            data-testid="input-club-image"
                            {...field}
                            value={field.value ?? ""} 
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
                      data-testid="button-cancel-club"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createClubMutation.isPending}
                      data-testid="button-submit-club"
                    >
                      {createClubMutation.isPending ? "Creating..." : "Create Club"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Clubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clubs?.map((club) => (
          <Card key={club.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-club-${club.id}`}>
            {club.imageUrl && (
              <img 
                src={club.imageUrl} 
                alt={club.name}
                className="w-full h-48 object-cover"
              />
            )}
            <CardHeader>
              <div className="flex items-center justify-between mb-3">
                <CardTitle className="text-lg" data-testid={`text-club-name-${club.id}`}>
                  {club.name}
                </CardTitle>
                <Badge 
                  variant={club.isActive ? "default" : "secondary"}
                  data-testid={`badge-club-status-${club.id}`}
                >
                  {club.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <CardDescription data-testid={`text-club-description-${club.id}`}>
                {club.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span>
                  <Users className="inline mr-1 h-4 w-4" />
                  {getMembersCount(club.id)} members
                </span>
                <span>
                  <Calendar className="inline mr-1 h-4 w-4" />
                  {getEventsCount(club.id)} events
                </span>
              </div>
              <div className="flex space-x-2">
                <Button 
                  className="flex-1" 
                  onClick={() => handleJoinClub(club)}
                  disabled={isJoinButtonDisabled(club.id)}
                  data-testid={`button-join-club-${club.id}`}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {getJoinButtonText(club.id)}
                </Button>
                {canCreateClub && (
                  <>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleEditClub(club)}
                      data-testid={`button-edit-club-${club.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon"
                          data-testid={`button-delete-club-${club.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Club</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{club.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteClub(club.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {clubs?.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No clubs yet</h3>
          <p className="text-muted-foreground mb-4">Get started by creating your first club</p>
          {canCreateClub && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Club
            </Button>
          )}
        </div>
      )}

      {/* Edit Club Modal */}
      {canCreateClub && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Club</DialogTitle>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Club Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter club name"
                          data-testid="input-edit-club-name"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter club description"
                          data-testid="input-edit-club-description"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://example.com/image.jpg"
                          data-testid="input-edit-club-image"
                          {...field}
                          value={field.value ?? ""} 
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
                    data-testid="button-cancel-edit-club"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateClubMutation.isPending}
                    data-testid="button-submit-edit-club"
                  >
                    {updateClubMutation.isPending ? "Updating..." : "Update Club"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
