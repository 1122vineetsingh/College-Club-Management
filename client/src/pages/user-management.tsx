import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, Edit, Trash2, Shield, Mail, GraduationCap } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type User, type InsertUser } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const createUserSchema = insertUserSchema.extend({
  password: insertUserSchema.shape.password,
});

const editUserSchema = insertUserSchema.partial().omit({ password: true });

export default function UserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">You need administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
  const res = await apiRequest("POST", `/auth/register`, userData);
      return await res.json();
    },
    onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsCreateModalOpen(false);
      toast({
        title: "Success",
        description: "User created successfully!",
      });
      createForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
  const res = await apiRequest("PUT", `/api/users/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setIsEditModalOpen(false);
      setSelectedUser(null);
      toast({
        title: "Success",
        description: "User updated successfully!",
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

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
  const res = await apiRequest("DELETE", `/api/users/${id}`);
      return await res.json();
    },
    onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Success",
        description: "User deleted successfully!",
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

  const createForm = useForm<InsertUser>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      studentId: "",
      role: "member",
    },
  });

  const editForm = useForm<Partial<User>>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: "",
      email: "",
      studentId: "",
      role: "member",
    },
  });

  const onCreateSubmit = (data: InsertUser) => {
    createUserMutation.mutate(data);
  };

  const onEditSubmit = (data: Partial<User>) => {
    if (selectedUser) {
      updateUserMutation.mutate({ id: selectedUser.id, data });
    }
  };

  const handleEditUser = (userToEdit: User) => {
    setSelectedUser(userToEdit);
    editForm.reset({
      name: userToEdit.name,
      email: userToEdit.email,
      studentId: userToEdit.studentId || "",
      role: userToEdit.role,
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    deleteUserMutation.mutate(userId);
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { variant: "default" as const, icon: Shield },
      faculty: { variant: "secondary" as const, icon: GraduationCap },
      club_head: { variant: "outline" as const, icon: Users },
      member: { variant: "outline" as const, icon: Users },
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.member;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-8 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-2">Manage system users and their permissions</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-user">
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter full name" 
                          data-testid="input-user-name"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="Enter email address" 
                          data-testid="input-user-email"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="Enter password" 
                          data-testid="input-user-password"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student ID (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter student ID" 
                          data-testid="input-user-student-id"
                          value={field.value || ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          disabled={field.disabled}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-user-role">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="club_head">Club Head</SelectItem>
                          <SelectItem value="faculty">Faculty</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                    data-testid="button-cancel-create-user"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createUserMutation.isPending}
                    data-testid="button-save-create-user"
                  >
                    {createUserMutation.isPending ? "Creating..." : "Create User"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter full name" 
                        data-testid="input-edit-user-name"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="Enter email address" 
                        data-testid="input-edit-user-email"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student ID</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter student ID" 
                        data-testid="input-edit-user-student-id"
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        disabled={field.disabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-user-role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="club_head">Club Head</SelectItem>
                        <SelectItem value="faculty">Faculty</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                  data-testid="button-cancel-edit-user"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  data-testid="button-save-edit-user"
                >
                  {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Users List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users?.map((userItem) => (
          <Card key={userItem.id} className="relative" data-testid={`card-user-${userItem.id}`}>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg" data-testid={`text-user-name-${userItem.id}`}>
                    {userItem.name}
                  </CardTitle>
                  <CardDescription className="flex items-center" data-testid={`text-user-email-${userItem.id}`}>
                    <Mail className="mr-1 h-3 w-3" />
                    {userItem.email}
                  </CardDescription>
                </div>
                {getRoleBadge(userItem.role)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {userItem.studentId && (
                  <div className="text-sm text-muted-foreground" data-testid={`text-user-student-id-${userItem.id}`}>
                    <strong>Student ID:</strong> {userItem.studentId}
                  </div>
                )}
                <div className="text-sm text-muted-foreground" data-testid={`text-user-created-${userItem.id}`}>
                  <strong>Joined:</strong> {userItem.createdAt ? new Date(userItem.createdAt).toLocaleDateString() : 'Unknown'}
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditUser(userItem)}
                  data-testid={`button-edit-user-${userItem.id}`}
                >
                  <Edit className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                {userItem.id !== user?.id && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        data-testid={`button-delete-user-${userItem.id}`}
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {userItem.name}? This action cannot be undone and will remove all their data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-testid={`button-cancel-delete-user-${userItem.id}`}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteUser(userItem.id)}
                          data-testid={`button-confirm-delete-user-${userItem.id}`}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {users?.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No users found</h3>
          <p className="text-muted-foreground mb-4">Create the first user to get started</p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create First User
          </Button>
        </div>
      )}
    </div>
  );
}