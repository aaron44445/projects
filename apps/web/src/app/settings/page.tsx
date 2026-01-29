'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  Menu,
  Building2,
  Clock,
  CreditCard,
  Mail,
  Shield,
  Palette,
  Globe,
  ChevronRight,
  Upload,
  Check,
  Lock,
  Sparkles,
  Users,
  BarChart3,
  Loader2,
  AlertCircle,
  Copy,
  Calendar,
  ExternalLink,
  Code,
  MapPin,
  DollarSign,
  Languages,
  Receipt,
  User,
  UserPlus,
  BellRing,
  History,
  Monitor,
  Smartphone,
  Trash2,
  Download,
  RefreshCw,
  X,
  MoreVertical,
} from 'lucide-react';
import { SUPPORTED_CURRENCIES, TIMEZONE_OPTIONS, type CurrencyCode, type DateFormatStyle, type TimeFormatStyle } from '@/lib/i18n';
import { useSubscription, AddOnId } from '@/contexts/SubscriptionContext';
import { AppSidebar } from '@/components/AppSidebar';
import { AuthGuard } from '@/components/AuthGuard';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LocationSwitcher } from '@/components/LocationSwitcher';
import { useSalon, useLocationContext, type Salon, useAccount, useTeam, useOwnerNotifications } from '@/hooks';
import { useServices, type Service } from '@/hooks/useServices';
import { useStaff, type StaffMember } from '@/hooks/useStaff';
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';
import { useNotificationSettings } from '@/hooks/useNotificationSettings';
import { useLocationHours } from '@/hooks/useLocationHours';
import type { UserSession, LoginHistoryEntry, TeamMember, TeamInvite } from '@/hooks';
import Link from 'next/link';
import { api } from '@/lib/api';

const settingsSections = [
  { id: 'account', name: 'My Account', icon: User, description: 'Profile, email, and account settings' },
  { id: 'business', name: 'Business Info', icon: Building2, description: 'Company details and address', requiresPermission: PERMISSIONS.MANAGE_BUSINESS_SETTINGS },
  { id: 'team', name: 'Team Access', icon: UserPlus, description: 'Invite and manage team members', requiresPermission: PERMISSIONS.MANAGE_STAFF },
  { id: 'locations', name: 'Locations', icon: MapPin, description: 'Multi-location settings', requiresPermission: PERMISSIONS.MANAGE_BUSINESS_SETTINGS },
  { id: 'hours', name: 'Business Hours', icon: Clock, description: 'Operating hours and holidays', requiresPermission: PERMISSIONS.MANAGE_BUSINESS_SETTINGS },
  { id: 'regional', name: 'Regional Settings', icon: Languages, description: 'Currency, date, and time formats', requiresPermission: PERMISSIONS.MANAGE_BUSINESS_SETTINGS },
  { id: 'tax', name: 'Tax / VAT Settings', icon: Receipt, description: 'Tax rates and configuration', requiresPermission: PERMISSIONS.MANAGE_BUSINESS_SETTINGS },
  { id: 'subscription', name: 'Subscription', icon: Sparkles, description: 'Manage your plan and add-ons', requiresPermission: PERMISSIONS.MANAGE_BILLING },
  { id: 'payments', name: 'Payments', icon: CreditCard, description: 'Payment methods and settings', requiredAddOn: 'payment_processing' as AddOnId, requiresPermission: PERMISSIONS.MANAGE_BILLING },
  { id: 'owner-notifications', name: 'Owner Notifications', icon: BellRing, description: 'Booking and business alerts', requiresPermission: PERMISSIONS.MANAGE_BUSINESS_SETTINGS },
  { id: 'notifications', name: 'Client Notifications', icon: Mail, description: 'Email and SMS preferences', requiredAddOn: 'reminders' as AddOnId },
  { id: 'booking', name: 'Online Booking', icon: Globe, description: 'Booking page settings', requiredAddOn: 'online_booking' as AddOnId, requiresPermission: PERMISSIONS.MANAGE_BUSINESS_SETTINGS },
  { id: 'branding', name: 'Branding', icon: Palette, description: 'Colors, logo, and appearance', requiresPermission: PERMISSIONS.MANAGE_BUSINESS_SETTINGS },
  { id: 'security', name: 'Security', icon: Shield, description: 'Sessions, login history, and 2FA' },
];

// Add-on info for upsell banners
const addOnInfo: Record<string, { name: string; description: string; price: number }> = {
  payment_processing: {
    name: 'Payment Processing',
    description: 'Accept credit cards, Apple Pay, Google Pay, and more',
    price: 25,
  },
  reminders: {
    name: 'SMS/Email Reminders',
    description: 'Reduce no-shows with automated appointment reminders',
    price: 25,
  },
  online_booking: {
    name: 'Online Booking',
    description: 'Let clients book appointments 24/7 from your website',
    price: 25,
  },
};

// Upsell banner component for locked features
function AddOnUpsellBanner({
  addOnId,
  onEnable,
}: {
  addOnId: AddOnId;
  onEnable: () => void;
}) {
  const info = addOnInfo[addOnId];
  if (!info) return null;

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-lavender/20 to-sage/10 rounded-xl border border-lavender/30">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-lavender/30 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-lavender" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-charcoal dark:text-white mb-1">
            Enable {info.name} to use this feature
          </h3>
          <p className="text-sm text-text-muted dark:text-white/60 mb-3">
            {info.description}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onEnable}
              className="inline-flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-lg font-medium hover:bg-sage-dark transition-colors text-sm"
            >
              <Sparkles className="w-4 h-4" />
              Enable Add-on - ${info.price}/mo
            </button>
            <Link
              href="/settings?section=subscription"
              className="text-sm text-text-muted dark:text-white/60 hover:text-charcoal dark:hover:text-white"
            >
              Learn more
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

interface BusinessHour {
  day: string;
  open: string;
  close: string;
  isOpen: boolean;
}

const defaultHours: BusinessHour[] = [
  { day: 'Monday', open: '09:00', close: '18:00', isOpen: true },
  { day: 'Tuesday', open: '09:00', close: '18:00', isOpen: true },
  { day: 'Wednesday', open: '09:00', close: '18:00', isOpen: true },
  { day: 'Thursday', open: '09:00', close: '18:00', isOpen: true },
  { day: 'Friday', open: '09:00', close: '18:00', isOpen: true },
  { day: 'Saturday', open: '10:00', close: '16:00', isOpen: true },
  { day: 'Sunday', open: '10:00', close: '16:00', isOpen: false },
];

function SettingsContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('account'); // Start with My Account
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { activeAddOns, hasAddOn, addAddon, removeAddon, monthlyTotal, trialEndsAt, isTrialActive, plan } = useSubscription();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { can } = usePermissions();

  // All sections are accessible - no permission-based filtering
  // API will enforce permissions on save operations
  // This allows users to explore all settings and see what's available

  // API hooks
  const { salon, loading: salonLoading, error: salonError, updateSalon, fetchSalon, setError: setSalonError } = useSalon();
  const { locations, selectedLocationId, isLoading: locationsLoading, error: locationsError } = useLocationContext();
  const { services, isLoading: servicesLoading, updateService } = useServices();
  const { staff, isLoading: staffLoading, updateStaff } = useStaff();

  // Account management hooks
  const {
    profile,
    sessions,
    loginHistory,
    deletionRequest,
    isLoading: accountLoading,
    error: accountError,
    fetchProfile,
    updateProfile,
    changePassword,
    fetchSessions,
    revokeSession,
    revokeAllOtherSessions,
    fetchLoginHistory,
    requestDataExport,
    fetchDeletionRequest,
    requestAccountDeletion,
    cancelAccountDeletion,
  } = useAccount();

  const {
    members: teamMembers,
    invites: teamInvites,
    isLoading: teamLoading,
    error: teamError,
    fetchMembers,
    fetchInvites,
    sendInvite,
    resendInvite,
    cancelInvite,
    changeRole,
    removeMember,
  } = useTeam();

  const {
    preferences: notificationPreferences,
    isLoading: notificationsLoading,
    error: notificationsError,
    fetchPreferences,
    updatePreferences,
    togglePreference,
  } = useOwnerNotifications();

  const {
    settings: notificationSettings,
    loading: notificationSettingsLoading,
    saving: notificationSettingsSaving,
    error: notificationSettingsError,
    setReminderTiming,
    toggleChannel,
    toggleReminders,
  } = useNotificationSettings();

  const {
    loading: hoursLoading,
    saving: hoursSaving,
    error: hoursError,
    fetchHours,
    getDisplayHours,
    setDisplayHours,
  } = useLocationHours(selectedLocationId);

  // Business hours editing state
  const [hoursSaved, setHoursSaved] = useState(false);
  const [editingHours, setEditingHours] = useState<Array<{
    day: string;
    dayOfWeek: number;
    open: string;
    close: string;
    isOpen: boolean;
  }> | null>(null);

  // Initialize editingHours when API data loads (only on initial load or location change)
  const [hoursInitialized, setHoursInitialized] = useState(false);

  useEffect(() => {
    // Reset initialization flag when location changes
    setHoursInitialized(false);
    setEditingHours(null);
  }, [selectedLocationId]);

  useEffect(() => {
    // Only initialize editingHours once after loading completes for this location
    if (!hoursLoading && !hoursInitialized) {
      setEditingHours(getDisplayHours());
      setHoursInitialized(true);
    }
  }, [hoursLoading, hoursInitialized, getDisplayHours]);

  const handleSaveHours = async () => {
    if (!editingHours) return;
    const success = await setDisplayHours(editingHours);
    if (success) {
      // Re-fetch hours and re-sync editingHours from database
      setHoursInitialized(false);
      await fetchHours();
      setHoursSaved(true);
      setTimeout(() => setHoursSaved(false), 2000);
    }
  };

  // Account section state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Team section state
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'staff' as 'admin' | 'manager' | 'staff' });
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);

  // Load account data when section changes
  useEffect(() => {
    if (activeSection === 'account') {
      fetchProfile();
      fetchSessions();
      fetchLoginHistory();
      fetchDeletionRequest();
    } else if (activeSection === 'team') {
      fetchMembers();
      fetchInvites();
    } else if (activeSection === 'owner-notifications') {
      fetchPreferences();
    } else if (activeSection === 'security') {
      fetchSessions();
      fetchLoginHistory();
    }
  }, [activeSection, fetchProfile, fetchSessions, fetchLoginHistory, fetchDeletionRequest, fetchMembers, fetchInvites, fetchPreferences]);

  // Sync profile form with fetched data
  useEffect(() => {
    if (profile) {
      setProfileForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  // Online booking toggle state
  const [togglingServiceId, setTogglingServiceId] = useState<string | null>(null);
  const [togglingStaffId, setTogglingStaffId] = useState<string | null>(null);

  // Multi-location toggle state
  const [isTogglingMultiLocation, setIsTogglingMultiLocation] = useState(false);
  const [multiLocationError, setMultiLocationError] = useState<string | null>(null);
  const [multiLocationSuccess, setMultiLocationSuccess] = useState(false);

  // Handle multi-location toggle
  const handleToggleMultiLocation = async (enabled: boolean) => {
    setIsTogglingMultiLocation(true);
    setMultiLocationError(null);
    setMultiLocationSuccess(false);
    try {
      await updateSalon({ multiLocationEnabled: enabled });
      setMultiLocationSuccess(true);
      // Hide success message after 3 seconds
      setTimeout(() => setMultiLocationSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to toggle multi-location:', err);
      setMultiLocationError(err instanceof Error ? err.message : 'Failed to update setting');
    } finally {
      setIsTogglingMultiLocation(false);
    }
  };

  // Handle service online booking toggle
  const handleToggleServiceOnlineBooking = async (serviceId: string, enabled: boolean) => {
    setTogglingServiceId(serviceId);
    try {
      await updateService(serviceId, { onlineBookingEnabled: enabled });
    } catch (err) {
      console.error('Failed to toggle service online booking:', err);
    } finally {
      setTogglingServiceId(null);
    }
  };

  // Handle staff online booking toggle
  const handleToggleStaffOnlineBooking = async (staffId: string, enabled: boolean) => {
    setTogglingStaffId(staffId);
    try {
      await updateStaff(staffId, { onlineBookingEnabled: enabled });
    } catch (err) {
      console.error('Failed to toggle staff online booking:', err);
    } finally {
      setTogglingStaffId(null);
    }
  };

  // Form state for business info - initialize from API data
  const [businessForm, setBusinessForm] = useState({
    name: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    timezone: 'America/Los_Angeles',
    description: '',
  });

  // Regional settings form state
  const [regionalForm, setRegionalForm] = useState({
    currency: 'USD' as CurrencyCode,
    dateFormat: 'MDY' as DateFormatStyle,
    timeFormat: '12h' as TimeFormatStyle,
    weekStartsOn: 0,
    timezone: 'America/Los_Angeles',
  });

  // Tax settings form state
  const [taxForm, setTaxForm] = useState({
    taxEnabled: false,
    taxName: 'Sales Tax',
    taxRate: 0,
    taxIncluded: false,
    vatNumber: '',
  });

  // Saving states for regional and tax
  const [isSavingRegional, setIsSavingRegional] = useState(false);
  const [regionalSaved, setRegionalSaved] = useState(false);
  const [regionalError, setRegionalError] = useState<string | null>(null);
  const [isSavingTax, setIsSavingTax] = useState(false);
  const [taxSaved, setTaxSaved] = useState(false);
  const [taxError, setTaxError] = useState<string | null>(null);

  // Branding form state
  const [brandingForm, setBrandingForm] = useState({
    primaryColor: '#C7DCC8',
    backgroundColor: '#FAF8F3',
  });
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [brandingSaved, setBrandingSaved] = useState(false);
  const [brandingError, setBrandingError] = useState<string | null>(null);

  // Widget customization state - synced with API
  const [widgetSettings, setWidgetSettings] = useState({
    primaryColor: '#7C9A82',
    accentColor: '#B5A8D5',
    buttonStyle: 'rounded' as 'rounded' | 'square',
    fontFamily: 'system' as 'system' | 'modern' | 'classic',
  });
  const [widgetLoading, setWidgetLoading] = useState(true); // Start true to prevent initial save
  const [widgetSaving, setWidgetSaving] = useState(false);
  const [widgetSaveStatus, setWidgetSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [widgetInitialized, setWidgetInitialized] = useState(false);
  const [iframeHeight, setIframeHeight] = useState('600');
  const [embedCopied, setEmbedCopied] = useState(false);
  const [activeInstallTab, setActiveInstallTab] = useState('wordpress');

  // Fetch widget settings on mount
  useEffect(() => {
    const fetchWidgetSettings = async () => {
      try {
        const response = await api.get<{
          primaryColor: string;
          accentColor: string;
          buttonStyle: 'rounded' | 'square';
          fontFamily: 'system' | 'modern' | 'classic';
        }>('/salon/widget-settings');
        if (response.success && response.data) {
          setWidgetSettings({
            primaryColor: response.data.primaryColor || '#7C9A82',
            accentColor: response.data.accentColor || '#B5A8D5',
            buttonStyle: response.data.buttonStyle || 'rounded',
            fontFamily: response.data.fontFamily || 'system',
          });
        }
      } catch (err) {
        console.error('Failed to fetch widget settings:', err);
      } finally {
        setWidgetLoading(false);
        // Small delay to allow state to settle before enabling auto-save
        setTimeout(() => setWidgetInitialized(true), 100);
      }
    };
    fetchWidgetSettings();
  }, []);

  // Auto-save widget settings when they change (debounced)
  useEffect(() => {
    // Don't save until we've loaded initial data
    if (!widgetInitialized) return;

    const saveWidgetSettings = async () => {
      setWidgetSaving(true);
      setWidgetSaveStatus('saving');
      try {
        const response = await api.patch('/salon/widget-settings', widgetSettings);
        if (response.success) {
          setWidgetSaveStatus('saved');
          setTimeout(() => setWidgetSaveStatus('idle'), 2000);
        } else {
          setWidgetSaveStatus('error');
        }
      } catch (err) {
        console.error('Failed to save widget settings:', err);
        setWidgetSaveStatus('error');
      } finally {
        setWidgetSaving(false);
      }
    };

    // Debounce the save - wait 500ms after last change
    const timeoutId = setTimeout(() => {
      saveWidgetSettings();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [widgetSettings, widgetInitialized]);

  // Update form when salon data loads
  useEffect(() => {
    if (salon) {
      setBusinessForm({
        name: salon.name || '',
        phone: salon.phone || '',
        email: salon.email || '',
        website: salon.website || '',
        address: salon.address || '',
        city: salon.city || '',
        state: salon.state || '',
        zip: salon.zip || '',
        timezone: salon.timezone || 'America/Los_Angeles',
        description: salon.description || '',
      });

      // Sync regional settings
      setRegionalForm({
        currency: (salon.currency as CurrencyCode) || 'USD',
        dateFormat: (salon.dateFormat as DateFormatStyle) || 'MDY',
        timeFormat: (salon.timeFormat as TimeFormatStyle) || '12h',
        weekStartsOn: salon.weekStartsOn ?? 0,
        timezone: salon.timezone || 'America/Los_Angeles',
      });

      // Sync tax settings
      setTaxForm({
        taxEnabled: salon.taxEnabled ?? false,
        taxName: salon.taxName || 'Sales Tax',
        taxRate: salon.taxRate ?? 0,
        taxIncluded: salon.taxIncluded ?? false,
        vatNumber: salon.vatNumber || '',
      });

      // Sync branding settings
      setBrandingForm({
        primaryColor: salon.brand_primary_color || '#C7DCC8',
        backgroundColor: salon.brand_background_color || '#FAF8F3',
      });
    }
  }, [salon]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      if (activeSection === 'business') {
        await updateSalon({
          name: businessForm.name,
          phone: businessForm.phone || null,
          email: businessForm.email,
          website: businessForm.website || null,
          address: businessForm.address || null,
          city: businessForm.city || null,
          state: businessForm.state || null,
          zip: businessForm.zip || null,
          timezone: businessForm.timezone,
          description: businessForm.description || null,
        });
      }
      // For hours and other sections, we would call appropriate API endpoints
      // For now, simulate save for other sections
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Save regional settings
  const handleSaveRegional = async () => {
    setIsSavingRegional(true);
    setRegionalError(null);
    setRegionalSaved(false);

    try {
      await updateSalon({
        currency: regionalForm.currency,
        dateFormat: regionalForm.dateFormat,
        timeFormat: regionalForm.timeFormat,
        weekStartsOn: regionalForm.weekStartsOn,
        timezone: regionalForm.timezone,
      });
      setRegionalSaved(true);
      setTimeout(() => setRegionalSaved(false), 2000);
    } catch (err) {
      setRegionalError(err instanceof Error ? err.message : 'Failed to save regional settings');
    } finally {
      setIsSavingRegional(false);
    }
  };

  // Save tax settings
  const handleSaveTax = async () => {
    setIsSavingTax(true);
    setTaxError(null);
    setTaxSaved(false);

    try {
      await updateSalon({
        taxEnabled: taxForm.taxEnabled,
        taxName: taxForm.taxName,
        taxRate: taxForm.taxRate,
        taxIncluded: taxForm.taxIncluded,
        vatNumber: taxForm.vatNumber || null,
      });
      setTaxSaved(true);
      setTimeout(() => setTaxSaved(false), 2000);
    } catch (err) {
      setTaxError(err instanceof Error ? err.message : 'Failed to save tax settings');
    } finally {
      setIsSavingTax(false);
    }
  };

  // Save branding settings
  const handleSaveBranding = async () => {
    setIsSavingBranding(true);
    setBrandingError(null);
    setBrandingSaved(false);

    try {
      await updateSalon({
        brand_primary_color: brandingForm.primaryColor,
        brand_background_color: brandingForm.backgroundColor,
      });
      setBrandingSaved(true);
      setTimeout(() => setBrandingSaved(false), 2000);
    } catch (err) {
      setBrandingError(err instanceof Error ? err.message : 'Failed to save branding settings');
    } finally {
      setIsSavingBranding(false);
    }
  };

  const toggleAddOn = async (addOnId: AddOnId) => {
    try {
      if (hasAddOn(addOnId)) {
        await removeAddon(addOnId);
      } else {
        await addAddon(addOnId);
      }
    } catch (error) {
      console.error('Failed to toggle add-on:', error);
      // Could show a toast notification here
    }
  };

  // All available add-ons for the subscription page (7 add-ons at $25/mo each)
  const allAddOns: { id: AddOnId; name: string; price: number; icon: typeof Globe; description: string }[] = [
    { id: 'online_booking', name: 'Online Booking', price: 25, icon: Globe, description: 'Let clients book 24/7 from your website' },
    { id: 'payment_processing', name: 'Payment Processing', price: 25, icon: CreditCard, description: 'Accept cards, Apple Pay, Google Pay' },
    { id: 'reminders', name: 'SMS/Email Reminders', price: 25, icon: Mail, description: 'Reduce no-shows with automated reminders' },
    { id: 'reports', name: 'Reports & Analytics', price: 25, icon: BarChart3, description: 'Revenue dashboards, staff performance' },
    { id: 'memberships', name: 'Packages & Memberships', price: 25, icon: Users, description: 'Sell packages and recurring memberships' },
    { id: 'gift_cards', name: 'Gift Cards', price: 25, icon: CreditCard, description: 'Sell and redeem digital gift cards' },
    { id: 'marketing', name: 'Marketing Automation', price: 25, icon: Sparkles, description: 'Automated campaigns and promotions' },
  ];

  const renderSection = () => {
    // Sections that depend on salon data
    const salonDependentSections = ['business', 'regional', 'tax'];

    // Show loading state for salon-dependent sections
    if (salonDependentSections.includes(activeSection) && salonLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-sage mx-auto mb-4" />
            <p className="text-text-muted dark:text-white/60">Loading settings...</p>
          </div>
        </div>
      );
    }

    // Show error state for salon-dependent sections
    if (salonDependentSections.includes(activeSection) && salonError) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-rose/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-rose" />
          </div>
          <h3 className="text-xl font-bold text-charcoal dark:text-white mb-2">Failed to Load Settings</h3>
          <p className="text-text-muted dark:text-white/60 mb-6">{salonError}</p>
          <button
            onClick={fetchSalon}
            className="px-6 py-3 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    switch (activeSection) {
      case 'account':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-charcoal dark:text-white mb-1">My Account</h2>
              <p className="text-text-muted dark:text-white/60">
                Manage your personal profile and account settings.
              </p>
            </div>

            {accountLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-sage" />
              </div>
            ) : (
              <>
                {/* Profile Section */}
                <div className="p-6 bg-white dark:bg-sidebar rounded-xl border border-charcoal/10 dark:border-white/10">
                  <h3 className="font-semibold text-charcoal dark:text-white mb-4">Profile Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">First Name</label>
                      <input
                        type="text"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Last Name</label>
                      <input
                        type="text"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Email</label>
                      <input
                        type="email"
                        value={profile?.email || ''}
                        disabled
                        className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 bg-charcoal/5 dark:bg-white/5 text-text-muted dark:text-white/60 cursor-not-allowed"
                      />
                      <p className="text-xs text-text-muted dark:text-white/50 mt-1">Contact support to change your email</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Phone</label>
                      <input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={async () => {
                        setIsUpdatingProfile(true);
                        setProfileError(null);
                        setProfileSaved(false);
                        try {
                          const result = await updateProfile(profileForm);
                          if (result) {
                            // Re-fetch to verify persistence
                            await fetchProfile();
                            setProfileSaved(true);
                            setTimeout(() => setProfileSaved(false), 2000);
                          } else {
                            setProfileError('Failed to save profile');
                          }
                        } catch (err) {
                          console.error('Failed to update profile:', err);
                          setProfileError(err instanceof Error ? err.message : 'Failed to save profile');
                        } finally {
                          setIsUpdatingProfile(false);
                        }
                      }}
                      disabled={isUpdatingProfile}
                      className="px-6 py-3 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isUpdatingProfile ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : profileSaved ? (
                        <Check className="w-4 h-4" />
                      ) : null}
                      {profileSaved ? 'Saved!' : 'Save Changes'}
                    </button>
                    {profileError && (
                      <span className="text-rose-dark text-sm">{profileError}</span>
                    )}
                  </div>
                </div>

                {/* Data Export Section */}
                <div className="p-6 bg-white dark:bg-sidebar rounded-xl border border-charcoal/10 dark:border-white/10">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-sage/10 flex items-center justify-center flex-shrink-0">
                      <Download className="w-6 h-6 text-sage" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-charcoal dark:text-white mb-1">Export Your Data</h3>
                      <p className="text-sm text-text-muted dark:text-white/60 mb-4">
                        Download a copy of all your account data including profile, appointments, and activity history.
                      </p>
                      <button
                        onClick={async () => {
                          try {
                            const data = await requestDataExport();
                            if (data) {
                              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `peacase-data-export-${new Date().toISOString().split('T')[0]}.json`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }
                          } catch (err) {
                            console.error('Failed to export data:', err);
                          }
                        }}
                        className="px-4 py-2 border border-sage text-sage rounded-lg font-medium hover:bg-sage/10 transition-colors flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download Data
                      </button>
                    </div>
                  </div>
                </div>

                {/* Delete Account Section */}
                <div className="p-6 bg-white dark:bg-sidebar rounded-xl border border-rose/20 dark:border-rose/20">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-rose/10 dark:bg-rose/20 flex items-center justify-center flex-shrink-0">
                      <Trash2 className="w-6 h-6 text-rose" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-charcoal dark:text-white mb-1">Delete Account</h3>
                      {deletionRequest ? (
                        <div>
                          <p className="text-sm text-rose-dark dark:text-rose mb-4">
                            Your account is scheduled for deletion on {new Date(deletionRequest.scheduledDeletion).toLocaleDateString()}.
                          </p>
                          <button
                            onClick={async () => {
                              try {
                                await cancelAccountDeletion();
                              } catch (err) {
                                console.error('Failed to cancel deletion:', err);
                              }
                            }}
                            className="px-4 py-2 bg-charcoal dark:bg-white text-white dark:text-charcoal rounded-lg font-medium hover:opacity-90 transition-opacity"
                          >
                            Cancel Deletion
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-text-muted dark:text-white/60 mb-4">
                            Permanently delete your account and all associated data. This cannot be undone.
                          </p>
                          <button
                            onClick={async () => {
                              if (confirm('Are you sure you want to delete your account? You will have 30 days to cancel this request.')) {
                                try {
                                  await requestAccountDeletion();
                                } catch (err) {
                                  console.error('Failed to request deletion:', err);
                                }
                              }
                            }}
                            className="px-4 py-2 border border-rose text-rose rounded-lg font-medium hover:bg-rose/10 dark:hover:bg-rose/20 transition-colors"
                          >
                            Delete Account
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 'business':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-charcoal dark:text-white mb-1">Business Information</h2>
              <p className="text-text-muted dark:text-white/60">
                Update your business details. This information appears on invoices and your booking page.
              </p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Business Name</label>
                  <input
                    type="text"
                    value={businessForm.name}
                    onChange={(e) => setBusinessForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={businessForm.phone}
                    onChange={(e) => setBusinessForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Email Address</label>
                  <input
                    type="email"
                    value={businessForm.email}
                    onChange={(e) => setBusinessForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Website</label>
                  <input
                    type="url"
                    value={businessForm.website}
                    onChange={(e) => setBusinessForm((prev) => ({ ...prev, website: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Street Address</label>
                <input
                  type="text"
                  value={businessForm.address}
                  onChange={(e) => setBusinessForm((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">City</label>
                  <input
                    type="text"
                    value={businessForm.city}
                    onChange={(e) => setBusinessForm((prev) => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">State</label>
                  <input
                    type="text"
                    value={businessForm.state}
                    onChange={(e) => setBusinessForm((prev) => ({ ...prev, state: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">ZIP Code</label>
                  <input
                    type="text"
                    value={businessForm.zip}
                    onChange={(e) => setBusinessForm((prev) => ({ ...prev, zip: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Timezone</label>
                <select
                  value={businessForm.timezone}
                  onChange={(e) => setBusinessForm((prev) => ({ ...prev, timezone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                >
                  <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                  <option value="America/Denver">Mountain Time (US & Canada)</option>
                  <option value="America/Chicago">Central Time (US & Canada)</option>
                  <option value="America/New_York">Eastern Time (US & Canada)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Business Description</label>
                <textarea
                  rows={3}
                  value={businessForm.description}
                  onChange={(e) => setBusinessForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all resize-none"
                />
              </div>
            </div>
          </div>
        );

      case 'team':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-charcoal dark:text-white mb-1">Team Access</h2>
                <p className="text-text-muted dark:text-white/60">
                  Invite and manage your team members.
                </p>
              </div>
              <button
                onClick={() => setShowInviteForm(true)}
                className="px-4 py-2 bg-sage text-white rounded-lg font-medium hover:bg-sage-dark transition-colors flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Invite Member
              </button>
            </div>

            {teamLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-sage" />
              </div>
            ) : (
              <>
                {/* Invite Form Modal */}
                {showInviteForm && (
                  <div className="p-6 bg-white dark:bg-sidebar rounded-xl border border-sage/50 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-charcoal dark:text-white">Invite Team Member</h3>
                      <button
                        onClick={() => { setShowInviteForm(false); setInviteSuccess(false); }}
                        className="p-1 hover:bg-charcoal/10 dark:hover:bg-white/10 rounded"
                      >
                        <X className="w-5 h-5 text-text-muted dark:text-white/60" />
                      </button>
                    </div>
                    {inviteSuccess ? (
                      <div className="text-center py-4">
                        <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                        <p className="text-charcoal dark:text-white font-medium">Invitation sent!</p>
                        <button
                          onClick={() => { setShowInviteForm(false); setInviteSuccess(false); setInviteForm({ email: '', role: 'staff' }); }}
                          className="mt-4 text-sage hover:underline"
                        >
                          Close
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Email Address</label>
                          <input
                            type="email"
                            value={inviteForm.email}
                            onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                            placeholder="team@example.com"
                            className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Role</label>
                          <select
                            value={inviteForm.role}
                            onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as 'admin' | 'manager' | 'staff' })}
                            className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                          >
                            <option value="staff">Staff - Can manage own schedule and appointments</option>
                            <option value="manager">Manager - Can manage staff and view reports</option>
                            <option value="admin">Admin - Full access to all settings</option>
                          </select>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            onClick={() => setShowInviteForm(false)}
                            className="px-4 py-2 text-text-muted dark:text-white/60 hover:text-charcoal dark:hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={async () => {
                              setIsInviting(true);
                              try {
                                await sendInvite(inviteForm);
                                setInviteSuccess(true);
                              } catch (err) {
                                console.error('Failed to send invite:', err);
                              } finally {
                                setIsInviting(false);
                              }
                            }}
                            disabled={isInviting || !inviteForm.email}
                            className="px-6 py-2 bg-sage text-white rounded-lg font-medium hover:bg-sage-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            {isInviting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Send Invitation
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Pending Invites */}
                {teamInvites.length > 0 && (
                  <div className="p-6 bg-white dark:bg-sidebar rounded-xl border border-charcoal/10 dark:border-white/10">
                    <h3 className="font-semibold text-charcoal dark:text-white mb-4">Pending Invitations</h3>
                    <div className="space-y-3">
                      {teamInvites.map((invite) => (
                        <div key={invite.id} className="flex items-center justify-between p-3 bg-charcoal/5 dark:bg-white/5 rounded-lg">
                          <div>
                            <p className="font-medium text-charcoal dark:text-white">{invite.email}</p>
                            <p className="text-xs text-text-muted dark:text-white/60">
                              {invite.role.charAt(0).toUpperCase() + invite.role.slice(1)} - Expires {new Date(invite.expiresAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => resendInvite(invite.id)}
                              className="p-2 text-text-muted dark:text-white/60 hover:text-sage hover:bg-sage/10 rounded-lg"
                              title="Resend"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => cancelInvite(invite.id)}
                              className="p-2 text-text-muted dark:text-white/60 hover:text-rose hover:bg-rose/10 dark:hover:bg-rose/20 rounded-lg"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Team Members */}
                <div className="p-6 bg-white dark:bg-sidebar rounded-xl border border-charcoal/10 dark:border-white/10">
                  <h3 className="font-semibold text-charcoal dark:text-white mb-4">Team Members ({teamMembers.length})</h3>
                  <div className="space-y-3">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-4 bg-charcoal/5 dark:bg-white/5 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center">
                            <User className="w-5 h-5 text-sage" />
                          </div>
                          <div>
                            <p className="font-medium text-charcoal dark:text-white">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-sm text-text-muted dark:text-white/60">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <select
                            value={member.role}
                            onChange={(e) => changeRole(member.id, e.target.value as 'admin' | 'manager' | 'staff')}
                            className="px-3 py-1.5 text-sm rounded-lg border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white"
                          >
                            <option value="staff">Staff</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => {
                              if (confirm(`Remove ${member.firstName} ${member.lastName} from the team?`)) {
                                removeMember(member.id);
                              }
                            }}
                            className="p-2 text-text-muted dark:text-white/60 hover:text-rose hover:bg-rose/10 dark:hover:bg-rose/20 rounded-lg"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 'locations':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-charcoal dark:text-white mb-1">Location Settings</h2>
              <p className="text-text-muted dark:text-white/60">
                Manage multiple locations for your business. Add locations, assign staff, and set location-specific pricing.
              </p>
            </div>

            {/* Multi-Location Feature Toggle */}
            <div className="p-6 bg-white dark:bg-sidebar rounded-2xl border border-charcoal/10 dark:border-white/10 shadow-soft">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <MapPin className="w-5 h-5 text-sage" />
                    <h3 className="font-semibold text-charcoal dark:text-white">Multi-Location Mode</h3>
                    {salon?.multiLocationEnabled && (
                      <span className="px-2 py-0.5 bg-sage/20 text-sage-dark text-xs font-medium rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-muted dark:text-white/60 mb-4">
                    Enable multi-location mode to manage multiple business locations. Each location can have its own staff, services, pricing, and operating hours.
                  </p>

                  {/* Features list */}
                  <ul className="text-sm space-y-2 text-text-secondary dark:text-white/70">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-sage" />
                      Assign staff to specific locations
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-sage" />
                      Set location-specific service pricing
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-sage" />
                      Filter reports and calendar by location
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-sage" />
                      Clients choose location when booking
                    </li>
                  </ul>
                </div>

                {/* Toggle Switch */}
                <div className="flex-shrink-0 ml-6">
                  <button
                    onClick={() => handleToggleMultiLocation(!salon?.multiLocationEnabled)}
                    disabled={isTogglingMultiLocation}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      salon?.multiLocationEnabled ? 'bg-sage' : 'bg-charcoal/20'
                    } ${isTogglingMultiLocation ? 'opacity-50' : ''}`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                        salon?.multiLocationEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                    {isTogglingMultiLocation && (
                      <Loader2 className="absolute w-3 h-3 text-white animate-spin left-1/2 -translate-x-1/2" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error/Success feedback */}
              {multiLocationError && (
                <div className="mt-4 p-3 bg-rose/10 border border-rose/20 rounded-lg flex items-center gap-2 text-rose-dark text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {multiLocationError}
                </div>
              )}
              {multiLocationSuccess && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
                  <Check className="w-4 h-4 flex-shrink-0" />
                  Multi-location setting updated successfully!
                </div>
              )}
            </div>

            {/* Locations Summary */}
            {salon?.multiLocationEnabled && (
              <div className="p-6 bg-white dark:bg-sidebar rounded-2xl border border-charcoal/10 dark:border-white/10 shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-charcoal dark:text-white">Your Locations</h3>
                  <Link
                    href="/locations"
                    className="text-sm text-sage hover:text-sage-dark font-medium flex items-center gap-1"
                  >
                    Manage Locations
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>

                {locationsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-sage" />
                  </div>
                ) : locationsError ? (
                  <div className="text-center py-4 text-rose-dark">
                    Failed to load locations
                  </div>
                ) : locations.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="w-10 h-10 text-charcoal/20 dark:text-white/20 mx-auto mb-3" />
                    <p className="text-text-muted dark:text-white/60 mb-4">No locations added yet</p>
                    <Link
                      href="/locations"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors"
                    >
                      Add Your First Location
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {locations.slice(0, 5).map((location) => (
                      <div
                        key={location.id}
                        className="flex items-center justify-between p-4 bg-charcoal/5 dark:bg-white/5 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className={`w-5 h-5 ${location.isPrimary ? 'text-amber-500' : 'text-text-muted dark:text-white/40'}`} />
                          <div>
                            <p className="font-medium text-charcoal dark:text-white flex items-center gap-2">
                              {location.name}
                              {location.isPrimary && (
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded">
                                  Primary
                                </span>
                              )}
                            </p>
                            {location.city && (
                              <p className="text-sm text-text-muted dark:text-white/60">{location.city}, {location.state}</p>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          location.isActive ? 'bg-sage/20 text-sage-dark' : 'bg-charcoal/10 text-text-muted'
                        }`}>
                          {location.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    ))}
                    {locations.length > 5 && (
                      <p className="text-sm text-text-muted dark:text-white/60 text-center pt-2">
                        + {locations.length - 5} more locations
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Pricing Info */}
            <div className="p-4 bg-lavender/10 rounded-xl border border-lavender/30">
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-lavender flex-shrink-0 mt-0.5" />
                <div className="text-sm text-text-secondary dark:text-white/70">
                  <p className="font-medium text-charcoal dark:text-white mb-1">Multi-Location Pricing</p>
                  <ul className="space-y-1">
                    <li>• First location: <span className="font-medium">Included in your plan</span></li>
                    <li>• Each additional location: <span className="font-medium text-charcoal dark:text-white">$100/month</span></li>
                  </ul>
                  {salon?.multiLocationEnabled && locations.length > 1 && (
                    <p className="mt-2 pt-2 border-t border-lavender/30">
                      You have <span className="font-medium text-charcoal dark:text-white">{locations.length} locations</span> ({locations.length - 1} additional = <span className="font-medium text-charcoal dark:text-white">${(locations.length - 1) * 100}/month</span>)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'hours':
        // No location selected
        if (!selectedLocationId) {
          return (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 mx-auto text-charcoal/20 dark:text-white/20 mb-4" />
              <p className="text-text-muted dark:text-white/60">
                Select a location from the header to manage its business hours.
              </p>
            </div>
          );
        }

        // Loading state
        if (hoursLoading || !editingHours) {
          return (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-sage" />
              <span className="ml-2 text-text-muted dark:text-white/60">Loading hours...</span>
            </div>
          );
        }

        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-charcoal dark:text-white mb-1">Business Hours</h2>
              <p className="text-text-muted dark:text-white/60">
                Set your default operating hours. Staff schedules can override these settings.
              </p>
            </div>

            <div className="space-y-3">
              {editingHours.map((day, index) => (
                <div
                  key={day.day}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    day.isOpen ? 'border-sage/30 bg-sage/5' : 'border-charcoal/10 dark:border-white/10 bg-charcoal/5 dark:bg-white/5'
                  }`}
                >
                  <div className="w-28 flex-shrink-0">
                    <span className="font-medium text-charcoal dark:text-white">{day.day}</span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={day.isOpen}
                      onChange={(e) => {
                        const updated = [...editingHours];
                        updated[index] = { ...updated[index], isOpen: e.target.checked };
                        setEditingHours(updated);
                      }}
                      className="w-5 h-5 rounded border-charcoal/20 dark:border-white/20 text-sage focus:ring-sage"
                    />
                    <span className="text-sm text-text-muted dark:text-white/60">Open</span>
                  </label>

                  {day.isOpen && (
                    <div className="flex items-center gap-2 ml-auto">
                      <input
                        type="time"
                        value={day.open}
                        onChange={(e) => {
                          const updated = [...editingHours];
                          updated[index] = { ...updated[index], open: e.target.value };
                          setEditingHours(updated);
                        }}
                        className="px-3 py-2 rounded-lg border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage outline-none text-sm"
                      />
                      <span className="text-text-muted dark:text-white/40">to</span>
                      <input
                        type="time"
                        value={day.close}
                        onChange={(e) => {
                          const updated = [...editingHours];
                          updated[index] = { ...updated[index], close: e.target.value };
                          setEditingHours(updated);
                        }}
                        className="px-3 py-2 rounded-lg border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage outline-none text-sm"
                      />
                    </div>
                  )}

                  {!day.isOpen && (
                    <span className="ml-auto text-sm text-text-muted dark:text-white/40">Closed</span>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 bg-lavender/20 rounded-xl border border-lavender/30">
              <p className="text-sm text-text-secondary dark:text-white/70">
                <strong>Note:</strong> To set up holiday closures or special hours, go to Calendar
                and use the Block Time feature.
              </p>
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-charcoal/10 dark:border-white/10">
              {hoursError && (
                <p className="text-rose-dark text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {hoursError}
                </p>
              )}
              {hoursSaved && (
                <p className="text-sage text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Hours saved
                </p>
              )}
              <button
                onClick={handleSaveHours}
                disabled={hoursSaving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-lg font-medium hover:bg-sage-dark transition-colors disabled:opacity-50"
              >
                {hoursSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Hours'
                )}
              </button>
            </div>
          </div>
        );

      case 'regional':
        // Group timezones by region for the dropdown
        const groupedTimezones = TIMEZONE_OPTIONS.reduce((acc, tz) => {
          if (!acc[tz.region]) acc[tz.region] = [];
          acc[tz.region].push(tz);
          return acc;
        }, {} as Record<string, typeof TIMEZONE_OPTIONS[number][]>);

        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-charcoal dark:text-white mb-1">Regional Settings</h2>
              <p className="text-text-muted dark:text-white/60">
                Configure currency, date format, time format, and timezone for your business.
              </p>
            </div>

            {/* Currency */}
            <div className="p-6 bg-white dark:bg-sidebar rounded-2xl border border-charcoal/10 dark:border-white/10">
              <h3 className="font-semibold text-charcoal dark:text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-sage" />
                Currency
              </h3>
              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Display Currency</label>
                <p className="text-xs text-text-muted dark:text-white/50 mb-3">
                  This currency will be used throughout the app for prices, invoices, and reports.
                </p>
                <select
                  value={regionalForm.currency}
                  onChange={(e) => setRegionalForm((prev) => ({ ...prev, currency: e.target.value as CurrencyCode }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all bg-white dark:bg-sidebar text-charcoal dark:text-white"
                >
                  {Object.entries(SUPPORTED_CURRENCIES).map(([code, info]) => (
                    <option key={code} value={code}>
                      {info.symbol} {info.name} ({code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date & Time Format */}
            <div className="p-6 bg-white dark:bg-sidebar rounded-2xl border border-charcoal/10 dark:border-white/10">
              <h3 className="font-semibold text-charcoal dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sage" />
                Date & Time Format
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Date Format</label>
                  <p className="text-xs text-text-muted dark:text-white/50 mb-3">
                    How dates are displayed (e.g., January 15, 2026)
                  </p>
                  <select
                    value={regionalForm.dateFormat}
                    onChange={(e) => setRegionalForm((prev) => ({ ...prev, dateFormat: e.target.value as DateFormatStyle }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all bg-white dark:bg-sidebar text-charcoal dark:text-white"
                  >
                    <option value="MDY">MM/DD/YYYY (US)</option>
                    <option value="DMY">DD/MM/YYYY (UK/Europe)</option>
                    <option value="YMD">YYYY-MM-DD (ISO)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Time Format</label>
                  <p className="text-xs text-text-muted dark:text-white/50 mb-3">
                    How times are displayed (e.g., 2:30 PM vs 14:30)
                  </p>
                  <select
                    value={regionalForm.timeFormat}
                    onChange={(e) => setRegionalForm((prev) => ({ ...prev, timeFormat: e.target.value as TimeFormatStyle }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all bg-white dark:bg-sidebar text-charcoal dark:text-white"
                  >
                    <option value="12h">12-hour (2:30 PM)</option>
                    <option value="24h">24-hour (14:30)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Week Starts On</label>
                  <p className="text-xs text-text-muted dark:text-white/50 mb-3">
                    First day of the week in calendar views
                  </p>
                  <select
                    value={regionalForm.weekStartsOn}
                    onChange={(e) => setRegionalForm((prev) => ({ ...prev, weekStartsOn: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all bg-white dark:bg-sidebar text-charcoal dark:text-white"
                  >
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Timezone</label>
                  <p className="text-xs text-text-muted dark:text-white/50 mb-3">
                    Your business timezone for appointments
                  </p>
                  <select
                    value={regionalForm.timezone}
                    onChange={(e) => setRegionalForm((prev) => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all bg-white dark:bg-sidebar text-charcoal dark:text-white"
                  >
                    {Object.entries(groupedTimezones).map(([region, timezones]) => (
                      <optgroup key={region} label={region}>
                        {timezones.map((tz) => (
                          <option key={tz.value} value={tz.value}>
                            {tz.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="p-4 bg-sage/10 rounded-xl border border-sage/20">
              <h4 className="font-medium text-charcoal dark:text-white mb-3">Preview</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-text-muted dark:text-white/60 mb-1">Currency</p>
                  <p className="font-medium text-charcoal dark:text-white">
                    {SUPPORTED_CURRENCIES[regionalForm.currency]?.symbol}125.00
                  </p>
                </div>
                <div>
                  <p className="text-text-muted dark:text-white/60 mb-1">Date</p>
                  <p className="font-medium text-charcoal dark:text-white">
                    {regionalForm.dateFormat === 'MDY' ? '01/15/2026' :
                     regionalForm.dateFormat === 'DMY' ? '15/01/2026' : '2026-01-15'}
                  </p>
                </div>
                <div>
                  <p className="text-text-muted dark:text-white/60 mb-1">Time</p>
                  <p className="font-medium text-charcoal dark:text-white">
                    {regionalForm.timeFormat === '12h' ? '2:30 PM' : '14:30'}
                  </p>
                </div>
                <div>
                  <p className="text-text-muted dark:text-white/60 mb-1">Week Starts</p>
                  <p className="font-medium text-charcoal dark:text-white">
                    {regionalForm.weekStartsOn === 0 ? 'Sunday' : 'Monday'}
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button for Regional */}
            <div className="flex items-center justify-between pt-4 border-t border-charcoal/10 dark:border-white/10">
              <div>
                {regionalSaved && (
                  <span className="flex items-center gap-2 text-green-600">
                    <Check className="w-4 h-4" />
                    Regional settings saved
                  </span>
                )}
                {regionalError && (
                  <span className="flex items-center gap-2 text-rose-dark">
                    <AlertCircle className="w-4 h-4" />
                    {regionalError}
                  </span>
                )}
              </div>
              <button
                onClick={handleSaveRegional}
                disabled={isSavingRegional}
                className="px-6 py-3 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSavingRegional ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Regional Settings'
                )}
              </button>
            </div>
          </div>
        );

      case 'tax':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-charcoal dark:text-white mb-1">Tax / VAT Settings</h2>
              <p className="text-text-muted dark:text-white/60">
                Configure tax rates and VAT settings for your invoices and receipts.
              </p>
            </div>

            {/* Tax Enable Toggle */}
            <div className="p-6 bg-white dark:bg-sidebar rounded-2xl border border-charcoal/10 dark:border-white/10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Receipt className="w-5 h-5 text-sage" />
                    <h3 className="font-semibold text-charcoal dark:text-white">Enable Tax</h3>
                    {taxForm.taxEnabled && (
                      <span className="px-2 py-0.5 bg-sage/20 text-sage-dark text-xs font-medium rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-text-muted dark:text-white/60">
                    When enabled, tax will be calculated and shown on invoices and receipts.
                  </p>
                </div>
                <button
                  onClick={() => setTaxForm((prev) => ({ ...prev, taxEnabled: !prev.taxEnabled }))}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    taxForm.taxEnabled ? 'bg-sage' : 'bg-charcoal/20'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                      taxForm.taxEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Tax Configuration - Only shown when enabled */}
            {taxForm.taxEnabled && (
              <>
                <div className="p-6 bg-white dark:bg-sidebar rounded-2xl border border-charcoal/10 dark:border-white/10">
                  <h3 className="font-semibold text-charcoal dark:text-white mb-4">Tax Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Tax Name</label>
                      <p className="text-xs text-text-muted dark:text-white/50 mb-3">
                        The label shown on invoices (e.g., VAT, GST, Sales Tax)
                      </p>
                      <input
                        type="text"
                        value={taxForm.taxName}
                        onChange={(e) => setTaxForm((prev) => ({ ...prev, taxName: e.target.value }))}
                        placeholder="Sales Tax"
                        className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Tax Rate (%)</label>
                      <p className="text-xs text-text-muted dark:text-white/50 mb-3">
                        The percentage rate applied to services
                      </p>
                      <div className="relative">
                        <input
                          type="number"
                          value={taxForm.taxRate}
                          onChange={(e) => setTaxForm((prev) => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                          placeholder="0"
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-full px-4 py-3 pr-10 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted dark:text-white/40">%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-white dark:bg-sidebar rounded-2xl border border-charcoal/10 dark:border-white/10">
                  <h3 className="font-semibold text-charcoal dark:text-white mb-4">Pricing Display</h3>

                  <div className="space-y-4">
                    <label className="flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-sage/30"
                      onClick={() => setTaxForm((prev) => ({ ...prev, taxIncluded: false }))}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        !taxForm.taxIncluded ? 'border-sage' : 'border-charcoal/30 dark:border-white/30'
                      }`}>
                        {!taxForm.taxIncluded && <div className="w-2.5 h-2.5 rounded-full bg-sage" />}
                      </div>
                      <div>
                        <p className="font-medium text-charcoal dark:text-white">Tax added at checkout (exclusive)</p>
                        <p className="text-sm text-text-muted dark:text-white/60">
                          Service prices shown without tax. Tax is calculated and added separately.
                        </p>
                        <p className="text-xs text-text-muted dark:text-white/40 mt-1">
                          Example: $100 service + {taxForm.taxRate}% tax = ${(100 + (100 * taxForm.taxRate / 100)).toFixed(2)} total
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-sage/30"
                      onClick={() => setTaxForm((prev) => ({ ...prev, taxIncluded: true }))}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        taxForm.taxIncluded ? 'border-sage' : 'border-charcoal/30 dark:border-white/30'
                      }`}>
                        {taxForm.taxIncluded && <div className="w-2.5 h-2.5 rounded-full bg-sage" />}
                      </div>
                      <div>
                        <p className="font-medium text-charcoal dark:text-white">Tax included in price (inclusive)</p>
                        <p className="text-sm text-text-muted dark:text-white/60">
                          Service prices already include tax. Tax amount shown as breakdown.
                        </p>
                        <p className="text-xs text-text-muted dark:text-white/40 mt-1">
                          Example: $100 service includes ${(100 * taxForm.taxRate / (100 + taxForm.taxRate)).toFixed(2)} tax
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="p-6 bg-white dark:bg-sidebar rounded-2xl border border-charcoal/10 dark:border-white/10">
                  <h3 className="font-semibold text-charcoal dark:text-white mb-4">VAT / Tax ID (Optional)</h3>
                  <div>
                    <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">VAT Number / Tax ID</label>
                    <p className="text-xs text-text-muted dark:text-white/50 mb-3">
                      Your business VAT or tax registration number. This will appear on invoices.
                    </p>
                    <input
                      type="text"
                      value={taxForm.vatNumber}
                      onChange={(e) => setTaxForm((prev) => ({ ...prev, vatNumber: e.target.value }))}
                      placeholder="e.g., GB123456789"
                      className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Tax Preview */}
            {taxForm.taxEnabled && (
              <div className="p-4 bg-sage/10 rounded-xl border border-sage/20">
                <h4 className="font-medium text-charcoal dark:text-white mb-3">Invoice Preview</h4>
                <div className="bg-white dark:bg-sidebar rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted dark:text-white/60">Haircut</span>
                    <span className="text-charcoal dark:text-white">${taxForm.taxIncluded ? '50.00' : '50.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted dark:text-white/60">Color Treatment</span>
                    <span className="text-charcoal dark:text-white">${taxForm.taxIncluded ? '100.00' : '100.00'}</span>
                  </div>
                  <div className="border-t border-charcoal/10 dark:border-white/10 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="text-text-muted dark:text-white/60">Subtotal</span>
                      <span className="text-charcoal dark:text-white">$150.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-muted dark:text-white/60">{taxForm.taxName} ({taxForm.taxRate}%)</span>
                      <span className="text-charcoal dark:text-white">
                        ${taxForm.taxIncluded
                          ? (150 * taxForm.taxRate / (100 + taxForm.taxRate)).toFixed(2)
                          : (150 * taxForm.taxRate / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between font-semibold text-charcoal dark:text-white pt-2 border-t border-charcoal/10 dark:border-white/10 mt-2">
                      <span>Total</span>
                      <span>
                        ${taxForm.taxIncluded
                          ? '150.00'
                          : (150 + 150 * taxForm.taxRate / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {taxForm.vatNumber && (
                    <div className="text-xs text-text-muted dark:text-white/40 pt-2 border-t border-charcoal/10 dark:border-white/10 mt-2">
                      VAT/Tax ID: {taxForm.vatNumber}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Save Button for Tax */}
            <div className="flex items-center justify-between pt-4 border-t border-charcoal/10 dark:border-white/10">
              <div>
                {taxSaved && (
                  <span className="flex items-center gap-2 text-green-600">
                    <Check className="w-4 h-4" />
                    Tax settings saved
                  </span>
                )}
                {taxError && (
                  <span className="flex items-center gap-2 text-rose-dark">
                    <AlertCircle className="w-4 h-4" />
                    {taxError}
                  </span>
                )}
              </div>
              <button
                onClick={handleSaveTax}
                disabled={isSavingTax}
                className="px-6 py-3 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSavingTax ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Tax Settings'
                )}
              </button>
            </div>
          </div>
        );

      case 'subscription':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-charcoal dark:text-white mb-1">Subscription & Add-ons</h2>
              <p className="text-text-muted dark:text-white/60">
                Manage your plan and add or remove features as your business needs change.
              </p>
            </div>

            {/* Current Plan */}
            <div className="bg-gradient-to-br from-sage/10 to-lavender/10 rounded-2xl p-6 border border-sage/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-charcoal dark:text-white">Current Plan</h3>
                  <p className="text-text-muted dark:text-white/60">Essentials + {activeAddOns.length} add-ons</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-charcoal dark:text-white">${monthlyTotal}</p>
                  <p className="text-sm text-text-muted dark:text-white/60">/month</p>
                </div>
              </div>

              {isTrialActive && trialEndsAt && (
                <div className="p-3 bg-sage/20 rounded-lg">
                  <div className="flex items-center gap-2 text-sage-dark">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      Trial ends {trialEndsAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Active Add-ons */}
            {activeAddOns.length > 0 && (
              <div>
                <h3 className="font-semibold text-charcoal dark:text-white mb-4">Your Active Add-ons</h3>
                <div className="space-y-3">
                  {activeAddOns.map((addOnId) => {
                    const addOn = allAddOns.find((a) => a.id === addOnId);
                    if (!addOn) return null;
                    const Icon = addOn.icon;
                    return (
                      <div
                        key={addOnId}
                        className="flex items-center gap-4 p-4 bg-white dark:bg-sidebar rounded-xl border border-sage/30"
                      >
                        <div className="w-10 h-10 rounded-lg bg-sage/20 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-sage" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-charcoal dark:text-white">{addOn.name}</p>
                          <p className="text-sm text-text-muted dark:text-white/60">{addOn.description}</p>
                        </div>
                        <span className="text-sm font-semibold text-charcoal dark:text-white">$25/mo</span>
                        <button
                          onClick={() => toggleAddOn(addOnId)}
                          className="px-3 py-1.5 text-sm text-rose-dark hover:bg-rose/10 rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available Add-ons */}
            <div>
              <h3 className="font-semibold text-charcoal dark:text-white mb-4">Available Add-ons</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allAddOns
                  .filter((addOn) => !hasAddOn(addOn.id))
                  .map((addOn) => {
                    const Icon = addOn.icon;
                    return (
                      <div
                        key={addOn.id}
                        className="p-4 bg-white dark:bg-sidebar rounded-xl border border-charcoal/10 dark:border-white/10 hover:border-sage/30 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-charcoal/5 dark:bg-white/5 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-text-muted dark:text-white/60" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-charcoal dark:text-white">{addOn.name}</p>
                              <span className="text-sm font-semibold text-charcoal dark:text-white">+$25/mo</span>
                            </div>
                            <p className="text-sm text-text-muted dark:text-white/60 mb-3">{addOn.description}</p>
                            <button
                              onClick={() => toggleAddOn(addOn.id)}
                              className="px-4 py-2 text-sm bg-sage text-white rounded-lg font-medium hover:bg-sage-dark transition-colors"
                            >
                              Add to Plan
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
              {allAddOns.filter((addOn) => !hasAddOn(addOn.id)).length === 0 && (
                <p className="text-center text-text-muted dark:text-white/60 py-8">
                  You have all available add-ons!
                </p>
              )}
            </div>
          </div>
        );

      case 'payments':
        const paymentsLocked = !hasAddOn('payment_processing');
        return (
          <div className="space-y-8">
            {/* Upsell Banner if locked */}
            {paymentsLocked && (
              <AddOnUpsellBanner
                addOnId="payment_processing"
                onEnable={() => {
                  toggleAddOn('payment_processing');
                }}
              />
            )}

            <div>
              <h2 className="text-xl font-bold text-charcoal dark:text-white mb-1">Payment Settings</h2>
              <p className="text-text-muted dark:text-white/60">
                Manage your payment methods and billing preferences.
              </p>
            </div>

            {/* Content - disabled when locked */}
            <div className={paymentsLocked ? 'opacity-50 pointer-events-none select-none' : ''}>
              <div className="space-y-4">
                {/* Stripe */}
                <div className="p-6 bg-white dark:bg-sidebar rounded-xl border border-charcoal/10 dark:border-white/10">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#635BFF]/10 flex items-center justify-center">
                      <span className="text-[#635BFF] font-bold text-lg">S</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-charcoal dark:text-white">Stripe</h3>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-charcoal/10 dark:bg-white/10 text-text-muted dark:text-white/60">
                          Not connected
                        </span>
                      </div>
                      <p className="text-sm text-text-muted dark:text-white/60 mb-4">
                        Accept credit cards, Apple Pay, and Google Pay
                      </p>
                      <button className="text-sm text-sage hover:text-sage-dark font-medium" disabled={paymentsLocked}>
                        Connect Stripe
                      </button>
                    </div>
                  </div>
                </div>

                {/* Square */}
                <div className="p-6 bg-white dark:bg-sidebar rounded-xl border border-charcoal/10 dark:border-white/10">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center">
                      <span className="font-bold text-lg dark:text-white">Sq</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-charcoal dark:text-white">Square</h3>
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-charcoal/10 dark:bg-white/10 text-text-muted dark:text-white/60">
                          Not connected
                        </span>
                      </div>
                      <p className="text-sm text-text-muted dark:text-white/60 mb-4">
                        In-person and online payments with Square
                      </p>
                      <button className="text-sm text-sage hover:text-sage-dark font-medium" disabled={paymentsLocked}>
                        Connect Square
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deposit Settings */}
              <div className="p-6 bg-charcoal/5 dark:bg-white/5 rounded-xl mt-4">
                <h3 className="font-semibold text-charcoal dark:text-white mb-4">Booking Deposits</h3>
                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      disabled={paymentsLocked}
                      className="mt-1 w-5 h-5 rounded border-charcoal/20 dark:border-white/20 text-sage focus:ring-sage disabled:opacity-50"
                    />
                    <div>
                      <p className="font-medium text-charcoal dark:text-white">Require deposit for online bookings</p>
                      <p className="text-sm text-text-muted dark:text-white/60">
                        Reduce no-shows by collecting a deposit when clients book online
                      </p>
                    </div>
                  </label>
                  <div className="flex items-center gap-3 ml-8">
                    <label className="text-sm text-text-muted dark:text-white/60">Deposit amount:</label>
                    <select
                      disabled={paymentsLocked}
                      className="px-3 py-2 rounded-lg border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage outline-none text-sm disabled:opacity-50"
                    >
                      <option value="20">20% of service</option>
                      <option value="50">50% of service</option>
                      <option value="100">Full amount</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'owner-notifications':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-charcoal dark:text-white mb-1">Owner Notifications</h2>
              <p className="text-text-muted dark:text-white/60">
                Control which email notifications you receive about your business.
              </p>
            </div>

            {notificationsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-sage" />
              </div>
            ) : (
              <>
                {/* Notification Toggles */}
                <div className="p-6 bg-white dark:bg-sidebar rounded-xl border border-charcoal/10 dark:border-white/10">
                  <h3 className="font-semibold text-charcoal dark:text-white mb-4">Business Alerts</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'newBookingEmail' as const, label: 'New Bookings', description: 'Get notified when a client books an appointment' },
                      { key: 'cancellationEmail' as const, label: 'Cancellations', description: 'Get notified when an appointment is cancelled' },
                      { key: 'newReviewEmail' as const, label: 'New Reviews', description: 'Get notified when a client leaves a review' },
                      { key: 'paymentReceivedEmail' as const, label: 'Payments Received', description: 'Get notified when a payment is processed' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between py-2">
                        <div>
                          <p className="font-medium text-charcoal dark:text-white">{item.label}</p>
                          <p className="text-sm text-text-muted dark:text-white/60">{item.description}</p>
                        </div>
                        <button
                          onClick={() => togglePreference(item.key)}
                          className={`w-12 h-6 rounded-full transition-colors relative ${
                            notificationPreferences?.[item.key] ? 'bg-sage' : 'bg-charcoal/20 dark:bg-white/20'
                          }`}
                        >
                          <span
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                              notificationPreferences?.[item.key] ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Summary Reports */}
                <div className="p-6 bg-white dark:bg-sidebar rounded-xl border border-charcoal/10 dark:border-white/10">
                  <h3 className="font-semibold text-charcoal dark:text-white mb-4">Summary Reports</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'dailySummaryEmail' as const, label: 'Daily Summary', description: 'Receive a daily recap of bookings and revenue' },
                      { key: 'weeklySummaryEmail' as const, label: 'Weekly Summary', description: 'Receive a weekly performance report' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between py-2">
                        <div>
                          <p className="font-medium text-charcoal dark:text-white">{item.label}</p>
                          <p className="text-sm text-text-muted dark:text-white/60">{item.description}</p>
                        </div>
                        <button
                          onClick={() => togglePreference(item.key)}
                          className={`w-12 h-6 rounded-full transition-colors relative ${
                            notificationPreferences?.[item.key] ? 'bg-sage' : 'bg-charcoal/20 dark:bg-white/20'
                          }`}
                        >
                          <span
                            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                              notificationPreferences?.[item.key] ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notification Email */}
                <div className="p-6 bg-white dark:bg-sidebar rounded-xl border border-charcoal/10 dark:border-white/10">
                  <h3 className="font-semibold text-charcoal dark:text-white mb-4">Notification Email</h3>
                  <p className="text-sm text-text-muted dark:text-white/60 mb-4">
                    Send owner notifications to a different email address.
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="email"
                      value={notificationPreferences?.notificationEmail || ''}
                      onChange={(e) => updatePreferences({ notificationEmail: e.target.value || null })}
                      placeholder="Use account email"
                      className="flex-1 px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 'notifications':
        const notificationsLocked = !hasAddOn('reminders');
        return (
          <div className="space-y-8">
            {/* Upsell Banner if locked */}
            {notificationsLocked && (
              <AddOnUpsellBanner
                addOnId="reminders"
                onEnable={() => {
                  toggleAddOn('reminders');
                }}
              />
            )}

            <div>
              <h2 className="text-xl font-bold text-charcoal dark:text-white mb-1">Notification Settings</h2>
              <p className="text-text-muted dark:text-white/60">
                Configure how you and your clients receive notifications.
              </p>
            </div>

            {/* Error state */}
            {notificationSettingsError && (
              <div className="p-4 bg-rose/10 dark:bg-rose/20 border border-rose/20 dark:border-rose/30 rounded-lg mb-4">
                <p className="text-rose-dark dark:text-rose text-sm">
                  <strong>Error:</strong> {notificationSettingsError}
                </p>
              </div>
            )}

            {/* Loading state */}
            {notificationSettingsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-sage" />
                <span className="ml-2 text-text-muted dark:text-white/60">Loading settings...</span>
              </div>
            ) : (
            <div className={notificationsLocked ? 'opacity-50 pointer-events-none select-none' : ''}>
              {/* Client Notifications */}
              <div className="space-y-4">
                <h3 className="font-semibold text-charcoal dark:text-white">Client Notifications</h3>

                <div className="p-4 bg-white dark:bg-sidebar rounded-xl border border-charcoal/10 dark:border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-charcoal dark:text-white">Appointment Confirmation</p>
                      <p className="text-sm text-text-muted dark:text-white/60">Send when booking is confirmed</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-sage font-medium">Always On</span>
                      <div className="w-11 h-6 bg-sage rounded-full relative">
                        <span className="absolute top-[2px] right-[2px] w-5 h-5 rounded-full bg-white" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 bg-charcoal/5 dark:bg-white/5 rounded-lg">
                      <div className="w-4 h-4 rounded border border-sage bg-sage flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm text-charcoal dark:text-white">Email</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-charcoal/5 dark:bg-white/5 rounded-lg">
                      <div className="w-4 h-4 rounded border border-sage bg-sage flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm text-charcoal dark:text-white">SMS</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-sidebar rounded-xl border border-charcoal/10 dark:border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-charcoal dark:text-white">Appointment Reminder</p>
                      <p className="text-sm text-text-muted dark:text-white/60">Remind clients before their appointment</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings?.reminders?.enabled ?? true}
                        onChange={() => toggleReminders()}
                        disabled={notificationsLocked || notificationSettingsSaving}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-charcoal/20 peer-focus:ring-4 peer-focus:ring-sage/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage"></div>
                    </label>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <label className="text-sm text-text-muted dark:text-white/60">Send reminder:</label>
                    <select
                      value={notificationSettings?.reminders?.timings?.[0]?.hours || 24}
                      onChange={(e) => setReminderTiming(parseInt(e.target.value))}
                      disabled={notificationsLocked || notificationSettingsSaving}
                      className="px-3 py-2 rounded-lg border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage outline-none text-sm disabled:opacity-50"
                    >
                      <option value="24">24 hours before</option>
                      <option value="48">48 hours before</option>
                      <option value="2">2 hours before</option>
                    </select>
                    {notificationSettingsSaving && (
                      <Loader2 className="w-4 h-4 animate-spin text-sage" />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-2 px-3 py-2 bg-charcoal/5 dark:bg-white/5 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings?.channels?.email ?? true}
                        onChange={() => toggleChannel('email')}
                        disabled={notificationsLocked || notificationSettingsSaving}
                        className="rounded border-charcoal/20 dark:border-white/20 text-sage focus:ring-sage disabled:opacity-50"
                      />
                      <span className="text-sm text-charcoal dark:text-white">Email</span>
                    </label>
                    <label className="flex items-center gap-2 px-3 py-2 bg-charcoal/5 dark:bg-white/5 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings?.channels?.sms ?? true}
                        onChange={() => toggleChannel('sms')}
                        disabled={notificationsLocked || notificationSettingsSaving}
                        className="rounded border-charcoal/20 dark:border-white/20 text-sage focus:ring-sage disabled:opacity-50"
                      />
                      <span className="text-sm text-charcoal dark:text-white">SMS</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Staff Notifications */}
              <div className="space-y-4 mt-8">
                <h3 className="font-semibold text-charcoal dark:text-white">Staff Notifications</h3>

                <div className="p-4 bg-white dark:bg-sidebar rounded-xl border border-charcoal/10 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-charcoal dark:text-white">New Booking Alert</p>
                      <p className="text-sm text-text-muted dark:text-white/60">Notify staff when a new booking is made</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-sage font-medium">Always On</span>
                      <div className="w-11 h-6 bg-sage rounded-full relative">
                        <span className="absolute top-[2px] right-[2px] w-5 h-5 rounded-full bg-white" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-sidebar rounded-xl border border-charcoal/10 dark:border-white/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-charcoal dark:text-white">Cancellation Alert</p>
                      <p className="text-sm text-text-muted dark:text-white/60">Notify staff when a booking is cancelled</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-sage font-medium">Always On</span>
                      <div className="w-11 h-6 bg-sage rounded-full relative">
                        <span className="absolute top-[2px] right-[2px] w-5 h-5 rounded-full bg-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
        );

      case 'booking':
        const bookingLocked = !hasAddOn('online_booking');

        // Use the salon's real slug for preview - shows exactly what customers will see
        // If no slug yet, use demo mode for preview to avoid "Business Not Found" error
        const salonSlug = salon?.slug || 'demo';
        const hasValidSlug = Boolean(salon?.slug);
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const previewUrl = `${baseUrl}/embed/${salonSlug}`;
        const embedUrl = hasValidSlug ? `${baseUrl}/embed/${salon?.slug}` : `${baseUrl}/embed/YOUR-SALON-SLUG`;

        // Font family CSS mapping
        const fontFamilyMap: Record<string, string> = {
          system: 'system-ui, -apple-system, sans-serif',
          modern: "'Plus Jakarta Sans', sans-serif",
          classic: "Georgia, 'Times New Roman', serif",
        };

        // Button radius based on style
        const buttonRadius = widgetSettings.buttonStyle === 'rounded' ? '12px' : '4px';

        // Generate iframe embed code
        const embedCode = `<iframe
  src="${embedUrl}"
  width="100%"
  height="${iframeHeight}px"
  frameborder="0"
  style="border: none; border-radius: ${buttonRadius}; max-width: 500px;"
  title="Book an appointment"
></iframe>`;

        const copyEmbedCode = () => {
          navigator.clipboard.writeText(embedCode.replace(/\n\s*/g, ' ').trim());
          setEmbedCopied(true);
          setTimeout(() => setEmbedCopied(false), 2000);
        };

        const installInstructions: Record<string, { title: string; steps: string[] }> = {
          wordpress: {
            title: 'WordPress',
            steps: [
              'Go to the page where you want the booking form',
              'Add a "Custom HTML" block',
              'Paste the embed code above',
              'Preview and publish your page',
            ],
          },
          squarespace: {
            title: 'Squarespace',
            steps: [
              'Edit the page where you want the booking form',
              'Click Add Section and choose "Code" block',
              'Paste the embed code and set display to "HTML"',
              'Click Save to publish',
            ],
          },
          wix: {
            title: 'Wix',
            steps: [
              'In the Wix Editor, click Add, then Embed, then Embed a Site',
              'Select "Custom HTML" and paste the embed code',
              'Adjust the size to fit your design',
              'Click Apply, then Publish your site',
            ],
          },
          shopify: {
            title: 'Shopify',
            steps: [
              'Go to Online Store then Pages',
              'Edit the page and switch to HTML view',
              'Paste the iframe code where you want the form',
              'Save and preview your changes',
            ],
          },
          html: {
            title: 'Generic HTML',
            steps: [
              'Open your website HTML file',
              'Paste the iframe code where you want the booking form',
              'Adjust width/height if needed',
              'Save and upload to your server',
            ],
          },
        };

        return (
          <div className="space-y-8">
            {/* Upsell Banner if locked */}
            {bookingLocked && (
              <AddOnUpsellBanner
                addOnId="online_booking"
                onEnable={() => {
                  toggleAddOn('online_booking');
                }}
              />
            )}

            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-charcoal dark:text-white mb-1">Online Booking Widget</h2>
                <p className="text-text-muted dark:text-white/60">
                  Customize and embed your booking widget on your website.
                </p>
              </div>
              {/* Auto-save status indicator */}
              {!bookingLocked && (
                <div className="flex items-center gap-2 text-sm">
                  {widgetSaveStatus === 'saving' && (
                    <span className="flex items-center gap-2 text-text-muted dark:text-white/50">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </span>
                  )}
                  {widgetSaveStatus === 'saved' && (
                    <span className="flex items-center gap-2 text-sage">
                      <Check className="w-4 h-4" />
                      Saved
                  </span>
                )}
                {widgetSaveStatus === 'error' && (
                  <span className="flex items-center gap-2 text-rose-dark">
                    <AlertCircle className="w-4 h-4" />
                    Save failed
                  </span>
                )}
              </div>
              )}
            </div>

            {/* Content - disabled when locked */}
            <div className={bookingLocked ? 'opacity-50 pointer-events-none select-none' : ''}>
            {/* Customization Section */}
            <div className="p-6 bg-white dark:bg-sidebar rounded-2xl border border-charcoal/10 dark:border-white/10">
              <h3 className="font-semibold text-charcoal dark:text-white mb-6">Customize Appearance</h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Controls */}
                <div className="space-y-6">
                  {/* Primary Color */}
                  <div>
                    <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                      Primary Color
                    </label>
                    <p className="text-xs text-text-muted dark:text-white/50 mb-3">
                      Used for buttons, selected states, and progress indicators
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="color"
                          value={widgetSettings.primaryColor}
                          onChange={(e) => setWidgetSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                          className="w-12 h-12 rounded-xl border-2 border-charcoal/10 dark:border-white/10 cursor-pointer appearance-none bg-transparent"
                          style={{ backgroundColor: widgetSettings.primaryColor }}
                        />
                      </div>
                      <input
                        type="text"
                        value={widgetSettings.primaryColor}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                            setWidgetSettings(prev => ({ ...prev, primaryColor: val }));
                          }
                        }}
                        placeholder="#7C9A82"
                        className="flex-1 px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none text-sm font-mono uppercase"
                      />
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div>
                    <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                      Accent Color
                    </label>
                    <p className="text-xs text-text-muted dark:text-white/50 mb-3">
                      Used for links and category headers
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <input
                          type="color"
                          value={widgetSettings.accentColor}
                          onChange={(e) => setWidgetSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                          className="w-12 h-12 rounded-xl border-2 border-charcoal/10 dark:border-white/10 cursor-pointer appearance-none bg-transparent"
                          style={{ backgroundColor: widgetSettings.accentColor }}
                        />
                      </div>
                      <input
                        type="text"
                        value={widgetSettings.accentColor}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                            setWidgetSettings(prev => ({ ...prev, accentColor: val }));
                          }
                        }}
                        placeholder="#B5A8D5"
                        className="flex-1 px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none text-sm font-mono uppercase"
                      />
                    </div>
                  </div>

                  {/* Button Style */}
                  <div>
                    <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                      Button Style
                    </label>
                    <p className="text-xs text-text-muted dark:text-white/50 mb-3">
                      Corner style for buttons and inputs
                    </p>
                    <select
                      value={widgetSettings.buttonStyle}
                      onChange={(e) => setWidgetSettings(prev => ({ ...prev, buttonStyle: e.target.value as 'rounded' | 'square' }))}
                      className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all bg-white dark:bg-sidebar text-charcoal dark:text-white"
                    >
                      <option value="rounded">Rounded (12px corners)</option>
                      <option value="square">Square (4px corners)</option>
                    </select>
                  </div>

                  {/* Font Style */}
                  <div>
                    <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                      Font Style
                    </label>
                    <p className="text-xs text-text-muted dark:text-white/50 mb-3">
                      Typography for all text in the widget
                    </p>
                    <div className="space-y-2">
                      {[
                        { value: 'system', label: 'System Default', desc: 'Clean and familiar' },
                        { value: 'modern', label: 'Modern', desc: 'Plus Jakarta Sans' },
                        { value: 'classic', label: 'Classic', desc: 'Georgia serif' },
                      ].map((font) => (
                        <label
                          key={font.value}
                          className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            widgetSettings.fontFamily === font.value
                              ? 'border-sage bg-sage/5'
                              : 'border-charcoal/10 hover:border-charcoal/20'
                          }`}
                        >
                          <input
                            type="radio"
                            name="fontFamily"
                            value={font.value}
                            checked={widgetSettings.fontFamily === font.value}
                            onChange={(e) => setWidgetSettings(prev => ({ ...prev, fontFamily: e.target.value as 'system' | 'modern' | 'classic' }))}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            widgetSettings.fontFamily === font.value ? 'border-sage' : 'border-charcoal/30 dark:border-white/30'
                          }`}>
                            {widgetSettings.fontFamily === font.value && (
                              <div className="w-2.5 h-2.5 rounded-full bg-sage" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-charcoal dark:text-white text-sm">{font.label}</p>
                            <p className="text-xs text-text-muted dark:text-white/50">{font.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Live Preview */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-charcoal dark:text-white">
                      Live Preview
                    </label>
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-sage hover:underline"
                    >
                      Open full preview <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="bg-cream/50 dark:bg-charcoal/50 rounded-2xl border border-charcoal/10 dark:border-white/10 overflow-hidden" style={{ height: '500px' }}>
                    {/* Live preview using real business data */}
                    {salonLoading || !salon?.slug ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-sage mx-auto mb-3" />
                          <p className="text-sm text-text-muted dark:text-white/60">Loading preview...</p>
                        </div>
                      </div>
                    ) : (
                      <iframe
                        src={`${previewUrl}?preview=true&t=${Date.now()}`}
                        className="w-full h-full border-0"
                        title="Booking widget preview"
                        key={`${widgetSettings.primaryColor}-${widgetSettings.accentColor}-${widgetSettings.buttonStyle}-${widgetSettings.fontFamily}-${salonSlug}`}
                      />
                    )}
                  </div>
                  <p className="text-xs text-text-muted dark:text-white/50 mt-2 text-center">
                    {hasValidSlug ? 'This is exactly what customers will see on your website.' : 'Showing demo preview - set your business slug in Business Info to see your actual booking page.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Embed Code Section */}
            <div className="p-6 bg-gradient-to-br from-sage/10 to-lavender/10 rounded-2xl border border-sage/20">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sage/20 flex items-center justify-center flex-shrink-0">
                    <Code className="w-5 h-5 text-sage" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-charcoal dark:text-white">Embed Code</h3>
                    <p className="text-sm text-text-muted dark:text-white/60">Copy and paste this iframe into your website</p>
                  </div>
                </div>
              </div>

              {/* Iframe height control */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                  Widget Height (pixels)
                </label>
                <input
                  type="number"
                  value={iframeHeight}
                  onChange={(e) => setIframeHeight(e.target.value)}
                  placeholder="700"
                  min="400"
                  max="1200"
                  className="w-32 px-4 py-2 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all text-sm"
                />
                <span className="text-xs text-text-muted dark:text-white/50 ml-2">Recommended: 600px</span>
              </div>

              <div className="relative">
                <pre className="bg-charcoal text-cream p-4 rounded-xl text-sm overflow-x-auto font-mono whitespace-pre-wrap break-all">
                  {embedCode}
                </pre>
                <button
                  onClick={copyEmbedCode}
                  className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {embedCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Installation Instructions */}
            <div className="p-6 bg-white dark:bg-sidebar rounded-2xl border border-charcoal/10 dark:border-white/10">
              <h3 className="font-semibold text-charcoal dark:text-white mb-4">Installation Instructions</h3>

              {/* Platform Tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                {Object.entries(installInstructions).map(([key, { title }]) => (
                  <button
                    key={key}
                    onClick={() => setActiveInstallTab(key)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      activeInstallTab === key
                        ? 'bg-sage text-white'
                        : 'bg-charcoal/5 dark:bg-white/5 text-text-secondary dark:text-white/70 hover:bg-charcoal/10 dark:hover:bg-white/10'
                    }`}
                  >
                    {title}
                  </button>
                ))}
              </div>

              {/* Instructions */}
              <div className="space-y-3">
                {installInstructions[activeInstallTab]?.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-sage">{index + 1}</span>
                    </div>
                    <p className="text-text-secondary dark:text-white/70">{step}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-lavender/10 rounded-xl border border-lavender/20">
                <p className="text-sm text-text-secondary dark:text-white/70">
                  <strong>Need help?</strong> Contact our support team and we will help you install the booking widget on your website.
                </p>
              </div>
            </div>

            {/* Service Online Booking Toggles */}
            <div className="p-6 bg-white dark:bg-sidebar rounded-2xl border border-charcoal/10 dark:border-white/10">
              <h3 className="font-semibold text-charcoal dark:text-white mb-2">Services Available for Online Booking</h3>
              <p className="text-sm text-text-muted dark:text-white/60 mb-4">
                Choose which services clients can book online. Disabled services will only be bookable by staff.
              </p>

              {servicesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-sage" />
                </div>
              ) : services.filter(s => s.isActive).length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-text-muted dark:text-white/60">No active services found. Add services in the Services page.</p>
                  <Link href="/services" className="text-sage hover:underline text-sm mt-2 inline-block">
                    Go to Services →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {services.filter(s => s.isActive).map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-3 bg-charcoal/5 dark:bg-white/5 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: service.color || '#7C9A82' }}
                        />
                        <div>
                          <p className="font-medium text-charcoal dark:text-white text-sm">{service.name}</p>
                          <p className="text-xs text-text-muted dark:text-white/60">
                            {service.durationMinutes}min • ${service.price}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleServiceOnlineBooking(service.id, !service.onlineBookingEnabled)}
                        disabled={togglingServiceId === service.id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          service.onlineBookingEnabled ? 'bg-sage' : 'bg-charcoal/20'
                        } ${togglingServiceId === service.id ? 'opacity-50' : ''}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                            service.onlineBookingEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                        {togglingServiceId === service.id && (
                          <Loader2 className="absolute w-3 h-3 text-white animate-spin left-1/2 -translate-x-1/2" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Staff Online Booking Toggles */}
            <div className="p-6 bg-white dark:bg-sidebar rounded-2xl border border-charcoal/10 dark:border-white/10">
              <h3 className="font-semibold text-charcoal dark:text-white mb-2">Staff Available for Online Booking</h3>
              <p className="text-sm text-text-muted dark:text-white/60 mb-4">
                Choose which staff members can be booked online. Disabled staff will only be assignable by staff.
              </p>

              {staffLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-sage" />
                </div>
              ) : staff.filter(s => s.isActive).length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-text-muted dark:text-white/60">No active staff found. Add staff in the Staff page.</p>
                  <Link href="/staff" className="text-sage hover:underline text-sm mt-2 inline-block">
                    Go to Staff →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {staff.filter(s => s.isActive).map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-charcoal/5 dark:bg-white/5 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        {member.avatarUrl ? (
                          <img
                            src={member.avatarUrl}
                            alt={`${member.firstName} ${member.lastName}`}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center">
                            <span className="text-sage text-sm font-medium">
                              {member.firstName[0]}{member.lastName[0]}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-charcoal dark:text-white text-sm">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-xs text-text-muted dark:text-white/60 capitalize">{member.role}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleStaffOnlineBooking(member.id, !member.onlineBookingEnabled)}
                        disabled={togglingStaffId === member.id}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          member.onlineBookingEnabled ? 'bg-sage' : 'bg-charcoal/20'
                        } ${togglingStaffId === member.id ? 'opacity-50' : ''}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
                            member.onlineBookingEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                        {togglingStaffId === member.id && (
                          <Loader2 className="absolute w-3 h-3 text-white animate-spin left-1/2 -translate-x-1/2" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Booking Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-charcoal dark:text-white">Booking Settings</h3>

              <div className="p-4 bg-white dark:bg-sidebar rounded-xl border border-charcoal/10 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-charcoal dark:text-white">Accept Online Bookings</p>
                    <p className="text-sm text-text-muted dark:text-white/60">Allow clients to book through your booking widget</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-charcoal/20 peer-focus:ring-4 peer-focus:ring-sage/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage"></div>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-white dark:bg-sidebar rounded-xl border border-charcoal/10 dark:border-white/10">
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                  Booking Lead Time
                </label>
                <p className="text-sm text-text-muted dark:text-white/60 mb-3">
                  Minimum time before an appointment can be booked
                </p>
                <select className="px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage outline-none">
                  <option value="1">1 hour</option>
                  <option value="2">2 hours</option>
                  <option value="4">4 hours</option>
                  <option value="24">24 hours</option>
                </select>
              </div>

              <div className="p-4 bg-white dark:bg-sidebar rounded-xl border border-charcoal/10 dark:border-white/10">
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                  Cancellation Policy
                </label>
                <p className="text-sm text-text-muted dark:text-white/60 mb-3">
                  Time before appointment that clients can cancel
                </p>
                <select disabled={bookingLocked} className="px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage outline-none disabled:opacity-50">
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                  <option value="72">72 hours</option>
                </select>
              </div>
            </div>
            </div>
          </div>
        );

      case 'branding':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-charcoal dark:text-white mb-1">Branding</h2>
              <p className="text-text-muted dark:text-white/60">
                Customize the look of your booking page and client communications.
              </p>
            </div>

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-white mb-3">Business Logo</label>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-sage/20 border-2 border-dashed border-sage/40 flex items-center justify-center">
                  {salon?.logoUrl ? (
                    <img
                      src={salon.logoUrl}
                      alt="Business logo"
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <span className="text-sage font-bold text-3xl">
                      {salon?.name?.[0] || 'S'}
                    </span>
                  )}
                </div>
                <div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-sidebar border border-charcoal/20 dark:border-white/10 rounded-lg cursor-pointer hover:border-sage transition-colors">
                    <Upload className="w-4 h-4 dark:text-white" />
                    <span className="text-sm font-medium dark:text-white">Upload Logo</span>
                    <input type="file" accept="image/*" className="hidden" />
                  </label>
                  <p className="text-xs text-text-muted dark:text-white/40 mt-2">PNG, JPG up to 5MB. Square works best.</p>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-white mb-3">Brand Colors</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-text-muted dark:text-white/60 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandingForm.primaryColor}
                      onChange={(e) => setBrandingForm((prev) => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-12 h-12 rounded-lg border border-charcoal/20 dark:border-white/10 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandingForm.primaryColor}
                      onChange={(e) => setBrandingForm((prev) => ({ ...prev, primaryColor: e.target.value }))}
                      className="flex-1 px-3 py-2 rounded-lg border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage outline-none text-sm font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted dark:text-white/60 mb-2">
                    Background Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandingForm.backgroundColor}
                      onChange={(e) => setBrandingForm((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-12 h-12 rounded-lg border border-charcoal/20 dark:border-white/10 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandingForm.backgroundColor}
                      onChange={(e) => setBrandingForm((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                      className="flex-1 px-3 py-2 rounded-lg border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage outline-none text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveBranding}
                disabled={isSavingBranding}
                className="px-6 py-3 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingBranding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : brandingSaved ? (
                  <Check className="w-4 h-4" />
                ) : null}
                {brandingSaved ? 'Saved!' : 'Save Branding'}
              </button>
              {brandingError && (
                <span className="text-rose-dark text-sm">{brandingError}</span>
              )}
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-charcoal dark:text-white mb-1">Security Settings</h2>
              <p className="text-text-muted dark:text-white/60">
                Manage your account security and access settings.
              </p>
            </div>

            {/* Change Password */}
            <div className="p-6 bg-white dark:bg-sidebar rounded-xl border border-charcoal/10 dark:border-white/10">
              <h3 className="font-semibold text-charcoal dark:text-white mb-4">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  />
                </div>
                {passwordError && (
                  <p className="text-sm text-rose-dark">{passwordError}</p>
                )}
                {passwordChanged && (
                  <p className="text-sm text-green-600 flex items-center gap-2">
                    <Check className="w-4 h-4" /> Password changed successfully!
                  </p>
                )}
                <button
                  onClick={async () => {
                    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                      setPasswordError('Passwords do not match');
                      return;
                    }
                    if (passwordForm.newPassword.length < 8) {
                      setPasswordError('Password must be at least 8 characters');
                      return;
                    }
                    setIsChangingPassword(true);
                    setPasswordError(null);
                    try {
                      await changePassword({
                        currentPassword: passwordForm.currentPassword,
                        newPassword: passwordForm.newPassword,
                      });
                      setPasswordChanged(true);
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                      setTimeout(() => setPasswordChanged(false), 3000);
                    } catch (err) {
                      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
                    } finally {
                      setIsChangingPassword(false);
                    }
                  }}
                  disabled={isChangingPassword || !passwordForm.currentPassword || !passwordForm.newPassword}
                  className="px-6 py-3 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isChangingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                  Update Password
                </button>
              </div>
            </div>

            {/* Two-Factor Authentication */}
            <div className="p-6 bg-white dark:bg-sidebar rounded-xl border border-charcoal/10 dark:border-white/10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-sage/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-sage" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-charcoal dark:text-white mb-1">Two-Factor Authentication</h3>
                  <p className="text-sm text-text-muted dark:text-white/60 mb-4">
                    Add an extra layer of security to your account by requiring a verification code.
                  </p>
                  <button className="px-4 py-2 border border-sage text-sage rounded-lg font-medium hover:bg-sage/10 transition-colors">
                    Enable 2FA (Coming Soon)
                  </button>
                </div>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="p-6 bg-white dark:bg-sidebar rounded-xl border border-charcoal/10 dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-charcoal dark:text-white">Active Sessions</h3>
                {sessions.length > 1 && (
                  <button
                    onClick={async () => {
                      if (confirm('Sign out of all other sessions?')) {
                        await revokeAllOtherSessions();
                      }
                    }}
                    className="text-sm text-rose hover:text-rose-dark"
                  >
                    Sign out all other sessions
                  </button>
                )}
              </div>
              {accountLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-sage" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-text-muted dark:text-white/60 text-sm">No active sessions found</p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session, index) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-charcoal/5 dark:bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white dark:bg-sidebar flex items-center justify-center">
                          {session.deviceInfo?.toLowerCase().includes('mobile') ? (
                            <Smartphone className="w-5 h-5 text-text-muted dark:text-white/60" />
                          ) : (
                            <Monitor className="w-5 h-5 text-text-muted dark:text-white/60" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-charcoal dark:text-white text-sm">
                            {session.deviceInfo ? session.deviceInfo.slice(0, 50) : 'Unknown device'}
                            {session.deviceInfo && session.deviceInfo.length > 50 && '...'}
                          </p>
                          <p className="text-xs text-text-muted dark:text-white/60">
                            {session.ipAddress || 'Unknown IP'} - Last active {new Date(session.lastActive).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {index === 0 ? (
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded">
                            Current
                          </span>
                        ) : (
                          <button
                            onClick={() => revokeSession(session.id)}
                            className="px-3 py-1 text-xs text-rose hover:bg-rose/10 dark:hover:bg-rose/20 rounded"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Login History */}
            <div className="p-6 bg-white dark:bg-sidebar rounded-xl border border-charcoal/10 dark:border-white/10">
              <div className="flex items-center gap-3 mb-4">
                <History className="w-5 h-5 text-text-muted dark:text-white/60" />
                <h3 className="font-semibold text-charcoal dark:text-white">Recent Login Activity</h3>
              </div>
              {accountLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-sage" />
                </div>
              ) : loginHistory.length === 0 ? (
                <p className="text-text-muted dark:text-white/60 text-sm">No login history available</p>
              ) : (
                <div className="space-y-2">
                  {loginHistory.slice(0, 10).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between py-2 border-b border-charcoal/5 dark:border-white/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${entry.success ? 'bg-green-500' : 'bg-rose'}`} />
                        <div>
                          <p className="text-sm text-charcoal dark:text-white">
                            {entry.success ? 'Successful login' : `Failed login: ${entry.failReason || 'Unknown'}`}
                          </p>
                          <p className="text-xs text-text-muted dark:text-white/60">
                            {entry.ipAddress || 'Unknown IP'}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-text-muted dark:text-white/60">
                        {new Date(entry.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-charcoal flex">
      <AppSidebar currentPage="settings" sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white dark:bg-sidebar border-b border-charcoal/10 dark:border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-text-muted dark:text-white/60 hover:text-charcoal dark:hover:text-white lg:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-charcoal dark:text-white">Settings</h1>
            </div>

            <div className="flex items-center gap-4">
              {locations.length > 1 && <LocationSwitcher showAllOption={false} />}
              <ThemeToggle />
              <NotificationDropdown />
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Settings Navigation */}
          <div className="w-64 bg-white dark:bg-sidebar border-r border-charcoal/10 dark:border-white/10 p-4 hidden lg:block overflow-auto">
            <div className="space-y-1">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                const isAddOnRequired = section.requiredAddOn && !hasAddOn(section.requiredAddOn);
                // All sections are clickable - no locks in navigation
                // Add-on locked sections show preview with upsell
                // API will enforce permissions on actual save operations
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                      activeSection === section.id
                        ? 'bg-sage/10 text-sage'
                        : 'text-text-secondary dark:text-white/70 hover:bg-charcoal/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{section.name}</p>
                      {isAddOnRequired && (
                        <p className="text-xs text-lavender font-medium">Premium</p>
                      )}
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        activeSection === section.id ? 'rotate-90' : ''
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Settings Content */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-3xl mx-auto p-6 lg:p-8">
              {/* Mobile Section Selector */}
              <div className="lg:hidden mb-6">
                <select
                  value={activeSection}
                  onChange={(e) => setActiveSection(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/10 bg-white dark:bg-sidebar text-charcoal dark:text-white focus:border-sage outline-none"
                >
                  {settingsSections.map((section) => {
                    const isAddOnRequired = section.requiredAddOn && !hasAddOn(section.requiredAddOn);
                    return (
                      <option key={section.id} value={section.id}>
                        {section.name}{isAddOnRequired ? ' (Premium)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Section Content */}
              <div className="bg-white dark:bg-sidebar rounded-2xl shadow-soft border border-charcoal/5 dark:border-white/5 p-6 lg:p-8">
                {renderSection()}

                {/* Save Button */}
                <div className="mt-8 pt-6 border-t border-charcoal/10 dark:border-white/10 flex items-center justify-between">
                  <div>
                    {saved && (
                      <span className="flex items-center gap-2 text-green-600">
                        <Check className="w-4 h-4" />
                        Settings saved
                      </span>
                    )}
                    {saveError && (
                      <span className="flex items-center gap-2 text-rose-dark">
                        <AlertCircle className="w-4 h-4" />
                        {saveError}
                      </span>
                    )}
                    {!saved && !saveError && (
                      <p className="text-sm text-text-muted dark:text-white/60">Make sure to save your changes</p>
                    )}
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-3 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}

