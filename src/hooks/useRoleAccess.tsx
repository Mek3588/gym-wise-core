import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'admin' | 'trainer' | 'member';

interface UserProfile {
  id: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  email: string;
}

interface RolePermissions {
  canManageUsers: boolean;
  canManageRoles: boolean;
  canManagePayments: boolean;
  canManageClasses: boolean;
  canViewReports: boolean;
  canManageSystem: boolean;
  canSendSMS: boolean;
  canManageEquipment: boolean;
  canManageWorkouts: boolean;
  canViewAllMembers: boolean;
  canModifyMemberships: boolean;
}

const rolePermissions: Record<UserRole, RolePermissions> = {
  admin: {
    canManageUsers: true,
    canManageRoles: true,
    canManagePayments: true,
    canManageClasses: true,
    canViewReports: true,
    canManageSystem: true,
    canSendSMS: true,
    canManageEquipment: true,
    canManageWorkouts: true,
    canViewAllMembers: true,
    canModifyMemberships: true,
  },
  trainer: {
    canManageUsers: false,
    canManageRoles: false,
    canManagePayments: false,
    canManageClasses: true,
    canViewReports: true,
    canManageSystem: false,
    canSendSMS: true,
    canManageEquipment: false,
    canManageWorkouts: true,
    canViewAllMembers: true,
    canModifyMemberships: false,
  },
  member: {
    canManageUsers: false,
    canManageRoles: false,
    canManagePayments: false,
    canManageClasses: false,
    canViewReports: false,
    canManageSystem: false,
    canSendSMS: false,
    canManageEquipment: false,
    canManageWorkouts: false,
    canViewAllMembers: false,
    canModifyMemberships: false,
  },
};

export function useRoleAccess() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<RolePermissions>(rolePermissions.member);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setIsLoading(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, role, first_name, last_name, email')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        setIsLoading(false);
        return;
      }

      const userProfile: UserProfile = {
        id: profile.id,
        role: profile.role as UserRole,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
      };

      setUser(userProfile);
      setPermissions(rolePermissions[userProfile.role]);
    } catch (error) {
      console.error('Error in getCurrentUser:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions for common permission checks
  const hasPermission = (permission: keyof RolePermissions): boolean => {
    return permissions[permission];
  };

  const isRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const isAdmin = (): boolean => isRole('admin');
  const isTrainer = (): boolean => isRole('trainer');
  const isMember = (): boolean => isRole('member');

  const canAccess = {
    userManagement: hasPermission('canManageUsers'),
    roleManagement: hasPermission('canManageRoles'),
    paymentManagement: hasPermission('canManagePayments'),
    classManagement: hasPermission('canManageClasses'),
    reports: hasPermission('canViewReports'),
    systemSettings: hasPermission('canManageSystem'),
    smsFeatures: hasPermission('canSendSMS'),
    equipmentManagement: hasPermission('canManageEquipment'),
    workoutManagement: hasPermission('canManageWorkouts'),
    allMembersData: hasPermission('canViewAllMembers'),
    membershipModification: hasPermission('canModifyMemberships'),
  };

  // High-level access control for UI components
  const requireRole = (requiredRole: UserRole | UserRole[]) => {
    if (!user) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role);
    }
    
    return user.role === requiredRole;
  };

  const requirePermission = (permission: keyof RolePermissions) => {
    return hasPermission(permission);
  };

  return {
    user,
    permissions,
    isLoading,
    hasPermission,
    isRole,
    isAdmin,
    isTrainer,
    isMember,
    canAccess,
    requireRole,
    requirePermission,
    refreshUser: getCurrentUser,
  };
}

// Higher-order component for role-based access control
export function withRoleAccess<T extends object>(
  Component: React.ComponentType<T>,
  requiredRole: UserRole | UserRole[],
  fallback?: React.ComponentType
) {
  return function WrappedComponent(props: T) {
    const { requireRole } = useRoleAccess();
    
    if (!requireRole(requiredRole)) {
      if (fallback) {
        const FallbackComponent = fallback;
        return <FallbackComponent />;
      }
      
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-muted-foreground">Access Denied</h2>
            <p className="text-muted-foreground">You don't have permission to access this resource.</p>
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
}

// Role-based navigation filter
export const filterNavigationByRole = (role: UserRole) => {
  const navigation = [
    { title: "Dashboard", url: "/dashboard", roles: ['admin', 'trainer', 'member'] },
    { title: "Members", url: "/members", roles: ['admin', 'trainer'] },
    { title: "Staff", url: "/staff", roles: ['admin'] },
    { title: "Plans", url: "/plans", roles: ['admin'] },
    { title: "Attendance", url: "/attendance", roles: ['admin', 'trainer', 'member'] },
    { title: "Schedules", url: "/schedules", roles: ['admin', 'trainer', 'member'] },
    { title: "Payments", url: "/payments", roles: ['admin', 'trainer'] },
    { title: "SMS", url: "/sms", roles: ['admin', 'trainer'] },
    { title: "Reports", url: "/reports", roles: ['admin', 'trainer'] },
    { title: "Settings", url: "/settings", roles: ['admin', 'trainer', 'member'] },
  ];

  return navigation.filter(item => item.roles.includes(role));
};