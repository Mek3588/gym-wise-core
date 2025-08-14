import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { CalendarIcon, Download, TrendingUp, TrendingDown, Users, DollarSign, Activity, Calendar as CalendarIconLucide, FileText, FileSpreadsheet, FileDown, RefreshCw, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { exportService, type ExportData } from "@/services/exportService";

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

  const exportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      toast({
        title: "Export Started",
        description: `Preparing ${format.toUpperCase()} report...`,
      });

      const exportData: ExportData = {
        dashboardStats,
        paymentAnalytics,
        attendanceData,
        membershipData,
        dateRange
      };

      switch (format) {
        case 'pdf':
          await exportService.exportToPDF(exportData, 'charts-container');
          break;
        case 'excel':
          await exportService.exportToExcel(exportData);
          break;
        case 'csv':
          await exportService.exportToCSV(exportData);
          break;
      }

      toast({
        title: "Export Complete",
        description: `${format.toUpperCase()} report downloaded successfully`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "There was an error exporting your report",
        variant: "destructive"
      });
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchReportData();
  };

  const setQuickDateRange = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);
    setDateRange({ from, to });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse bg-gradient-to-br from-card to-muted/50 shadow-[var(--shadow-card)]">
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
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-[var(--gradient-primary)] bg-clip-text text-transparent">
            Analytics & Reports
          </h1>
          <p className="text-muted-foreground text-lg">
            Comprehensive insights into your gym's performance and growth
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick Date Filters */}
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => setQuickDateRange(7)}>7D</Button>
            <Button variant="outline" size="sm" onClick={() => setQuickDateRange(30)}>30D</Button>
            <Button variant="outline" size="sm" onClick={() => setQuickDateRange(90)}>90D</Button>
          </div>
          
          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start text-left font-normal transition-[var(--transition-smooth)] hover:shadow-[var(--shadow-elegant)]">
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

          {/* Refresh Button */}
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
            className="transition-[var(--transition-smooth)] hover:shadow-[var(--shadow-elegant)]"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
          
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-[var(--gradient-primary)] hover:shadow-[var(--shadow-glow)] transition-[var(--transition-smooth)]">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => exportReport('pdf')} className="cursor-pointer">
                <FileText className="w-4 h-4 mr-2" />
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportReport('excel')} className="cursor-pointer">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportReport('csv')} className="cursor-pointer">
                <FileDown className="w-4 h-4 mr-2" />
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group relative overflow-hidden bg-gradient-to-br from-card to-muted/50 border-0 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-[var(--transition-smooth)] hover:-translate-y-1">
          <div className="absolute inset-0 bg-[var(--gradient-primary)] opacity-5"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold mb-2">{dashboardStats.totalMembers.toLocaleString()}</div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                {dashboardStats.activeMembers} active
              </Badge>
              <TrendingUp className="w-3 h-3 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-card to-muted/50 border-0 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-[var(--transition-smooth)] hover:-translate-y-1">
          <div className="absolute inset-0 bg-[var(--gradient-success)] opacity-5"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold mb-2">{dashboardStats.totalRevenue.toLocaleString()} ETB</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              <span>{dashboardStats.monthlyRevenue.toLocaleString()} ETB this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-card to-muted/50 border-0 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-[var(--transition-smooth)] hover:-translate-y-1">
          <div className="absolute inset-0 bg-[var(--gradient-warning)] opacity-5"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Classes</CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Activity className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold mb-2">{dashboardStats.totalClasses.toLocaleString()}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BarChart3 className="w-3 h-3 text-blue-500" />
              <span>Available classes</span>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-card to-muted/50 border-0 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elegant)] transition-[var(--transition-smooth)] hover:-translate-y-1">
          <div className="absolute inset-0 bg-[var(--gradient-danger)] opacity-5"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Attendance</CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/10">
              <CalendarIconLucide className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold mb-2">{dashboardStats.averageAttendance.toLocaleString()}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <PieChartIcon className="w-3 h-3 text-purple-500" />
              <span>Monthly average</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div id="charts-container">
        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger value="payments" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-[var(--transition-smooth)]">
              Payment Analytics
            </TabsTrigger>
            <TabsTrigger value="attendance" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-[var(--transition-smooth)]">
              Attendance Trends
            </TabsTrigger>
            <TabsTrigger value="memberships" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-[var(--transition-smooth)]">
              Membership Distribution
            </TabsTrigger>
            <TabsTrigger value="financial" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-[var(--transition-smooth)]">
              Financial Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-gradient-to-br from-card to-muted/50 border-0 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Payment Trends
                  </CardTitle>
                  <CardDescription>Monthly payment volume and revenue analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={paymentAnalytics.monthlyTrend}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="hsl(var(--primary))" 
                          fillOpacity={1} 
                          fill="url(#colorAmount)" 
                          name="Revenue (ETB)"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="count" 
                          stroke="hsl(var(--secondary))" 
                          fillOpacity={1} 
                          fill="url(#colorCount)" 
                          name="Payment Count"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-card to-muted/50 border-0 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-primary" />
                    Payment Status
                  </CardTitle>
                  <CardDescription>Distribution of payment statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                      <span className="text-sm font-medium flex items-center">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
                        Completed
                      </span>
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                        {paymentAnalytics.completedPayments}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                      <span className="text-sm font-medium flex items-center">
                        <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                        Pending
                      </span>
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                        {paymentAnalytics.pendingPayments}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                      <span className="text-sm font-medium flex items-center">
                        <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                        Failed
                      </span>
                      <Badge className="bg-red-100 text-red-700 border-red-200">
                        {paymentAnalytics.failedPayments}
                      </Badge>
                    </div>
                    <div className="pt-4 border-t border-border">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {paymentAnalytics.totalPayments}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Payments</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <Card className="bg-gradient-to-br from-card to-muted/50 border-0 shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Daily Attendance Trends
                </CardTitle>
                <CardDescription>Member check-ins and activity patterns over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={attendanceData}>
                      <defs>
                        <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="hsl(var(--primary))" 
                        fillOpacity={1} 
                        fill="url(#colorAttendance)" 
                        strokeWidth={3}
                        name="Daily Attendance"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="memberships" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-card to-muted/50 border-0 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-primary" />
                    Membership Distribution
                  </CardTitle>
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

              <Card className="bg-gradient-to-br from-card to-muted/50 border-0 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Plan Performance
                  </CardTitle>
                  <CardDescription>Revenue and member count by plan</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {membershipData.map((plan, index) => (
                      <div key={index} className="flex justify-between items-center p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/50 border border-border/50 hover:shadow-md transition-[var(--transition-smooth)]">
                        <div>
                          <div className="font-medium text-foreground">{plan.planName}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {plan.count} members
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary">{plan.revenue.toLocaleString()} ETB</div>
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
              <Card className="bg-gradient-to-br from-card to-muted/50 border-0 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                    Revenue Summary
                  </CardTitle>
                  <CardDescription>Financial overview for selected period</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                    <span className="font-medium">Total Revenue</span>
                    <span className="font-bold text-emerald-600 text-lg">
                      {dashboardStats.totalRevenue.toLocaleString()} ETB
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <span className="font-medium">Monthly Revenue</span>
                    <span className="font-bold text-blue-600">
                      {dashboardStats.monthlyRevenue.toLocaleString()} ETB
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                    <span className="font-medium">Average per Member</span>
                    <span className="font-bold text-purple-600">
                      {dashboardStats.totalMembers > 0 
                        ? Math.round(dashboardStats.totalRevenue / dashboardStats.totalMembers).toLocaleString()
                        : 0} ETB
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-card to-muted/50 border-0 shadow-[var(--shadow-card)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Performance Metrics
                  </CardTitle>
                  <CardDescription>Key performance indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30 border border-border/50">
                    <span className="font-medium">Payment Success Rate</span>
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      {paymentAnalytics.totalPayments > 0
                        ? Math.round((paymentAnalytics.completedPayments / paymentAnalytics.totalPayments) * 100)
                        : 0}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30 border border-border/50">
                    <span className="font-medium">Member Retention</span>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      {dashboardStats.totalMembers > 0
                        ? Math.round((dashboardStats.activeMembers / dashboardStats.totalMembers) * 100)
                        : 0}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30 border border-border/50">
                    <span className="font-medium">Classes Utilization</span>
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                      {Math.round((dashboardStats.averageAttendance / dashboardStats.totalClasses) * 100) || 0}%
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reports;