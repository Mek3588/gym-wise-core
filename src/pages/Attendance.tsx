import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Search, Plus, Calendar as CalendarIcon, CheckCircle, Clock, QrCode, UserCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AttendanceRecord {
  id: string;
  user_id: string;
  date: string;
  check_in_time: string;
  check_out_time?: string;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const ITEMS_PER_PAGE = 15;

export default function Attendance() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [viewMode, setViewMode] = useState<"daily" | "history">("daily");
  const { toast } = useToast();

  useEffect(() => {
    fetchAttendanceRecords();
    fetchMembers();
  }, [dateFilter, viewMode]);

  const fetchAttendanceRecords = async () => {
    try {
      let query = supabase
        .from("attendance")
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            email
          )
        `)
        .order("check_in_time", { ascending: false });

      if (viewMode === "daily") {
        const selectedDate = format(dateFilter, "yyyy-MM-dd");
        query = query.eq("date", selectedDate);
      }

      const { data, error } = await query.limit(viewMode === "daily" ? 100 : 50);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch attendance records",
          variant: "destructive",
        });
      } else {
        setAttendanceRecords(data || []);
      }
    } catch (error) {
      console.error("Error fetching attendance records:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .eq("role", "member")
        .order("first_name");

      if (error) {
        console.error("Error fetching members:", error);
      } else {
        setMembers(data || []);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedMemberId) {
      toast({
        title: "Error",
        description: "Please select a member",
        variant: "destructive",
      });
      return;
    }

    try {
      const today = format(new Date(), "yyyy-MM-dd");
      
      // Check if member already checked in today
      const { data: existingRecord } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", selectedMemberId)
        .eq("date", today)
        .single();

      if (existingRecord) {
        toast({
          title: "Already Checked In",
          description: "This member has already checked in today",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("attendance")
        .insert({
          user_id: selectedMemberId,
          date: today,
          check_in_time: new Date().toISOString(),
        });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Member checked in successfully",
        });
        fetchAttendanceRecords();
        setIsCheckInDialogOpen(false);
        setSelectedMemberId("");
      }
    } catch (error) {
      console.error("Error checking in member:", error);
      toast({
        title: "Error",
        description: "Failed to check in member",
        variant: "destructive",
      });
    }
  };

  const handleCheckOut = async (attendanceId: string) => {
    try {
      const { error } = await supabase
        .from("attendance")
        .update({
          check_out_time: new Date().toISOString(),
        })
        .eq("id", attendanceId);

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Member checked out successfully",
        });
        fetchAttendanceRecords();
      }
    } catch (error) {
      console.error("Error checking out member:", error);
      toast({
        title: "Error",
        description: "Failed to check out member",
        variant: "destructive",
      });
    }
  };

  const filteredRecords = attendanceRecords.filter((record) => {
    const matchesSearch = 
      record.profiles.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.profiles.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.profiles.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && !record.check_out_time) ||
      (statusFilter === "completed" && record.check_out_time);

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getStatusBadge = (record: AttendanceRecord) => {
    if (record.check_out_time) {
      return <Badge variant="outline">Completed</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const getDuration = (record: AttendanceRecord) => {
    if (!record.check_out_time) return "Active";
    
    const checkIn = new Date(record.check_in_time);
    const checkOut = new Date(record.check_out_time);
    const duration = Math.floor((checkOut.getTime() - checkIn.getTime()) / (1000 * 60)); // minutes
    
    if (duration < 60) {
      return `${duration} min`;
    }
    return `${Math.floor(duration / 60)}h ${duration % 60}m`;
  };

  const todayStats = {
    totalCheckIns: attendanceRecords.filter(r => r.date === format(new Date(), "yyyy-MM-dd")).length,
    activeMembers: attendanceRecords.filter(r => r.date === format(new Date(), "yyyy-MM-dd") && !r.check_out_time).length,
    completedSessions: attendanceRecords.filter(r => r.date === format(new Date(), "yyyy-MM-dd") && r.check_out_time).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance</h1>
          <p className="text-muted-foreground">Track member check-ins and gym attendance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <QrCode className="mr-2 h-4 w-4" />
            QR Scanner
          </Button>
          <Dialog open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserCheck className="mr-2 h-4 w-4" />
                Check In Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Check In Member</DialogTitle>
                <DialogDescription>
                  Select a member to check them in for today's session.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="member">Select Member</Label>
                  <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a member" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.first_name} {member.last_name} - {member.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCheckIn} className="w-full">
                  Check In
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Check-ins</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.totalCheckIns}</div>
            <p className="text-xs text-muted-foreground">
              Total members who visited today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Active</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.activeMembers}</div>
            <p className="text-xs text-muted-foreground">
              Members currently in the gym
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.completedSessions}</div>
            <p className="text-xs text-muted-foreground">
              Finished workouts today
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Attendance Records ({filteredRecords.length})</CardTitle>
              <CardDescription>
                {viewMode === "daily" 
                  ? `Attendance for ${format(dateFilter, "MMMM d, yyyy")}`
                  : "Recent attendance history"
                }
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={viewMode} onValueChange={(value: "daily" | "history") => setViewMode(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily View</SelectItem>
                  <SelectItem value="history">History</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {viewMode === "daily" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dateFilter, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFilter}
                    onSelect={(date) => date && setDateFilter(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            )}

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.length > 0 ? (
                  paginatedRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.profiles.first_name} {record.profiles.last_name}
                      </TableCell>
                      <TableCell>
                        {format(new Date(record.date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(record.check_in_time), "h:mm a")}
                      </TableCell>
                      <TableCell>
                        {record.check_out_time 
                          ? format(new Date(record.check_out_time), "h:mm a")
                          : "—"
                        }
                      </TableCell>
                      <TableCell>{getDuration(record)}</TableCell>
                      <TableCell>{getStatusBadge(record)}</TableCell>
                      <TableCell className="text-right">
                        {!record.check_out_time && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCheckOut(record.id)}
                          >
                            Check Out
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No attendance records found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredRecords.length)} of {filteredRecords.length} results
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                    if (page > totalPages) return null;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}