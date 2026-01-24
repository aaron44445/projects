'use client';

import { useAuth } from '@/contexts/AuthContext';

// Permission constants
export const PERMISSIONS = {
  MANAGE_STAFF: 'manage_staff',
  CREATE_STAFF: 'create_staff',
  EDIT_STAFF: 'edit_staff',
  DELETE_STAFF: 'delete_staff',
  MANAGE_SERVICES: 'manage_services',
  MANAGE_CLIENTS: 'manage_clients',
  VIEW_REPORTS: 'view_reports',
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_BILLING: 'manage_billing',
  MANAGE_BUSINESS_SETTINGS: 'manage_business_settings',
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

  // Alias for hasPermission
  const can = hasPermission;

  // Check if user role is at least the given level
  const roleHierarchy = ['staff', 'admin', 'owner'];
  const isAtLeast = (role: string): boolean => {
    if (!user) return false;
    const userRoleIndex = roleHierarchy.indexOf(user.role);
    const requiredRoleIndex = roleHierarchy.indexOf(role);
    return userRoleIndex >= requiredRoleIndex;
  };

  return {
    can,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAtLeast,
    role: user?.role || 'staff',
    isOwner: user?.role === 'owner',
    isAdmin: user?.role === 'admin' || user?.role === 'owner',
    isStaff: user?.role === 'staff',
  };
}
