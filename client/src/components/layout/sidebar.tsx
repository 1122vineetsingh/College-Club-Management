import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  UsersRound, 
  BarChart3,
  UserCog,
  Settings 
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function Sidebar() {
  const { user } = useAuth();
  const [location] = useLocation();

  const navigationItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      title: "Clubs",
      href: "/clubs",
      icon: Users,
    },
    {
      title: "Events",
      href: "/events",
      icon: Calendar,
    },
    {
      title: "Members",
      href: "/members",
      icon: UsersRound,
    },
    {
      title: "Reports",
      href: "/reports",
      icon: BarChart3,
    },
  ];

  const adminItems = [
    {
      title: "User Management",
      href: "/users",
      icon: UserCog,
    },
    {
      title: "System Settings", 
      href: "/settings",
      icon: Settings,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <aside className="w-64 bg-card border-r border-border shadow-sm h-full">
      <div className="p-6">
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive(item.href) ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive(item.href) && "bg-accent text-accent-foreground"
                  )}
                  data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            );
          })}

          {/* Admin Only Section */}
          {isAdmin && (
            <div className="pt-4 border-t border-border">
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Admin
              </h3>
              {adminItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive(item.href) ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        isActive(item.href) && "bg-accent text-accent-foreground"
                      )}
                      data-testid={`nav-${item.title.toLowerCase().replace(' ', '-')}`}
                    >
                      <Icon className="mr-3 h-4 w-4" />
                      {item.title}
                    </Button>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
}
