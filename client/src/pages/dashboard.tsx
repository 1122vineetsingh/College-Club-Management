import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, UsersRound, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient"; // added

interface DashboardStats {
  totalClubs: number;
  activeEvents: number;
  totalMembers: number;
  pendingRequests: number;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/dashboard/stats');
      if (!res.ok) throw new Error('Failed to fetch dashboard stats');
      return res.json();
    },
  });

  const { data: events } = useQuery<any[]>({
    queryKey: ['/api/events'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/events');
      if (!res.ok) throw new Error('Failed to fetch events');
      return res.json();
    },
  });

  const { data: activities } = useQuery<any[]>({
    queryKey: ['/api/recent-activity'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/recent-activity');
      if (!res.ok) throw new Error('Failed to fetch recent activity');
      return res.json();
    },
  });

  const formatTimeAgo = (iso?: string | Date) => {
    if (!iso) return '';
    const d = new Date(iso);
    const sec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const days = Math.floor(hr / 24);
    return `${days}d ago`;
  };

  const upcomingEvents = (events ?? [])
    .filter(e => {
      try { return new Date(e.date) >= new Date(); } catch { return false; }
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Clubs",
      value: stats?.totalClubs || 0,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900",
    },
    {
      title: "Active Events", 
      value: stats?.activeEvents || 0,
      icon: Calendar,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900",
    },
    {
      title: "Total Members",
      value: stats?.totalMembers || 0,
      icon: UsersRound,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-100 dark:bg-yellow-900",
    },
    {
      title: "Pending Requests",
      value: stats?.pendingRequests || 0,
      icon: Clock,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900",
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome back! Here's what's happening with your clubs.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`text-xl ${stat.color}`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground" data-testid={`stat-${stat.title.toLowerCase().replace(' ', '-')}`}>
                      {stat.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Events scheduled for the coming weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.length === 0 && <p className="text-muted-foreground">No upcoming events.</p>}
              {upcomingEvents.map(ev => (
                <div key={ev.id} className="flex items-center space-x-4 py-3 border-b border-border last:border-b-0">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                      <span className="text-primary-foreground font-semibold text-sm">{new Date(ev.date).getDate()}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
                    <p className="text-sm text-muted-foreground">{ev.details || ev.createdBy}</p>
                  </div>
                  <div className="text-sm text-muted-foreground">{new Date(ev.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates and actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!activities || activities.length === 0 ? (
                <p className="text-muted-foreground">No recent activity.</p>
              ) : (
                activities.slice(0, 8).map(act => (
                  <div key={act.id} className="flex items-start space-x-3 py-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        {act.type.includes('event') ? <Calendar className="text-green-600 text-xs" /> : <Users className="text-blue-600 text-xs" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        {act.type === 'membership_request' && (
                          <>
                            <span className="font-medium">{act.details?.user.name}</span> requested to join <span className="font-medium">{act.details?.club.name || act.clubId}</span>
                          </>
                        )}
                        {act.type === 'membership_approved' && (
                          <>
                            <span className="font-medium">{act.details?.user.name }</span> was approved for <span className="font-medium">{act.details?.club.name || act.clubId}</span>
                          </>
                        )}
                        {act.type === 'event_created' && (
                          <>
                          <span className="font-medium">{act.details?.event.title || act.eventId}</span> created by <span className="font-medium">{act.details?.club.name || act.createdBy}</span>
                          </>
                        )}
                        {(!['membership_request','membership_approved','event_created'].includes(act.type)) && (
                          <span className="font-medium">{act.details?.text || act.type}</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(act.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
