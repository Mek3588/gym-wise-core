// RBAC Module Exports
export * from './types';
export * from './permissions';
export * from './hooks/useRBAC';
export * from './components/PermissionGuard';
export * from './components/RoleManagementModule';

// Re-export commonly used components for convenience
export { RBACProvider, useRBAC } from './hooks/useRBAC';
export { PermissionGuard, AdminOnly, TrainerOrAdmin, MemberOrAbove } from './components/PermissionGuard';
export { RoleManagementModule } from './components/RoleManagementModule';