import { useState } from "react";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { MoreHorizontal } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "../ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type ApplicationStatus = "pending" | "approved" | "rejected";
type Application = {
  id: string;
  created_at: string | null;
  membership_type: "basic" | "silver" | "gold" | "platinum";
  status: ApplicationStatus | null;
  user_id: string;
  profile: {
    full_name: string;
    email: string;
  } | null;
};

const ITEMS_PER_PAGE = 10;

const fetchApplications = async ({ page, status }: { page: number; status: string }): Promise<{ applications: Application[], count: number }> => {
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  let query = supabase
    .from("membership_applications")
    .select("id, created_at, membership_type, status, user_id, profiles(full_name, email)", { count: "exact" });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  // The join syntax changed slightly, let's adapt
  const applications = data.map(item => ({
    ...item,
    profile: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
  })) as Application[];

  return { applications, count: count || 0 };
};

const updateApplicationStatus = async ({ id, status }: { id: string; status: ApplicationStatus }) => {
  const { error } = await supabase
    .from("membership_applications")
    .update({ status })
    .eq("id", id);

  if (error) throw error;
};

const ApplicationsTable = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["applications", page, statusFilter],
    queryFn: () => fetchApplications({ page, status: statusFilter }),
    keepPreviousData: true,
  });

  const mutation = useMutation({
    mutationFn: updateApplicationStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      toast({ title: "Success", description: "Application status updated." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
  
  const totalPages = Math.ceil((data?.count || 0) / ITEMS_PER_PAGE);

  const handleUpdateStatus = (id: string, status: ApplicationStatus) => {
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
    <Tabs defaultValue="all" onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value={statusFilter}>
        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
            <CardDescription>Manage membership applications.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
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
                    <TableCell colSpan={5} className="text-center text-red-500">Failed to load applications.</TableCell>
                  </TableRow>
                ) : data?.applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">No applications found for this filter.</TableCell>
                  </TableRow>
                ) : (
                  data?.applications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div className="font-medium">{app.profile?.full_name || 'N/A'}</div>
                        <div className="hidden text-sm text-muted-foreground md:inline">{app.profile?.email || ''}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell capitalize">{app.membership_type}</TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell className="hidden md:table-cell">{app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Toggle menu</span></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(app.id, 'approved')}>Approve</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateStatus(app.id, 'rejected')}>Reject</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Showing <strong>{Math.min(data?.count || 0, (page - 1) * ITEMS_PER_PAGE + 1)}-{Math.min(page * ITEMS_PER_PAGE, data?.count || 0)}</strong> of <strong>{data?.count || 0}</strong> applications
            </div>
            <Pagination className="ml-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage(p => Math.max(p - 1, 1)); }} disabled={page === 1} />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage(p => Math.min(p + 1, totalPages)); }} disabled={page === totalPages} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default ApplicationsTable;
