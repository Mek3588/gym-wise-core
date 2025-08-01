import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Settings as SettingsIcon, 
  Database, 
  Mail, 
  MessageSquare, 
  Bell,
  Save,
  RefreshCw,
  AlertTriangle
} from "lucide-react";

interface SystemSettings {
  gym_name: string;
  gym_email: string;
  gym_phone: string;
  gym_address: string;
  auto_payment_reminders: boolean;
  sms_notifications: boolean;
  email_notifications: boolean;
  membership_auto_renewal: boolean;
  late_payment_grace_period: number;
  max_class_capacity: number;
}

export function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    gym_name: "GymWise Core",
    gym_email: "admin@gymwise.com",
    gym_phone: "+1 (555) 123-4567",
    gym_address: "123 Fitness Street, Health City, HC 12345",
    auto_payment_reminders: true,
    sms_notifications: true,
    email_notifications: true,
    membership_auto_renewal: false,
    late_payment_grace_period: 7,
    max_class_capacity: 20,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [systemStats, setSystemStats] = useState({
    totalMembers: 0,
    totalPayments: 0,
    totalClasses: 0,
    totalSMS: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    setIsLoading(true);
    try {
      // Get system statistics
      const [membersResult, paymentsResult, classesResult, smsResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('payments').select('id', { count: 'exact' }),
        supabase.from('classes').select('id', { count: 'exact' }),
        supabase.from('sms_logs').select('id', { count: 'exact' }),
      ]);

      setSystemStats({
        totalMembers: membersResult.count || 0,
        totalPayments: paymentsResult.count || 0,
        totalClasses: classesResult.count || 0,
        totalSMS: smsResult.count || 0,
      });
    } catch (error) {
      console.error('Error loading system stats:', error);
      toast({
        title: "Error",
        description: "Failed to load system statistics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof SystemSettings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a real implementation, you would save these to a system_settings table
      // For now, we'll simulate saving to localStorage and show success
      localStorage.setItem('gym_system_settings', JSON.stringify(settings));
      
      toast({
        title: "Success",
        description: "System settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save system settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    setSettings({
      gym_name: "GymWise Core",
      gym_email: "admin@gymwise.com",
      gym_phone: "+1 (555) 123-4567",
      gym_address: "123 Fitness Street, Health City, HC 12345",
      auto_payment_reminders: true,
      sms_notifications: true,
      email_notifications: true,
      membership_auto_renewal: false,
      late_payment_grace_period: 7,
      max_class_capacity: 20,
    });
  };

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            System Overview
          </CardTitle>
          <CardDescription>
            Current system statistics and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">{systemStats.totalMembers}</div>
              <div className="text-sm text-muted-foreground">Total Members</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-secondary-foreground">{systemStats.totalPayments}</div>
              <div className="text-sm text-muted-foreground">Total Payments</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-accent-foreground">{systemStats.totalClasses}</div>
              <div className="text-sm text-muted-foreground">Total Classes</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">{systemStats.totalSMS}</div>
              <div className="text-sm text-muted-foreground">SMS Sent</div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={loadSystemStats} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Stats
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gym Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Gym Information
          </CardTitle>
          <CardDescription>
            Basic information about your gym
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gym_name">Gym Name</Label>
              <Input
                id="gym_name"
                value={settings.gym_name}
                onChange={(e) => handleInputChange('gym_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gym_email">Contact Email</Label>
              <Input
                id="gym_email"
                type="email"
                value={settings.gym_email}
                onChange={(e) => handleInputChange('gym_email', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gym_phone">Phone Number</Label>
              <Input
                id="gym_phone"
                value={settings.gym_phone}
                onChange={(e) => handleInputChange('gym_phone', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gym_address">Address</Label>
              <Input
                id="gym_address"
                value={settings.gym_address}
                onChange={(e) => handleInputChange('gym_address', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure how and when notifications are sent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  SMS Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Send SMS notifications to members
                </p>
              </div>
              <Switch
                checked={settings.sms_notifications}
                onCheckedChange={(checked) => handleInputChange('sms_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Send email notifications to members
                </p>
              </div>
              <Switch
                checked={settings.email_notifications}
                onCheckedChange={(checked) => handleInputChange('email_notifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Payment Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically send payment reminder notifications
                </p>
              </div>
              <Switch
                checked={settings.auto_payment_reminders}
                onCheckedChange={(checked) => handleInputChange('auto_payment_reminders', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Business Rules</CardTitle>
          <CardDescription>
            Configure business logic and operational parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grace_period">Late Payment Grace Period (days)</Label>
              <Input
                id="grace_period"
                type="number"
                min="0"
                max="30"
                value={settings.late_payment_grace_period}
                onChange={(e) => handleInputChange('late_payment_grace_period', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_capacity">Default Max Class Capacity</Label>
              <Input
                id="max_capacity"
                type="number"
                min="1"
                max="100"
                value={settings.max_class_capacity}
                onChange={(e) => handleInputChange('max_class_capacity', parseInt(e.target.value) || 20)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label>Membership Auto-Renewal</Label>
              <p className="text-sm text-muted-foreground">
                Automatically renew memberships when they expire
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.membership_auto_renewal}
                onCheckedChange={(checked) => handleInputChange('membership_auto_renewal', checked)}
              />
              {settings.membership_auto_renewal && (
                <Badge variant="secondary">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Button variant="outline" onClick={resetToDefaults} className="w-full sm:w-auto">
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}