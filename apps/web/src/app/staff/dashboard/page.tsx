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
import { StaffAuthGuard } from '@/components/StaffAuthGuard';
import { StaffPortalSidebar } from '@/components/StaffPortalSidebar';
import { useStaffAuth } from '@/contexts/StaffAuthContext';
import { api, ApiError } from '@/lib/api';

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
                      <div className="p-8 text-center">
                        <Calendar className="w-12 h-12 text-charcoal/20 mx-auto mb-3" />
                        <p className="text-charcoal/60">No appointments scheduled for today</p>
                        <p className="text-sm text-charcoal/40 mt-1">Enjoy your free time!</p>
                      </div>
                    ) : (
                      dashboardData.todayAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="p-4 hover:bg-charcoal/5 transition-colors"
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
                      ))
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
