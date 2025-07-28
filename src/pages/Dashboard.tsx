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
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceToday}</div>
            <p className="text-xs text-muted-foreground">
              Real-time tracking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <Badge variant="secondary">{stats.activeClasses}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeClasses}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest member check-ins and activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {activity.profiles?.first_name} {activity.profiles?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Checked in at {new Date(activity.check_in_time).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {activity.check_out_time ? "Completed" : "Active"}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No recent activity to display
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}