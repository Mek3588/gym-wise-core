import { ReactNode } from 'react';
import { useRBAC } from '../hooks/useRBAC';
import { RolePermissions } from '../types';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: keyof RolePermissions;
  permissions?: (keyof RolePermissions)[];
  requireAll?: boolean;
  role?: string | string[];
  fallback?: ReactNode;
  showAccessDenied?: boolean;
}

export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  role,
  fallback,
  showAccessDenied = true,
}: PermissionGuardProps) {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    requireRole,
    isLoading 
  } = useRBAC();

  // Show loading state
  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-48 mb-2"></div>
        <div className="h-4 bg-muted rounded w-64"></div>
      </div>
    );
  }

  // Check role-based access
  if (role && !requireRole(role)) {
    if (fallback) return <>{fallback}</>;
    if (!showAccessDenied) return null;
    
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Access denied. You don't have the required role to view this content.
        </AlertDescription>
      </Alert>
    );
  }

  // Check single permission
  if (permission && !hasPermission(permission)) {
    if (fallback) return <>{fallback}</>;
    if (!showAccessDenied) return null;
    
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Access denied. You don't have permission to view this content.
        </AlertDescription>
      </Alert>
    );
  }

  // Check multiple permissions
  if (permissions) {
    const hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    
    if (!hasAccess) {
      if (fallback) return <>{fallback}</>;
      if (!showAccessDenied) return null;
      
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. You don't have the required permissions to view this content.
          </AlertDescription>
        </Alert>
      );
    }
  }

  return <>{children}</>;
}

// Convenience components for common use cases
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard role="admin" fallback={fallback} showAccessDenied={false}>
      {children}
    </PermissionGuard>
  );
}

export function TrainerOrAdmin({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard role={['admin', 'trainer']} fallback={fallback} showAccessDenied={false}>
      {children}
    </PermissionGuard>
  );
}

export function MemberOrAbove({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <PermissionGuard role={['admin', 'trainer', 'member']} fallback={fallback} showAccessDenied={false}>
      {children}
    </PermissionGuard>
  );
}