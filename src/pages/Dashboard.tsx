import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalMembers: number;
  monthlyRevenue: number;
  attendanceToday: number;
  activeClasses: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    monthlyRevenue: 0,
    attendanceToday: 0,
    activeClasses: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch member count
        const { count: memberCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        // Fetch today's attendance
        const today = new Date().toISOString().split("T")[0];
        const { count: attendanceCount } = await supabase
          .from("attendance")
          .select("*", { count: "exact", head: true })
          .eq("date", today);

        // Fetch active classes
        const { count: classCount } = await supabase
          .from("classes")
          .select("*", { count: "exact", head: true })
          .eq("status", "scheduled");

        // Fetch monthly revenue (mock data for now)
        const monthlyRevenue = 15750;

        setStats({
          totalMembers: memberCount || 0,
          monthlyRevenue,
          attendanceToday: attendanceCount || 0,
          activeClasses: classCount || 0,
        });

        // Fetch recent activity
        const { data: recentAttendance } = await supabase
          .from("attendance")
          .select(`
            *,
            profiles:user_id (first_name, last_name)
          `)
          .order("created_at", { ascending: false })
          .limit(5);

        setRecentActivity(recentAttendance || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening at your gym today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Members</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.totalMembers}</div>
            <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center mt-2">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Monthly Revenue</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">${stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-2">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Attendance Today</CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.attendanceToday}</div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
              Real-time tracking
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Active Classes</CardTitle>
            <Badge variant="secondary" className="bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800">
              {stats.activeClasses}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">{stats.activeClasses}</div>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
              Scheduled this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gradient-to-r from-card to-card/80 rounded-t-lg">
          <CardTitle className="text-xl font-semibold">Recent Activity</CardTitle>
          <CardDescription>Latest member check-ins and activities</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center ring-2 ring-primary/20">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {activity.profiles?.first_name} {activity.profiles?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Checked in at {new Date(activity.check_in_time).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={activity.check_out_time ? "default" : "secondary"}
                    className={activity.check_out_time ? "bg-green-500/10 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" : ""}
                  >
                    {activity.check_out_time ? "Completed" : "Active"}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No recent activity to display</p>
                <p className="text-sm text-muted-foreground mt-1">Check-ins will appear here once members start arriving</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}