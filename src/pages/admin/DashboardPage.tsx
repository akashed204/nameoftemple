import {
  Users,
  FileClock,
  IndianRupee,
  Calendar,
} from "lucide-react";
import StatCard from "@/components/admin/StatCard";
import RecentApplicationsTable from "@/components/admin/RecentApplicationsTable";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

const fetchDashboardStats = async () => {
  const { count: totalMembers, error: membersError } = await supabase
    .from("membership_applications")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved");

  const { count: pendingApplications, error: pendingError } = await supabase
    .from("membership_applications")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const { data: revenueData, error: revenueError } = await supabase
    .from("membership_applications")
    .select("amount")
    .eq("status", "approved");

  if (membersError || pendingError || revenueError) {
    console.error("Error fetching stats:", membersError || pendingError || revenueError);
    throw new Error("Failed to fetch dashboard statistics");
  }

  const totalRevenue = revenueData?.reduce((sum, item) => sum + item.amount, 0) || 0;
  
  // Hardcoded events count for now
  const upcomingEvents = 4;

  return { totalMembers, pendingApplications, totalRevenue, upcomingEvents };
};

const DashboardPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: fetchDashboardStats,
  });

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        {isLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : isError ? (
          <div className="col-span-4 text-red-500">Failed to load statistics.</div>
        ) : (
          <>
            <StatCard
              title="Total Members"
              value={data?.totalMembers?.toString() || '0'}
              icon={Users}
              description="All approved members"
            />
            <StatCard
              title="Pending Applications"
              value={data?.pendingApplications?.toString() || '0'}
              icon={FileClock}
              description="Awaiting review"
            />
            <StatCard
              title="Total Revenue"
              value={`₹${data?.totalRevenue.toLocaleString()}`}
              icon={IndianRupee}
              description="From approved memberships"
            />
            <StatCard
              title="Upcoming Events"
              value={data?.upcomingEvents.toString() || '0'}
              icon={Calendar}
              description="In the next 30 days"
            />
          </>
        )}
      </div>
      <div className="grid gap-4 md:gap-8">
        <RecentApplicationsTable />
      </div>
    </>
  );
};

export default DashboardPage;
