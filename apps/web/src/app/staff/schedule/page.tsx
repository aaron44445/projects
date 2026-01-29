'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Menu,
  Calendar,
  Clock,
  MapPin,
  Scissors,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Save,
  X,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  User,
} from 'lucide-react';
import { StaffAuthGuard } from '@/components/StaffAuthGuard';
import { StaffPortalSidebar } from '@/components/StaffPortalSidebar';
import { useStaffSchedule, useTimeOff, useStaffAppointments, TimeOffRequest } from '@/hooks/useStaffPortal';
import { Modal } from '@peacase/ui';
import { STATUS_COLORS } from '@/lib/statusColors';

// Time off status colors - maps time off statuses to centralized design tokens
// pending: uses lavender (waiting state)
// approved: uses confirmed/sage (success state)
// rejected: uses cancelled/rose (negative state)
function getTimeOffStatusClasses(status: 'pending' | 'approved' | 'rejected'): string {
  const statusMap: Record<string, keyof typeof STATUS_COLORS> = {
    pending: 'pending',
    approved: 'confirmed',
    rejected: 'cancelled',
  };
  const colors = STATUS_COLORS[statusMap[status]];
  return `${colors.bg} ${colors.text}`;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6; // 6am to 7pm
  const min = (i % 2) * 30;
  return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
});

// Helper function to format time to 12-hour
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

function ScheduleContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { schedule, assignments, loading, error, updateSchedule } = useStaffSchedule();
  const { timeOffs, loading: timeOffLoading, createTimeOff, cancelTimeOff } = useTimeOff();

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedSchedule, setEditedSchedule] = useState<Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isWorking: boolean;
  }>>([]);
  const [showTimeOffModal, setShowTimeOffModal] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Set default location when schedule loads
  useEffect(() => {
    if (schedule?.locations && schedule.locations.length > 0 && !selectedLocationId) {
      const primary = schedule.locations.find(l => l.isPrimary);
      setSelectedLocationId(primary?.id || schedule.locations[0].id);
    }
  }, [schedule, selectedLocationId]);

  // Get current location's schedule
  const currentSchedule = selectedLocationId && schedule?.scheduleByLocation
    ? schedule.scheduleByLocation[selectedLocationId]?.schedule || []
    : [];

  // Initialize edit mode
  const startEdit = () => {
    setEditedSchedule(currentSchedule.map(s => ({
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime || '09:00',
      endTime: s.endTime || '17:00',
      isWorking: s.isAvailable,
    })));
    setEditMode(true);
    setSaveMessage(null);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditedSchedule([]);
    setSaveMessage(null);
  };

  const saveSchedule = async () => {
    const result = await updateSchedule(selectedLocationId, editedSchedule);
    if (result.success) {
      setEditMode(false);
      if (result.pendingApproval) {
        setSaveMessage('Changes submitted for manager approval');
      } else {
        setSaveMessage('Schedule saved successfully');
      }
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

  const updateDay = (dayOfWeek: number, updates: Partial<typeof editedSchedule[0]>) => {
    setEditedSchedule(prev => prev.map(s =>
      s.dayOfWeek === dayOfWeek ? { ...s, ...updates } : s
    ));
  };

  // Calculate total hours
  const calculateTotalHours = (sched: Array<{ startTime: string; endTime: string; isWorking?: boolean; isAvailable?: boolean }>) => {
    return sched
      .filter(s => s.isWorking || s.isAvailable)
      .reduce((total, s) => {
        const [startH, startM] = (s.startTime || '09:00').split(':').map(Number);
        const [endH, endM] = (s.endTime || '17:00').split(':').map(Number);
        return total + (endH + endM / 60) - (startH + startM / 60);
      }, 0);
  };

  const totalHours = editMode
    ? calculateTotalHours(editedSchedule)
    : calculateTotalHours(currentSchedule);

  if (loading && !schedule) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-sage animate-spin mx-auto mb-4" />
          <p className="text-charcoal/60">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex">
      <StaffPortalSidebar sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-charcoal/10 px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-charcoal/60 hover:text-charcoal lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-charcoal">My Schedule</h1>
              <p className="text-sm text-charcoal/60">Manage your working hours, assignments, and time off</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Location Selector */}
          {schedule?.locations && schedule.locations.length > 1 && (
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-charcoal/60" />
              <select
                value={selectedLocationId || ''}
                onChange={(e) => {
                  setSelectedLocationId(e.target.value);
                  setEditMode(false);
                }}
                className="px-4 py-2 rounded-lg border border-charcoal/20 bg-white text-charcoal"
              >
                {schedule.locations.map(loc => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.isPrimary ? '(Primary)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Success Message */}
          {saveMessage && (
            <div className="p-4 bg-sage/10 border border-sage/20 rounded-xl text-sage flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              {saveMessage}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-rose/10 border border-rose/20 rounded-xl text-rose-dark flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {/* Working Hours Section */}
          <div className="bg-white rounded-2xl border border-charcoal/10 overflow-hidden shadow-soft">
            <div className="p-4 border-b border-charcoal/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-sage" />
                <h2 className="font-semibold text-charcoal">My Working Hours</h2>
              </div>
              {!editMode ? (
                <button
                  onClick={startEdit}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-sage hover:bg-sage/10 rounded-lg transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-charcoal/60 hover:bg-charcoal/5 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={saveSchedule}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-sage hover:bg-sage-dark rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 space-y-3">
              {DAYS.map((day, index) => {
                const editedDaySchedule = editedSchedule.find(s => s.dayOfWeek === index);
                const currentDaySchedule = currentSchedule.find(s => s.dayOfWeek === index);

                const isWorking = editMode
                  ? editedDaySchedule?.isWorking
                  : currentDaySchedule?.isAvailable;
                const startTime = editMode
                  ? editedDaySchedule?.startTime || '09:00'
                  : currentDaySchedule?.startTime || '09:00';
                const endTime = editMode
                  ? editedDaySchedule?.endTime || '17:00'
                  : currentDaySchedule?.endTime || '17:00';

                return (
                  <div key={day} className="flex items-center gap-4 py-2">
                    <span className="w-28 text-sm font-medium text-charcoal">{day}</span>

                    {editMode ? (
                      <>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isWorking}
                            onChange={(e) => updateDay(index, { isWorking: e.target.checked })}
                            className="rounded border-charcoal/20 text-sage focus:ring-sage"
                          />
                          <span className="text-sm text-charcoal/60">Working</span>
                        </label>
                        {isWorking && (
                          <>
                            <select
                              value={startTime}
                              onChange={(e) => updateDay(index, { startTime: e.target.value })}
                              className="px-3 py-1.5 rounded-lg border border-charcoal/20 text-sm"
                            >
                              {TIME_OPTIONS.map(t => (
                                <option key={t} value={t}>{formatTime(t)}</option>
                              ))}
                            </select>
                            <span className="text-charcoal/40">to</span>
                            <select
                              value={endTime}
                              onChange={(e) => updateDay(index, { endTime: e.target.value })}
                              className="px-3 py-1.5 rounded-lg border border-charcoal/20 text-sm"
                            >
                              {TIME_OPTIONS.map(t => (
                                <option key={t} value={t}>{formatTime(t)}</option>
                              ))}
                            </select>
                          </>
                        )}
                      </>
                    ) : (
                      <span className={`text-sm ${isWorking ? 'text-charcoal' : 'text-charcoal/40'}`}>
                        {isWorking ? `${formatTime(startTime)} - ${formatTime(endTime)}` : 'OFF'}
                      </span>
                    )}
                  </div>
                );
              })}

              <div className="pt-3 mt-3 border-t border-charcoal/10">
                <span className="text-sm text-charcoal/60">
                  Total: <strong className="text-charcoal">{totalHours.toFixed(1)} hours/week</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Assignments Section */}
          {assignments && (
            <div className="bg-white rounded-2xl border border-charcoal/10 overflow-hidden shadow-soft">
              <div className="p-4 border-b border-charcoal/10">
                <h2 className="font-semibold text-charcoal">My Assignments</h2>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-sm text-charcoal/60 mb-2">
                    <MapPin className="w-4 h-4" />
                    Locations
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {assignments.locations.length > 0 ? (
                      assignments.locations.map(loc => (
                        <span
                          key={loc.id}
                          className="px-3 py-1.5 bg-sage/10 text-sage rounded-full text-sm"
                        >
                          {loc.name}
                          {loc.isPrimaryForStaff && ' (Primary)'}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-charcoal/40">No locations assigned</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-sm text-charcoal/60 mb-2">
                    <Scissors className="w-4 h-4" />
                    Services
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {assignments.services.length > 0 ? (
                      assignments.services.map(svc => (
                        <span
                          key={svc.id}
                          className="px-3 py-1.5 bg-lavender/20 text-charcoal rounded-full text-sm"
                        >
                          {svc.name} (${svc.price})
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-charcoal/40">
                        No services assigned. Contact your manager.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Time Off Section */}
          <div className="bg-white rounded-2xl border border-charcoal/10 overflow-hidden shadow-soft">
            <div className="p-4 border-b border-charcoal/10 flex items-center justify-between">
              <h2 className="font-semibold text-charcoal">Time Off</h2>
              <button
                onClick={() => setShowTimeOffModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-sage hover:bg-sage-dark rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Request Time Off
              </button>
            </div>
            <div className="p-4">
              {timeOffs && timeOffs.length > 0 ? (
                <div className="space-y-3">
                  {timeOffs.slice(0, 5).map(request => (
                    <TimeOffRow key={request.id} request={request} onCancel={cancelTimeOff} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-charcoal/40">No time off requests</p>
              )}
            </div>
          </div>

          {/* Appointments Calendar */}
          <AppointmentsCalendar />
        </div>
      </main>

      {/* Time Off Request Modal */}
      <TimeOffRequestModal
        isOpen={showTimeOffModal}
        onClose={() => setShowTimeOffModal(false)}
        onSubmit={async (data) => {
          await createTimeOff(data);
          setShowTimeOffModal(false);
        }}
        loading={timeOffLoading}
      />
    </div>
  );
}

// Time Off Row Component
function TimeOffRow({ request, onCancel }: { request: TimeOffRequest; onCancel: (id: string) => void }) {
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric'
  });

  const StatusIcon = {
    pending: AlertCircle,
    approved: CheckCircle2,
    rejected: XCircle,
  }[request.status] || AlertCircle;

  // Get status icon color based on status
  const getStatusIconColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-sage-dark';
      case 'rejected': return 'text-rose-dark';
      default: return 'text-lavender-dark';
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-charcoal/5 rounded-lg">
      <div className="flex items-center gap-3">
        <StatusIcon className={`w-5 h-5 ${getStatusIconColor(request.status)}`} />
        <div>
          <p className="text-sm font-medium text-charcoal">
            {formatDate(request.startDate)}
            {request.startDate !== request.endDate && ` - ${formatDate(request.endDate)}`}
          </p>
          <p className="text-xs text-charcoal/60 capitalize">{request.type}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`px-2 py-1 text-xs rounded-full ${getTimeOffStatusClasses(request.status as 'pending' | 'approved' | 'rejected')}`}>
          {request.status}
        </span>
        {request.status === 'pending' && (
          <button
            onClick={() => onCancel(request.id)}
            className="text-xs text-rose-dark hover:text-rose"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

// Time Off Request Modal Component
function TimeOffRequestModal({
  isOpen,
  onClose,
  onSubmit,
  loading
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { startDate: string; endDate: string; type: 'vacation' | 'sick' | 'personal' | 'other'; reason?: string }) => Promise<void>;
  loading: boolean;
}) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState<'vacation' | 'sick' | 'personal' | 'other'>('vacation');
  const [reason, setReason] = useState('');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ startDate, endDate: endDate || startDate, type, reason: reason || undefined });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Time Off" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-charcoal/60 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={minDate}
              required
              className="w-full px-3 py-2 rounded-lg border border-charcoal/20"
            />
          </div>
          <div>
            <label className="block text-sm text-charcoal/60 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || minDate}
              className="w-full px-3 py-2 rounded-lg border border-charcoal/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-charcoal/60 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'vacation' | 'sick' | 'personal' | 'other')}
            className="w-full px-3 py-2 rounded-lg border border-charcoal/20"
          >
            <option value="vacation">Vacation</option>
            <option value="sick">Sick</option>
            <option value="personal">Personal</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-charcoal/60 mb-1">Reason (optional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-charcoal/20 resize-none"
            placeholder="Add a note for your manager..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-charcoal/60 hover:bg-charcoal/5 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !startDate}
            className="px-4 py-2 bg-sage text-white rounded-lg hover:bg-sage-dark disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Appointments Calendar Component
function AppointmentsCalendar() {
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    return new Date(today.setDate(diff));
  });

  const { appointments, isLoading, fetchAppointments } = useStaffAppointments();

  useEffect(() => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    fetchAppointments(weekStart.toISOString().split('T')[0], weekEnd.toISOString().split('T')[0]);
  }, [weekStart, fetchAppointments]);

  const prevWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() - 7);
    setWeekStart(newStart);
  };

  const nextWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + 7);
    setWeekStart(newStart);
  };

  const goToToday = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day;
    setWeekStart(new Date(today.setDate(diff)));
  };

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      return date;
    });
  }, [weekStart]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="bg-white rounded-2xl border border-charcoal/10 overflow-hidden shadow-soft">
      <div className="p-4 border-b border-charcoal/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-sage" />
          <h2 className="font-semibold text-charcoal">My Appointments</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToToday} className="px-3 py-1.5 text-sm text-sage hover:bg-sage/10 rounded-lg">
            Today
          </button>
          <button onClick={prevWeek} className="p-1.5 hover:bg-charcoal/5 rounded-lg">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={nextWeek} className="p-1.5 hover:bg-charcoal/5 rounded-lg">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-charcoal/10">
        {weekDays.map((date, i) => (
          <div
            key={i}
            className={`p-2 text-center border-r border-charcoal/10 last:border-r-0 ${
              isToday(date) ? 'bg-sage/10' : ''
            }`}
          >
            <p className="text-xs text-charcoal/60">{DAYS[date.getDay()].slice(0, 3)}</p>
            <p className={`text-sm font-medium ${isToday(date) ? 'text-sage' : 'text-charcoal'}`}>
              {date.getDate()}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 min-h-[200px]">
        {weekDays.map((date, i) => {
          const dateStr = date.toISOString().split('T')[0];
          const dayAppointments = appointments?.filter(apt =>
            apt.startTime.startsWith(dateStr)
          ) || [];

          return (
            <div key={i} className={`border-r border-charcoal/10 last:border-r-0 p-2 space-y-1 ${
              isToday(date) ? 'bg-sage/5' : ''
            }`}>
              {dayAppointments.length === 0 ? (
                <p className="text-xs text-charcoal/30 text-center mt-4">No appointments</p>
              ) : (
                dayAppointments.map(apt => (
                  <div
                    key={apt.id}
                    className="p-2 rounded-lg text-xs bg-lavender/20"
                  >
                    <p className="font-medium truncate text-charcoal">
                      {apt.client?.firstName || 'Client'}
                    </p>
                    <p className="text-charcoal/60">
                      {new Date(apt.startTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="truncate text-charcoal/50">{apt.service?.name}</p>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>

      {isLoading && (
        <div className="p-4 text-center text-charcoal/40 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading appointments...
        </div>
      )}
    </div>
  );
}

export default function StaffSchedulePage() {
  return (
    <StaffAuthGuard>
      <ScheduleContent />
    </StaffAuthGuard>
  );
}
