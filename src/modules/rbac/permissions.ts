import { Permission, Role, UserRole, RolePermissions } from './types';

// Define all available permissions
export const PERMISSIONS: Record<string, Permission> = {
  // User Management
  MANAGE_USERS: {
    id: 'manage_users',
    name: 'Manage Users',
    description: 'Full access to user management',
    resource: 'users',
    action: 'manage'
  },
  VIEW_USERS: {
    id: 'view_users',
    name: 'View Users',
    description: 'View user profiles and information',
    resource: 'users',
    action: 'read'
  },
  CREATE_USERS: {
    id: 'create_users',
    name: 'Create Users',
    description: 'Create new user accounts',
    resource: 'users',
    action: 'create'
  },
  UPDATE_USERS: {
    id: 'update_users',
    name: 'Update Users',
    description: 'Update user profiles',
    resource: 'users',
    action: 'update'
  },
  DELETE_USERS: {
    id: 'delete_users',
    name: 'Delete Users',
    description: 'Delete user accounts',
    resource: 'users',
    action: 'delete'
  },

  // Role Management
  MANAGE_ROLES: {
    id: 'manage_roles',
    name: 'Manage Roles',
    description: 'Full access to role management',
    resource: 'roles',
    action: 'manage'
  },
  ASSIGN_ROLES: {
    id: 'assign_roles',
    name: 'Assign Roles',
    description: 'Assign roles to users',
    resource: 'roles',
    action: 'assign'
  },
  VIEW_ROLES: {
    id: 'view_roles',
    name: 'View Roles',
    description: 'View role information',
    resource: 'roles',
    action: 'read'
  },

  // Financial
  MANAGE_PAYMENTS: {
    id: 'manage_payments',
    name: 'Manage Payments',
    description: 'Full access to payment management',
    resource: 'payments',
    action: 'manage'
  },
  VIEW_PAYMENTS: {
    id: 'view_payments',
    name: 'View Payments',
    description: 'View payment information',
    resource: 'payments',
    action: 'read'
  },
  CREATE_PAYMENTS: {
    id: 'create_payments',
    name: 'Create Payments',
    description: 'Create payment records',
    resource: 'payments',
    action: 'create'
  },
  UPDATE_PAYMENTS: {
    id: 'update_payments',
    name: 'Update Payments',
    description: 'Update payment information',
    resource: 'payments',
    action: 'update'
  },

  // Classes & Schedules
  MANAGE_CLASSES: {
    id: 'manage_classes',
    name: 'Manage Classes',
    description: 'Full access to class management',
    resource: 'classes',
    action: 'manage'
  },
  VIEW_CLASSES: {
    id: 'view_classes',
    name: 'View Classes',
    description: 'View class schedules',
    resource: 'classes',
    action: 'read'
  },
  CREATE_CLASSES: {
    id: 'create_classes',
    name: 'Create Classes',
    description: 'Create new classes',
    resource: 'classes',
    action: 'create'
  },
  UPDATE_CLASSES: {
    id: 'update_classes',
    name: 'Update Classes',
    description: 'Update class information',
    resource: 'classes',
    action: 'update'
  },
  DELETE_CLASSES: {
    id: 'delete_classes',
    name: 'Delete Classes',
    description: 'Delete classes',
    resource: 'classes',
    action: 'delete'
  },

  // Reports & Analytics
  VIEW_REPORTS: {
    id: 'view_reports',
    name: 'View Reports',
    description: 'Access to reports and analytics',
    resource: 'reports',
    action: 'read'
  },
  EXPORT_DATA: {
    id: 'export_data',
    name: 'Export Data',
    description: 'Export system data',
    resource: 'data',
    action: 'export'
  },
  VIEW_ANALYTICS: {
    id: 'view_analytics',
    name: 'View Analytics',
    description: 'Access to system analytics',
    resource: 'analytics',
    action: 'read'
  },

  // System Settings
  MANAGE_SYSTEM: {
    id: 'manage_system',
    name: 'Manage System',
    description: 'Full system administration',
    resource: 'system',
    action: 'manage'
  },
  VIEW_SYSTEM_SETTINGS: {
    id: 'view_system_settings',
    name: 'View System Settings',
    description: 'View system configuration',
    resource: 'system',
    action: 'read'
  },
  UPDATE_SYSTEM_SETTINGS: {
    id: 'update_system_settings',
    name: 'Update System Settings',
    description: 'Update system configuration',
    resource: 'system',
    action: 'update'
  },

  // Communication
  SEND_SMS: {
    id: 'send_sms',
    name: 'Send SMS',
    description: 'Send SMS messages',
    resource: 'communication',
    action: 'sms'
  },
  SEND_NOTIFICATIONS: {
    id: 'send_notifications',
    name: 'Send Notifications',
    description: 'Send system notifications',
    resource: 'communication',
    action: 'notify'
  },
  MANAGE_COMMUNICATION: {
    id: 'manage_communication',
    name: 'Manage Communication',
    description: 'Full access to communication features',
    resource: 'communication',
    action: 'manage'
  },

  // Equipment
  MANAGE_EQUIPMENT: {
    id: 'manage_equipment',
    name: 'Manage Equipment',
    description: 'Full access to equipment management',
    resource: 'equipment',
    action: 'manage'
  },
  VIEW_EQUIPMENT: {
    id: 'view_equipment',
    name: 'View Equipment',
    description: 'View equipment information',
    resource: 'equipment',
    action: 'read'
  },
  CREATE_EQUIPMENT: {
    id: 'create_equipment',
    name: 'Create Equipment',
    description: 'Add new equipment',
    resource: 'equipment',
    action: 'create'
  },
  UPDATE_EQUIPMENT: {
    id: 'update_equipment',
    name: 'Update Equipment',
    description: 'Update equipment information',
    resource: 'equipment',
    action: 'update'
  },

  // Workouts
  MANAGE_WORKOUTS: {
    id: 'manage_workouts',
    name: 'Manage Workouts',
    description: 'Full access to workout management',
    resource: 'workouts',
    action: 'manage'
  },
  VIEW_WORKOUTS: {
    id: 'view_workouts',
    name: 'View Workouts',
    description: 'View workout programs',
    resource: 'workouts',
    action: 'read'
  },
  CREATE_WORKOUTS: {
    id: 'create_workouts',
    name: 'Create Workouts',
    description: 'Create new workout programs',
    resource: 'workouts',
    action: 'create'
  },
  UPDATE_WORKOUTS: {
    id: 'update_workouts',
    name: 'Update Workouts',
    description: 'Update workout programs',
    resource: 'workouts',
    action: 'update'
  },

  // Memberships
  MANAGE_MEMBERSHIPS: {
    id: 'manage_memberships',
    name: 'Manage Memberships',
    description: 'Full access to membership management',
    resource: 'memberships',
    action: 'manage'
  },
  VIEW_MEMBERSHIPS: {
    id: 'view_memberships',
    name: 'View Memberships',
    description: 'View membership information',
    resource: 'memberships',
    action: 'read'
  },
  CREATE_MEMBERSHIPS: {
    id: 'create_memberships',
    name: 'Create Memberships',
    description: 'Create new memberships',
    resource: 'memberships',
    action: 'create'
  },
  UPDATE_MEMBERSHIPS: {
    id: 'update_memberships',
    name: 'Update Memberships',
    description: 'Update membership information',
    resource: 'memberships',
    action: 'update'
  },

  // Attendance
  VIEW_ATTENDANCE: {
    id: 'view_attendance',
    name: 'View Attendance',
    description: 'View attendance records',
    resource: 'attendance',
    action: 'read'
  },
  MANAGE_ATTENDANCE: {
    id: 'manage_attendance',
    name: 'Manage Attendance',
    description: 'Full access to attendance management',
    resource: 'attendance',
    action: 'manage'
  },
  CHECK_IN_OUT: {
    id: 'check_in_out',
    name: 'Check In/Out',
    description: 'Personal check-in and check-out',
    resource: 'attendance',
    action: 'checkin'
  },

  // Personal Data
  VIEW_OWN_DATA: {
    id: 'view_own_data',
    name: 'View Own Data',
    description: 'View personal data and records',
    resource: 'profile',
    action: 'read'
  },
  UPDATE_OWN_PROFILE: {
    id: 'update_own_profile',
    name: 'Update Own Profile',
    description: 'Update personal profile',
    resource: 'profile',
    action: 'update'
  },
  VIEW_ALL_MEMBERS: {
    id: 'view_all_members',
    name: 'View All Members',
    description: 'View all member profiles',
    resource: 'members',
    action: 'read'
  },
};

// Define role configurations with their permissions
export const ROLE_DEFINITIONS: Record<UserRole, Role> = {
  admin: {
    id: 'admin',
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full system access with all permissions',
    level: 100,
    permissions: Object.values(PERMISSIONS), // All permissions
  },
  trainer: {
    id: 'trainer',
    name: 'trainer',
    displayName: 'Trainer',
    description: 'Can manage classes, workouts, and view member data',
    level: 50,
    permissions: [
      PERMISSIONS.VIEW_USERS,
      PERMISSIONS.VIEW_ALL_MEMBERS,
      PERMISSIONS.MANAGE_CLASSES,
      PERMISSIONS.VIEW_CLASSES,
      PERMISSIONS.CREATE_CLASSES,
      PERMISSIONS.UPDATE_CLASSES,
      PERMISSIONS.MANAGE_WORKOUTS,
      PERMISSIONS.VIEW_WORKOUTS,
      PERMISSIONS.CREATE_WORKOUTS,
      PERMISSIONS.UPDATE_WORKOUTS,
      PERMISSIONS.VIEW_REPORTS,
      PERMISSIONS.VIEW_ANALYTICS,
      PERMISSIONS.SEND_SMS,
      PERMISSIONS.SEND_NOTIFICATIONS,
      PERMISSIONS.VIEW_EQUIPMENT,
      PERMISSIONS.VIEW_ATTENDANCE,
      PERMISSIONS.MANAGE_ATTENDANCE,
      PERMISSIONS.VIEW_MEMBERSHIPS,
      PERMISSIONS.VIEW_OWN_DATA,
      PERMISSIONS.UPDATE_OWN_PROFILE,
      PERMISSIONS.CHECK_IN_OUT,
    ],
  },
  member: {
    id: 'member',
    name: 'member',
    displayName: 'Member',
    description: 'Basic access to personal data and gym features',
    level: 10,
    permissions: [
      PERMISSIONS.VIEW_CLASSES,
      PERMISSIONS.VIEW_WORKOUTS,
      PERMISSIONS.VIEW_EQUIPMENT,
      PERMISSIONS.VIEW_OWN_DATA,
      PERMISSIONS.UPDATE_OWN_PROFILE,
      PERMISSIONS.CHECK_IN_OUT,
      PERMISSIONS.VIEW_ATTENDANCE, // Own attendance only
    ],
  },
};

// Generate role permissions matrix for easy checking
export const generateRolePermissions = (role: UserRole): RolePermissions => {
  const roleDefinition = ROLE_DEFINITIONS[role];
  const permissions = roleDefinition.permissions;
  
  return {
    // User Management
    canManageUsers: permissions.some(p => p.id === 'manage_users'),
    canViewUsers: permissions.some(p => p.id === 'view_users'),
    canCreateUsers: permissions.some(p => p.id === 'create_users'),
    canUpdateUsers: permissions.some(p => p.id === 'update_users'),
    canDeleteUsers: permissions.some(p => p.id === 'delete_users'),
    
    // Role Management
    canManageRoles: permissions.some(p => p.id === 'manage_roles'),
    canAssignRoles: permissions.some(p => p.id === 'assign_roles'),
    canViewRoles: permissions.some(p => p.id === 'view_roles'),
    
    // Financial
    canManagePayments: permissions.some(p => p.id === 'manage_payments'),
    canViewPayments: permissions.some(p => p.id === 'view_payments'),
    canCreatePayments: permissions.some(p => p.id === 'create_payments'),
    canUpdatePayments: permissions.some(p => p.id === 'update_payments'),
    
    // Classes & Schedules
    canManageClasses: permissions.some(p => p.id === 'manage_classes'),
    canViewClasses: permissions.some(p => p.id === 'view_classes'),
    canCreateClasses: permissions.some(p => p.id === 'create_classes'),
    canUpdateClasses: permissions.some(p => p.id === 'update_classes'),
    canDeleteClasses: permissions.some(p => p.id === 'delete_classes'),
    
    // Reports & Analytics
    canViewReports: permissions.some(p => p.id === 'view_reports'),
    canExportData: permissions.some(p => p.id === 'export_data'),
    canViewAnalytics: permissions.some(p => p.id === 'view_analytics'),
    
    // System Settings
    canManageSystem: permissions.some(p => p.id === 'manage_system'),
    canViewSystemSettings: permissions.some(p => p.id === 'view_system_settings'),
    canUpdateSystemSettings: permissions.some(p => p.id === 'update_system_settings'),
    
    // Communication
    canSendSMS: permissions.some(p => p.id === 'send_sms'),
    canSendNotifications: permissions.some(p => p.id === 'send_notifications'),
    canManageCommunication: permissions.some(p => p.id === 'manage_communication'),
    
    // Equipment
    canManageEquipment: permissions.some(p => p.id === 'manage_equipment'),
    canViewEquipment: permissions.some(p => p.id === 'view_equipment'),
    canCreateEquipment: permissions.some(p => p.id === 'create_equipment'),
    canUpdateEquipment: permissions.some(p => p.id === 'update_equipment'),
    
    // Workouts
    canManageWorkouts: permissions.some(p => p.id === 'manage_workouts'),
    canViewWorkouts: permissions.some(p => p.id === 'view_workouts'),
    canCreateWorkouts: permissions.some(p => p.id === 'create_workouts'),
    canUpdateWorkouts: permissions.some(p => p.id === 'update_workouts'),
    
    // Memberships
    canManageMemberships: permissions.some(p => p.id === 'manage_memberships'),
    canViewMemberships: permissions.some(p => p.id === 'view_memberships'),
    canCreateMemberships: permissions.some(p => p.id === 'create_memberships'),
    canUpdateMemberships: permissions.some(p => p.id === 'update_memberships'),
    
    // Attendance
    canViewAttendance: permissions.some(p => p.id === 'view_attendance'),
    canManageAttendance: permissions.some(p => p.id === 'manage_attendance'),
    canCheckInOut: permissions.some(p => p.id === 'check_in_out'),
    
    // Personal Data Access
    canViewOwnData: permissions.some(p => p.id === 'view_own_data'),
    canUpdateOwnProfile: permissions.some(p => p.id === 'update_own_profile'),
    canViewAllMembers: permissions.some(p => p.id === 'view_all_members'),
  };
};

// Helper function to check if a role can manage another role
export const canManageRole = (currentRole: UserRole, targetRole: UserRole): boolean => {
  const currentLevel = ROLE_DEFINITIONS[currentRole].level;
  const targetLevel = ROLE_DEFINITIONS[targetRole].level;
  
  // Can only manage roles with lower level
  return currentLevel > targetLevel;
};

// Helper function to get available roles for assignment
export const getAssignableRoles = (currentRole: UserRole): UserRole[] => {
  const currentLevel = ROLE_DEFINITIONS[currentRole].level;
  
  return Object.values(ROLE_DEFINITIONS)
    .filter(role => role.level < currentLevel)
    .map(role => role.name);
};