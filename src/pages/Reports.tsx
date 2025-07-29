import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { CalendarIcon, Download, TrendingUp, TrendingDown, Users, DollarSign, Activity, Calendar as CalendarIconLucide } from 'lucide-react';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalClasses: number;
  averageAttendance: number;
}

interface PaymentAnalytics {
  totalPayments: number;
  completedPayments: number;
  pendingPayments: number;
  failedPayments: number;
  monthlyTrend: Array<{ month: string; amount: number; count: number }>;
}

interface AttendanceData {
  date: string;
  count: number;
}

interface MembershipData {
  planName: string;
  count: number;
  revenue: number;
  fill: string;
}

const Reports = () => {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalMembers: 0,
    activeMembers: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalClasses: 0,
    averageAttendance: 0
  });
  const [paymentAnalytics, setPaymentAnalytics] = useState<PaymentAnalytics>({
    totalPayments: 0,
    completedPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    monthlyTrend: []
  });
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [membershipData, setMembershipData] = useState<MembershipData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const chartConfig = {
    amount: {
      label: "Amount (ETB)",
      color: "hsl(var(--primary))",
    },
    count: {
      label: "Count",
      color: "hsl(var(--secondary))",
    },
    attendance: {
      label: "Attendance",
      color: "hsl(var(--accent))",
    }
  };

  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--accent))',
    'hsl(var(--muted-foreground))',
    'hsl(var(--destructive))'
  ];

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchPaymentAnalytics(),
        fetchAttendanceData(),
        fetchMembershipData()
      ]);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch report data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    const [membersResult, paymentsResult, classesResult, attendanceResult] = await Promise.all([
      supabase.from('profiles').select('id, role'),
      supabase.from('payments').select('amount, status, payment_date'),
      supabase.from('classes').select('id'),
      supabase.from('attendance').select('id, date')
    ]);

    const totalMembers = membersResult.data?.filter(p => p.role === 'member').length || 0;
    const activeMembers = totalMembers; // Simplified for now
    
    const payments = paymentsResult.data || [];
    const totalRevenue = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = payments
      .filter(p => {
        if (!p.payment_date || p.status !== 'completed') return false;
        const paymentDate = new Date(p.payment_date);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const totalClasses = classesResult.data?.length || 0;
    const averageAttendance = attendanceResult.data?.length || 0;

    setDashboardStats({
      totalMembers,
      activeMembers,
      totalRevenue,
      monthlyRevenue,
      totalClasses,
      averageAttendance
    });
  };

  const fetchPaymentAnalytics = async () => {
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString());

    if (!payments) return;

    const totalPayments = payments.length;
    const completedPayments = payments.filter(p => p.status === 'completed').length;
    const pendingPayments = payments.filter(p => p.status === 'pending').length;
    const failedPayments = payments.filter(p => p.status === 'failed').length;

    // Generate monthly trend data
    const monthlyMap = new Map();
    payments.forEach(payment => {
      const month = format(new Date(payment.created_at), 'MMM yyyy');
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { amount: 0, count: 0 });
      }
      const current = monthlyMap.get(month);
      current.count += 1;
      if (payment.status === 'completed') {
        current.amount += Number(payment.amount);
      }
    });

    const monthlyTrend = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      ...data
    }));

    setPaymentAnalytics({
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      monthlyTrend
    });
  };

  const fetchAttendanceData = async () => {
    const { data: attendance } = await supabase
      .from('attendance')
      .select('date')
      .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
      .lte('date', format(dateRange.to, 'yyyy-MM-dd'));

    if (!attendance) return;

    const attendanceMap = new Map();
    attendance.forEach(record => {
      const date = record.date;
      attendanceMap.set(date, (attendanceMap.get(date) || 0) + 1);
    });

    const attendanceData = Array.from(attendanceMap.entries()).map(([date, count]) => ({
      date: format(new Date(date), 'MMM dd'),
      count
    }));

    setAttendanceData(attendanceData.slice(-30)); // Last 30 days
  };

  const fetchMembershipData = async () => {
    const { data: memberships } = await supabase
      .from('memberships')
      .select(`
        plan_id,
        membership_plans(name, price)
      `)
      .eq('status', 'active');

    if (!memberships) return;

    const planMap = new Map();
    memberships.forEach(membership => {
      const planName = membership.membership_plans?.name || 'Unknown';
      const price = Number(membership.membership_plans?.price || 0);
      
      if (!planMap.has(planName)) {
        planMap.set(planName, { count: 0, revenue: 0 });
      }
      const current = planMap.get(planName);
      current.count += 1;
      current.revenue += price;
    });

    const membershipData = Array.from(planMap.entries()).map(([planName, data], index) => ({
      planName,
      ...data,
      fill: COLORS[index % COLORS.length]
    }));

    setMembershipData(membershipData);
  };

  const exportReport = () => {
    toast({
      title: "Export Started",
      description: "Your report is being prepared for download",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Analytics & Reports
          </h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your gym's performance
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(range) => range?.from && range?.to && setDateRange({ from: range.from, to: range.to })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          
          <Button onClick={exportReport} className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                {dashboardStats.activeMembers} active
              </Badge>
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalRevenue.toLocaleString()} ETB</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
              {dashboardStats.monthlyRevenue.toLocaleString()} ETB this month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalClasses}</div>
            <p className="text-xs text-muted-foreground">
              Available classes
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Attendance</CardTitle>
            <CalendarIconLucide className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.averageAttendance}</div>
            <p className="text-xs text-muted-foreground">
              Monthly average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="payments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="payments">Payment Analytics</TabsTrigger>
          <TabsTrigger value="attendance">Attendance Trends</TabsTrigger>
          <TabsTrigger value="memberships">Membership Distribution</TabsTrigger>
          <TabsTrigger value="financial">Financial Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Payment Trends</CardTitle>
                <CardDescription>Monthly payment volume and revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentAnalytics.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="amount" fill="var(--color-amount)" name="Revenue (ETB)" />
                      <Bar dataKey="count" fill="var(--color-count)" name="Payment Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Status</CardTitle>
                <CardDescription>Distribution of payment statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      Completed
                    </span>
                    <Badge variant="secondary">{paymentAnalytics.completedPayments}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium flex items-center">
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                      Pending
                    </span>
                    <Badge variant="secondary">{paymentAnalytics.pendingPayments}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                      Failed
                    </span>
                    <Badge variant="secondary">{paymentAnalytics.failedPayments}</Badge>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="text-lg font-bold">
                      Total: {paymentAnalytics.totalPayments}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Attendance Trends</CardTitle>
              <CardDescription>Member check-ins over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="var(--color-attendance)" 
                      strokeWidth={3}
                      name="Daily Attendance"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memberships" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Membership Distribution</CardTitle>
                <CardDescription>Active memberships by plan</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={membershipData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ planName, count }) => `${planName}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {membershipData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plan Performance</CardTitle>
                <CardDescription>Revenue and member count by plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {membershipData.map((plan, index) => (
                    <div key={index} className="flex justify-between items-center p-3 rounded-lg border">
                      <div>
                        <div className="font-medium">{plan.planName}</div>
                        <div className="text-sm text-muted-foreground">
                          {plan.count} members
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{plan.revenue.toLocaleString()} ETB</div>
                        <div className="text-sm text-muted-foreground">
                          Total revenue
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Summary</CardTitle>
                <CardDescription>Financial overview for selected period</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Revenue</span>
                  <span className="font-bold text-green-600">
                    {dashboardStats.totalRevenue.toLocaleString()} ETB
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Monthly Revenue</span>
                  <span className="font-bold">
                    {dashboardStats.monthlyRevenue.toLocaleString()} ETB
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Average per Member</span>
                  <span className="font-bold">
                    {dashboardStats.totalMembers > 0 
                      ? Math.round(dashboardStats.totalRevenue / dashboardStats.totalMembers).toLocaleString()
                      : 0} ETB
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Payment Success Rate</span>
                  <Badge variant="secondary">
                    {paymentAnalytics.totalPayments > 0
                      ? Math.round((paymentAnalytics.completedPayments / paymentAnalytics.totalPayments) * 100)
                      : 0}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Member Retention</span>
                  <Badge variant="secondary">
                    {dashboardStats.totalMembers > 0
                      ? Math.round((dashboardStats.activeMembers / dashboardStats.totalMembers) * 100)
                      : 0}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Classes Utilization</span>
                  <Badge variant="secondary">
                    {Math.round((dashboardStats.averageAttendance / dashboardStats.totalClasses) * 100) || 0}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;