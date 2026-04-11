import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Bell, Moon, Sun, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";

export function Navbar() {
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const [notificationCount] = useState(3);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'faculty':
        return 'secondary';
      case 'club_head':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                <GraduationCap className="text-primary-foreground" />
              </div>
              <span className="text-xl font-semibold text-foreground">Club Management</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 text-xs rounded-full p-0 flex items-center justify-center"
                  data-testid="badge-notification-count"
                >
                  {notificationCount}
                </Badge>
              )}
            </Button>

            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="button-theme-toggle">
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={user?.name} />
                    <AvatarFallback>{user ? getInitials(user.name) : 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col items-start">
                      <span className="text-foreground font-medium text-sm" data-testid="text-user-name">
                        {user?.name}
                      </span>
                      <Badge 
                        variant={getRoleBadgeVariant(user?.role || 'member')} 
                        className="text-xs"
                        data-testid="badge-user-role"
                      >
                        {user?.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem data-testid="menu-profile">
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem data-testid="menu-preferences">
                  Preferences
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleLogout}
                  className="text-destructive"
                  data-testid="menu-logout"
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
