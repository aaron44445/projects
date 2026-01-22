'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  User,
  Calendar,
  Check,
  Loader2,
  X,
  AlertCircle,
  MapPin,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface Salon {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  widget: {
    primaryColor: string;
    accentColor: string;
    buttonStyle: 'rounded' | 'square';
    fontFamily: 'system' | 'modern' | 'classic';
  };
}

interface Location {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  isPrimary: boolean;
  isActive: boolean;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  color: string;
}

interface ServiceCategory {
  id: string;
  name: string;
  services: Service[];
}

interface Staff {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  serviceIds: string[];
}

interface TimeSlot {
  time: string;
  available: boolean;
}

interface BookingData {
  locationId: string | null;
  locationName: string | null;
  serviceId: string | null;
  serviceName: string | null;
  staffId: string | null;
  staffName: string | null;
  date: string | null;
  time: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
  optInReminders: boolean;
}

// ============================================
// DEMO MODE DATA
// ============================================

const DEMO_SALON: Salon = {
  id: 'demo',
  name: 'Serenity Spa & Salon',
  slug: 'demo',
  logoUrl: null,
  phone: '(555) 123-4567',
  address: '123 Wellness Way',
  city: 'Beverly Hills',
  state: 'CA',
  zip: '90210',
  widget: {
    primaryColor: '#7C9A82',
    accentColor: '#B5A8D5',
    buttonStyle: 'rounded',
    fontFamily: 'modern',
  },
};

const DEMO_CATEGORIES: ServiceCategory[] = [
  {
    id: 'cat-hair',
    name: 'Hair Services',
    services: [
      { id: 'svc-1', name: 'Haircut & Style', description: 'Professional cut and blow-dry styling', durationMinutes: 45, price: 65, color: '#C7DCC8' },
      { id: 'svc-2', name: 'Full Color', description: 'Single-process all-over color', durationMinutes: 90, price: 120, color: '#E8D5C4' },
      { id: 'svc-3', name: 'Highlights', description: 'Partial or full foil highlights', durationMinutes: 120, price: 150, color: '#D4C5E8' },
    ],
  },
  {
    id: 'cat-spa',
    name: 'Spa Treatments',
    services: [
      { id: 'svc-4', name: 'Swedish Massage', description: 'Relaxing full-body massage', durationMinutes: 60, price: 95, color: '#E8C5D4' },
      { id: 'svc-5', name: 'Deep Tissue Massage', description: 'Therapeutic deep tissue work', durationMinutes: 60, price: 110, color: '#C8E0D4' },
      { id: 'svc-6', name: 'Facial Treatment', description: 'Customized facial for your skin type', durationMinutes: 60, price: 85, color: '#D4E0C8' },
    ],
  },
  {
    id: 'cat-nails',
    name: 'Nail Services',
    services: [
      { id: 'svc-7', name: 'Manicure', description: 'Classic manicure with polish', durationMinutes: 30, price: 35, color: '#E0D4C8' },
      { id: 'svc-8', name: 'Pedicure', description: 'Relaxing pedicure treatment', durationMinutes: 45, price: 50, color: '#C8D4E0' },
    ],
  },
];

const DEMO_STAFF: Staff[] = [
  { id: 'staff-1', name: 'Sarah Johnson', firstName: 'Sarah', lastName: 'Johnson', avatarUrl: null, serviceIds: ['svc-1', 'svc-2', 'svc-3'] },
  { id: 'staff-2', name: 'Michael Chen', firstName: 'Michael', lastName: 'Chen', avatarUrl: null, serviceIds: ['svc-4', 'svc-5'] },
  { id: 'staff-3', name: 'Emily Davis', firstName: 'Emily', lastName: 'Davis', avatarUrl: null, serviceIds: ['svc-6', 'svc-7', 'svc-8'] },
];

// Generate demo time slots for today
function generateDemoSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'];
  times.forEach(time => {
    // Randomly mark some slots as unavailable
    slots.push({ time, available: Math.random() > 0.3 });
  });
  return slots;
}

// ============================================
// API HELPERS
// ============================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://peacase-api.onrender.com';

interface SalonFetchResult {
  salon: Salon | null;
  errorType: 'none' | 'not_found' | 'booking_disabled' | 'network_error';
}

async function fetchSalon(slug: string): Promise<SalonFetchResult> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/public/${slug}/salon`);
    const data = await res.json();

    if (data.success && data.data) {
      // Check if booking is enabled for this salon
      const bookingEnabled = data.data.bookingEnabled !== false;
      if (!bookingEnabled) {
        return { salon: null, errorType: 'booking_disabled' };
      }
      return { salon: data.data, errorType: 'none' };
    }

    return { salon: null, errorType: 'not_found' };
  } catch {
    return { salon: null, errorType: 'network_error' };
  }
}

async function fetchLocations(slug: string): Promise<Location[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/public/${slug}/locations`);
    const data = await res.json();
    return data.success ? data.data : [];
  } catch {
    return [];
  }
}

async function fetchServices(slug: string, locationId?: string): Promise<ServiceCategory[]> {
  try {
    let url = `${API_BASE}/api/v1/public/${slug}/services`;
    if (locationId) url += `?locationId=${locationId}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.success ? data.data : [];
  } catch {
    return [];
  }
}

async function fetchStaff(slug: string, serviceId?: string, locationId?: string): Promise<Staff[]> {
  try {
    const params = new URLSearchParams();
    if (serviceId) params.append('serviceId', serviceId);
    if (locationId) params.append('locationId', locationId);
    const queryString = params.toString();
    const url = `${API_BASE}/api/v1/public/${slug}/staff${queryString ? `?${queryString}` : ''}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.success ? data.data : [];
  } catch {
    return [];
  }
}

async function fetchAvailability(
  slug: string,
  date: string,
  serviceId: string,
  staffId?: string
): Promise<TimeSlot[]> {
  try {
    let url = `${API_BASE}/api/v1/public/${slug}/availability?date=${date}&serviceId=${serviceId}`;
    if (staffId) url += `&staffId=${staffId}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.success ? data.data : [];
  } catch {
    return [];
  }
}

async function createBooking(
  slug: string,
  booking: {
    serviceId: string;
    staffId?: string;
    locationId?: string;
    startTime: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    notes?: string;
    optInReminders: boolean;
  }
): Promise<{ success: boolean; data?: unknown; error?: { message: string } }> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/public/${slug}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    });
    return await res.json();
  } catch {
    return { success: false, error: { message: 'Failed to create booking' } };
  }
}

// ============================================
// COMPONENTS
// ============================================

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
}

function formatPrice(price: number): string {
  return `$${price.toFixed(0)}`;
}

// Step 0: Select Location (when multiple locations exist)
function LocationStep({
  locations,
  onSelect,
  primaryColor,
  borderRadius,
}: {
  locations: Location[];
  onSelect: (location: Location) => void;
  primaryColor: string;
  borderRadius: string;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">Select Location</h2>
        <p className="text-sm text-gray-500 mt-1">Choose which location you&apos;d like to visit</p>
      </div>
      <div className="space-y-3">
        {locations.map((location) => (
          <button
            key={location.id}
            onClick={() => onSelect(location)}
            className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all text-left"
            style={{ borderRadius }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: primaryColor + '20' }}
              >
                <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{location.name}</p>
                {location.address && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {location.address}
                    {location.city && `, ${location.city}`}
                    {location.state && `, ${location.state}`}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Step 1: Select Service
function ServiceStep({
  categories,
  onSelect,
  primaryColor,
  accentColor,
  borderRadius,
}: {
  categories: ServiceCategory[];
  onSelect: (service: Service) => void;
  primaryColor: string;
  accentColor: string;
  borderRadius: string;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">Select a Service</h2>
        <p className="text-sm text-gray-500 mt-1">Choose the service you&apos;d like to book</p>
      </div>

      <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
        {categories.map((category) => (
          <div key={category.id}>
            <h3 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: accentColor }}>
              {category.name}
            </h3>
            <div className="space-y-2">
              {category.services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => onSelect(service)}
                  className="w-full p-4 bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-left group"
                  style={{ borderRadius }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: service.color }}
                        />
                        <span className="font-medium text-gray-900">{service.name}</span>
                      </div>
                      {service.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {service.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="font-semibold text-gray-900">{formatPrice(service.price)}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {formatDuration(service.durationMinutes)}
                      </p>
                    </div>
                  </div>
                  <div
                    className="mt-2 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: primaryColor }}
                  >
                    Select &rarr;
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Step 2: Select Staff
function StaffStep({
  staff,
  onSelect,
  primaryColor,
  borderRadius,
}: {
  staff: Staff[];
  onSelect: (staffId: string | null, staffName: string) => void;
  primaryColor: string;
  borderRadius: string;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">Select a Stylist</h2>
        <p className="text-sm text-gray-500 mt-1">Choose who you&apos;d like to see</p>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {/* Any Available Option */}
        <button
          onClick={() => onSelect(null, 'Any Available')}
          className="w-full p-4 bg-white border-2 border-gray-200 hover:border-gray-300 transition-all text-left"
          style={{ borderColor: primaryColor + '40', borderRadius }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: primaryColor + '20' }}
            >
              <User className="w-6 h-6" style={{ color: primaryColor }} />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Any Available</p>
              <p className="text-sm text-gray-500">First available team member</p>
            </div>
          </div>
        </button>

        {/* Individual Staff */}
        {staff.map((member) => (
          <button
            key={member.id}
            onClick={() => onSelect(member.id, member.name)}
            className="w-full p-4 bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all text-left"
            style={{ borderRadius }}
          >
            <div className="flex items-center gap-4">
              {member.avatarUrl ? (
                <img
                  src={member.avatarUrl}
                  alt={member.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-lg font-semibold text-gray-600">
                    {member.firstName[0]}
                    {member.lastName[0]}
                  </span>
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">{member.name}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Step 3: Select Date & Time
function DateTimeStep({
  slots,
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeSelect,
  isLoadingSlots,
  primaryColor,
  borderRadius,
}: {
  slots: TimeSlot[];
  selectedDate: string;
  selectedTime: string | null;
  onDateChange: (date: string) => void;
  onTimeSelect: (time: string) => void;
  isLoadingSlots: boolean;
  primaryColor: string;
  borderRadius: string;
}) {
  // Generate next 30 days
  const dates = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date.toISOString().split('T')[0];
  });

  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">Pick a Date & Time</h2>
        <p className="text-sm text-gray-500 mt-1">Select when you&apos;d like to come in</p>
      </div>

      {/* Date Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {dates.slice(0, 14).map((date) => {
            const isSelected = date === selectedDate;
            return (
              <button
                key={date}
                onClick={() => onDateChange(date)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  isSelected
                    ? 'border-transparent text-white'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
                style={isSelected ? { backgroundColor: primaryColor } : {}}
              >
                {formatDateLabel(date)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Available Times</label>
        {isLoadingSlots ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No available times for this date</p>
            <p className="text-sm">Try selecting a different date</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto">
            {slots.map((slot) => {
              const isSelected = slot.time === selectedTime;
              return (
                <button
                  key={slot.time}
                  onClick={() => onTimeSelect(slot.time)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? 'text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                  style={isSelected ? { backgroundColor: primaryColor } : {}}
                >
                  {formatTime(slot.time)}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Step 4: Client Details
function DetailsStep({
  booking,
  onChange,
  primaryColor,
  borderRadius,
}: {
  booking: BookingData;
  onChange: (field: keyof BookingData, value: string | boolean) => void;
  primaryColor: string;
  borderRadius: string;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">Your Details</h2>
        <p className="text-sm text-gray-500 mt-1">Enter your contact information</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input
              type="text"
              value={booking.firstName}
              onChange={(e) => onChange('firstName', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-0 outline-none transition-colors"
              placeholder="Jane"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input
              type="text"
              value={booking.lastName}
              onChange={(e) => onChange('lastName', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-0 outline-none transition-colors"
              placeholder="Smith"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            type="email"
            value={booking.email}
            onChange={(e) => onChange('email', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-0 outline-none transition-colors"
            placeholder="jane@example.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={booking.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-0 outline-none transition-colors"
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <textarea
            value={booking.notes}
            onChange={(e) => onChange('notes', e.target.value)}
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-gray-400 focus:ring-0 outline-none transition-colors resize-none"
            placeholder="Any special requests..."
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={booking.optInReminders}
            onChange={(e) => onChange('optInReminders', e.target.checked)}
            className="w-5 h-5 rounded border-gray-300"
            style={{ accentColor: primaryColor }}
          />
          <span className="text-sm text-gray-600">Send me appointment reminders</span>
        </label>
      </div>
    </div>
  );
}

// Step 5: Confirmation
function ConfirmationStep({
  booking,
  salon,
  primaryColor,
  borderRadius,
}: {
  booking: BookingData;
  salon: Salon;
  primaryColor: string;
  borderRadius: string;
}) {
  const formatDateTime = () => {
    if (!booking.date || !booking.time) return '';
    const date = new Date(`${booking.date}T${booking.time}`);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const googleCalendarUrl = () => {
    if (!booking.date || !booking.time) return '#';
    const start = new Date(`${booking.date}T${booking.time}`);
    const end = new Date(start.getTime() + 60 * 60000); // 1 hour default
    const format = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `${booking.serviceName} at ${salon.name}`
    )}&dates=${format(start)}/${format(end)}&details=${encodeURIComponent(
      `Your appointment with ${booking.staffName}`
    )}&location=${encodeURIComponent(
      `${salon.address || ''}, ${salon.city || ''}, ${salon.state || ''}`
    )}`;
  };

  return (
    <div className="space-y-6 text-center">
      <div
        className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
        style={{ backgroundColor: primaryColor + '20' }}
      >
        <Check className="w-8 h-8" style={{ color: primaryColor }} />
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900">You&apos;re All Set!</h2>
        <p className="text-sm text-gray-500 mt-1">Confirmation sent to {booking.email}</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3">
        {booking.locationName && (
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: primaryColor + '20' }}
            >
              <MapPin className="w-4 h-4" style={{ color: primaryColor }} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium text-gray-900">{booking.locationName}</p>
            </div>
          </div>
        )}

        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: primaryColor + '20' }}
          >
            <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
          </div>
          <div>
            <p className="text-sm text-gray-500">When</p>
            <p className="font-medium text-gray-900">{formatDateTime()}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: primaryColor + '20' }}
          >
            <Clock className="w-4 h-4" style={{ color: primaryColor }} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Service</p>
            <p className="font-medium text-gray-900">{booking.serviceName}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: primaryColor + '20' }}
          >
            <User className="w-4 h-4" style={{ color: primaryColor }} />
          </div>
          <div>
            <p className="text-sm text-gray-500">With</p>
            <p className="font-medium text-gray-900">{booking.staffName}</p>
          </div>
        </div>
      </div>

      <a
        href={googleCalendarUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <Calendar className="w-4 h-4" />
        Add to Google Calendar
      </a>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function EmbedBookingPage() {
  const params = useParams();
  const slug = (params?.slug as string) || '';

  // Check if this is demo mode - do this early and consistently
  const isDemo = slug === 'demo';

  const [step, setStep] = useState(1);
  // In demo mode, we already have the data, so no loading needed
  const [isLoading, setIsLoading] = useState(!isDemo);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<'none' | 'not_found' | 'booking_disabled' | 'network_error'>('none');

  // Initialize salon with demo data if in demo mode to avoid flicker
  const [salon, setSalon] = useState<Salon | null>(isDemo ? DEMO_SALON : null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>(isDemo ? DEMO_CATEGORIES : []);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // If there are multiple locations, we need an extra step
  const hasMultipleLocations = locations.length > 1;
  // Step offset: if multiple locations, step 1 is location selection
  // Otherwise step 1 is service selection
  const getActualStep = (displayStep: number) => {
    if (hasMultipleLocations) return displayStep;
    return displayStep + 1; // Skip location step
  };
  const totalSteps = hasMultipleLocations ? 6 : 5;

  // Check if in preview mode (for settings page preview iframe)
  const [isPreview, setIsPreview] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsPreview(new URLSearchParams(window.location.search).has('preview'));
    }
  }, []);

  const [booking, setBooking] = useState<BookingData>({
    locationId: null,
    locationName: null,
    serviceId: null,
    serviceName: null,
    staffId: null,
    staffName: null,
    date: new Date().toISOString().split('T')[0],
    time: null,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
    optInReminders: true,
  });

  // Ensure demo mode is always properly initialized
  // This catches edge cases where useState initializers might not have the correct isDemo value
  useEffect(() => {
    if (isDemo && (!salon || salon.id !== 'demo')) {
      setSalon(DEMO_SALON);
      setCategories(DEMO_CATEGORIES);
      setLocations([]);
      setLoadError('none');
      setIsLoading(false);
    }
  }, [isDemo, salon]);

  // Widget styling from salon settings
  const primaryColor = salon?.widget?.primaryColor || '#7C9A82';
  const accentColor = salon?.widget?.accentColor || '#B5A8D5';
  const buttonStyle = salon?.widget?.buttonStyle || 'rounded';
  const fontFamily = salon?.widget?.fontFamily || 'system';

  // Map font family to CSS value
  const fontFamilyCSS = {
    system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    modern: '"Plus Jakarta Sans", system-ui, sans-serif',
    classic: 'Georgia, "Times New Roman", Times, serif',
  }[fontFamily];

  // Map button style to border radius
  const borderRadius = buttonStyle === 'rounded' ? '12px' : '4px';

  // Load initial data
  useEffect(() => {
    // Track if this effect is still active (for cleanup)
    let cancelled = false;

    async function load() {
      // Demo mode - use mock data, no API calls needed
      if (isDemo) {
        setSalon(DEMO_SALON);
        setLocations([]);
        setCategories(DEMO_CATEGORIES);
        setLoadError('none');
        setIsLoading(false);
        return;
      }

      // Don't fetch if slug is empty - params might not be hydrated yet
      // This prevents race conditions where we get "not_found" before slug is set
      if (!slug) {
        return;
      }

      setIsLoading(true);
      setLoadError('none');

      // Real salon - fetch from API
      const [salonResult, locationsData] = await Promise.all([
        fetchSalon(slug),
        fetchLocations(slug),
      ]);

      // If effect was cancelled (slug changed), don't update state
      if (cancelled) return;

      if (salonResult.errorType !== 'none') {
        setLoadError(salonResult.errorType);
        setIsLoading(false);
        return;
      }

      setSalon(salonResult.salon);
      setLocations(locationsData);

      // If only one location (or no locations), auto-select it and load services
      if (locationsData.length <= 1) {
        const locationId = locationsData.length === 1 ? locationsData[0].id : undefined;
        const locationName = locationsData.length === 1 ? locationsData[0].name : null;
        setBooking(prev => ({
          ...prev,
          locationId: locationId || null,
          locationName,
        }));
        const servicesData = await fetchServices(slug, locationId);
        if (cancelled) return;
        setCategories(servicesData);
      }
      // If multiple locations, services will be loaded when location is selected

      setIsLoading(false);
    }
    load();

    // Cleanup: cancel this effect if dependencies change
    return () => {
      cancelled = true;
    };
  }, [slug, isDemo]);

  // Load staff when service is selected
  useEffect(() => {
    if (booking.serviceId) {
      if (isDemo) {
        // Demo mode - filter demo staff by service
        const filteredStaff = DEMO_STAFF.filter(s => s.serviceIds.includes(booking.serviceId!));
        setStaff(filteredStaff);
      } else {
        fetchStaff(slug, booking.serviceId, booking.locationId || undefined).then(setStaff);
      }
    }
  }, [slug, booking.serviceId, booking.locationId, isDemo]);

  // Load availability when date/service/staff changes
  useEffect(() => {
    if (booking.serviceId && booking.date) {
      setIsLoadingSlots(true);
      if (isDemo) {
        // Demo mode - use generated demo slots
        setTimeout(() => {
          setSlots(generateDemoSlots());
          setIsLoadingSlots(false);
        }, 500); // Simulate network delay
      } else {
        fetchAvailability(slug, booking.date, booking.serviceId, booking.staffId || undefined)
          .then(setSlots)
          .finally(() => setIsLoadingSlots(false));
      }
    }
  }, [slug, booking.serviceId, booking.staffId, booking.date, isDemo]);

  const updateBooking = useCallback((field: keyof BookingData, value: string | boolean | null) => {
    setBooking((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Step numbers based on whether we have multiple locations
  // With multiple locations: 1=Location, 2=Service, 3=Staff, 4=DateTime, 5=Details, 6=Confirm
  // Without multiple locations: 1=Service, 2=Staff, 3=DateTime, 4=Details, 5=Confirm
  const STEP_LOCATION = hasMultipleLocations ? 1 : 0; // 0 means skip
  const STEP_SERVICE = hasMultipleLocations ? 2 : 1;
  const STEP_STAFF = hasMultipleLocations ? 3 : 2;
  const STEP_DATETIME = hasMultipleLocations ? 4 : 3;
  const STEP_DETAILS = hasMultipleLocations ? 5 : 4;
  const STEP_CONFIRM = hasMultipleLocations ? 6 : 5;

  const handleLocationSelect = async (location: Location) => {
    setBooking(prev => ({
      ...prev,
      locationId: location.id,
      locationName: location.name,
    }));
    // Load services for the selected location
    const servicesData = await fetchServices(slug, location.id);
    setCategories(servicesData);
    setStep(STEP_SERVICE);
  };

  const handleServiceSelect = (service: Service) => {
    updateBooking('serviceId', service.id);
    updateBooking('serviceName', service.name);
    setStep(STEP_STAFF);
  };

  const handleStaffSelect = (staffId: string | null, staffName: string) => {
    updateBooking('staffId', staffId);
    updateBooking('staffName', staffName);
    setStep(STEP_DATETIME);
  };

  const handleTimeSelect = (time: string) => {
    updateBooking('time', time);
    setStep(STEP_DETAILS);
  };

  const handleSubmit = async () => {
    if (!booking.serviceId || !booking.date || !booking.time || !booking.firstName || !booking.lastName || !booking.email) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Demo mode - simulate successful booking
    if (isDemo) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
      setIsSubmitting(false);
      setStep(STEP_CONFIRM);
      window.parent?.postMessage({ type: 'peacase-booking-complete' }, '*');
      return;
    }

    // Real booking
    const startTime = `${booking.date}T${booking.time}:00`;
    const result = await createBooking(slug, {
      serviceId: booking.serviceId,
      staffId: booking.staffId || undefined,
      locationId: booking.locationId || undefined,
      startTime,
      firstName: booking.firstName,
      lastName: booking.lastName,
      email: booking.email,
      phone: booking.phone || undefined,
      notes: booking.notes || undefined,
      optInReminders: booking.optInReminders,
    });

    setIsSubmitting(false);

    if (result.success) {
      setStep(STEP_CONFIRM);
      // Notify parent window
      window.parent?.postMessage({ type: 'peacase-booking-complete' }, '*');
    } else {
      setError(result.error?.message || 'Failed to create booking');
    }
  };

  const handleClose = () => {
    window.parent?.postMessage({ type: 'peacase-booking-close' }, '*');
  };

  const canGoNext = () => {
    if (step === STEP_DATETIME) {
      return booking.time !== null;
    }
    if (step === STEP_DETAILS) {
      return booking.firstName && booking.lastName && booking.email;
    }
    return true;
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Don't show error if we're in demo mode - demo data will be set by useEffect
  // This prevents flash of error during hydration
  if (!isDemo && (!salon || loadError !== 'none')) {
    const errorMessages = {
      not_found: {
        title: 'Business Not Found',
        description: 'Please check the URL and try again.',
        icon: 'error' as const,
      },
      booking_disabled: {
        title: 'Online Booking Unavailable',
        description: 'Online booking is not available for this business. Please contact them directly to schedule an appointment.',
        icon: 'info' as const,
      },
      network_error: {
        title: 'Connection Error',
        description: 'Unable to load booking page. Please check your internet connection and try again.',
        icon: 'error' as const,
      },
      none: {
        title: 'Something Went Wrong',
        description: 'Please try again later.',
        icon: 'error' as const,
      },
    };

    const errorInfo = errorMessages[loadError];

    return (
      <div className="min-h-[400px] flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-sm">
          {errorInfo.icon === 'error' ? (
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
          )}
          <h2 className="text-xl font-bold text-gray-900 mb-2">{errorInfo.title}</h2>
          <p className="text-gray-500">{errorInfo.description}</p>
          {loadError === 'network_error' && (
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[500px] bg-gray-50 flex flex-col" style={{ fontFamily: fontFamilyCSS }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            {salon.logoUrl ? (
              <img
                src={salon.logoUrl}
                alt={salon.name}
                className="w-8 h-8 object-contain"
                style={{ borderRadius }}
              />
            ) : (
              <div
                className="w-8 h-8 flex items-center justify-center"
                style={{ backgroundColor: primaryColor, borderRadius }}
              >
                <span className="text-white font-bold text-sm">
                  {salon.name[0]}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{salon.name}</span>
              {isDemo && (
                <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                  Demo
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      {step < STEP_CONFIRM && (
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <div className="max-w-lg mx-auto">
            <div className="flex gap-1">
              {Array.from({ length: totalSteps - 1 }, (_, i) => i + 1).map((s) => (
                <div
                  key={s}
                  className="flex-1 h-1 rounded-full transition-colors"
                  style={{
                    backgroundColor: s <= step ? primaryColor : '#E5E7EB',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-lg mx-auto p-6 flex-1">
        {step === STEP_LOCATION && hasMultipleLocations && (
          <LocationStep
            locations={locations}
            onSelect={handleLocationSelect}
            primaryColor={primaryColor}
            borderRadius={borderRadius}
          />
        )}

        {step === STEP_SERVICE && (
          <ServiceStep
            categories={categories}
            onSelect={handleServiceSelect}
            primaryColor={primaryColor}
            accentColor={accentColor}
            borderRadius={borderRadius}
          />
        )}

        {step === STEP_STAFF && (
          <StaffStep
            staff={staff}
            onSelect={handleStaffSelect}
            primaryColor={primaryColor}
            borderRadius={borderRadius}
          />
        )}

        {step === STEP_DATETIME && (
          <DateTimeStep
            slots={slots}
            selectedDate={booking.date || ''}
            selectedTime={booking.time}
            onDateChange={(date) => updateBooking('date', date)}
            onTimeSelect={handleTimeSelect}
            isLoadingSlots={isLoadingSlots}
            primaryColor={primaryColor}
            borderRadius={borderRadius}
          />
        )}

        {step === STEP_DETAILS && (
          <DetailsStep
            booking={booking}
            onChange={updateBooking}
            primaryColor={primaryColor}
            borderRadius={borderRadius}
          />
        )}

        {step === STEP_CONFIRM && (
          <ConfirmationStep
            booking={booking}
            salon={salon}
            primaryColor={primaryColor}
            borderRadius={borderRadius}
          />
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}
      </main>

      {/* Footer Navigation */}
      {step < STEP_CONFIRM && (
        <footer className="bg-white border-t border-gray-200 px-4 py-4 mt-auto">
          <div className="max-w-lg mx-auto flex gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1 px-4 py-3 text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
            )}
            {step === STEP_DETAILS && (
              <button
                onClick={handleSubmit}
                disabled={!canGoNext() || isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                style={{ backgroundColor: primaryColor }}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Confirm Booking
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
            {step === STEP_DATETIME && booking.time && (
              <button
                onClick={() => setStep(STEP_DETAILS)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-white font-semibold rounded-xl transition-all"
                style={{ backgroundColor: primaryColor }}
              >
                Continue
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </footer>
      )}

      {/* Done Button */}
      {step === STEP_CONFIRM && (
        <footer className="bg-white border-t border-gray-200 px-4 py-4 mt-auto">
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleClose}
              className="w-full px-6 py-3 text-white font-semibold rounded-xl transition-all"
              style={{ backgroundColor: primaryColor }}
            >
              Done
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
