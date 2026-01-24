'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  Users,
  Clock,
  LayoutGrid,
  List,
  Bell,
  Menu,
  X,
  Loader2,
  AlertCircle,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { AppSidebar } from '@/components/AppSidebar';
import { AuthGuard } from '@/components/AuthGuard';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { LocationSwitcher } from '@/components/LocationSwitcher';
import {
  useAppointments,
  useStaff,
  useClients,
  useServices,
  useLocationContext,
  type Appointment,
  type CreateAppointmentInput,
  type UpdateAppointmentInput,
  type StaffMember,
  type Client,
  type Service,
} from '@/hooks';

const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

// Color palette for staff members
const staffColors = [
  '#C7DCC8',
  '#E8D5C4',
  '#D4C5E8',
  '#E8C5D4',
  '#C8E0D4',
  '#D4E0C8',
  '#E0D4C8',
  '#C8D4E0',
];

// Week View Component
interface WeekViewProps {
  currentDate: Date;
  appointments: Appointment[];
  selectedStaff: string[];
  searchQuery: string;
  staff: StaffMember[];
  getStaffColor: (index: number) => string;
  formatTime: (isoString: string) => string;
  getAppointmentPosition: (startTime: string, endTime: string) => { top: number; height: number };
  getStatusColor: (status: string) => string;
  onAppointmentClick: (apt: Appointment) => void;
  onCompleteAppointment: (id: string) => void;
  onCancelAppointment: (id: string) => void;
  onMarkNoShow: (id: string) => void;
}

function WeekView({
  currentDate,
  appointments,
  selectedStaff,
  searchQuery,
  staff,
  getStaffColor,
  formatTime,
  getAppointmentPosition,
  getStatusColor,
  onAppointmentClick,
  onCompleteAppointment,
  onCancelAppointment,
  onMarkNoShow,
}: WeekViewProps) {
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointmentMenuOpen, setAppointmentMenuOpen] = useState<string | null>(null);

  // Get the week dates (7 days starting from currentDate)
  const weekDates = useMemo(() => {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentDate]);

  // Filter appointments for the week
  const weekAppointments = useMemo(() => {
    return (appointments || []).filter((apt) => {
      const aptDate = new Date(apt.startTime);
      const weekStart = new Date(currentDate);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(currentDate);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const isInWeek = aptDate >= weekStart && aptDate <= weekEnd;
      const isStaffSelected = selectedStaff.includes(apt.staffId);

      const matchesSearch =
        !searchQuery ||
        apt.client?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.client?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.service?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      return isInWeek && isStaffSelected && matchesSearch;
    });
  }, [appointments, currentDate, selectedStaff, searchQuery]);

  // Get appointments for a specific day
  const getAppointmentsForDay = (date: Date) => {
    return (weekAppointments || []).filter((apt) => {
      const aptDate = new Date(apt.startTime);
      return (
        aptDate.getFullYear() === date.getFullYear() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getDate() === date.getDate()
      );
    });
  };

  // Format day header
  const formatDayHeader = (date: Date) => {
    const today = new Date();
    const isToday =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    return {
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: date.getDate(),
      isToday,
    };
  };

  // Get staff color for appointment based on staff index
  const getAppointmentColor = (staffId: string) => {
    const staffIndex = (staff || []).findIndex((s) => s.id === staffId);
    return staffIndex >= 0 ? getStaffColor(staffIndex) : '#E5E5E5';
  };

  return (
    <div className="min-h-full">
      {/* Day Headers */}
      <div className="sticky top-0 bg-white border-b border-charcoal/10 z-10 flex">
        <div className="w-16 flex-shrink-0 p-2 border-r border-charcoal/10">
          <Clock className="w-4 h-4 text-charcoal/40 mx-auto" />
        </div>
        {weekDates.map((date, index) => {
          const { dayName, dayNumber, isToday } = formatDayHeader(date);
          return (
            <div
              key={index}
              className={`flex-1 min-w-[120px] p-3 border-r border-charcoal/10 text-center ${
                isToday ? 'bg-sage/5' : ''
              }`}
            >
              <p className="text-xs text-charcoal/60 uppercase tracking-wide">{dayName}</p>
              <p
                className={`text-lg font-semibold ${
                  isToday
                    ? 'w-8 h-8 bg-sage text-white rounded-full flex items-center justify-center mx-auto'
                    : 'text-charcoal'
                }`}
              >
                {dayNumber}
              </p>
            </div>
          );
        })}
      </div>

      {/* Time Grid */}
      <div className="relative">
        {hours.map((hour) => (
          <div key={hour} className="flex border-b border-charcoal/10" style={{ height: '80px' }}>
            <div className="w-16 flex-shrink-0 p-1 text-xs text-charcoal/60 text-right border-r border-charcoal/10">
              {hour.toString().padStart(2, '0')}:00
            </div>
            {weekDates.map((date, dayIndex) => {
              const { isToday } = formatDayHeader(date);
              return (
                <div
                  key={dayIndex}
                  className={`flex-1 min-w-[120px] border-r border-charcoal/10 relative ${
                    isToday ? 'bg-sage/5' : ''
                  }`}
                />
              );
            })}
          </div>
        ))}

        {/* Appointments */}
        {weekDates.map((date, dayIndex) => {
          const dayAppointments = getAppointmentsForDay(date);
          return dayAppointments.map((apt) => {
            const { top, height } = getAppointmentPosition(apt.startTime, apt.endTime);
            const left = 64 + dayIndex * (100 / 7) + '%';
            const width = `calc(${100 / 7}% - 8px)`;

            return (
              <div
                key={apt.id}
                className="absolute rounded-lg p-2 cursor-pointer hover:shadow-lg transition-shadow overflow-hidden group"
                style={{
                  top: `${top}px`,
                  left: `calc(64px + ${dayIndex} * ((100% - 64px) / 7) + 4px)`,
                  width: `calc((100% - 64px) / 7 - 8px)`,
                  height: `${Math.max(height, 36)}px`,
                  backgroundColor: getAppointmentColor(apt.staffId),
                }}
                onClick={() => onAppointmentClick(apt)}
              >
                <div className="flex items-start justify-between h-full">
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="font-semibold text-charcoal text-xs truncate">
                      {apt.client
                        ? `${apt.client.firstName} ${apt.client.lastName}`
                        : 'Unknown Client'}
                    </p>
                    {height >= 50 && (
                      <p className="text-xs text-charcoal/70 truncate">
                        {apt.service?.name || 'Unknown Service'}
                      </p>
                    )}
                    {height >= 65 && (
                      <p className="text-xs text-charcoal/60 mt-0.5">
                        {formatTime(apt.startTime)} - {formatTime(apt.endTime)}
                      </p>
                    )}
                  </div>
                  {/* Appointment Menu */}
                  <div className="relative opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAppointmentMenuOpen(appointmentMenuOpen === apt.id ? null : apt.id);
                        setSelectedAppointment(apt);
                      }}
                      className="p-0.5 hover:bg-white/50 rounded"
                    >
                      <MoreVertical className="w-3 h-3 text-charcoal/70" />
                    </button>
                    {appointmentMenuOpen === apt.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-charcoal/10 py-1 z-20 min-w-[120px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAppointmentMenuOpen(null);
                            onAppointmentClick(apt);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-charcoal hover:bg-charcoal/5"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAppointmentMenuOpen(null);
                            onCompleteAppointment(apt.id);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-green-600 hover:bg-green-50"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Complete
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAppointmentMenuOpen(null);
                            onMarkNoShow(apt.id);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-orange-600 hover:bg-orange-50"
                        >
                          <XCircle className="w-3 h-3" />
                          No Show
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAppointmentMenuOpen(null);
                            onCancelAppointment(apt.id);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {/* Status Badge */}
                {apt.status !== 'confirmed' && height >= 50 && (
                  <span
                    className={`absolute bottom-1 right-1 px-1 py-0.5 text-[10px] font-medium rounded ${getStatusColor(
                      apt.status
                    )}`}
                  >
                    {apt.status.replace('_', ' ')}
                  </span>
                )}
              </div>
            );
          });
        })}
      </div>

      {/* Click outside to close appointment menu */}
      {appointmentMenuOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setAppointmentMenuOpen(null)}
        />
      )}
    </div>
  );
}

function CalendarContent() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [showEditAppointment, setShowEditAppointment] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [appointmentMenuOpen, setAppointmentMenuOpen] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state for new/edit appointment
  const [appointmentForm, setAppointmentForm] = useState({
    clientId: '',
    serviceId: '',
    staffId: '',
    date: '',
    time: '',
    notes: '',
  });
  const [clientSearch, setClientSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // API hooks
  const {
    appointments,
    isLoading: appointmentsLoading,
    error: appointmentsError,
    fetchAppointments,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    completeAppointment,
    markNoShow,
  } = useAppointments();

  const { staff, isLoading: staffLoading, error: staffError, fetchStaff } = useStaff();
  const { clients, fetchClients } = useClients();
  const { services, isLoading: servicesLoading } = useServices();
  const { selectedLocationId, locations } = useLocationContext();

  // Get date range for current view
  const dateRange = useMemo(() => {
    const start = new Date(currentDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(currentDate);
    if (viewMode === 'week') {
      end.setDate(end.getDate() + 6);
    }
    end.setHours(23, 59, 59, 999);

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }, [currentDate, viewMode]);

  // Fetch appointments when date range or location changes
  useEffect(() => {
    fetchAppointments(dateRange, undefined, selectedLocationId || undefined);
  }, [dateRange, fetchAppointments, selectedLocationId]);

  // Fetch staff when location changes
  useEffect(() => {
    fetchStaff(selectedLocationId || undefined);
  }, [fetchStaff, selectedLocationId]);

  // Reset selected staff when staff list changes (e.g., location change)
  // This ensures all staff are visible by default after a location switch
  useEffect(() => {
    const staffArray = staff || [];
    if (staffArray.length > 0) {
      const currentStaffIds = staffArray.map((s) => s.id);
      // Check if selectedStaff has stale IDs not in current staff list
      // This happens when location changes and brings new staff
      const hasStaleIds = selectedStaff.some((id) => !currentStaffIds.includes(id));

      if (hasStaleIds || selectedStaff.length === 0) {
        setSelectedStaff(currentStaffIds);
      }
    }
  }, [staff, selectedStaff]);

  // Set default date in form
  useEffect(() => {
    setAppointmentForm((prev) => ({
      ...prev,
      date: currentDate.toISOString().split('T')[0],
    }));
  }, [currentDate]);

  // Debounced client search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (clientSearch) {
        fetchClients(clientSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [clientSearch, fetchClients]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const toggleStaffFilter = (staffId: string) => {
    setSelectedStaff((prev) =>
      prev.includes(staffId) ? prev.filter((id) => id !== staffId) : [...prev, staffId]
    );
  };

  const getStaffColor = (index: number) => {
    return staffColors[index % staffColors.length];
  };

  const getAppointmentPosition = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const startHour = start.getHours();
    const startMin = start.getMinutes();
    const endHour = end.getHours();
    const endMin = end.getMinutes();
    const top = (startHour - 8) * 80 + (startMin / 60) * 80;
    const height = ((endHour - startHour) * 60 + (endMin - startMin)) * (80 / 60);
    return { top, height };
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // Filter appointments for current day and selected staff
  const filteredAppointments = useMemo(() => {
    return (appointments || []).filter((apt) => {
      const aptDate = new Date(apt.startTime);
      const isSameDay =
        aptDate.getFullYear() === currentDate.getFullYear() &&
        aptDate.getMonth() === currentDate.getMonth() &&
        aptDate.getDate() === currentDate.getDate();

      const isStaffSelected = selectedStaff.includes(apt.staffId);

      const matchesSearch =
        !searchQuery ||
        apt.client?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.client?.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.service?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      return isSameDay && isStaffSelected && matchesSearch;
    });
  }, [appointments, currentDate, selectedStaff, searchQuery]);

  // Get filtered staff list
  const filteredStaff = useMemo(() => {
    return (staff || []).filter((s) => selectedStaff.includes(s.id));
  }, [staff, selectedStaff]);

  // Handle appointment form submission
  const handleCreateAppointment = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const selectedService = (services || []).find((s) => s.id === appointmentForm.serviceId);
      const startDateTime = new Date(`${appointmentForm.date}T${appointmentForm.time}`);
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + (selectedService?.durationMinutes || 60));

      const input: CreateAppointmentInput = {
        clientId: appointmentForm.clientId,
        staffId: appointmentForm.staffId,
        serviceId: appointmentForm.serviceId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        durationMinutes: selectedService?.durationMinutes || 60,
        price: selectedService?.price || 0,
        notes: appointmentForm.notes || undefined,
        source: 'manual',
      };

      await createAppointment(input);
      setShowNewAppointment(false);
      resetForm();
      await fetchAppointments(dateRange);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle appointment update
  const handleUpdateAppointment = async () => {
    if (!selectedAppointment) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const selectedService = (services || []).find((s) => s.id === appointmentForm.serviceId);
      const startDateTime = new Date(`${appointmentForm.date}T${appointmentForm.time}`);
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + (selectedService?.durationMinutes || 60));

      const input: UpdateAppointmentInput = {
        clientId: appointmentForm.clientId,
        staffId: appointmentForm.staffId,
        serviceId: appointmentForm.serviceId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        durationMinutes: selectedService?.durationMinutes || 60,
        price: selectedService?.price || 0,
        notes: appointmentForm.notes || undefined,
      };

      await updateAppointment(selectedAppointment.id, input);
      setShowEditAppointment(false);
      setSelectedAppointment(null);
      resetForm();
      await fetchAppointments(dateRange);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to update appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle appointment cancellation
  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      await cancelAppointment(appointmentId, { cancellationReason: 'Cancelled by staff' });
      setAppointmentMenuOpen(null);
      await fetchAppointments(dateRange);
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
    }
  };

  // Handle appointment completion
  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      await completeAppointment(appointmentId);
      setAppointmentMenuOpen(null);
      await fetchAppointments(dateRange);
    } catch (err) {
      console.error('Failed to complete appointment:', err);
    }
  };

  // Handle no-show
  const handleMarkNoShow = async (appointmentId: string) => {
    try {
      await markNoShow(appointmentId);
      setAppointmentMenuOpen(null);
      await fetchAppointments(dateRange);
    } catch (err) {
      console.error('Failed to mark no-show:', err);
    }
  };

  // Open edit modal
  const openEditModal = (appointment: Appointment) => {
    const startDate = new Date(appointment.startTime);
    setAppointmentForm({
      clientId: appointment.clientId,
      serviceId: appointment.serviceId,
      staffId: appointment.staffId,
      date: startDate.toISOString().split('T')[0],
      time: formatTime(appointment.startTime),
      notes: appointment.notes || '',
    });
    setSelectedAppointment(appointment);
    setShowEditAppointment(true);
    setAppointmentMenuOpen(null);
  };

  // Reset form
  const resetForm = () => {
    setAppointmentForm({
      clientId: '',
      serviceId: '',
      staffId: '',
      date: currentDate.toISOString().split('T')[0],
      time: '',
      notes: '',
    });
    setClientSearch('');
    setSubmitError(null);
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      case 'no_show':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const isLoading = appointmentsLoading || staffLoading || servicesLoading;
  const error = appointmentsError || staffError;

  return (
    <div className="min-h-screen bg-cream flex">
      <AppSidebar
        currentPage="calendar"
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
              <h1 className="text-2xl font-bold text-charcoal">Calendar</h1>
            </div>

            <div className="flex items-center gap-4">
              {locations.length > 1 && (
                <LocationSwitcher className="hidden sm:block" />
              )}
              <NotificationDropdown />
              <button
                onClick={() => {
                  resetForm();
                  setShowNewAppointment(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-all"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">New Appointment</span>
              </button>
            </div>
          </div>
        </header>

        {/* Calendar Controls */}
        <div className="bg-white border-b border-charcoal/10 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Date Navigation */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateDate('prev')}
                  className="p-2 rounded-lg border border-charcoal/10 hover:bg-charcoal/5 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-charcoal" />
                </button>
                <button
                  onClick={() => navigateDate('next')}
                  className="p-2 rounded-lg border border-charcoal/10 hover:bg-charcoal/5 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-charcoal" />
                </button>
              </div>
              <button
                onClick={goToToday}
                className="px-4 py-2 text-sm font-medium text-charcoal border border-charcoal/10 rounded-lg hover:bg-charcoal/5 transition-colors"
              >
                Today
              </button>
              <h2 className="text-lg font-semibold text-charcoal">{formatDate(currentDate)}</h2>
            </div>

            {/* View Toggle & Filters */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                <input
                  type="text"
                  placeholder="Search appointments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 rounded-lg border border-charcoal/10 text-sm focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-charcoal/5 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('day')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'day' ? 'bg-white text-charcoal shadow-sm' : 'text-charcoal/60'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Day
                </button>
                <button
                  onClick={() => setViewMode('week')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'week' ? 'bg-white text-charcoal shadow-sm' : 'text-charcoal/60'
                  }`}
                >
                  <List className="w-4 h-4" />
                  Week
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
              <button
                onClick={() => fetchAppointments(dateRange)}
                className="ml-auto text-sm font-medium underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Calendar Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Staff Filter Sidebar */}
          <div className="w-64 bg-white border-r border-charcoal/10 p-4 hidden xl:block">
            <h3 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Staff Filter
            </h3>
            {staffLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-sage" />
              </div>
            ) : (
              <div className="space-y-2">
                {(staff || []).map((staffMember, index) => (
                  <label
                    key={staffMember.id}
                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-charcoal/5 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStaff.includes(staffMember.id)}
                      onChange={() => toggleStaffFilter(staffMember.id)}
                      className="w-4 h-4 rounded border-charcoal/20 text-sage focus:ring-sage"
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getStaffColor(index) }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-charcoal text-sm truncate">
                        {staffMember.firstName} {staffMember.lastName}
                      </p>
                      <p className="text-xs text-charcoal/60 capitalize">{staffMember.role}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 overflow-auto bg-white">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-sage mx-auto mb-4" />
                  <p className="text-charcoal/60">Loading calendar...</p>
                </div>
              </div>
            ) : viewMode === 'day' ? (
              /* Day View */
              <div className="min-h-full">
                {/* Staff Headers */}
                <div className="sticky top-0 bg-white border-b border-charcoal/10 z-10 flex">
                  <div className="w-20 flex-shrink-0 p-4 border-r border-charcoal/10">
                    <Clock className="w-5 h-5 text-charcoal/40 mx-auto" />
                  </div>
                  {(filteredStaff || []).map((staffMember, index) => (
                    <div
                      key={staffMember.id}
                      className="flex-1 min-w-[200px] p-4 border-r border-charcoal/10 text-center"
                    >
                      <div
                        className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-semibold"
                        style={{ backgroundColor: getStaffColor(index) }}
                      >
                        {staffMember.firstName?.[0] || '?'}
                        {staffMember.lastName?.[0] || ''}
                      </div>
                      <p className="font-medium text-charcoal text-sm">
                        {staffMember.firstName} {staffMember.lastName}
                      </p>
                      <p className="text-xs text-charcoal/60 capitalize">{staffMember.role}</p>
                    </div>
                  ))}
                </div>

                {/* Time Grid */}
                <div className="relative">
                  {/* Background grid lines */}
                  {hours.map((hour) => (
                    <div key={hour} className="flex border-b border-charcoal/10" style={{ height: '80px' }}>
                      <div className="w-20 flex-shrink-0 p-2 text-sm text-charcoal/60 text-right border-r border-charcoal/10">
                        {hour.toString().padStart(2, '0')}:00
                      </div>
                      {(filteredStaff || []).map((staffMember) => (
                        <div
                          key={staffMember.id}
                          className="flex-1 min-w-[200px] border-r border-charcoal/10"
                        />
                      ))}
                    </div>
                  ))}

                  {/* Appointments overlay - positioned within staff columns */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {/* Time column spacer */}
                    <div className="w-20 flex-shrink-0" />

                    {/* Staff columns with their appointments */}
                    {(filteredStaff || []).map((staffMember, staffIndex) => (
                      <div key={staffMember.id} className="flex-1 min-w-[200px] relative">
                        {(filteredAppointments || [])
                          .filter((apt) => apt.staffId === staffMember.id)
                          .map((apt) => {
                            const { top, height } = getAppointmentPosition(apt.startTime, apt.endTime);

                            return (
                              <div
                                key={apt.id}
                                className="absolute rounded-lg p-3 cursor-pointer hover:shadow-lg transition-shadow overflow-hidden group pointer-events-auto"
                                style={{
                                  top: `${top}px`,
                                  left: '4px',
                                  right: '4px',
                                  height: `${Math.max(height, 40)}px`,
                                  backgroundColor: getStaffColor(staffIndex),
                                }}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-charcoal text-sm truncate">
                                      {apt.client
                                        ? `${apt.client.firstName} ${apt.client.lastName}`
                                        : 'Unknown Client'}
                                    </p>
                                    <p className="text-xs text-charcoal/70 truncate">
                                      {apt.service?.name || 'Unknown Service'}
                                    </p>
                                    <p className="text-xs text-charcoal/60 mt-1">
                                      {formatTime(apt.startTime)} - {formatTime(apt.endTime)}
                                    </p>
                                  </div>
                                  {/* Appointment Menu */}
                                  <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAppointmentMenuOpen(
                                          appointmentMenuOpen === apt.id ? null : apt.id
                                        );
                                      }}
                                      className="p-1 hover:bg-white/50 rounded"
                                    >
                                      <MoreVertical className="w-4 h-4 text-charcoal/70" />
                                    </button>
                                    {appointmentMenuOpen === apt.id && (
                                      <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-charcoal/10 py-1 z-20 min-w-[140px]">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openEditModal(apt);
                                          }}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-charcoal hover:bg-charcoal/5"
                                        >
                                          <Edit className="w-4 h-4" />
                                          Edit
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCompleteAppointment(apt.id);
                                          }}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50"
                                        >
                                          <CheckCircle className="w-4 h-4" />
                                          Complete
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleMarkNoShow(apt.id);
                                          }}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50"
                                        >
                                          <XCircle className="w-4 h-4" />
                                          No Show
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCancelAppointment(apt.id);
                                          }}
                                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                          Cancel
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {/* Status Badge */}
                                {apt.status !== 'confirmed' && (
                                  <span
                                    className={`absolute bottom-2 right-2 px-1.5 py-0.5 text-xs font-medium rounded ${getStatusColor(
                                      apt.status
                                    )}`}
                                  >
                                    {apt.status.replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Week View */
              <WeekView
                currentDate={currentDate}
                appointments={appointments}
                selectedStaff={selectedStaff}
                searchQuery={searchQuery}
                staff={staff}
                getStaffColor={getStaffColor}
                formatTime={formatTime}
                getAppointmentPosition={getAppointmentPosition}
                getStatusColor={getStatusColor}
                onAppointmentClick={(apt) => openEditModal(apt)}
                onCompleteAppointment={handleCompleteAppointment}
                onCancelAppointment={handleCancelAppointment}
                onMarkNoShow={handleMarkNoShow}
              />
            )}
          </div>
        </div>
      </main>

      {/* New Appointment Modal */}
      {showNewAppointment && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-charcoal/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-charcoal">New Appointment</h2>
              <button
                onClick={() => {
                  setShowNewAppointment(false);
                  resetForm();
                }}
                className="p-2 text-charcoal/40 hover:text-charcoal transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {submitError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {submitError}
                </div>
              )}

              {/* Client Selection */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Client</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40" />
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  />
                </div>
                {clientSearch && (clients || []).length > 0 && (
                  <div className="mt-2 border border-charcoal/10 rounded-xl max-h-40 overflow-auto">
                    {(clients || []).map((client) => (
                      <button
                        key={client.id}
                        onClick={() => {
                          setAppointmentForm((prev) => ({ ...prev, clientId: client.id }));
                          setClientSearch(`${client.firstName} ${client.lastName}`);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-charcoal/5 ${
                          appointmentForm.clientId === client.id ? 'bg-sage/10' : ''
                        }`}
                      >
                        <p className="font-medium text-charcoal">
                          {client.firstName} {client.lastName}
                        </p>
                        <p className="text-xs text-charcoal/60">{client.email || client.phone}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Service</label>
                <select
                  value={appointmentForm.serviceId}
                  onChange={(e) =>
                    setAppointmentForm((prev) => ({ ...prev, serviceId: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                >
                  <option value="">Select a service...</option>
                  {(services || []).map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {service.durationMinutes} min - ${service.price}
                    </option>
                  ))}
                </select>
              </div>

              {/* Staff Selection */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Staff Member</label>
                <select
                  value={appointmentForm.staffId}
                  onChange={(e) =>
                    setAppointmentForm((prev) => ({ ...prev, staffId: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                >
                  <option value="">Select staff...</option>
                  {(staff || []).map((staffMember) => (
                    <option key={staffMember.id} value={staffMember.id}>
                      {staffMember.firstName} {staffMember.lastName} - {staffMember.role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Date</label>
                  <input
                    type="date"
                    value={appointmentForm.date}
                    onChange={(e) =>
                      setAppointmentForm((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Time</label>
                  <select
                    value={appointmentForm.time}
                    onChange={(e) =>
                      setAppointmentForm((prev) => ({ ...prev, time: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  >
                    <option value="">Select time...</option>
                    {hours.map((hour) => (
                      <>
                        <option key={`${hour}:00`} value={`${hour.toString().padStart(2, '0')}:00`}>
                          {hour.toString().padStart(2, '0')}:00
                        </option>
                        <option key={`${hour}:30`} value={`${hour.toString().padStart(2, '0')}:30`}>
                          {hour.toString().padStart(2, '0')}:30
                        </option>
                      </>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Notes (optional)
                </label>
                <textarea
                  rows={3}
                  value={appointmentForm.notes}
                  onChange={(e) =>
                    setAppointmentForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Add any special notes..."
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-charcoal/10 flex gap-3">
              <button
                onClick={() => {
                  setShowNewAppointment(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-3 border border-charcoal/20 text-charcoal rounded-xl font-medium hover:bg-charcoal/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAppointment}
                disabled={
                  isSubmitting ||
                  !appointmentForm.clientId ||
                  !appointmentForm.serviceId ||
                  !appointmentForm.staffId ||
                  !appointmentForm.date ||
                  !appointmentForm.time
                }
                className="flex-1 px-4 py-3 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Booking...
                  </>
                ) : (
                  'Book Appointment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {showEditAppointment && selectedAppointment && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-charcoal/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-charcoal">Edit Appointment</h2>
              <button
                onClick={() => {
                  setShowEditAppointment(false);
                  setSelectedAppointment(null);
                  resetForm();
                }}
                className="p-2 text-charcoal/40 hover:text-charcoal transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {submitError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {submitError}
                </div>
              )}

              {/* Client (read-only for edit) */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Client</label>
                <input
                  type="text"
                  value={
                    selectedAppointment.client
                      ? `${selectedAppointment.client.firstName} ${selectedAppointment.client.lastName}`
                      : 'Unknown Client'
                  }
                  readOnly
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 bg-charcoal/5 text-charcoal/70"
                />
              </div>

              {/* Service Selection */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Service</label>
                <select
                  value={appointmentForm.serviceId}
                  onChange={(e) =>
                    setAppointmentForm((prev) => ({ ...prev, serviceId: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                >
                  <option value="">Select a service...</option>
                  {(services || []).map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} - {service.durationMinutes} min - ${service.price}
                    </option>
                  ))}
                </select>
              </div>

              {/* Staff Selection */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Staff Member</label>
                <select
                  value={appointmentForm.staffId}
                  onChange={(e) =>
                    setAppointmentForm((prev) => ({ ...prev, staffId: e.target.value }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                >
                  <option value="">Select staff...</option>
                  {(staff || []).map((staffMember) => (
                    <option key={staffMember.id} value={staffMember.id}>
                      {staffMember.firstName} {staffMember.lastName} - {staffMember.role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Date</label>
                  <input
                    type="date"
                    value={appointmentForm.date}
                    onChange={(e) =>
                      setAppointmentForm((prev) => ({ ...prev, date: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Time</label>
                  <select
                    value={appointmentForm.time}
                    onChange={(e) =>
                      setAppointmentForm((prev) => ({ ...prev, time: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  >
                    <option value="">Select time...</option>
                    {hours.map((hour) => (
                      <>
                        <option key={`${hour}:00`} value={`${hour.toString().padStart(2, '0')}:00`}>
                          {hour.toString().padStart(2, '0')}:00
                        </option>
                        <option key={`${hour}:30`} value={`${hour.toString().padStart(2, '0')}:30`}>
                          {hour.toString().padStart(2, '0')}:30
                        </option>
                      </>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Notes (optional)
                </label>
                <textarea
                  rows={3}
                  value={appointmentForm.notes}
                  onChange={(e) =>
                    setAppointmentForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Add any special notes..."
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-charcoal/10 flex gap-3">
              <button
                onClick={() => {
                  setShowEditAppointment(false);
                  setSelectedAppointment(null);
                  resetForm();
                }}
                className="flex-1 px-4 py-3 border border-charcoal/20 text-charcoal rounded-xl font-medium hover:bg-charcoal/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateAppointment}
                disabled={
                  isSubmitting ||
                  !appointmentForm.serviceId ||
                  !appointmentForm.staffId ||
                  !appointmentForm.date ||
                  !appointmentForm.time
                }
                className="flex-1 px-4 py-3 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Appointment'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close appointment menu */}
      {appointmentMenuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setAppointmentMenuOpen(null)} />
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <AuthGuard>
      <CalendarContent />
    </AuthGuard>
  );
}
