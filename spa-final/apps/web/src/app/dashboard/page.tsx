'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Menu,
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  UserCheck,
  CalendarCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
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
  Check,
  XCircle,
  Edit,
  CreditCard,
  Globe,
  UserPlus,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { useSubscription, ADD_ON_DETAILS, AddOnId } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/AppSidebar';
import { AuthGuard } from '@/components/AuthGuard';
import { OnboardingGuard } from '@/components/OnboardingGuard';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { LocationSwitcher } from '@/components/LocationSwitcher';
import { useDashboard, useAppointments, useLocations, useServices, useClients, useStaff } from '@/hooks';

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

// No hardcoded demo data - recentActivity comes from useDashboard hook with real API data

function DashboardContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState<AddOnId | null>(null);
  const [appointmentMenu, setAppointmentMenu] = useState<string | null>(null);
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [setupChecklistCollapsed, setSetupChecklistCollapsed] = useState(false);
  const [skippedOptionalSteps, setSkippedOptionalSteps] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('skippedSetupSteps');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Quick Add Client modal state
  const [showAddClient, setShowAddClient] = useState(false);
  const [clientForm, setClientForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [addClientError, setAddClientError] = useState<string | null>(null);

  const router = useRouter();
  const { salon, user } = useAuth();
  const { activeAddOns, trialEndsAt, isTrialActive, monthlyTotal } = useSubscription();
  const { selectedLocationId, locations } = useLocations();
  const { stats, todayAppointments, recentActivity, loading, error, refetch } = useDashboard(selectedLocationId);
  const { updateAppointment, cancelAppointment } = useAppointments();
  const { services } = useServices();
  const { clients, createClient, refetch: refetchClients } = useClients();
  const { staff } = useStaff();

  // Handle quick add client
  const handleAddClient = async () => {
    if (!clientForm.firstName.trim()) return;

    setIsAddingClient(true);
    setAddClientError(null);

    try {
      await createClient({
        firstName: clientForm.firstName.trim(),
        lastName: clientForm.lastName.trim() || undefined,
        email: clientForm.email.trim() || undefined,
        phone: clientForm.phone.trim() || undefined,
      });

      // Reset and close
      setClientForm({ firstName: '', lastName: '', email: '', phone: '' });
      setShowAddClient(false);
      refetchClients();
      refetch(); // Refresh dashboard stats
    } catch (err) {
      setAddClientError(err instanceof Error ? err.message : 'Failed to add client');
    } finally {
      setIsAddingClient(false);
    }
  };

  // Setup checklist items
  const setupItems = [
    {
      id: 'hours',
      label: 'Add business hours',
      link: '/settings',
      icon: Clock,
      completed: salon?.settings && typeof salon.settings === 'object' && 'businessHours' in salon.settings,
      optional: false,
    },
    {
      id: 'services',
      label: 'Add your first service',
      link: '/services',
      icon: Scissors,
      completed: services && services.length > 0,
      optional: false,
    },
    {
      id: 'clients',
      label: 'Add your first client',
      link: '/clients',
      icon: Users,
      completed: clients && clients.length > 0,
      optional: false,
    },
    {
      id: 'booking',
      label: 'Set up your booking page',
      link: '/settings',
      icon: Globe,
      completed: salon?.slug ? true : false,
      optional: false,
    },
    {
      id: 'payments',
      label: 'Connect payment processing',
      link: '/settings',
      icon: CreditCard,
      completed: false, // Would check Stripe connection
      optional: true,
    },
    {
      id: 'team',
      label: 'Invite team members',
      link: '/staff',
      icon: UserPlus,
      completed: staff && staff.length > 1,
      optional: true,
    },
  ];

  // Filter out skipped optional steps
  const visibleSetupItems = setupItems.filter(
    item => !item.optional || !skippedOptionalSteps.includes(item.id)
  );

  // Calculate completion
  const requiredItems = visibleSetupItems.filter(item => !item.optional);
  const completedRequired = requiredItems.filter(item => item.completed).length;
  const allRequiredComplete = completedRequired === requiredItems.length;
  const totalCompleted = visibleSetupItems.filter(item => item.completed).length;

  const skipOptionalStep = (stepId: string) => {
    const newSkipped = [...skippedOptionalSteps, stepId];
    setSkippedOptionalSteps(newSkipped);
    localStorage.setItem('skippedSetupSteps', JSON.stringify(newSkipped));
  };

  // Handle appointment actions
  const handleCompleteAppointment = async (id: string) => {
    try {
      await updateAppointment(id, { status: 'completed' });
      setAppointmentMenu(null);
      refetch();
    } catch (err) {
      console.error('Failed to complete appointment:', err);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    try {
      await cancelAppointment(id);
      setAppointmentMenu(null);
      refetch();
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
    }
  };

  const handleEditAppointment = (id: string) => {
    router.push(`/calendar?appointment=${id}`);
    setAppointmentMenu(null);
  };

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
                <h1 className="text-2xl font-bold text-charcoal">
                  {salon?.name ? `Welcome to ${salon.name}` : 'Dashboard'}
                </h1>
                <p className="text-sm text-charcoal/60">
                  {user?.firstName ? `Hi, ${user.firstName}!` : 'Manage your business'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {locations.length > 1 && <LocationSwitcher />}

              {/* Quick Add Client Button - Prominent */}
              <button
                onClick={() => setShowAddClient(true)}
                className="flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-all shadow-sm"
              >
                <UserPlus className="w-5 h-5" />
                <span className="hidden sm:inline">Add Client</span>
              </button>

              <button
                onClick={() => refetch()}
                className="p-2 text-charcoal/60 hover:text-charcoal"
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <NotificationDropdown />
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

          {/* Setup Checklist Widget - shows until all required items complete */}
          {!allRequiredComplete && (
            <div className="mb-6 bg-white rounded-2xl border border-border shadow-soft overflow-hidden">
              {/* Header - Always visible */}
              <button
                onClick={() => setSetupChecklistCollapsed(!setupChecklistCollapsed)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-charcoal/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sage/10 rounded-xl flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-sage" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-charcoal">Complete Your Setup</h3>
                    <p className="text-sm text-charcoal/60">
                      {totalCompleted} of {visibleSetupItems.length} tasks complete
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Progress bar */}
                  <div className="w-24 h-2 bg-charcoal/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sage rounded-full transition-all duration-500"
                      style={{ width: `${(totalCompleted / visibleSetupItems.length) * 100}%` }}
                    />
                  </div>
                  {setupChecklistCollapsed ? (
                    <ChevronDown className="w-5 h-5 text-charcoal/40" />
                  ) : (
                    <ChevronUp className="w-5 h-5 text-charcoal/40" />
                  )}
                </div>
              </button>

              {/* Checklist Items - Collapsible */}
              {!setupChecklistCollapsed && (
                <div className="px-5 pb-4 space-y-2">
                  {visibleSetupItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                          item.completed
                            ? 'bg-sage/5'
                            : 'bg-charcoal/5 hover:bg-charcoal/10'
                        }`}
                      >
                        {/* Checkbox */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          item.completed
                            ? 'bg-sage text-white'
                            : 'border-2 border-charcoal/20'
                        }`}>
                          {item.completed && <Check className="w-4 h-4" />}
                        </div>

                        {/* Icon & Label */}
                        <Icon className={`w-5 h-5 flex-shrink-0 ${
                          item.completed ? 'text-sage' : 'text-charcoal/40'
                        }`} />
                        <span className={`flex-1 ${
                          item.completed
                            ? 'text-charcoal/60 line-through'
                            : 'text-charcoal font-medium'
                        }`}>
                          {item.label}
                          {item.optional && (
                            <span className="ml-2 text-xs text-charcoal/40 font-normal">(optional)</span>
                          )}
                        </span>

                        {/* Action buttons */}
                        {!item.completed && (
                          <div className="flex items-center gap-2">
                            {item.optional && (
                              <button
                                onClick={() => skipOptionalStep(item.id)}
                                className="text-xs text-charcoal/40 hover:text-charcoal/60 transition-colors"
                              >
                                Skip
                              </button>
                            )}
                            <Link
                              href={item.link}
                              className="px-3 py-1.5 bg-sage text-white text-sm font-medium rounded-lg hover:bg-sage-dark transition-colors"
                            >
                              Start
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
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
                            {apt.client?.firstName} {apt.client?.lastName}
                          </p>
                          <p className="text-sm text-charcoal/60 truncate">
                            {apt.service?.name} with {apt.staff?.firstName} {apt.staff?.lastName}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                            statusColors[apt.status] || statusColors.scheduled
                          }`}
                        >
                          {apt.status.replace('-', ' ')}
                        </span>
                        <div className="relative">
                          <button
                            onClick={() => setAppointmentMenu(appointmentMenu === apt.id ? null : apt.id)}
                            className="p-2 text-charcoal/40 hover:text-charcoal"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </button>
                          {appointmentMenu === apt.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-charcoal/10 py-2 z-10">
                              <button
                                onClick={() => handleEditAppointment(apt.id)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-sage/5 flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Edit Appointment
                              </button>
                              {apt.status !== 'completed' && (
                                <button
                                  onClick={() => handleCompleteAppointment(apt.id)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-sage/5 flex items-center gap-2"
                                >
                                  <Check className="w-4 h-4" />
                                  Mark Complete
                                </button>
                              )}
                              {apt.status !== 'cancelled' && (
                                <button
                                  onClick={() => handleCancelAppointment(apt.id)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-rose/5 text-rose flex items-center gap-2"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Cancel
                                </button>
                              )}
                            </div>
                          )}
                        </div>
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
                {recentActivity && recentActivity.length > 0 ? (
                  recentActivity.slice(0, 4).map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-sage mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-charcoal">{activity.action}</p>
                        <p className="text-sm text-charcoal/60 truncate">{activity.detail}</p>
                        <p className="text-xs text-charcoal/40 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-charcoal/20 mx-auto mb-3" />
                    <p className="text-charcoal/60">No recent activity yet</p>
                    <p className="text-sm text-charcoal/40 mt-1">
                      Activity will appear here as you book appointments and add clients
                    </p>
                  </div>
                )}
              </div>
              {recentActivity && recentActivity.length > 0 && (
                <div className="p-4 border-t border-border">
                  <button
                    onClick={() => setShowAllActivity(true)}
                    className="w-full text-sm text-sage hover:text-sage-dark font-medium"
                  >
                    View All Activity
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Location Comparison Cards - shown when "All Locations" is selected */}
          {!selectedLocationId && locations.length > 1 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-charcoal mb-4">By Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {locations.map((loc) => (
                  <div key={loc.id} className="bg-white rounded-xl p-4 border border-charcoal/10 hover:border-sage/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-charcoal">{loc.name}</h4>
                        <p className="text-sm text-charcoal/60">
                          {loc.isPrimary ? 'Primary Location' : 'Branch'}
                        </p>
                        {loc.city && (
                          <p className="text-xs text-charcoal/40 mt-1">
                            {loc.city}, {loc.state}
                          </p>
                        )}
                      </div>
                      {loc.isPrimary && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                          Primary
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

      {/* Click outside to close appointment menu */}
      {appointmentMenu && (
        <div className="fixed inset-0 z-[5]" onClick={() => setAppointmentMenu(null)} />
      )}

      {/* View All Activity Modal */}
      {showAllActivity && (
        <>
          <div
            className="fixed inset-0 bg-charcoal/50 z-40"
            onClick={() => setShowAllActivity(false)}
          />
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 overflow-auto">
            <div className="sticky top-0 bg-white border-b border-charcoal/10 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-charcoal">Recent Activity</h2>
              <button
                onClick={() => setShowAllActivity(false)}
                className="p-2 text-charcoal/40 hover:text-charcoal transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {recentActivity && recentActivity.length > 0 ? (
                <>
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex gap-3 p-4 bg-charcoal/5 rounded-xl">
                      <div className="w-2.5 h-2.5 rounded-full bg-sage mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-charcoal">{activity.action}</p>
                        <p className="text-charcoal/60">{activity.detail}</p>
                        <p className="text-xs text-charcoal/40 mt-2">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 text-center">
                    <p className="text-sm text-charcoal/40">
                      Showing recent activity from your business
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-16 h-16 text-charcoal/20 mx-auto mb-4" />
                  <p className="text-lg text-charcoal/60">No activity yet</p>
                  <p className="text-sm text-charcoal/40 mt-2">
                    Your activity feed will show bookings, payments, and more
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Quick Add Client Modal */}
      {showAddClient && (
        <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-charcoal/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sage/10 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-sage" />
                </div>
                <h2 className="text-xl font-bold text-charcoal">Add Client</h2>
              </div>
              <button
                onClick={() => {
                  setShowAddClient(false);
                  setClientForm({ firstName: '', lastName: '', email: '', phone: '' });
                  setAddClientError(null);
                }}
                className="p-2 text-charcoal/40 hover:text-charcoal transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {addClientError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
                  {addClientError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={clientForm.firstName}
                    onChange={(e) => setClientForm({ ...clientForm, firstName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                    placeholder="John"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Last Name</label>
                  <input
                    type="text"
                    value={clientForm.lastName}
                    onChange={(e) => setClientForm({ ...clientForm, lastName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Email <span className="text-charcoal/40 text-xs">(optional)</span>
                </label>
                <input
                  type="email"
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Phone <span className="text-charcoal/40 text-xs">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={clientForm.phone}
                  onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="p-6 border-t border-charcoal/10 flex gap-3">
              <button
                onClick={() => {
                  setShowAddClient(false);
                  setClientForm({ firstName: '', lastName: '', email: '', phone: '' });
                  setAddClientError(null);
                }}
                disabled={isAddingClient}
                className="flex-1 px-4 py-3 border border-charcoal/20 text-charcoal rounded-xl font-medium hover:bg-charcoal/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddClient}
                disabled={isAddingClient || !clientForm.firstName.trim()}
                className="flex-1 px-4 py-3 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAddingClient && <Loader2 className="w-4 h-4 animate-spin" />}
                Add Client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <OnboardingGuard>
        <DashboardContent />
      </OnboardingGuard>
    </AuthGuard>
  );
}
