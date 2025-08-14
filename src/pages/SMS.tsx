import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { MessageSquare, Send, Users, Calendar, Activity, Plus, Filter } from "lucide-react";
import { format } from "date-fns";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  phone?: string;
  role: string;
}

interface Campaign {
  id: string;
  name: string;
  message: string;
  type: string;
  status: string;
  recipient_count: number;
  success_count: number;
  failed_count: number;
  created_at: string;
  sent_at?: string;
}

interface SMSLog {
  id: string;
  phone_number: string;
  message: string;
  status: string;
  sent_at?: string;
  error_message?: string;
  recipient: {
    first_name: string;
    last_name: string;
  };
}

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  due_date: string;
  status: string;
  user: {
    first_name: string;
    last_name: string;
    phone_number?: string;
  };
}

export default function SMS() {
  const [members, setMembers] = useState<Profile[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [overduePayments, setOverduePayments] = useState<Payment[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("send");
  const [filterStatus, setFilterStatus] = useState("all");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    message: "",
    type: "manual" as "payment_reminder" | "marketing" | "announcement" | "manual",
    scheduledAt: "",
  });

  const getPhone = (p: { phone_number?: string | null; phone?: string | null }) =>
    (p.phone_number || p.phone || '').trim();

  useEffect(() => {
    fetchMembers();
    fetchCampaigns();
    fetchSMSLogs();
    fetchOverduePayments();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, phone_number, phone, role");

      if (error) throw error;
      const withPhones = (data || []).filter((m: any) => getPhone(m));
      setMembers(withPhones as Profile[]);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast({
        title: "Error",
        description: "Failed to fetch members",
        variant: "destructive",
      });
    }
  };

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from("sms_campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  };

  const fetchSMSLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("sms_logs")
        .select(`
          *,
          profiles:recipient_id(first_name, last_name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setSmsLogs(data?.map(log => ({
        ...log,
        recipient: log.profiles || { first_name: "Unknown", last_name: "User" }
      })) || []);
    } catch (error) {
      console.error("Error fetching SMS logs:", error);
    }
  };

  const fetchOverduePayments = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("payments")
        .select(`
          id,
          user_id,
          amount,
          due_date,
          status,
          profiles:user_id(first_name, last_name, phone_number, phone)
        `)
        .eq("status", "pending")
        .lt("due_date", today);

      if (error) throw error;
      const mapped = (data || []).map((payment: any) => ({
        ...payment,
        user: payment.profiles || { first_name: "Unknown", last_name: "User", phone_number: null, phone: null }
      })).filter((p: any) => getPhone(p.user));
      setOverduePayments(mapped);
    } catch (error) {
      console.error("Error fetching overdue payments:", error);
    }
  };

  const handleMemberSelection = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers([...selectedMembers, memberId]);
    } else {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    }
  };

  const selectAllMembers = () => {
    const memberIds = members.filter(m => getPhone(m)).map(m => m.id);
    setSelectedMembers(memberIds);
  };

  const clearSelection = () => {
    setSelectedMembers([]);
  };

  const sendPaymentReminders = async () => {
    if (overduePayments.length === 0) {
      toast({
        title: "No Overdue Payments",
        description: "There are no overdue payments to send reminders for.",
      });
      return;
    }

    setLoading(true);
    try {
      // Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from("sms_campaigns")
        .insert({
          name: "Payment Reminder - " + format(new Date(), "yyyy-MM-dd"),
          message: "Hi {firstName}, this is a reminder that you have an overdue payment of ${amount}. Please make your payment as soon as possible. Thank you!",
          type: "payment_reminder",
          status: "scheduled",
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Prepare recipients
      const recipients = overduePayments.map(payment => ({
        id: payment.user_id,
        phone: getPhone(payment.user)!,
        firstName: payment.user.first_name,
        lastName: payment.user.last_name,
      }));

      // Send SMS
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          campaignId: campaign.id,
          recipients,
          message: "Hi {firstName}, this is a reminder that you have an overdue payment. Please make your payment as soon as possible. Thank you!",
          type: "payment_reminder",
        },
      });

      if (error) throw error;

      toast({
        title: "Payment Reminders Sent",
        description: `Payment reminders sent to ${recipients.length} members`,
      });

      fetchCampaigns();
      fetchSMSLogs();
    } catch (error) {
      console.error("Error sending payment reminders:", error);
      toast({
        title: "Error",
        description: "Failed to send payment reminders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedMembers.length === 0) {
      toast({
        title: "No Recipients",
        description: "Please select at least one member to send SMS to.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.message.trim()) {
      toast({
        title: "Missing Message",
        description: "Please enter a message to send.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create campaign
      const { data: campaign, error: campaignError } = await supabase
        .from("sms_campaigns")
        .insert({
          name: formData.name || `SMS Campaign - ${format(new Date(), "yyyy-MM-dd HH:mm")}`,
          message: formData.message,
          type: formData.type,
          status: formData.scheduledAt ? "scheduled" : "draft",
          scheduled_at: formData.scheduledAt || null,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Prepare recipients
      const recipients = members
        .filter(member => selectedMembers.includes(member.id) && getPhone(member))
        .map(member => ({
          id: member.id,
          phone: getPhone(member)!,
          firstName: member.first_name,
          lastName: member.last_name,
        }));

      // Send SMS immediately if not scheduled
      if (!formData.scheduledAt) {
        const { data, error } = await supabase.functions.invoke('send-sms', {
          body: {
            campaignId: campaign.id,
            recipients,
            message: formData.message,
            type: formData.type,
          },
        });

        if (error) throw error;
      }

      toast({
        title: "SMS Campaign Created",
        description: formData.scheduledAt 
          ? `Campaign scheduled for ${format(new Date(formData.scheduledAt), "PPP p")}`
          : `SMS sent to ${recipients.length} members`,
      });

      // Reset form
      setFormData({
        name: "",
        message: "",
        type: "manual",
        scheduledAt: "",
      });
      setSelectedMembers([]);
      setIsDialogOpen(false);
      
      fetchCampaigns();
      fetchSMSLogs();
    } catch (error) {
      console.error("Error sending SMS:", error);
      toast({
        title: "Error",
        description: "Failed to send SMS",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredLogs = smsLogs.filter(log => 
    filterStatus === "all" || log.status === filterStatus
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SMS Management</h1>
          <p className="text-muted-foreground">Send SMS messages to members and manage campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={sendPaymentReminders}
            disabled={loading || overduePayments.length === 0}
            variant="outline"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Send Payment Reminders ({overduePayments.length})
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New SMS Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create SMS Campaign</DialogTitle>
                <DialogDescription>
                  Send SMS messages to selected members
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Campaign Name (Optional)</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="SMS Campaign Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Message Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: any) => setFormData({...formData, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual Message</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="announcement">Announcement</SelectItem>
                        <SelectItem value="payment_reminder">Payment Reminder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    placeholder="Enter your message here. Use {firstName}, {lastName}, or {fullName} for personalization."
                    rows={4}
                    maxLength={160}
                  />
                  <p className="text-sm text-muted-foreground">
                    {formData.message.length}/160 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Schedule For Later (Optional)</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Select Recipients ({selectedMembers.length} selected)</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={selectAllMembers}
                      >
                        Select All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearSelection}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                  
                  <Command className="border rounded-md">
                    <CommandInput placeholder="Search members..." />
                    <CommandList className="max-h-40">
                      <CommandEmpty>No member found.</CommandEmpty>
                      <CommandGroup>
                        {members.filter(member => getPhone(member)).length === 0 ? (
                          <div className="p-4">
                            <p className="text-sm text-muted-foreground">
                              No members with phone numbers found. Add phone numbers in the Members page and refresh.
                            </p>
                          </div>
                        ) : (
                          members.filter(member => getPhone(member)).map((member) => (
                            <CommandItem
                              key={member.id}
                              value={member.id}
                              onSelect={() => {
                                const isChecked = !selectedMembers.includes(member.id);
                                handleMemberSelection(member.id, isChecked);
                              }}
                              className="flex items-center space-x-2 cursor-pointer"
                            >
                              <Checkbox
                                checked={selectedMembers.includes(member.id)}
                                className="mr-2"
                              />
                              <span className="flex-1">
                                {member.first_name} {member.last_name} - {getPhone(member)}
                                <Badge variant="outline" className="ml-2">
                                  {member.role}
                                </Badge>
                              </span>
                            </CommandItem>
                          ))
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Sending..." : formData.scheduledAt ? "Schedule SMS" : "Send SMS"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">
              {members.filter(m => getPhone(m)).length} with phone numbers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS Campaigns</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground">
              {campaigns.filter(c => c.status === "sent").length} sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent Today</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {smsLogs.filter(log => 
                log.sent_at && new Date(log.sent_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {smsLogs.filter(log => 
                log.status === "sent" && log.sent_at && new Date(log.sent_at).toDateString() === new Date().toDateString()
              ).length} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overduePayments.length}</div>
            <p className="text-xs text-muted-foreground">
              ${overduePayments.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2)} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="logs">SMS Logs</TabsTrigger>
          <TabsTrigger value="overdue">Overdue Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SMS Campaigns</CardTitle>
              <CardDescription>
                Manage your SMS campaigns and track their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Sent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {campaign.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{campaign.recipient_count}</TableCell>
                      <TableCell>
                        {campaign.recipient_count > 0 
                          ? `${Math.round((campaign.success_count / campaign.recipient_count) * 100)}%`
                          : "N/A"
                        }
                      </TableCell>
                      <TableCell>{format(new Date(campaign.created_at), "PPp")}</TableCell>
                      <TableCell>
                        {campaign.sent_at ? format(new Date(campaign.sent_at), "PPp") : "Not sent"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>SMS Logs</CardTitle>
                  <CardDescription>
                    View detailed logs of all SMS messages sent
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Message Preview</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {log.recipient.first_name} {log.recipient.last_name}
                      </TableCell>
                      <TableCell>{log.phone_number}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.message}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(log.status)}>
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.sent_at ? format(new Date(log.sent_at), "PPp") : "Not sent"}
                      </TableCell>
                      <TableCell className="text-red-600 text-sm">
                        {log.error_message}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Overdue Payments</CardTitle>
              <CardDescription>
                Members with overdue payments who can receive SMS reminders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Amount Due</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Overdue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overduePayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {payment.user.first_name} {payment.user.last_name}
                      </TableCell>
                      <TableCell>{getPhone(payment.user)}</TableCell>
                      <TableCell>${Number(payment.amount).toFixed(2)}</TableCell>
                      <TableCell>{format(new Date(payment.due_date), "PPP")}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          {Math.floor((new Date().getTime() - new Date(payment.due_date).getTime()) / (1000 * 60 * 60 * 24))} days
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}