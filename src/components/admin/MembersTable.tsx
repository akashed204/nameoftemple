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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "../ui/skeleton";

type MemberApplication = {
  id: string;
  created_at: string | null;
  profiles: {
    full_name: string;
    email: string;
    phone: string;
  } | null;
};

const ITEMS_PER_PAGE = 10;

const fetchMembers = async ({ page }: { page: number }): Promise<{ members: MemberApplication[], count: number }> => {
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  const { data, error, count } = await supabase
    .from("membership_applications")
    .select(`
      id,
      created_at,
      profiles (
        full_name,
        email,
        phone
      )
    `, { count: "exact" })
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const members = data.map(item => ({
    ...item,
    profiles: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
  })) as MemberApplication[];

  return { members, count: count || 0 };
};

const MembersTable = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["members", page],
    queryFn: () => fetchMembers({ page }),
    keepPreviousData: true,
  });

  const totalPages = Math.ceil((data?.count || 0) / ITEMS_PER_PAGE);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approved Members</CardTitle>
        <CardDescription>A list of all users with an approved membership.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead className="hidden md:table-cell">Phone Number</TableHead>
              <TableHead className="hidden md:table-cell">Joined On</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-red-500">Failed to load members.</TableCell>
              </TableRow>
            ) : data?.members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">No approved members found.</TableCell>
              </TableRow>
            ) : (
              data?.members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="font-medium">{member.profiles?.full_name || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">{member.profiles?.email || ''}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{member.profiles?.phone || 'N/A'}</TableCell>
                  <TableCell className="hidden md:table-cell">{member.created_at ? new Date(member.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button aria-haspopup="true" size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Toggle menu</span></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Revoke Membership</DropdownMenuItem>
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
          Showing <strong>{Math.min(data?.count || 0, (page - 1) * ITEMS_PER_PAGE + 1)}-{Math.min(page * ITEMS_PER_PAGE, data?.count || 0)}</strong> of <strong>{data?.count || 0}</strong> members
        </div>
        <Pagination className="ml-auto">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage(p => Math.max(p - 1, 1)); }} disabled={page === 1 || isLoading} />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage(p => Math.min(p + 1, totalPages)); }} disabled={page === totalPages || isLoading} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </CardFooter>
    </Card>
  );
};

export default MembersTable;
