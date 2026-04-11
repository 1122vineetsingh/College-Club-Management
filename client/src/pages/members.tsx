import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Check, X, Eye, Edit } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { type Membership, type User, type Club } from "@shared/schema";

interface PendingMembershipWithDetails extends Membership {
  user: User;
  club: Club;
}

interface ApprovedMembershipWithDetails extends Membership {
  user: User;
  club: Club;
}

export default function Members() {
  const { user } = useAuth();
  const { toast } = useToast();
  // Fetch pending and approved memberships from backend
  const { data: pendingMemberships, isLoading: pendingLoading } = useQuery<PendingMembershipWithDetails[]>({
    queryKey: ['/api/memberships/pending'],
  });

  const { data: approvedMemberships, isLoading: approvedLoading } = useQuery<ApprovedMembershipWithDetails[]>({
    queryKey: ['/api/memberships/approved'],
  });

  const approveMembershipMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      const res = await apiRequest('PATCH', `/api/memberships/${membershipId}`, {
        status: 'approved',
        approvedBy: user?.id,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/memberships/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/memberships/approved'] });
      toast({
        title: 'Success',
        description: 'Membership request approved!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const rejectMembershipMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      const res = await apiRequest('PATCH', `/api/memberships/${membershipId}`, {
        status: 'rejected',
        approvedBy: user?.id,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/memberships/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/memberships/approved'] });
      toast({
        title: 'Success',
        description: 'Membership request rejected.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const canManageMembers = user?.role === 'admin' || user?.role === 'faculty' || user?.role === 'club_head';

  const handleApprove = (membershipId: string) => {
    approveMembershipMutation.mutate(membershipId);
  };

  const handleReject = (membershipId: string) => {
    rejectMembershipMutation.mutate(membershipId);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (pendingLoading || approvedLoading) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="mb-8">
          <Skeleton className="h-64" />
        </div>
        <div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Members</h1>
        <p className="text-muted-foreground mt-2">Manage club memberships and requests</p>
      </div>

      {/* Pending Membership Requests */}
      {canManageMembers && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="mr-2 h-5 w-5" />
              Pending Membership Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingMemberships && pendingMemberships.length > 0 ? (
              <div className="divide-y divide-border">
                {pendingMemberships.map((membership) => (
                  <div key={membership.id} className="py-4 flex items-center justify-between" data-testid={`request-${membership.id}`}>
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src="" alt={membership.user.name} />
                        <AvatarFallback>{getInitials(membership.user.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-foreground" data-testid={`text-requester-name-${membership.id}`}>
                          {membership.user.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Wants to join <span className="font-medium" data-testid={`text-club-name-${membership.id}`}>
                            {membership.club?.name || 'Unknown Club'}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Requested {membership.requestedAt ? new Date(membership.requestedAt).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(membership.id)}
                        disabled={approveMembershipMutation.isPending}
                        data-testid={`button-approve-${membership.id}`}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="mr-1 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(membership.id)}
                        disabled={rejectMembershipMutation.isPending}
                        data-testid={`button-reject-${membership.id}`}
                      >
                        <X className="mr-1 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No pending membership requests
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Members Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Active Members</CardTitle>
            <div className="flex space-x-2">
              <Input 
                placeholder="Search members..." 
                className="w-64"
                data-testid="input-search-members"
              />
              <Select>
                <SelectTrigger className="w-40" data-testid="select-filter-club">
                  <SelectValue placeholder="All Clubs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clubs</SelectItem>
                  <SelectItem value="coding-club">Coding Club</SelectItem>
                  <SelectItem value="music-club">Music Club</SelectItem>
                  <SelectItem value="art-club">Art Club</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {approvedMemberships && approvedMemberships.length > 0 ? (
                  approvedMemberships.map((membership) => (
                    <TableRow key={membership.id} className="hover:bg-accent" data-testid={`row-member-${membership.id}`}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src="" alt={membership.user?.name || ''} />
                            <AvatarFallback>{getInitials(membership.user?.name || 'Unknown')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground" data-testid={`text-member-name-${membership.id}`}>
                              {membership.user?.name || 'Unknown User'}
                            </div>
                            <div className="text-sm text-muted-foreground" data-testid={`text-member-email-${membership.id}`}>
                              {membership.user?.email || ''}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-member-club-${membership.id}`}>
                        {membership.club?.name || 'Unknown Club'}
                      </TableCell>
                      <TableCell data-testid={`text-member-role-${membership.id}`}>
                        {membership.role === 'club_head' ? 'Club Head' : 'Member'}
                      </TableCell>
                      <TableCell data-testid={`text-member-joined-${membership.id}`}>
                        {membership.approvedAt ? new Date(membership.approvedAt).toLocaleDateString() : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Badge data-testid={`badge-member-status-${membership.id}`}>
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" data-testid={`button-view-member-${membership.id}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" data-testid={`button-edit-member-${membership.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No active members found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
