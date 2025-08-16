import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, Role, RolePermissions, AccessControlContext, PermissionCheck } from '../types';
import { ROLE_DEFINITIONS, generateRolePermissions } from '../permissions';
import { useToast } from '@/hooks/use-toast';

// Create RBAC Context
const RBACContext = createContext<AccessControlContext>({
  user: null,
  role: null,
  permissions: {} as RolePermissions,
  isLoading: true,
});

// RBAC Provider Component
interface RBACProviderProps {
  children: ReactNode;
}

export function RBACProvider({ children }: RBACProviderProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<RolePermissions>({} as RolePermissions);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    initializeAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setRole(null);
          setPermissions({} as RolePermissions);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const initializeAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      toast({
        title: "Authentication Error",
        description: "Failed to initialize user session",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (profile) {
        const userProfile: UserProfile = {
          id: profile.id,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          role: profile.role,
          created_at: profile.created_at,
          updated_at: profile.updated_at,
        };

        const userRole = ROLE_DEFINITIONS[profile.role];
        const userPermissions = generateRolePermissions(profile.role);

        setUser(userProfile);
        setRole(userRole);
        setPermissions(userPermissions);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast({
        title: "Profile Error",
        description: "Failed to load user profile",
        variant: "destructive",
      });
    }
  };

  const contextValue: AccessControlContext = {
    user,
    role,
    permissions,
    isLoading,
  };

  return (
    <RBACContext.Provider value={contextValue}>
      {children}
    </RBACContext.Provider>
  );
}

// Main RBAC Hook
export function useRBAC() {
  const context = useContext(RBACContext);
  
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }

  const { user, role, permissions, isLoading } = context;

  // Permission checking functions
  const hasPermission = (permissionKey: keyof RolePermissions): boolean => {
    return permissions[permissionKey] || false;
  };

  const hasAnyPermission = (permissionKeys: (keyof RolePermissions)[]): boolean => {
    return permissionKeys.some(key => permissions[key]);
  };

  const hasAllPermissions = (permissionKeys: (keyof RolePermissions)[]): boolean => {
    return permissionKeys.every(key => permissions[key]);
  };

  const checkPermission = (check: PermissionCheck): boolean => {
    if (!role || !user) return false;

    // Find permission in role's permissions
    const hasResourcePermission = role.permissions.some(
      p => p.resource === check.resource && p.action === check.action
    );

    return hasResourcePermission;
  };

  // Role checking functions
  const isRole = (roleName: string): boolean => {
    return user?.role === roleName;
  };

  const isAdmin = (): boolean => isRole('admin');
  const isTrainer = (): boolean => isRole('trainer');
  const isMember = (): boolean => isRole('member');

  const hasRoleLevel = (minLevel: number): boolean => {
    return role ? role.level >= minLevel : false;
  };

  // Access control helpers
  const canAccess = {
    // User Management
    userManagement: hasPermission('canManageUsers'),
    userViewing: hasPermission('canViewUsers'),
    userCreation: hasPermission('canCreateUsers'),
    userUpdating: hasPermission('canUpdateUsers'),
    userDeletion: hasPermission('canDeleteUsers'),

    // Role Management
    roleManagement: hasPermission('canManageRoles'),
    roleAssignment: hasPermission('canAssignRoles'),
    roleViewing: hasPermission('canViewRoles'),

    // Financial
    paymentManagement: hasPermission('canManagePayments'),
    paymentViewing: hasPermission('canViewPayments'),
    paymentCreation: hasPermission('canCreatePayments'),
    paymentUpdating: hasPermission('canUpdatePayments'),

    // Classes & Schedules
    classManagement: hasPermission('canManageClasses'),
    classViewing: hasPermission('canViewClasses'),
    classCreation: hasPermission('canCreateClasses'),
    classUpdating: hasPermission('canUpdateClasses'),
    classDeletion: hasPermission('canDeleteClasses'),

    // Reports & Analytics
    reports: hasPermission('canViewReports'),
    dataExport: hasPermission('canExportData'),
    analytics: hasPermission('canViewAnalytics'),

    // System Settings
    systemManagement: hasPermission('canManageSystem'),
    systemSettings: hasPermission('canViewSystemSettings'),
    systemUpdating: hasPermission('canUpdateSystemSettings'),

    // Communication
    smsFeatures: hasPermission('canSendSMS'),
    notifications: hasPermission('canSendNotifications'),
    communicationManagement: hasPermission('canManageCommunication'),

    // Equipment
    equipmentManagement: hasPermission('canManageEquipment'),
    equipmentViewing: hasPermission('canViewEquipment'),
    equipmentCreation: hasPermission('canCreateEquipment'),
    equipmentUpdating: hasPermission('canUpdateEquipment'),

    // Workouts
    workoutManagement: hasPermission('canManageWorkouts'),
    workoutViewing: hasPermission('canViewWorkouts'),
    workoutCreation: hasPermission('canCreateWorkouts'),
    workoutUpdating: hasPermission('canUpdateWorkouts'),

    // Memberships
    membershipManagement: hasPermission('canManageMemberships'),
    membershipViewing: hasPermission('canViewMemberships'),
    membershipCreation: hasPermission('canCreateMemberships'),
    membershipUpdating: hasPermission('canUpdateMemberships'),

    // Attendance
    attendanceViewing: hasPermission('canViewAttendance'),
    attendanceManagement: hasPermission('canManageAttendance'),
    checkInOut: hasPermission('canCheckInOut'),

    // Personal Data
    ownDataViewing: hasPermission('canViewOwnData'),
    profileUpdating: hasPermission('canUpdateOwnProfile'),
    allMembersViewing: hasPermission('canViewAllMembers'),
  };

  // UI Control helpers
  const requireRole = (requiredRole: string | string[]) => {
    if (!user) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(user.role);
    }
    
    return user.role === requiredRole;
  };

  const requirePermission = (permissionKey: keyof RolePermissions) => {
    return hasPermission(permissionKey);
  };

  const requireAnyPermission = (permissionKeys: (keyof RolePermissions)[]) => {
    return hasAnyPermission(permissionKeys);
  };

  const requireAllPermissions = (permissionKeys: (keyof RolePermissions)[]) => {
    return hasAllPermissions(permissionKeys);
  };

  // Data filtering helpers
  const filterByAccess = <T extends { user_id?: string }>(
    items: T[],
    accessType: 'own' | 'all' = 'all'
  ): T[] => {
    if (accessType === 'own' && user) {
      return items.filter(item => item.user_id === user.id);
    }
    
    if (hasPermission('canViewAllMembers')) {
      return items;
    }
    
    // Fallback to own data only
    return items.filter(item => item.user_id === user?.id);
  };

  return {
    // User and Role Info
    user,
    role,
    permissions,
    isLoading,

    // Permission Checking
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    checkPermission,

    // Role Checking
    isRole,
    isAdmin,
    isTrainer,
    isMember,
    hasRoleLevel,

    // Access Control
    canAccess,

    // UI Control
    requireRole,
    requirePermission,
    requireAnyPermission,
    requireAllPermissions,

    // Data Filtering
    filterByAccess,

    // Refresh function
    refreshProfile: async () => {
      if (user) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            window.location.reload(); // Simple refresh for now
          }
        } catch (error) {
          console.error('Error refreshing profile:', error);
        }
      }
    },
  };
}