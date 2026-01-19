'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Menu,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  UserCheck,
  CalendarCheck,
  ChevronRight,
  MoreHorizontal,
  X,
  Calendar,
  Users,
  Scissors,
  BarChart3,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useSubscription, ADD_ON_DETAILS, AddOnId } from '@/contexts/SubscriptionContext';
import { AppSidebar } from '@/components/AppSidebar';
import { AuthGuard } from '@/components/AuthGuard';
import { useDashboard, useSetupProgress } from '@/hooks';

const statusColors: Record<string, string> = {
  scheduled: 'bg-sage/20 text-sage-dark border border-sage/30',
  confirmed: 'bg-sage/20 text-sage-dark border border-sage/30',
  'in-progress': 'bg-lavender/20 text-lavender-dark border border-lavender/30',
  completed: 'bg-mint/20 text-mint-dark border border-mint/30',
  cancelled: 'bg-rose/20 text-rose-dark border border-rose/30',
  'no-show': 'bg-rose/20 text-rose-dark border border-rose/30',
};

// Fallback static data for when API is not available
const fallbackStats = [
  {
    label: "Today's Revenue",
    value: '$0',
    change: '0%',
    trend: 'up' as const,
    icon: DollarSign,
    bgColor: 'bg-sage',
  },
  {
    label: 'Appointments Today',
    value: '0',
    change: '0',
    trend: 'up' as const,
    icon: CalendarCheck,
    bgColor: 'bg-lavender',
  },
  {
    label: 'New Clients',
    value: '0',
    change: '0',
    trend: 'up' as const,
    icon: UserCheck,
    bgColor: 'bg-peach',
  },
  {
    label: 'Monthly Revenue',
    value: '$0',
    change: '0%',
    trend: 'up' as const,
    icon: Clock,
    bgColor: 'bg-mint',
  },
];

const recentActivity = [
  { id: '1', action: 'New booking', detail: 'Sarah Johnson booked Haircut & Style', time: '5 min ago' },
  { id: '2', action: 'Payment received', detail: '$85 from Michael Chen', time: '12 min ago' },
  { id: '3', action: 'New client', detail: 'Robert Wilson signed up', time: '25 min ago' },
  { id: '4', action: 'Review received', detail: '5 stars from Emily Davis', time: '1 hour ago' },
];

function DashboardContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState<AddOnId | null>(null);
  const [showHoursSetup, setShowHoursSetup] = useState(false);
  const [showServiceSetup, setShowServiceSetup] = useState(false);
  const { activeAddOns, trialEndsAt, isTrialActive, monthlyTotal } = useSubscription();
  const { stats, todayAppointments, loading, error, refetch } = useDashboard();
  const { progress, completedCount, totalSteps, percentComplete } = useSetupProgress();

  // Format time from ISO string
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Calculate duration between two times
  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
    return `${diffMinutes} min`;
  };

  // Build stats array from API data
  const displayStats = stats
    ? [
        {
          label: "Today's Revenue",
          value: `$${stats.todayRevenue?.toLocaleString() ?? 0}`,
          change: stats.revenueChange || '+0%',
          trend: (stats.revenueChange?.startsWith('-') ? 'down' : 'up') as 'up' | 'down',
          icon: DollarSign,
          bgColor: 'bg-sage',
        },
        {
          label: 'Appointments Today',
          value: String(stats.todayAppointments ?? 0),
          change: '+0',
          trend: 'up' as const,
          icon: CalendarCheck,
          bgColor: 'bg-lavender',
        },
        {
          label: 'New Clients',
          value: String(stats.newClients ?? 0),
          change: `+${stats.clientsChange ?? 0}`,
          trend: ((stats.clientsChange ?? 0) >= 0 ? 'up' : 'down') as 'up' | 'down',
          icon: UserCheck,
          bgColor: 'bg-peach',
        },
        {
          label: 'Monthly Revenue',
          value: `$${stats.monthRevenue?.toLocaleString() ?? 0}`,
          change: stats.revenueChange || '+0%',
          trend: (stats.revenueChange?.startsWith('-') ? 'down' : 'up') as 'up' | 'down',
          icon: Clock,
          bgColor: 'bg-mint',
        },
      ]
    : fallbackStats;

  return (
    <div className="min-h-screen bg-cream flex">
      <AppSidebar
        currentPage="dashboard"
        sidebarOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-charcoal/60 hover:text-charcoal lg:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-charcoal">Dashboard</h1>
                <p className="text-sm text-charcoal/60">Welcome back</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => refetch()}
                className="p-2 text-charcoal/60 hover:text-charcoal"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button className="p-2 text-charcoal/60 hover:text-charcoal relative">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full border-2 border-white" />
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 p-6 overflow-auto">
          {/* Error State */}
          {error && (
            <div className="mb-6 p-4 bg-rose/10 border border-rose/20 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose flex-shrink-0" />
              <div className="flex-1">
                <p className="text-charcoal font-medium">Failed to load dashboard data</p>
                <p className="text-sm text-charcoal/60">{error}</p>
              </div>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-white border border-charcoal/20 rounded-lg text-sm font-medium hover:bg-charcoal/5"
              >
                Retry
              </button>
            </div>
          )}

          {/* Welcome Banner - Setup Progress */}
          {progress && !progress.completedAt && (
            <div className="mb-6 bg-white rounded-2xl border border-border shadow-soft p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-sage/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-sage" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-charcoal mb-1">
                    Welcome to Peacase!
                  </h2>
                  <p className="text-charcoal/60 mb-4">
                    Complete your setup to start accepting bookings.
                  </p>
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-charcoal/60">
                        {completedCount} of {totalSteps} steps complete
                      </span>
                      <span className="font-medium text-sage">{percentComplete}%</span>
                    </div>
                    <div className="h-2 bg-charcoal/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sage rounded-full transition-all duration-500"
                        style={{ width: `${percentComplete}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {!progress.businessHours && (
                      <button
                        onClick={() => setShowHoursSetup(true)}
                        className="px-4 py-2 bg-sage text-white rounded-lg text-sm font-medium hover:bg-sage-dark transition-colors"
                      >
                        Set Business Hours
                      </button>
                    )}
                    {!progress.firstService && progress.businessHours && (
                      <button
                        onClick={() => setShowServiceSetup(true)}
                        className="px-4 py-2 bg-sage text-white rounded-lg text-sm font-medium hover:bg-sage-dark transition-colors"
                      >
                        Add First Service
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {loading && !stats ? (
              // Loading skeleton for stats
              [...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 border border-border shadow-soft animate-pulse"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-charcoal/10 rounded-xl" />
                    <div className="w-12 h-4 bg-charcoal/10 rounded" />
                  </div>
                  <div className="w-20 h-8 bg-charcoal/10 rounded mb-2" />
                  <div className="w-24 h-4 bg-charcoal/10 rounded" />
                </div>
              ))
            ) : (
              displayStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="bg-white rounded-2xl p-6 border border-border shadow-soft hover:shadow-card transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div
                        className={`flex items-center gap-1 text-sm font-semibold ${
                          stat.trend === 'up' ? 'text-success' : 'text-error'
                        }`}
                      >
                        {stat.trend === 'up' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {stat.change}
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-charcoal mb-1">{stat.value}</p>
                    <p className="text-sm text-charcoal/60 font-medium">{stat.label}</p>
                  </div>
                );
              })
            )}
          </div>

          {/* Active Add-ons Section */}
          {activeAddOns.length > 0 && (
            <div className="mb-8">
              {/* Trial Banner */}
              {isTrialActive && trialEndsAt && (
                <div className="bg-gradient-to-r from-sage/10 to-lavender/10 rounded-2xl p-4 mb-6 border border-sage/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-sage" />
                      <div>
                        <p className="font-medium text-charcoal">14-Day Free Trial Active</p>
                        <p className="text-sm text-charcoal/60">
                          Trial ends {trialEndsAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - ${monthlyTotal}/month after
                        </p>
                      </div>
                    </div>
                    <Link
                      href="/settings?tab=billing"
                      className="text-sm text-sage hover:text-sage-dark font-medium"
                    >
                      Manage Billing
                    </Link>
                  </div>
                </div>
              )}

              {/* Your Add-ons */}
              <div className="bg-white rounded-2xl border border-border shadow-soft">
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-charcoal">Your Add-ons</h2>
                    <p className="text-sm text-charcoal/60">Set up your features to get the most out of Peacase</p>
                  </div>
                  <Link
                    href="/settings?tab=subscription"
                    className="text-sm text-sage hover:text-sage-dark font-medium flex items-center gap-1"
                  >
                    Manage Add-ons <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {activeAddOns.map((addOnId) => {
                    const addOn = ADD_ON_DETAILS[addOnId];
                    if (!addOn) return null;
                    const Icon = Sparkles;
                    return (
                      <button
                        key={addOnId}
                        onClick={() => setShowSetupGuide(addOnId)}
                        className="p-4 rounded-xl bg-cream/50 border border-charcoal/5 hover:border-sage/30 hover:bg-sage/5 transition-all text-left group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-sage/20 flex items-center justify-center group-hover:bg-sage group-hover:text-white transition-colors">
                            <Icon className="w-5 h-5 text-sage group-hover:text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-charcoal">{addOn.name}</p>
                            <p className="text-xs text-sage mt-1">View Setup Guide</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Setup Guide Modal */}
          {showSetupGuide && ADD_ON_DETAILS[showSetupGuide] && (
            <>
              <div
                className="fixed inset-0 bg-charcoal/50 z-40"
                onClick={() => setShowSetupGuide(null)}
              />
              <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 overflow-auto">
                <div className="sticky top-0 bg-white border-b border-charcoal/10 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-charcoal">
                    {ADD_ON_DETAILS[showSetupGuide].name} Setup
                  </h2>
                  <button
                    onClick={() => setShowSetupGuide(null)}
                    className="p-2 text-charcoal/40 hover:text-charcoal transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  <div className="bg-sage/10 rounded-xl p-4">
                    <p className="text-charcoal">{ADD_ON_DETAILS[showSetupGuide].description}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-charcoal mb-4">How to set up</h3>
                    <div className="space-y-4">
                      {ADD_ON_DETAILS[showSetupGuide].setupSteps.map((step, index) => (
                        <div key={index} className="flex gap-4">
                          <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-sage">{index + 1}</span>
                          </div>
                          <div className="flex-1 pt-1">
                            <p className="text-charcoal">{step}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Link
                    href={ADD_ON_DETAILS[showSetupGuide].helpUrl}
                    onClick={() => setShowSetupGuide(null)}
                    className="block w-full py-3 bg-sage text-white rounded-xl font-semibold text-center hover:bg-sage-dark transition-all"
                  >
                    Go to Settings
                  </Link>
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Today's Appointments */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-border shadow-soft">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-semibold text-charcoal">Today&apos;s Schedule</h2>
                <Link
                  href="/calendar"
                  className="text-sm text-sage hover:text-sage-dark font-medium flex items-center gap-1"
                >
                  View Calendar <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="divide-y divide-border">
                {loading && todayAppointments.length === 0 ? (
                  // Loading skeleton for appointments
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="p-4 animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="w-[70px]">
                          <div className="w-16 h-4 bg-charcoal/10 rounded mb-1" />
                          <div className="w-12 h-3 bg-charcoal/10 rounded" />
                        </div>
                        <div className="flex-1">
                          <div className="w-32 h-4 bg-charcoal/10 rounded mb-1" />
                          <div className="w-48 h-3 bg-charcoal/10 rounded" />
                        </div>
                        <div className="w-20 h-6 bg-charcoal/10 rounded-full" />
                      </div>
                    </div>
                  ))
                ) : todayAppointments.length > 0 ? (
                  todayAppointments.map((apt) => (
                    <div key={apt.id} className="p-4 hover:bg-cream/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[70px]">
                          <p className="text-sm font-bold text-charcoal">{formatTime(apt.startTime)}</p>
                          <p className="text-xs text-charcoal/50">{calculateDuration(apt.startTime, apt.endTime)}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-charcoal truncate">
                            {apt.client.firstName} {apt.client.lastName}
                          </p>
                          <p className="text-sm text-charcoal/60 truncate">
                            {apt.service.name} with {apt.staff.firstName} {apt.staff.lastName}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                            statusColors[apt.status] || statusColors.scheduled
                          }`}
                        >
                          {apt.status.replace('-', ' ')}
                        </span>
                        <button className="p-2 text-charcoal/40 hover:text-charcoal">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Calendar className="w-12 h-12 text-charcoal/20 mx-auto mb-4" />
                    <p className="text-charcoal/60">No appointments scheduled for today</p>
                    <Link
                      href="/calendar"
                      className="inline-block mt-4 text-sage hover:text-sage-dark font-medium"
                    >
                      Book an appointment
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl border border-border shadow-soft">
              <div className="p-6 border-b border-border">
                <h2 className="text-lg font-semibold text-charcoal">Recent Activity</h2>
              </div>
              <div className="p-4 space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-sage mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-charcoal">{activity.action}</p>
                      <p className="text-sm text-charcoal/60 truncate">{activity.detail}</p>
                      <p className="text-xs text-charcoal/40 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-border">
                <button className="w-full text-sm text-sage hover:text-sage-dark font-medium">
                  View All Activity
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/calendar"
              className="bg-white rounded-xl p-5 border border-border shadow-soft hover:shadow-card hover:border-sage/30 transition-all group"
            >
              <Calendar className="w-10 h-10 text-sage mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-semibold text-charcoal">New Appointment</p>
              <p className="text-sm text-charcoal/60">Book a service</p>
            </Link>
            <Link
              href="/clients"
              className="bg-white rounded-xl p-5 border border-border shadow-soft hover:shadow-card hover:border-lavender/30 transition-all group"
            >
              <Users className="w-10 h-10 text-lavender mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-semibold text-charcoal">Add Client</p>
              <p className="text-sm text-charcoal/60">Register new client</p>
            </Link>
            <Link
              href="/services"
              className="bg-white rounded-xl p-5 border border-border shadow-soft hover:shadow-card hover:border-peach/30 transition-all group"
            >
              <Scissors className="w-10 h-10 text-peach mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-semibold text-charcoal">Manage Services</p>
              <p className="text-sm text-charcoal/60">Edit service menu</p>
            </Link>
            <Link
              href="/reports"
              className="bg-white rounded-xl p-5 border border-border shadow-soft hover:shadow-card hover:border-mint/30 transition-all group"
            >
              <BarChart3 className="w-10 h-10 text-mint mb-3 group-hover:scale-110 transition-transform" />
              <p className="font-semibold text-charcoal">View Reports</p>
              <p className="text-sm text-charcoal/60">Analytics & insights</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
