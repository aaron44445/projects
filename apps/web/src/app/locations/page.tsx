'use client';

import { useState, useMemo } from 'react';
import {
  Menu,
  Search,
  Plus,
  Clock,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  Building2,
  Phone,
  Star,
  Users,
  Calendar,
} from 'lucide-react';
import { Modal, EmptyState } from '@peacase/ui';
import { AppSidebar } from '@/components/AppSidebar';
import { AuthGuard } from '@/components/AuthGuard';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useLocationContext, type Location, type CreateLocationInput, type UpdateLocationInput, type LocationHours } from '@/hooks/useLocations';
import { COUNTRIES, TIMEZONE_OPTIONS, formatAddress as formatAddressUtil } from '@/lib/i18n';

interface LocationFormState {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  timezone: string;
  hours: string;
  isPrimary: boolean;
}

const emptyFormState: LocationFormState = {
  name: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  country: 'US',
  phone: '',
  timezone: 'America/New_York',
  hours: '',
  isPrimary: false,
};

// Days of the week
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Default hours for initialization
const getDefaultHours = (): LocationHours[] => {
  return DAYS.map((_, index) => ({
    dayOfWeek: index,
    openTime: index === 0 ? null : '09:00', // Sunday closed by default
    closeTime: index === 0 ? null : '17:00',
    isClosed: index === 0, // Sunday closed by default
  }));
};

// Hours Editor Component
function HoursEditor({
  hours,
  onChange,
}: {
  hours: LocationHours[];
  onChange: (hours: LocationHours[]) => void;
}) {
  const updateDay = (dayOfWeek: number, updates: Partial<LocationHours>) => {
    const newHours = hours.map((h) =>
      h.dayOfWeek === dayOfWeek ? { ...h, ...updates } : h
    );
    onChange(newHours);
  };

  return (
    <div className="space-y-3">
      {DAYS.map((day, index) => {
        const dayHours = hours.find((h) => h.dayOfWeek === index) || {
          dayOfWeek: index,
          openTime: '09:00',
          closeTime: '17:00',
          isClosed: false,
        };

        return (
          <div key={day} className="flex items-center gap-4">
            <span className="w-24 text-sm font-medium text-charcoal dark:text-white">{day}</span>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={dayHours.isClosed}
                onChange={(e) => updateDay(index, { isClosed: e.target.checked })}
                className="rounded border-charcoal/20 dark:border-white/20"
              />
              <span className="text-sm text-charcoal/60 dark:text-white/60">Closed</span>
            </label>
            {!dayHours.isClosed && (
              <>
                <input
                  type="time"
                  value={dayHours.openTime || '09:00'}
                  onChange={(e) => updateDay(index, { openTime: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-charcoal/20 dark:border-white/20 text-sm focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all bg-white dark:bg-sidebar text-charcoal dark:text-white"
                />
                <span className="text-charcoal/40 dark:text-white/40">to</span>
                <input
                  type="time"
                  value={dayHours.closeTime || '17:00'}
                  onChange={(e) => updateDay(index, { closeTime: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-charcoal/20 dark:border-white/20 text-sm focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all bg-white dark:bg-sidebar text-charcoal dark:text-white"
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LocationsContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [locationForm, setLocationForm] = useState<LocationFormState>(emptyFormState);
  const [locationHours, setLocationHours] = useState<LocationHours[]>(getDefaultHours());

  const {
    locations,
    isLoading,
    error,
    createLocation,
    updateLocation,
    deleteLocation,
    getLocationHours,
    updateLocationHours,
    refetch,
  } = useLocationContext();

  // Filter locations based on search query
  const filteredLocations = useMemo(() => {
    if (!searchQuery) return locations;
    const query = searchQuery.toLowerCase();
    return locations.filter(
      (location) =>
        location.name.toLowerCase().includes(query) ||
        location.address?.toLowerCase().includes(query) ||
        location.city?.toLowerCase().includes(query) ||
        location.phone?.toLowerCase().includes(query)
    );
  }, [locations, searchQuery]);

  const formatAddress = (location: Location) => {
    return formatAddressUtil({
      address: location.address,
      city: location.city,
      state: location.state,
      zip: location.zip,
      country: location.country,
    });
  };

  const getTimezoneLabel = (timezoneValue: string) => {
    return TIMEZONE_OPTIONS.find((tz) => tz.value === timezoneValue)?.label || timezoneValue;
  };

  const resetForm = () => {
    setLocationForm(emptyFormState);
    setLocationHours(getDefaultHours());
    setFormError(null);
  };

  const openNewLocationModal = () => {
    resetForm();
    setEditingLocation(null);
    setShowLocationModal(true);
  };

  const openEditLocationModal = async (location: Location) => {
    setLocationForm({
      name: location.name,
      address: location.address || '',
      city: location.city || '',
      state: location.state || '',
      zip: location.zip || '',
      country: location.country || 'US',
      phone: location.phone || '',
      timezone: location.timezone || 'America/New_York',
      hours: location.hours || '',
      isPrimary: location.isPrimary,
    });
    setEditingLocation(location);
    setShowLocationModal(true);

    // Load hours for this location
    const hours = await getLocationHours(location.id);
    if (hours.length > 0) {
      // Ensure all 7 days are represented
      const fullHours = DAYS.map((_, index) => {
        const existing = hours.find((h) => h.dayOfWeek === index);
        return existing || {
          dayOfWeek: index,
          openTime: '09:00',
          closeTime: '17:00',
          isClosed: false,
        };
      });
      setLocationHours(fullHours);
    } else {
      setLocationHours(getDefaultHours());
    }
  };

  const closeModal = () => {
    setShowLocationModal(false);
    setEditingLocation(null);
    resetForm();
  };

  const handleSaveLocation = async () => {
    if (!locationForm.name) return;

    setIsSubmitting(true);
    setFormError(null);
    try {
      const data: CreateLocationInput = {
        name: locationForm.name,
        address: locationForm.address || undefined,
        city: locationForm.city || undefined,
        state: locationForm.state || undefined,
        zip: locationForm.zip || undefined,
        country: locationForm.country || undefined,
        phone: locationForm.phone || undefined,
        timezone: locationForm.timezone || undefined,
        hours: locationForm.hours || undefined,
        isPrimary: locationForm.isPrimary,
      };

      let locationId: string;

      if (editingLocation) {
        await updateLocation(editingLocation.id, data as UpdateLocationInput);
        locationId = editingLocation.id;
      } else {
        const newLocation = await createLocation(data);
        locationId = newLocation.id;
      }

      // Save the structured hours
      await updateLocationHours(locationId, locationHours);

      closeModal();
    } catch (err) {
      console.error('Failed to save location:', err);
      // Show user-friendly error message
      const message = err instanceof Error ? err.message : 'Failed to save location';
      // Special handling for multi-location error
      if (message.includes('Multi-location')) {
        setFormError('To add additional locations, please enable Multi-Location Mode in Settings first.');
      } else {
        setFormError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    setIsSubmitting(true);
    try {
      await deleteLocation(id);
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Failed to delete location:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetPrimary = async (location: Location) => {
    if (location.isPrimary) return;

    setIsSubmitting(true);
    try {
      await updateLocation(location.id, { isPrimary: true });
    } catch (err) {
      console.error('Failed to set primary location:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (location: Location) => {
    setIsSubmitting(true);
    try {
      await updateLocation(location.id, { isActive: !location.isActive });
    } catch (err) {
      console.error('Failed to toggle location status:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-charcoal flex">
      <AppSidebar
        currentPage="locations"
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white dark:bg-sidebar border-b border-charcoal/10 dark:border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-charcoal/60 dark:text-white/60 hover:text-charcoal dark:hover:text-white lg:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-charcoal dark:text-white">Locations</h1>
                <p className="text-sm text-charcoal/60 dark:text-white/60">
                  {locations.length} {locations.length === 1 ? 'location' : 'locations'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <ThemeToggle />
              <NotificationDropdown />
              <button
                onClick={openNewLocationModal}
                className="flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-all"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Add Location</span>
              </button>
            </div>
          </div>
        </header>

        {/* Search Bar */}
        <div className="bg-white dark:bg-sidebar border-b border-charcoal/10 dark:border-white/10 px-6 py-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40 dark:text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search locations..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-charcoal/10 dark:border-white/10 text-sm focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all bg-white dark:bg-charcoal text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-sage animate-spin mx-auto mb-4" />
              <p className="text-charcoal/60 dark:text-white/60">Loading locations...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex-1 p-6">
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl p-6 text-center">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-4" />
              <p className="text-rose-700 dark:text-rose-300 font-medium mb-2">Failed to load locations</p>
              <p className="text-rose-600 dark:text-rose-400 text-sm mb-4">{error}</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 rounded-xl font-medium hover:bg-rose-200 dark:hover:bg-rose-900/60 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Locations List */}
        {!isLoading && !error && (
          <div className="flex-1 p-6 overflow-auto">
            {filteredLocations.length === 0 ? (
              <div className="bg-white dark:bg-sidebar rounded-2xl shadow-soft border border-charcoal/5 dark:border-white/5">
                <EmptyState
                  icon={Building2}
                  title={searchQuery ? "No locations found" : "No locations yet"}
                  description={searchQuery ? "Try adjusting your search to see more results." : "Add your first location to get started."}
                  action={!searchQuery ? {
                    label: "Add Location",
                    onClick: openNewLocationModal,
                  } : undefined}
                />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredLocations.map((location) => (
                  <div
                    key={location.id}
                    className={`bg-white dark:bg-sidebar rounded-2xl shadow-soft border border-charcoal/5 dark:border-white/5 overflow-hidden transition-all hover:shadow-md ${
                      !location.isActive ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Card Header */}
                    <div className="p-5 border-b border-charcoal/5 dark:border-white/5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-sage" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-charcoal dark:text-white truncate">{location.name}</h3>
                              {location.isPrimary && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                                  <Star className="w-3 h-3" />
                                  Primary
                                </span>
                              )}
                              {!location.isActive && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-charcoal/10 dark:bg-white/10 text-charcoal/60 dark:text-white/60">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-charcoal/60 dark:text-white/60 truncate">{formatAddress(location)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-3">
                      {location.phone && (
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="w-4 h-4 text-charcoal/40 dark:text-white/40 flex-shrink-0" />
                          <span className="text-charcoal/70 dark:text-white/70">{location.phone}</span>
                        </div>
                      )}

                      {location.timezone && (
                        <div className="flex items-center gap-3 text-sm">
                          <Clock className="w-4 h-4 text-charcoal/40 dark:text-white/40 flex-shrink-0" />
                          <span className="text-charcoal/70 dark:text-white/70">{getTimezoneLabel(location.timezone)}</span>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 pt-2 border-t border-charcoal/5 dark:border-white/5">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-charcoal/40 dark:text-white/40" />
                          <span className="text-charcoal/60 dark:text-white/60">
                            {location._count?.staffLocations ?? 0} staff
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-charcoal/40 dark:text-white/40" />
                          <span className="text-charcoal/60 dark:text-white/60">
                            {location._count?.appointments ?? 0} appointments
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="px-5 py-3 bg-charcoal/[0.02] dark:bg-white/[0.02] border-t border-charcoal/5 dark:border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {!location.isPrimary && (
                          <button
                            onClick={() => handleSetPrimary(location)}
                            disabled={isSubmitting}
                            className="p-2 text-charcoal/40 dark:text-white/40 hover:text-amber-500 transition-colors disabled:opacity-50"
                            title="Set as primary"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditLocationModal(location)}
                          className="p-2 text-charcoal/40 dark:text-white/40 hover:text-charcoal dark:hover:text-white transition-colors"
                          title="Edit location"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {!location.isPrimary && (
                          <button
                            onClick={() => setDeleteConfirm({ id: location.id, name: location.name })}
                            className="p-2 text-charcoal/40 dark:text-white/40 hover:text-rose-500 transition-colors"
                            title="Delete location"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleToggleActive(location)}
                        disabled={isSubmitting}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          location.isActive
                            ? 'bg-sage/10 text-sage hover:bg-sage/20'
                            : 'bg-charcoal/10 dark:bg-white/10 text-charcoal/60 dark:text-white/60 hover:bg-charcoal/20 dark:hover:bg-white/20'
                        }`}
                      >
                        {location.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* New/Edit Location Modal */}
      <Modal
        isOpen={showLocationModal}
        onClose={closeModal}
        title={editingLocation ? 'Edit Location' : 'Add New Location'}
        size="lg"
        className="max-h-[90vh] overflow-auto dark:bg-sidebar"
      >
        <div className="space-y-6">
              {/* Error Message */}
              {formError && (
                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-3 text-rose-700 dark:text-rose-300">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Unable to save location</p>
                    <p className="text-sm text-rose-600 dark:text-rose-400 mt-1">{formError}</p>
                  </div>
                </div>
              )}

              {/* Location Name */}
              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                  Location Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={locationForm.name}
                  onChange={(e) => setLocationForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all bg-white dark:bg-charcoal text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                  placeholder="e.g., Downtown Spa"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Street Address</label>
                <input
                  type="text"
                  value={locationForm.address}
                  onChange={(e) => setLocationForm((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all bg-white dark:bg-charcoal text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                  placeholder="e.g., 123 Main Street"
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Country</label>
                <select
                  value={locationForm.country}
                  onChange={(e) => setLocationForm((prev) => ({ ...prev, country: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all bg-white dark:bg-charcoal text-charcoal dark:text-white"
                >
                  {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* City, State/Province, Postal Code */}
              <div className="grid grid-cols-6 gap-4">
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">City</label>
                  <input
                    type="text"
                    value={locationForm.city}
                    onChange={(e) => setLocationForm((prev) => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all bg-white dark:bg-charcoal text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                    placeholder="City"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">State / Province</label>
                  <input
                    type="text"
                    value={locationForm.state}
                    onChange={(e) => setLocationForm((prev) => ({ ...prev, state: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all bg-white dark:bg-charcoal text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                    placeholder="Region"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Postal</label>
                  <input
                    type="text"
                    value={locationForm.zip}
                    onChange={(e) => setLocationForm((prev) => ({ ...prev, zip: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all bg-white dark:bg-charcoal text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                    placeholder="Code"
                    maxLength={10}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Phone</label>
                <input
                  type="tel"
                  value={locationForm.phone}
                  onChange={(e) => setLocationForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all bg-white dark:bg-charcoal text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                  placeholder="e.g., (555) 123-4567"
                />
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">Timezone</label>
                <select
                  value={locationForm.timezone}
                  onChange={(e) => setLocationForm((prev) => ({ ...prev, timezone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all bg-white dark:bg-charcoal text-charcoal dark:text-white"
                >
                  {/* Group timezones by region */}
                  {['Europe', 'Americas', 'Asia/Pacific', 'Other'].map((region) => (
                    <optgroup key={region} label={region}>
                      {TIMEZONE_OPTIONS.filter((tz) => tz.region === region).map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Business Hours - Structured Editor */}
              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-3">Business Hours</label>
                <div className="p-4 bg-cream/50 dark:bg-charcoal/50 rounded-xl border border-charcoal/10 dark:border-white/10">
                  <HoursEditor
                    hours={locationHours}
                    onChange={setLocationHours}
                  />
                </div>
              </div>

              {/* Legacy Business Hours (optional text override) */}
              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                  Hours Description <span className="text-charcoal/40 dark:text-white/40 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={locationForm.hours}
                  onChange={(e) => setLocationForm((prev) => ({ ...prev, hours: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all resize-none bg-white dark:bg-charcoal text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-white/40"
                  placeholder="e.g., Extended hours during holidays"
                />
                <p className="mt-1 text-xs text-charcoal/50 dark:text-white/50">
                  Additional notes about your hours (displayed alongside structured hours)
                </p>
              </div>

          {/* Primary Location Toggle */}
          {!editingLocation?.isPrimary && (
            <div className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-medium text-charcoal dark:text-white">Set as Primary Location</p>
                  <p className="text-sm text-charcoal/60 dark:text-white/60">This will be the default location for your business</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLocationForm((prev) => ({ ...prev, isPrimary: !prev.isPrimary }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  locationForm.isPrimary ? 'bg-amber-500' : 'bg-charcoal/20 dark:bg-white/20'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    locationForm.isPrimary ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-charcoal/10 dark:border-white/10 flex gap-3 mt-6">
          <button
            onClick={closeModal}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 border border-charcoal/20 dark:border-white/20 text-charcoal dark:text-white rounded-xl font-medium hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveLocation}
            disabled={isSubmitting || !locationForm.name}
            className="flex-1 px-4 py-3 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {editingLocation ? 'Save Changes' : 'Add Location'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Location?"
        size="sm"
        className="dark:bg-sidebar"
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-rose-500" />
          </div>
          <p className="text-charcoal/60 dark:text-white/60 mb-6">
            Are you sure you want to delete &quot;{deleteConfirm?.name}&quot;? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-charcoal/20 dark:border-white/20 text-charcoal dark:text-white rounded-xl font-medium hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteConfirm && handleDeleteLocation(deleteConfirm.id)}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function LocationsPage() {
  return (
    <AuthGuard>
      <LocationsContent />
    </AuthGuard>
  );
}
