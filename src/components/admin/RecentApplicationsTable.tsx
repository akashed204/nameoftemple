import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "../ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type Application = {
  id: string;
  created_at: string | null;
  membership_type: "basic" | "silver" | "gold" | "platinum";
  status: "pending" | "approved" | "rejected" | null;
  user_id: string;
  profile: {
    full_name: string;
    email: string;
  } | null;
};

const fetchRecentApplications = async (): Promise<Application[]> => {
  const { data: applications, error: applicationsError } = await supabase
    .from("membership_applications")
    .select("id, created_at, membership_type, status, user_id")
    .order("created_at", { ascending: false })
    .limit(5);

  if (applicationsError) throw applicationsError;

  const userIds = applications.map((app) => app.user_id);
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds);

  if (profilesError) throw profilesError;

  const profilesMap = new Map(profiles.map((p) => [p.id, p]));

  return applications.map((app) => ({
    ...app,
    profile: profilesMap.get(app.user_id) || null,
  }));
};

const updateApplicationStatus = async ({ id, status }: { id: string, status: 'approved' | 'rejected' }) => {
  const { error } = await supabase
    .from("membership_applications")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
};

const RecentApplicationsTable = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: applications, isLoading, isError } = useQuery({
    queryKey: ["recentApplications"],
    queryFn: fetchRecentApplications,
  });

  const mutation = useMutation({
    mutationFn: updateApplicationStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recentApplications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      toast({ title: "Success", description: "Application status updated." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleUpdateStatus = (id: string, status: 'approved' | 'rejected') => {
    mutation.mutate({ id, status });
  };

  const getStatusBadge = (status: string | null) => {
    const variants: any = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
    };
    return <Badge variant={variants[status || ''] || 'secondary'} className="capitalize">{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Applications</CardTitle>
        <CardDescription>
          A list of the most recent membership applications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead className="hidden md:table-cell">
                Membership Type
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Applied On</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-red-500">
                  Failed to load applications.
                </TableCell>
              </TableRow>
            ) : (
              applications?.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <div className="font-medium">{app.profile?.full_name || 'N/A'}</div>
                    <div className="hidden text-sm text-muted-foreground md:inline">
                      {app.profile?.email || ''}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell capitalize">
                    {app.membership_type}
                  </TableCell>
                  <TableCell>{getStatusBadge(app.status)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(app.id, 'approved')}>
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleUpdateStatus(app.id, 'rejected')}>
                          Reject
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RecentApplicationsTable;
