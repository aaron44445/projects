'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Menu,
  Calendar,
  DollarSign,
  Clock,
  Users,
  CheckCircle2,
  ChevronRight,
  CalendarOff,
  Loader2,
  AlertCircle,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import { EmptyState, Modal } from '@peacase/ui';
import { StaffAuthGuard } from '@/components/StaffAuthGuard';
import { StaffPortalSidebar } from '@/components/StaffPortalSidebar';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { api, ApiError } from '@/lib/api';
import { useTimeClock } from '@/hooks/useTimeClock';
import { formatInTimeZone } from 'date-fns-tz';
import { parseISO } from 'date-fns';

interface DashboardData {
  todayAppointments: {
    id: string;
    startTime: string;
    endTime: string;
    status: string;
    notes?: string;
    client: {
      id: string;
      firstName: string;
      lastName: string;
      phone?: string;
    };
    service: {
      id: string;
      name: string;
      durationMinutes: number;
      color?: string;
      price: number;
    };
    location?: {
      id: string;
      name: string;
    };
  }[];
  earnings: {
    commission: number;
    tips: number;
    total: number;
    period: {
      start: string;
      end: string;
    };
  };
  stats: {
    todayCount: number;
    weekCount: number;
  };
  staffCanViewClientContact: boolean;
  hasMultipleLocations: boolean;
}

function DashboardContent() {
  const { staff } = useStaffAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<DashboardData['todayAppointments'][0] | null>(null);

  // Time Clock state
  const {
    status: clockStatus,
    history: clockHistory,
    loading: clockLoading,
    historyLoading,
    clockIn,
    clockOut,
  } = useTimeClock();
  const [clockSubmitting, setClockSubmitting] = useState(false);
  const [clockError, setClockError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<DashboardData>('/staff-portal/dashboard');
      if (response.success && response.data) {
        setDashboardData(response.data);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load dashboard data');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-sage/20 text-sage-dark';
      case 'in-progress':
        return 'bg-amber-100 text-amber-700';
      case 'completed':
        return 'bg-emerald-100 text-emerald-700';
      case 'cancelled':
        return 'bg-rose-100 text-rose-700';
      default:
        return 'bg-charcoal/10 text-charcoal/60';
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const isPastAppointment = (startTime: string) => {
    return new Date(startTime) < new Date();
  };

  // Get primary location for clock in
  const primaryLocation = staff?.assignedLocations?.find(l => l.isPrimary) || staff?.assignedLocations?.[0];

  // Handle clock action (clock in or clock out)
  const handleClockAction = async () => {
    if (!primaryLocation) {
      setClockError('No assigned location');
      return;
    }

    setClockSubmitting(true);
    setClockError(null);
    try {
      if (clockStatus?.isClockedIn) {
        await clockOut();
      } else {
        await clockIn(primaryLocation.id);
      }
    } catch (err) {
      setClockError(err instanceof Error ? err.message : 'Failed to clock in/out');
    } finally {
      setClockSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex">
      <StaffPortalSidebar sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
                <h1 className="text-2xl font-bold text-charcoal">
                  {getGreeting()}, {staff?.firstName}
                </h1>
                <p className="text-sm text-charcoal/60">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            <Link
              href="/staff/time-off"
              className="flex items-center gap-2 px-4 py-2 border border-charcoal/20 text-charcoal rounded-xl font-medium hover:bg-charcoal/5 transition-colors"
            >
              <CalendarOff className="w-5 h-5" />
              <span className="hidden sm:inline">Request Time Off</span>
            </Link>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 p-6 overflow-auto">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-sage animate-spin mx-auto mb-4" />
                <p className="text-charcoal/60">Loading dashboard...</p>
              </div>
            </div>
          )}

          {error && !isLoading && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-4" />
              <p className="text-rose-700 font-medium mb-2">Failed to load dashboard</p>
              <p className="text-rose-600 text-sm mb-4">{error}</p>
              <button
                onClick={fetchDashboardData}
                className="px-4 py-2 bg-rose-100 text-rose-700 rounded-xl font-medium hover:bg-rose-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {!isLoading && !error && dashboardData && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Appointments Today */}
                <div className="bg-white rounded-2xl shadow-soft border border-charcoal/5 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-sage/20 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-sage" />
                    </div>
                    <span className="text-xs text-charcoal/50">Today</span>
                  </div>
                  <p className="text-2xl font-bold text-charcoal">
                    {dashboardData.stats.todayCount}
                  </p>
                  <p className="text-sm text-charcoal/60">Appointments</p>
                </div>

                {/* This Week */}
                <div className="bg-white rounded-2xl shadow-soft border border-charcoal/5 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-lavender/30 flex items-center justify-center">
                      <Users className="w-5 h-5 text-lavender-dark" />
                    </div>
                    <span className="text-xs text-charcoal/50">This Week</span>
                  </div>
                  <p className="text-2xl font-bold text-charcoal">
                    {dashboardData.stats.weekCount}
                  </p>
                  <p className="text-sm text-charcoal/60">Appointments</p>
                </div>

                {/* Completed Today */}
                <div className="bg-white rounded-2xl shadow-soft border border-charcoal/5 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-xs text-charcoal/50">Completed</span>
                  </div>
                  <p className="text-2xl font-bold text-charcoal">
                    {dashboardData.todayAppointments.filter(a => a.status === 'completed').length}
                  </p>
                  <p className="text-sm text-charcoal/60">Today</p>
                </div>

                {/* Monthly Earnings */}
                <div className="bg-white rounded-2xl shadow-soft border border-charcoal/5 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-amber-600" />
                    </div>
                    <span className="text-xs text-charcoal/50">This Month</span>
                  </div>
                  <p className="text-2xl font-bold text-charcoal">
                    {formatCurrency(dashboardData.earnings.total)}
                  </p>
                  <p className="text-sm text-charcoal/60">Total Earnings</p>
                </div>
              </div>

              {/* Time Clock Section */}
              <div className="bg-white rounded-2xl shadow-soft border border-charcoal/5 p-6">
                <h2 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-sage" />
                  Time Clock
                </h2>

                {clockLoading ? (
                  <div className="h-24 bg-cream/50 animate-pulse rounded-xl" />
                ) : (
                  <div className="text-center space-y-4">
                    {clockStatus?.isClockedIn && clockStatus.activeEntry ? (
                      <>
                        <div className="w-16 h-16 mx-auto rounded-full bg-sage/10 flex items-center justify-center">
                          <Clock className="w-8 h-8 text-sage animate-pulse" />
                        </div>
                        <div>
                          <p className="text-sm text-charcoal/60">Clocked in since</p>
                          <p className="text-2xl font-bold text-sage">
                            {formatInTimeZone(
                              parseISO(clockStatus.activeEntry.clockIn),
                              clockStatus.activeEntry.timezone || 'UTC',
                              'h:mm a'
                            )}
                          </p>
                          {clockStatus.activeEntry.locationName && (
                            <p className="text-sm text-charcoal/60">{clockStatus.activeEntry.locationName}</p>
                          )}
                        </div>
                        <button
                          onClick={handleClockAction}
                          disabled={clockSubmitting}
                          className="w-full px-6 py-3 bg-rose text-cream rounded-xl font-medium hover:bg-rose/90 transition-colors disabled:opacity-50"
                        >
                          {clockSubmitting ? 'Clocking out...' : 'Clock Out'}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 mx-auto rounded-full bg-sage/10 flex items-center justify-center">
                          <Clock className="w-8 h-8 text-sage" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-charcoal">Not clocked in</p>
                          <p className="text-sm text-charcoal/60">Tap below to start your shift</p>
                        </div>
                        <button
                          onClick={handleClockAction}
                          disabled={clockSubmitting || !primaryLocation}
                          className="w-full px-6 py-3 bg-sage text-cream rounded-xl font-medium hover:bg-sage/90 transition-colors disabled:opacity-50"
                        >
                          {clockSubmitting ? 'Clocking in...' : 'Clock In'}
                        </button>
                      </>
                    )}

                    {clockError && (
                      <div className="flex items-center gap-2 text-rose text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {clockError}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Time History Section */}
              <div className="bg-white rounded-2xl shadow-soft border border-charcoal/5 p-6">
                <h2 className="text-lg font-semibold text-charcoal mb-4">Recent Time Entries</h2>

                {historyLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-cream/50 animate-pulse rounded-xl" />
                    ))}
                  </div>
                ) : clockHistory.length === 0 ? (
                  <EmptyState
                    icon={Clock}
                    title="No time entries yet"
                    description="Your clock in/out history will appear here"
                  />
                ) : (
                  <div className="space-y-3">
                    {clockHistory.slice(0, 10).map((entry) => (
                      <div
                        key={entry.id}
                        className={`p-4 rounded-xl border ${
                          entry.isActive
                            ? 'bg-sage/5 border-sage/20'
                            : 'bg-cream/30 border-charcoal/5'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-charcoal">
                              {formatInTimeZone(
                                parseISO(entry.clockIn),
                                entry.timezone || 'UTC',
                                'MMM d, yyyy'
                              )}
                            </p>
                            <p className="text-sm text-charcoal/60">
                              {formatInTimeZone(
                                parseISO(entry.clockIn),
                                entry.timezone || 'UTC',
                                'h:mm a'
                              )}
                              {entry.clockOut ? (
                                <> - {formatInTimeZone(
                                  parseISO(entry.clockOut),
                                  entry.timezone || 'UTC',
                                  'h:mm a'
                                )}</>
                              ) : (
                                <span className="text-lavender ml-2">(active)</span>
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            {entry.durationMinutes ? (
                              <p className="font-medium text-charcoal">
                                {Math.floor(entry.durationMinutes / 60)}h {entry.durationMinutes % 60}m
                              </p>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-lavender/10 text-lavender">
                                In progress
                              </span>
                            )}
                            {entry.locationName && (
                              <p className="text-xs text-charcoal/50">{entry.locationName}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Today's Appointments */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-soft border border-charcoal/5">
                  <div className="p-5 border-b border-charcoal/10 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-charcoal">Today&apos;s Appointments</h2>
                      <p className="text-sm text-charcoal/60">
                        {dashboardData.todayAppointments.length} scheduled
                      </p>
                    </div>
                    <Link
                      href="/staff/schedule"
                      className="flex items-center gap-1 text-sage font-medium text-sm hover:text-sage-dark transition-colors"
                    >
                      View Schedule
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className="divide-y divide-charcoal/10">
                    {dashboardData.todayAppointments.length === 0 ? (
                      <EmptyState
                        icon={Calendar}
                        title="No appointments scheduled for today"
                        description="Enjoy your free time!"
                      />
                    ) : (
                      dashboardData.todayAppointments.map((appointment) => {
                        const isPast = isPastAppointment(appointment.startTime);
                        return (
                          <div
                            key={appointment.id}
                            onClick={() => setSelectedAppointment(appointment)}
                            className={`p-4 hover:bg-charcoal/5 transition-colors cursor-pointer ${
                              isPast ? 'opacity-50' : ''
                            }`}
                          >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-sage/10 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-sage" />
                              </div>
                              <div>
                                <p className="font-medium text-charcoal">
                                  {appointment.client.firstName} {appointment.client.lastName}
                                </p>
                                {/* Show phone if allowed */}
                                {dashboardData.staffCanViewClientContact && appointment.client.phone && (
                                  <p className="text-xs text-charcoal/50">{appointment.client.phone}</p>
                                )}
                                <p className="text-sm text-charcoal/60">
                                  {appointment.service.name}
                                </p>
                                {/* Location badge for multi-location staff */}
                                {dashboardData.hasMultipleLocations && appointment.location && (
                                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-lavender/20 text-lavender-dark rounded-full text-xs">
                                    <MapPin className="w-3 h-3" />
                                    {appointment.location.name}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-charcoal">
                                {formatTime(appointment.startTime)}
                              </p>
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(appointment.status)}`}
                              >
                                {appointment.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Earnings Summary */}
                <div className="bg-white rounded-2xl shadow-soft border border-charcoal/5">
                  <div className="p-5 border-b border-charcoal/10">
                    <h2 className="text-lg font-semibold text-charcoal">Earnings Summary</h2>
                    <p className="text-sm text-charcoal/60">This Month</p>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Commission */}
                    <div className="flex items-center justify-between p-4 bg-sage/10 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-sage/20 flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-sage" />
                        </div>
                        <span className="text-charcoal font-medium">Commission</span>
                      </div>
                      <span className="text-lg font-bold text-charcoal">
                        {formatCurrency(dashboardData.earnings.commission)}
                      </span>
                    </div>

                    {/* Tips */}
                    <div className="flex items-center justify-between p-4 bg-lavender/10 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-lavender/30 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-lavender-dark" />
                        </div>
                        <span className="text-charcoal font-medium">Tips</span>
                      </div>
                      <span className="text-lg font-bold text-charcoal">
                        {formatCurrency(dashboardData.earnings.tips)}
                      </span>
                    </div>

                    {/* Total */}
                    <div className="pt-4 border-t border-charcoal/10">
                      <div className="flex items-center justify-between">
                        <span className="text-charcoal font-semibold">Total</span>
                        <span className="text-2xl font-bold text-sage">
                          {formatCurrency(dashboardData.earnings.total)}
                        </span>
                      </div>
                    </div>

                    <Link
                      href="/staff/earnings"
                      className="flex items-center justify-center gap-2 w-full mt-4 py-3 border border-sage text-sage rounded-xl font-medium hover:bg-sage/5 transition-colors"
                    >
                      View Detailed Earnings
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Appointment Detail Modal */}
        <Modal
          isOpen={!!selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          title="Appointment Details"
          size="md"
        >
          {selectedAppointment && (
            <div className="space-y-4">
              {/* Time */}
              <div className="flex items-center gap-3 p-4 bg-sage/10 rounded-xl">
                <Clock className="w-5 h-5 text-sage" />
                <div>
                  <p className="font-medium text-charcoal">
                    {formatTime(selectedAppointment.startTime)} - {formatTime(selectedAppointment.endTime)}
                  </p>
                  <p className="text-sm text-charcoal/60">
                    {new Date(selectedAppointment.startTime).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {/* Client */}
              <div className="p-4 border border-charcoal/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-lavender/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-lavender-dark" />
                  </div>
                  <div>
                    <p className="font-medium text-charcoal">
                      {selectedAppointment.client.firstName} {selectedAppointment.client.lastName}
                    </p>
                    {dashboardData?.staffCanViewClientContact && selectedAppointment.client.phone && (
                      <p className="text-sm text-charcoal/60">{selectedAppointment.client.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Service */}
              <div className="p-4 border border-charcoal/10 rounded-xl">
                <p className="text-sm text-charcoal/60 mb-2">Service</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-charcoal">{selectedAppointment.service.name}</p>
                    {selectedAppointment.service.durationMinutes && (
                      <p className="text-sm text-charcoal/60">
                        {selectedAppointment.service.durationMinutes} minutes
                      </p>
                    )}
                  </div>
                  <p className="font-semibold text-sage">
                    {formatCurrency(selectedAppointment.service.price)}
                  </p>
                </div>
              </div>

              {/* Location (if multi-location) */}
              {dashboardData?.hasMultipleLocations && selectedAppointment.location && (
                <div className="p-4 border border-charcoal/10 rounded-xl">
                  <p className="text-sm text-charcoal/60 mb-1">Location</p>
                  <p className="font-medium text-charcoal flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-charcoal/40" />
                    {selectedAppointment.location.name}
                  </p>
                </div>
              )}

              {/* Notes (if any) */}
              {selectedAppointment.notes && (
                <div className="p-4 border border-charcoal/10 rounded-xl">
                  <p className="text-sm text-charcoal/60 mb-1">Notes</p>
                  <p className="text-charcoal">{selectedAppointment.notes}</p>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-charcoal/60">Status</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(selectedAppointment.status)}`}
                >
                  {selectedAppointment.status}
                </span>
              </div>
            </div>
          )}
        </Modal>
      </main>
    </div>
  );
}

export default function StaffDashboardPage() {
  return (
    <StaffAuthGuard>
      <DashboardContent />
    </StaffAuthGuard>
  );
}
