import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  UserCheck,
  Calendar,
  DollarSign,
  BarChart3,
  Settings,
  Dumbbell,
  Users2,
  MessageSquare,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { Badge } from "@/components/ui/badge";

const allNavigation = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, roles: ['admin', 'trainer', 'member'] },
  { title: "Members", url: "/members", icon: Users, roles: ['admin', 'trainer'] },
  { title: "Staff", url: "/staff", icon: Users2, roles: ['admin'] },
  { title: "Plans", url: "/plans", icon: CreditCard, roles: ['admin'] },
  { title: "Attendance", url: "/attendance", icon: UserCheck, roles: ['admin', 'trainer', 'member'] },
  { title: "Schedules", url: "/schedules", icon: Calendar, roles: ['admin', 'trainer', 'member'] },
  { title: "Payments", url: "/payments", icon: DollarSign, roles: ['admin', 'trainer'] },
  { title: "SMS", url: "/sms", icon: MessageSquare, roles: ['admin', 'trainer'] },
  { title: "Reports", url: "/reports", icon: BarChart3, roles: ['admin', 'trainer'] },
  { title: "Settings", url: "/settings", icon: Settings, roles: ['admin', 'trainer', 'member'] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user } = useRoleAccess();

  const isActive = (path: string) => location.pathname === path;
  const collapsed = state === "collapsed";
  
  const navigation = user ? allNavigation.filter(item => item.roles.includes(user.role)) : allNavigation;

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-lg p-2">
              <Dumbbell className="h-6 w-6 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-sidebar-foreground">FitTracker</h1>
                <p className="text-xs text-sidebar-foreground/60">Gym Management</p>
              </div>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}