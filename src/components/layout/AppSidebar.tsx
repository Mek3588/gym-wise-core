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
    <Sidebar className={collapsed ? "w-16" : "w-72"} collapsible="icon">
      <SidebarContent className="bg-sidebar">
        <div className="p-6 border-b border-sidebar-border/50">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-3 shadow-lg">
              <Dumbbell className="h-6 w-6 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-lg text-sidebar-foreground">FitTracker</h1>
                <p className="text-xs text-sidebar-foreground/60 font-medium">Gym Management Pro</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4">
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/70 mb-3">
              {!collapsed ? "MAIN NAVIGATION" : "NAV"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive(item.url)}
                      className={`
                        h-11 rounded-lg transition-all duration-200
                        ${isActive(item.url) 
                          ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                          : 'hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
                        }
                      `}
                    >
                      <NavLink to={item.url} className="flex items-center gap-3 px-3">
                        <item.icon className={`h-5 w-5 ${isActive(item.url) ? 'text-primary' : ''}`} />
                        {!collapsed && (
                          <span className="font-medium">{item.title}</span>
                        )}
                        {!collapsed && isActive(item.url) && (
                          <div className="ml-auto w-2 h-2 bg-primary rounded-full"></div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {!collapsed && (
          <div className="mt-auto p-4 border-t border-sidebar-border/50">
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="text-xs bg-primary/20 text-primary">Pro</Badge>
              </div>
              <p className="text-xs text-sidebar-foreground/70">
                Advanced gym management features enabled
              </p>
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}