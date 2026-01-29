import { Request, Response, NextFunction } from 'express';
import { prisma } from '@peacase/database';

// ============================================
// ROLE DEFINITIONS
// ============================================

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
  RECEPTIONIST: 'receptionist',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// Role hierarchy - higher index = more permissions
const ROLE_HIERARCHY: Role[] = [
  ROLES.STAFF,
  ROLES.RECEPTIONIST,
  ROLES.MANAGER,
  ROLES.ADMIN,
  ROLES.OWNER,
];

// ============================================
// PERMISSION DEFINITIONS
// ============================================

export const PERMISSIONS = {
  // Locations
  VIEW_ALL_LOCATIONS: 'view_all_locations',
  MANAGE_LOCATIONS: 'manage_locations',

  // Staff Management
  VIEW_ALL_STAFF: 'view_all_staff',
  CREATE_STAFF: 'create_staff',
  EDIT_STAFF: 'edit_staff',
  DELETE_STAFF: 'delete_staff',
  CHANGE_STAFF_ROLE: 'change_staff_role',

  // Services
  VIEW_SERVICES: 'view_services',
  EDIT_SERVICES: 'edit_services',
  CREATE_SERVICES: 'create_services',
  DELETE_SERVICES: 'delete_services',

  // Appointments
  VIEW_ALL_APPOINTMENTS: 'view_all_appointments',
  VIEW_OWN_APPOINTMENTS: 'view_own_appointments',
  BOOK_APPOINTMENTS: 'book_appointments',
  EDIT_APPOINTMENTS: 'edit_appointments',
  CANCEL_APPOINTMENTS: 'cancel_appointments',

  // Clients
  VIEW_ALL_CLIENTS: 'view_all_clients',
  VIEW_OWN_CLIENTS: 'view_own_clients',
  CREATE_CLIENTS: 'create_clients',
  EDIT_CLIENTS: 'edit_clients',
  DELETE_CLIENTS: 'delete_clients',

  // Payments
  VIEW_ALL_PAYMENTS: 'view_all_payments',
  VIEW_OWN_PAYMENTS: 'view_own_payments',
  PROCESS_PAYMENTS: 'process_payments',
  ISSUE_REFUNDS: 'issue_refunds',

  // Reports & Analytics
  VIEW_REPORTS: 'view_reports',
  VIEW_OWN_REPORTS: 'view_own_reports',
  EXPORT_DATA: 'export_data',

  // Settings
  VIEW_SETTINGS: 'view_settings',
  EDIT_SETTINGS: 'edit_settings',
  MANAGE_INTEGRATIONS: 'manage_integrations',
  DELETE_BUSINESS: 'delete_business',

  // Marketing
  VIEW_MARKETING: 'view_marketing',
  MANAGE_MARKETING: 'manage_marketing',

  // Time Off
  REQUEST_TIME_OFF: 'request_time_off',
  APPROVE_TIME_OFF: 'approve_time_off',

  // Commission
  VIEW_OWN_COMMISSION: 'view_own_commission',
  VIEW_ALL_COMMISSIONS: 'view_all_commissions',
  MANAGE_COMMISSIONS: 'manage_commissions',

  // Schedule
  VIEW_OWN_SCHEDULE: 'view_own_schedule',
  EDIT_OWN_SCHEDULE: 'edit_own_schedule',
  VIEW_ALL_SCHEDULES: 'view_all_schedules',
  EDIT_ALL_SCHEDULES: 'edit_all_schedules',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ============================================
// PERMISSION MATRIX
// ============================================

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // Owner - Everything
  [ROLES.OWNER]: Object.values(PERMISSIONS),

  // Admin - Everything except deleting business
  [ROLES.ADMIN]: Object.values(PERMISSIONS).filter(
    (p) => p !== PERMISSIONS.DELETE_BUSINESS
  ),

  // Manager - Full control within their location(s)
  [ROLES.MANAGER]: [
    PERMISSIONS.VIEW_ALL_STAFF,
    PERMISSIONS.VIEW_SERVICES,
    PERMISSIONS.EDIT_SERVICES,
    PERMISSIONS.CREATE_SERVICES,
    PERMISSIONS.DELETE_SERVICES,
    PERMISSIONS.VIEW_ALL_APPOINTMENTS,
    PERMISSIONS.VIEW_OWN_APPOINTMENTS,
    PERMISSIONS.BOOK_APPOINTMENTS,
    PERMISSIONS.EDIT_APPOINTMENTS,
    PERMISSIONS.CANCEL_APPOINTMENTS,
    PERMISSIONS.VIEW_ALL_CLIENTS,
    PERMISSIONS.VIEW_OWN_CLIENTS,
    PERMISSIONS.CREATE_CLIENTS,
    PERMISSIONS.EDIT_CLIENTS,
    PERMISSIONS.VIEW_ALL_PAYMENTS,
    PERMISSIONS.VIEW_OWN_PAYMENTS,
    PERMISSIONS.PROCESS_PAYMENTS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.VIEW_OWN_REPORTS,
    PERMISSIONS.APPROVE_TIME_OFF,
    PERMISSIONS.REQUEST_TIME_OFF,
    PERMISSIONS.VIEW_ALL_COMMISSIONS,
    PERMISSIONS.VIEW_OWN_COMMISSION,
    PERMISSIONS.VIEW_OWN_SCHEDULE,
    PERMISSIONS.EDIT_OWN_SCHEDULE,
    PERMISSIONS.VIEW_ALL_SCHEDULES,
    PERMISSIONS.EDIT_ALL_SCHEDULES,
  ],

  // Staff - Own schedule, own clients, own earnings
  [ROLES.STAFF]: [
    PERMISSIONS.VIEW_SERVICES,
    PERMISSIONS.VIEW_OWN_APPOINTMENTS,
    PERMISSIONS.VIEW_OWN_CLIENTS,
    PERMISSIONS.CREATE_CLIENTS,
    PERMISSIONS.VIEW_OWN_PAYMENTS,
    PERMISSIONS.VIEW_OWN_REPORTS,
    PERMISSIONS.REQUEST_TIME_OFF,
    PERMISSIONS.VIEW_OWN_COMMISSION,
    PERMISSIONS.VIEW_OWN_SCHEDULE,
    PERMISSIONS.EDIT_OWN_SCHEDULE,
  ],

  // Receptionist - Booking, check-in, payments at their location
  [ROLES.RECEPTIONIST]: [
    PERMISSIONS.VIEW_ALL_STAFF,
    PERMISSIONS.VIEW_SERVICES,
    PERMISSIONS.VIEW_ALL_APPOINTMENTS,
    PERMISSIONS.BOOK_APPOINTMENTS,
    PERMISSIONS.EDIT_APPOINTMENTS,
    PERMISSIONS.CANCEL_APPOINTMENTS,
    PERMISSIONS.VIEW_ALL_CLIENTS,
    PERMISSIONS.CREATE_CLIENTS,
    PERMISSIONS.EDIT_CLIENTS,
    PERMISSIONS.VIEW_ALL_PAYMENTS,
    PERMISSIONS.PROCESS_PAYMENTS,
    PERMISSIONS.VIEW_OWN_SCHEDULE,
    PERMISSIONS.REQUEST_TIME_OFF,
  ],
};

// ============================================
// PERMISSION CHECK FUNCTIONS
// ============================================

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role as Role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Get all permissions for a role
 */
export function getPermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role as Role] || [];
}

/**
 * Check if role1 is higher or equal in hierarchy to role2
 */
export function isRoleAtLeast(role1: string, role2: string): boolean {
  const idx1 = ROLE_HIERARCHY.indexOf(role1 as Role);
  const idx2 = ROLE_HIERARCHY.indexOf(role2 as Role);
  if (idx1 === -1 || idx2 === -1) return false;
  return idx1 >= idx2;
}

// ============================================
// MIDDLEWARE FUNCTIONS
// ============================================

/**
 * Middleware to require specific permission(s)
 * Usage: requirePermission(PERMISSIONS.EDIT_SERVICES)
 * Usage: requirePermission(PERMISSIONS.EDIT_SERVICES, PERMISSIONS.DELETE_SERVICES) // requires ALL
 */
export function requirePermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    if (!hasAllPermissions(req.user.role, permissions)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action',
        },
      });
    }

    next();
  };
}

/**
 * Middleware to require any of the specified permissions
 * Usage: requireAnyPermission(PERMISSIONS.VIEW_ALL_CLIENTS, PERMISSIONS.VIEW_OWN_CLIENTS)
 */
export function requireAnyPermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    if (!hasAnyPermission(req.user.role, permissions)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action',
        },
      });
    }

    next();
  };
}

/**
 * Middleware to require minimum role level
 * Usage: requireRole(ROLES.MANAGER) // allows manager, admin, owner
 */
export function requireRole(minimumRole: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authenticated',
        },
      });
    }

    if (!isRoleAtLeast(req.user.role, minimumRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient role privileges',
        },
      });
    }

    next();
  };
}

// ============================================
// LOCATION-BASED ACCESS HELPERS
// ============================================

/**
 * Get location IDs that a user has access to
 * Returns null if user has access to all locations (owner/admin)
 * Returns array of location IDs for manager/staff/receptionist
 */
export async function getUserLocationIds(
  userId: string,
  salonId: string,
  role: string
): Promise<string[] | null> {
  // Owner and Admin have access to all locations
  if (role === ROLES.OWNER || role === ROLES.ADMIN) {
    return null; // null means all locations
  }

  // Get staff location assignments
  const staffLocations = await prisma.staffLocation.findMany({
    where: { staffId: userId },
    select: { locationId: true },
  });

  // If no specific assignments, get primary location
  if (staffLocations.length === 0) {
    const primaryLocation = await prisma.location.findFirst({
      where: { salonId, isPrimary: true },
      select: { id: true },
    });
    return primaryLocation ? [primaryLocation.id] : [];
  }

  return staffLocations.map((sl) => sl.locationId);
}

/**
 * Check if user has access to a specific location
 */
export async function hasLocationAccess(
  userId: string,
  salonId: string,
  role: string,
  locationId: string
): Promise<boolean> {
  const accessibleLocations = await getUserLocationIds(userId, salonId, role);

  // null means access to all locations
  if (accessibleLocations === null) return true;

  return accessibleLocations.includes(locationId);
}

/**
 * Middleware to filter results by user's accessible locations
 * Adds req.userLocations with the location IDs the user can access
 */
export async function attachUserLocations(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Not authenticated',
      },
    });
  }

  const locations = await getUserLocationIds(
    req.user.userId,
    req.user.salonId,
    req.user.role
  );

  // Extend request with user locations
  (req as any).userLocations = locations;

  next();
}

// ============================================
// RESOURCE OWNERSHIP HELPERS
// ============================================

/**
 * Check if user can view/edit their own resource
 * Staff can only access their own appointments, clients, etc.
 */
export function canAccessOwnResource(
  userRole: string,
  userId: string,
  resourceOwnerId: string,
  allPermission: Permission,
  ownPermission: Permission
): boolean {
  // If user has permission to view all, they can access any resource
  if (hasPermission(userRole, allPermission)) {
    return true;
  }

  // If user has permission to view own, check ownership
  if (hasPermission(userRole, ownPermission)) {
    return userId === resourceOwnerId;
  }

  return false;
}

/**
 * Helper to build Prisma where clause for staff-filtered queries
 * For staff role: filters to their own records
 * For other roles with VIEW_ALL: no additional filter
 */
export function buildStaffFilter(
  userRole: string,
  userId: string,
  staffIdField: string = 'staffId'
): Record<string, string> | undefined {
  if (userRole === ROLES.STAFF) {
    return { [staffIdField]: userId };
  }
  return undefined;
}

/**
 * Helper to build Prisma where clause for location-filtered queries
 */
export function buildLocationFilter(
  userLocations: string[] | null,
  locationIdField: string = 'locationId'
): Record<string, any> | undefined {
  if (userLocations === null) {
    return undefined; // No filter needed, user has access to all
  }

  if (userLocations.length === 0) {
    // User has no location assignments, return impossible condition
    return { [locationIdField]: 'impossible-id-no-access' };
  }

  return { [locationIdField]: { in: userLocations } };
}
