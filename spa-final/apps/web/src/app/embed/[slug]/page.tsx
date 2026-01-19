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
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface Salon {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  branding: {
    primaryColor: string;
    accentColor: string;
    logoUrl: string | null;
  };
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
// API HELPERS
// ============================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://peacase-api.onrender.com';

async function fetchSalon(slug: string): Promise<Salon | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/public/${slug}/salon`);
    const data = await res.json();
    return data.success ? data.data : null;
  } catch {
    return null;
  }
}

async function fetchServices(slug: string): Promise<ServiceCategory[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/public/${slug}/services`);
    const data = await res.json();
    return data.success ? data.data : [];
  } catch {
    return [];
  }
}

async function fetchStaff(slug: string, serviceId?: string): Promise<Staff[]> {
  try {
    const url = serviceId
      ? `${API_BASE}/api/v1/public/${slug}/staff?serviceId=${serviceId}`
      : `${API_BASE}/api/v1/public/${slug}/staff`;
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

// Step 1: Select Service
function ServiceStep({
  categories,
  onSelect,
  primaryColor,
}: {
  categories: ServiceCategory[];
  onSelect: (service: Service) => void;
  primaryColor: string;
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
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              {category.name}
            </h3>
            <div className="space-y-2">
              {category.services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => onSelect(service)}
                  className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-left group"
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
}: {
  staff: Staff[];
  onSelect: (staffId: string | null, staffName: string) => void;
  primaryColor: string;
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
          className="w-full p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-all text-left"
          style={{ borderColor: primaryColor + '40' }}
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
            className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all text-left"
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
}: {
  slots: TimeSlot[];
  selectedDate: string;
  selectedTime: string | null;
  onDateChange: (date: string) => void;
  onTimeSelect: (time: string) => void;
  isLoadingSlots: boolean;
  primaryColor: string;
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
}: {
  booking: BookingData;
  onChange: (field: keyof BookingData, value: string | boolean) => void;
  primaryColor: string;
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
}: {
  booking: BookingData;
  salon: Salon;
  primaryColor: string;
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
  const slug = params.slug as string;

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [salon, setSalon] = useState<Salon | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const [booking, setBooking] = useState<BookingData>({
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

  const primaryColor = salon?.branding?.primaryColor || '#7C9A82';

  // Load initial data
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const [salonData, servicesData] = await Promise.all([
        fetchSalon(slug),
        fetchServices(slug),
      ]);
      setSalon(salonData);
      setCategories(servicesData);
      setIsLoading(false);
    }
    load();
  }, [slug]);

  // Load staff when service is selected
  useEffect(() => {
    if (booking.serviceId) {
      fetchStaff(slug, booking.serviceId).then(setStaff);
    }
  }, [slug, booking.serviceId]);

  // Load availability when date/service/staff changes
  useEffect(() => {
    if (booking.serviceId && booking.date) {
      setIsLoadingSlots(true);
      fetchAvailability(slug, booking.date, booking.serviceId, booking.staffId || undefined)
        .then(setSlots)
        .finally(() => setIsLoadingSlots(false));
    }
  }, [slug, booking.serviceId, booking.staffId, booking.date]);

  const updateBooking = useCallback((field: keyof BookingData, value: string | boolean | null) => {
    setBooking((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleServiceSelect = (service: Service) => {
    updateBooking('serviceId', service.id);
    updateBooking('serviceName', service.name);
    setStep(2);
  };

  const handleStaffSelect = (staffId: string | null, staffName: string) => {
    updateBooking('staffId', staffId);
    updateBooking('staffName', staffName);
    setStep(3);
  };

  const handleTimeSelect = (time: string) => {
    updateBooking('time', time);
    setStep(4);
  };

  const handleSubmit = async () => {
    if (!booking.serviceId || !booking.date || !booking.time || !booking.firstName || !booking.lastName || !booking.email) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const startTime = `${booking.date}T${booking.time}:00`;
    const result = await createBooking(slug, {
      serviceId: booking.serviceId,
      staffId: booking.staffId || undefined,
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
      setStep(5);
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
    switch (step) {
      case 3:
        return booking.time !== null;
      case 4:
        return booking.firstName && booking.lastName && booking.email;
      default:
        return true;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Salon Not Found</h2>
          <p className="text-gray-500">This booking page is not available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            {salon.branding.logoUrl ? (
              <img
                src={salon.branding.logoUrl}
                alt={salon.name}
                className="w-8 h-8 rounded-lg object-contain"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <span className="text-white font-bold text-sm">
                  {salon.name[0]}
                </span>
              </div>
            )}
            <span className="font-semibold text-gray-900">{salon.name}</span>
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
      {step < 5 && (
        <div className="bg-white border-b border-gray-200 px-4 py-2">
          <div className="max-w-lg mx-auto">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((s) => (
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
      <main className="max-w-lg mx-auto p-6">
        {step === 1 && (
          <ServiceStep
            categories={categories}
            onSelect={handleServiceSelect}
            primaryColor={primaryColor}
          />
        )}

        {step === 2 && (
          <StaffStep
            staff={staff}
            onSelect={handleStaffSelect}
            primaryColor={primaryColor}
          />
        )}

        {step === 3 && (
          <DateTimeStep
            slots={slots}
            selectedDate={booking.date || ''}
            selectedTime={booking.time}
            onDateChange={(date) => updateBooking('date', date)}
            onTimeSelect={handleTimeSelect}
            isLoadingSlots={isLoadingSlots}
            primaryColor={primaryColor}
          />
        )}

        {step === 4 && (
          <DetailsStep
            booking={booking}
            onChange={updateBooking}
            primaryColor={primaryColor}
          />
        )}

        {step === 5 && (
          <ConfirmationStep
            booking={booking}
            salon={salon}
            primaryColor={primaryColor}
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
      {step < 5 && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4">
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
            {step === 4 && (
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
            {step === 3 && booking.time && (
              <button
                onClick={() => setStep(4)}
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
      {step === 5 && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-4">
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
