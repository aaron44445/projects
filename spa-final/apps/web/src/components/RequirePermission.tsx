'use client';

import { ReactNode } from 'react';
import { usePermissions, Permission, PERMISSIONS } from '@/hooks/usePermissions';

interface RequirePermissionProps {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequirePermission({ permission, children, fallback = null }: RequirePermissionProps) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Re-export PERMISSIONS for convenience
export { PERMISSIONS };
export type { Permission };
