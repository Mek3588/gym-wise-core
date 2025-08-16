// Role-Based Access Control Types

export type UserRole = 'admin' | 'trainer' | 'member';

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  name: UserRole;
  displayName: string;
  description: string;
  permissions: Permission[];
  level: number; // Hierarchy level (higher = more permissions)
}

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface RolePermissions {
  // User Management
  canManageUsers: boolean;
  canViewUsers: boolean;
  canCreateUsers: boolean;
  canUpdateUsers: boolean;
  canDeleteUsers: boolean;
  
  // Role Management
  canManageRoles: boolean;
  canAssignRoles: boolean;
  canViewRoles: boolean;
  
  // Financial
  canManagePayments: boolean;
  canViewPayments: boolean;
  canCreatePayments: boolean;
  canUpdatePayments: boolean;
  
  // Classes & Schedules
  canManageClasses: boolean;
  canViewClasses: boolean;
  canCreateClasses: boolean;
  canUpdateClasses: boolean;
  canDeleteClasses: boolean;
  
  // Reports & Analytics
  canViewReports: boolean;
  canExportData: boolean;
  canViewAnalytics: boolean;
  
  // System Settings
  canManageSystem: boolean;
  canViewSystemSettings: boolean;
  canUpdateSystemSettings: boolean;
  
  // Communication
  canSendSMS: boolean;
  canSendNotifications: boolean;
  canManageCommunication: boolean;
  
  // Equipment
  canManageEquipment: boolean;
  canViewEquipment: boolean;
  canCreateEquipment: boolean;
  canUpdateEquipment: boolean;
  
  // Workouts
  canManageWorkouts: boolean;
  canViewWorkouts: boolean;
  canCreateWorkouts: boolean;
  canUpdateWorkouts: boolean;
  
  // Memberships
  canManageMemberships: boolean;
  canViewMemberships: boolean;
  canCreateMemberships: boolean;
  canUpdateMemberships: boolean;
  
  // Attendance
  canViewAttendance: boolean;
  canManageAttendance: boolean;
  canCheckInOut: boolean;
  
  // Personal Data Access
  canViewOwnData: boolean;
  canUpdateOwnProfile: boolean;
  canViewAllMembers: boolean;
}

export interface RoleChangeRequest {
  userId: string;
  currentRole: UserRole;
  newRole: UserRole;
  requestedBy: string;
  reason?: string;
}

export interface AccessControlContext {
  user: UserProfile | null;
  role: Role | null;
  permissions: RolePermissions;
  isLoading: boolean;
}

export interface PermissionCheck {
  resource: string;
  action: string;
  context?: Record<string, any>;
}