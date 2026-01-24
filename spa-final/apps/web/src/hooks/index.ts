// Re-export all hooks for convenient imports
export { useClients } from './useClients';
export type { Client, CreateClientInput, UpdateClientInput } from './useClients';

export { useServices } from './useServices';
export type {
  Service,
  ServiceCategory,
  CreateServiceInput,
  UpdateServiceInput,
  CreateCategoryInput,
  UpdateCategoryInput,
} from './useServices';

export { useAppointments } from './useAppointments';
export type {
  Appointment,
  AppointmentStatus,
  CreateAppointmentInput,
  UpdateAppointmentInput,
  CancelAppointmentInput,
  DateRange,
} from './useAppointments';

export { useStaff } from './useStaff';
export type {
  StaffMember,
  StaffService,
  StaffAvailability,
  CreateStaffInput,
  UpdateStaffInput,
  SetAvailabilityInput,
  SetStaffServicesInput,
} from './useStaff';

export { usePackages } from './usePackages';
export type { Package, PackageMember } from './usePackages';

export { useDashboard } from './useDashboard';

export { useReviews } from './useReviews';
export type { Review } from './useReviews';

export { useGiftCards } from './useGiftCards';
export type { GiftCard } from './useGiftCards';

export { useSalon } from './useSalon';
export type { Salon } from './useSalon';

export { useReports } from './useReports';
export type {
  // DateRange is already exported from useAppointments
  RevenueTimelineItem,
  RecentTransaction,
  RevenueReport,
  ServiceReportItem,
  CategoryReportItem,
  ServicesReport,
  StaffReportItem,
  StaffReport,
  TopClient,
  ClientsReport,
  OverviewReport,
} from './useReports';

export { useUpload, formatBytes, getFileExtension, isImageFile } from './useUpload';
export type {
  UploadType,
  UploadedImage,
  UploadConfig,
  UploadProgress,
  UseUploadOptions,
  UseUploadReturn,
} from './useUpload';

export { useLocations, LocationProvider, useLocationContext } from './useLocations';
export type {
  Location,
  StaffAtLocation,
  ServiceAtLocation,
  CreateLocationInput,
  UpdateLocationInput,
  ServiceLocationSettings,
  LocationHours,
} from './useLocations';

export { useMarketing } from './useMarketing';
export type { Campaign, CreateCampaignInput, UpdateCampaignInput } from './useMarketing';
