import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Shield, Save, RotateCcw } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { type SystemSettings, type InsertSystemSettings, insertSystemSettingsSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

const defaultSettings: Omit<SystemSettings, "id" | "updatedAt" | "updatedBy"> = {
  systemName: "College Club Management System",
  systemDescription: "Manage clubs, events, and memberships efficiently",
  maintenanceMode: false,
  registrationEnabled: true,
  defaultUserRole: "member",
  maxEventsPerClub: 10,
  maxMembersPerClub: 100,
  autoApproveMembers: false,
  allowEventRegistration: true,
  emailNotificationsEnabled: true,
};

export default function SystemSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  // API base handled by apiRequest
  const [hasChanges, setHasChanges] = useState(false);

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

  // Fetch system settings from backend
  const { data: settings, isLoading } = useQuery<SystemSettings>({
    queryKey: ['/api/system/settings'],
  });

  const form = useForm<InsertSystemSettings>({
    resolver: zodResolver(insertSystemSettingsSchema),
    defaultValues: defaultSettings,
    values: settings ? {
      systemName: settings.systemName || '',
      systemDescription: settings.systemDescription || '',
      maintenanceMode: settings.maintenanceMode ?? false,
      registrationEnabled: settings.registrationEnabled ?? true,
      defaultUserRole: settings.defaultUserRole,
      maxEventsPerClub: settings.maxEventsPerClub || 10,
      maxMembersPerClub: settings.maxMembersPerClub || 100,
      autoApproveMembers: settings.autoApproveMembers ?? false,
      allowEventRegistration: settings.allowEventRegistration ?? true,
      emailNotificationsEnabled: settings.emailNotificationsEnabled ?? true,
    } : undefined,
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (settingsData: InsertSystemSettings) => {
      const response = await apiRequest('PUT', `/api/system/settings`, settingsData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system/settings'] });
      setHasChanges(false);
      toast({
        title: "Success",
        description: "System settings saved successfully!",
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

  const onSubmit = (data: InsertSystemSettings) => {
    saveSettingsMutation.mutate(data);
  };

  const handleReset = () => {
    form.reset(settings);
    setHasChanges(false);
    toast({
      title: "Reset",
      description: "Settings have been reset to saved values.",
    });
  };

  // Watch for form changes
  const watchedValues = form.watch();
  const currentHasChanges = JSON.stringify(watchedValues) !== JSON.stringify(settings);
  if (currentHasChanges !== hasChanges) {
    setHasChanges(currentHasChanges);
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
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
          <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground mt-2">Configure system-wide settings and preferences</p>
        </div>
        <div className="flex space-x-2">
          {hasChanges && (
            <Button 
              variant="outline"
              onClick={handleReset}
              data-testid="button-reset-settings"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            disabled={saveSettingsMutation.isPending || !hasChanges}
            data-testid="button-save-settings"
          >
            <Save className="mr-2 h-4 w-4" />
            {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Basic system configuration and display settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="systemName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter system name" 
                        data-testid="input-system-name"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      This name will appear in the header and throughout the application
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="systemDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter system description"
                        data-testid="textarea-system-description"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description shown on login and about pages
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maintenanceMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Maintenance Mode</FormLabel>
                      <FormDescription>
                        When enabled, only administrators can access the system
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                        data-testid="switch-maintenance-mode"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* User & Registration Settings */}
          <Card>
            <CardHeader>
              <CardTitle>User & Registration Settings</CardTitle>
              <CardDescription>
                Configure user registration and default permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="registrationEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Allow User Registration</FormLabel>
                      <FormDescription>
                        When disabled, only administrators can create new users
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                        data-testid="switch-registration-enabled"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultUserRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default User Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-default-user-role">
                          <SelectValue placeholder="Select default role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="club_head">Club Head</SelectItem>
                        <SelectItem value="faculty">Faculty</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Role automatically assigned to new users during registration
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="autoApproveMembers"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Auto-approve Club Memberships</FormLabel>
                      <FormDescription>
                        When enabled, membership requests are automatically approved
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                        data-testid="switch-auto-approve-members"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Club & Event Limits */}
          <Card>
            <CardHeader>
              <CardTitle>Club & Event Limits</CardTitle>
              <CardDescription>
                Set system-wide limits for clubs and events
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="maxEventsPerClub"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Events per Club</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="1"
                          max="100"
                          placeholder="10"
                          data-testid="input-max-events-per-club"
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of events a club can create
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxMembersPerClub"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Members per Club</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min="1"
                          max="1000"
                          placeholder="100"
                          data-testid="input-max-members-per-club"
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum number of members allowed per club
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="allowEventRegistration"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Allow Event Registration</FormLabel>
                      <FormDescription>
                        When enabled, users can register for events
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                        data-testid="switch-allow-event-registration"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure system notifications and communication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="emailNotificationsEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Email Notifications</FormLabel>
                      <FormDescription>
                        Send email notifications for important events and updates
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                        data-testid="switch-email-notifications"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </form>
      </Form>

      {/* Status Footer */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 bg-background border rounded-lg shadow-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <span className="text-sm text-muted-foreground">You have unsaved changes</span>
            <Button 
              size="sm"
              onClick={form.handleSubmit(onSubmit)}
              disabled={saveSettingsMutation.isPending}
              data-testid="button-quick-save"
            >
              {saveSettingsMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}