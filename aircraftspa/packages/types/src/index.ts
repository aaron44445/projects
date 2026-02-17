// Enums
export const AIRCRAFT_CLASSES = [
  "single_engine",
  "twin_engine",
  "turboprop",
  "light_jet",
  "midsize_jet",
  "heavy_jet",
  "helicopter",
] as const;

export type AircraftClass = (typeof AIRCRAFT_CLASSES)[number];

export const SERVICE_TYPES = ["interior", "exterior", "full_detail"] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const USER_ROLES = ["owner", "admin", "manager", "technician"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const LOCATION_TYPES = ["hangar", "ramp"] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

// API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
