'use client';

import { useState, useMemo } from 'react';
import {
  Menu,
  Search,
  Plus,
  Clock,
  X,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  MapPin,
  Building2,
  Phone,
  Star,
  Users,
  Calendar,
} from 'lucide-react';
import { AppSidebar } from '@/components/AppSidebar';
import { AuthGuard } from '@/components/AuthGuard';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { useLocations, type Location, type CreateLocationInput, type UpdateLocationInput, type LocationHours } from '@/hooks/useLocations';

// US Timezones for dropdown
const TIMEZONES = [
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Phoenix', label: 'Arizona (No DST)' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
];

// US States for dropdown
const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' },
];

interface LocationFormState {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
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
  phone: '',
  timezone: 'America/Los_Angeles',
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
            <span className="w-24 text-sm font-medium text-charcoal">{day}</span>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={dayHours.isClosed}
                onChange={(e) => updateDay(index, { isClosed: e.target.checked })}
                className="rounded border-charcoal/20"
              />
              <span className="text-sm text-charcoal/60">Closed</span>
            </label>
            {!dayHours.isClosed && (
              <>
                <input
                  type="time"
                  value={dayHours.openTime || '09:00'}
                  onChange={(e) => updateDay(index, { openTime: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-charcoal/20 text-sm focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                />
                <span className="text-charcoal/40">to</span>
                <input
                  type="time"
                  value={dayHours.closeTime || '17:00'}
                  onChange={(e) => updateDay(index, { closeTime: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-charcoal/20 text-sm focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
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
  } = useLocations();

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
    const parts = [location.address, location.city, location.state, location.zip].filter(Boolean);
    return parts.join(', ') || 'No address';
  };

  const getTimezoneLabel = (timezoneValue: string) => {
    return TIMEZONES.find((tz) => tz.value === timezoneValue)?.label || timezoneValue;
  };

  const resetForm = () => {
    setLocationForm(emptyFormState);
    setLocationHours(getDefaultHours());
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
      phone: location.phone || '',
      timezone: location.timezone || 'America/Los_Angeles',
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
    try {
      const data: CreateLocationInput = {
        name: locationForm.name,
        address: locationForm.address || undefined,
        city: locationForm.city || undefined,
        state: locationForm.state || undefined,
        zip: locationForm.zip || undefined,
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
    <div className="min-h-screen bg-cream flex">
      <AppSidebar
        currentPage="locations"
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-charcoal/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-charcoal/60 hover:text-charcoal lg:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-charcoal">Locations</h1>
                <p className="text-sm text-charcoal/60">
                  {locations.length} {locations.length === 1 ? 'location' : 'locations'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
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
        <div className="bg-white border-b border-charcoal/10 px-6 py-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search locations..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-charcoal/10 text-sm focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-sage animate-spin mx-auto mb-4" />
              <p className="text-charcoal/60">Loading locations...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex-1 p-6">
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-4" />
              <p className="text-rose-700 font-medium mb-2">Failed to load locations</p>
              <p className="text-rose-600 text-sm mb-4">{error}</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-rose-100 text-rose-700 rounded-xl font-medium hover:bg-rose-200 transition-colors"
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
              <div className="bg-white rounded-2xl shadow-soft border border-charcoal/5 p-12 text-center">
                <Building2 className="w-12 h-12 text-charcoal/20 mx-auto mb-4" />
                <p className="text-charcoal/60 mb-2">No locations found</p>
                <p className="text-sm text-charcoal/40 mb-4">
                  {searchQuery ? 'Try adjusting your search' : 'Add your first location to get started'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={openNewLocationModal}
                    className="px-4 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors"
                  >
                    Add Location
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredLocations.map((location) => (
                  <div
                    key={location.id}
                    className={`bg-white rounded-2xl shadow-soft border border-charcoal/5 overflow-hidden transition-all hover:shadow-md ${
                      !location.isActive ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Card Header */}
                    <div className="p-5 border-b border-charcoal/5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-sage" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-charcoal truncate">{location.name}</h3>
                              {location.isPrimary && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                  <Star className="w-3 h-3" />
                                  Primary
                                </span>
                              )}
                              {!location.isActive && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-charcoal/10 text-charcoal/60">
                                  Inactive
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-charcoal/60 truncate">{formatAddress(location)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 space-y-3">
                      {location.phone && (
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="w-4 h-4 text-charcoal/40 flex-shrink-0" />
                          <span className="text-charcoal/70">{location.phone}</span>
                        </div>
                      )}

                      {location.timezone && (
                        <div className="flex items-center gap-3 text-sm">
                          <Clock className="w-4 h-4 text-charcoal/40 flex-shrink-0" />
                          <span className="text-charcoal/70">{getTimezoneLabel(location.timezone)}</span>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 pt-2 border-t border-charcoal/5">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-charcoal/40" />
                          <span className="text-charcoal/60">
                            {location._count?.staffLocations ?? 0} staff
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-charcoal/40" />
                          <span className="text-charcoal/60">
                            {location._count?.appointments ?? 0} appointments
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="px-5 py-3 bg-charcoal/[0.02] border-t border-charcoal/5 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {!location.isPrimary && (
                          <button
                            onClick={() => handleSetPrimary(location)}
                            disabled={isSubmitting}
                            className="p-2 text-charcoal/40 hover:text-amber-500 transition-colors disabled:opacity-50"
                            title="Set as primary"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditLocationModal(location)}
                          className="p-2 text-charcoal/40 hover:text-charcoal transition-colors"
                          title="Edit location"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {!location.isPrimary && (
                          <button
                            onClick={() => setDeleteConfirm({ id: location.id, name: location.name })}
                            className="p-2 text-charcoal/40 hover:text-rose-500 transition-colors"
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
                            : 'bg-charcoal/10 text-charcoal/60 hover:bg-charcoal/20'
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
      {showLocationModal && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-charcoal/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-charcoal">
                {editingLocation ? 'Edit Location' : 'Add New Location'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-charcoal/40 hover:text-charcoal transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Location Name */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Location Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={locationForm.name}
                  onChange={(e) => setLocationForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  placeholder="e.g., Downtown Spa"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Street Address</label>
                <input
                  type="text"
                  value={locationForm.address}
                  onChange={(e) => setLocationForm((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  placeholder="e.g., 123 Main Street"
                />
              </div>

              {/* City, State, Zip */}
              <div className="grid grid-cols-6 gap-4">
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-charcoal mb-2">City</label>
                  <input
                    type="text"
                    value={locationForm.city}
                    onChange={(e) => setLocationForm((prev) => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                    placeholder="City"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-charcoal mb-2">State</label>
                  <select
                    value={locationForm.state}
                    onChange={(e) => setLocationForm((prev) => ({ ...prev, state: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  >
                    <option value="">Select</option>
                    {US_STATES.map((state) => (
                      <option key={state.value} value={state.value}>
                        {state.value}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-charcoal mb-2">ZIP</label>
                  <input
                    type="text"
                    value={locationForm.zip}
                    onChange={(e) => setLocationForm((prev) => ({ ...prev, zip: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                    placeholder="ZIP"
                    maxLength={10}
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Phone</label>
                <input
                  type="tel"
                  value={locationForm.phone}
                  onChange={(e) => setLocationForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  placeholder="e.g., (555) 123-4567"
                />
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Timezone</label>
                <select
                  value={locationForm.timezone}
                  onChange={(e) => setLocationForm((prev) => ({ ...prev, timezone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Business Hours - Structured Editor */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-3">Business Hours</label>
                <div className="p-4 bg-cream/50 rounded-xl border border-charcoal/10">
                  <HoursEditor
                    hours={locationHours}
                    onChange={setLocationHours}
                  />
                </div>
              </div>

              {/* Legacy Business Hours (optional text override) */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Hours Description <span className="text-charcoal/40 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={locationForm.hours}
                  onChange={(e) => setLocationForm((prev) => ({ ...prev, hours: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all resize-none"
                  placeholder="e.g., Extended hours during holidays"
                />
                <p className="mt-1 text-xs text-charcoal/50">
                  Additional notes about your hours (displayed alongside structured hours)
                </p>
              </div>

              {/* Primary Location Toggle */}
              {!editingLocation?.isPrimary && (
                <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-3">
                    <Star className="w-5 h-5 text-amber-600" />
                    <div>
                      <p className="font-medium text-charcoal">Set as Primary Location</p>
                      <p className="text-sm text-charcoal/60">This will be the default location for your business</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLocationForm((prev) => ({ ...prev, isPrimary: !prev.isPrimary }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      locationForm.isPrimary ? 'bg-amber-500' : 'bg-charcoal/20'
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

            <div className="p-6 border-t border-charcoal/10 flex gap-3">
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 border border-charcoal/20 text-charcoal rounded-xl font-medium hover:bg-charcoal/5 transition-colors disabled:opacity-50"
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
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-rose-500" />
              </div>
              <h2 className="text-lg font-bold text-charcoal mb-2">Delete Location?</h2>
              <p className="text-charcoal/60 mb-6">
                Are you sure you want to delete &quot;{deleteConfirm.name}&quot;? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 border border-charcoal/20 text-charcoal rounded-xl font-medium hover:bg-charcoal/5 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteLocation(deleteConfirm.id)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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
