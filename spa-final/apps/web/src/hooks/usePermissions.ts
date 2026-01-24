'use client';

import { useAuth } from '@/contexts/AuthContext';

// Permission constants
export const PERMISSIONS = {
  MANAGE_STAFF: 'manage_staff',
  MANAGE_SERVICES: 'manage_services',
  MANAGE_CLIENTS: 'manage_clients',
  VIEW_REPORTS: 'view_reports',
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_BILLING: 'manage_billing',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export function usePermissions() {
  const { user } = useAuth();

  // For now, owners and admins have all permissions
  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    if (user.role === 'owner' || user.role === 'admin') return true;
    return false;
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some((p) => hasPermission(p));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every((p) => hasPermission(p));
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isOwner: user?.role === 'owner',
    isAdmin: user?.role === 'admin' || user?.role === 'owner',
    isStaff: user?.role === 'staff',
  };
}
