'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Bell,
  Menu,
  TrendingUp,
  DollarSign,
  UserCheck,
  CalendarCheck,
  Clock,
  Download,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { FeatureGate } from '@/components/FeatureGate';
import { AppSidebar } from '@/components/AppSidebar';
import { AuthGuard } from '@/components/AuthGuard';
import { useReports } from '@/hooks/useReports';

// Date range presets
const dateRangePresets = [
  { label: 'Today', getValue: () => {
    const today = new Date();
    return { start: today.toISOString().split('T')[0], end: today.toISOString().split('T')[0] };
  }},
  { label: 'This Week', getValue: () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    return { start: startOfWeek.toISOString().split('T')[0], end: today.toISOString().split('T')[0] };
  }},
  { label: 'This Month', getValue: () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start: startOfMonth.toISOString().split('T')[0], end: today.toISOString().split('T')[0] };
  }},
  { label: 'Last 30 Days', getValue: () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    return { start: thirtyDaysAgo.toISOString().split('T')[0], end: today.toISOString().split('T')[0] };
  }},
  { label: 'Last 3 Months', getValue: () => {
    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    return { start: threeMonthsAgo.toISOString().split('T')[0], end: today.toISOString().split('T')[0] };
  }},
  { label: 'This Year', getValue: () => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    return { start: startOfYear.toISOString().split('T')[0], end: today.toISOString().split('T')[0] };
  }},
];

const statusColors: Record<string, string> = {
  completed: 'bg-sage/20 text-sage-dark',
  pending: 'bg-amber-100 text-amber-700',
  refunded: 'bg-rose/20 text-rose-dark',
};

// Color palette for service categories
const categoryColors = ['bg-sage', 'bg-lavender', 'bg-peach', 'bg-mint', 'bg-rose'];

function ReportsContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('This Month');
  const [groupBy, setGroupBy] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showAllTransactions, setShowAllTransactions] = useState(false);

  const {
    loading,
    error,
    overview,
    revenueReport,
    servicesReport,
    staffReport,
    clientsReport,
    fetchAllReports,
  } = useReports();

  // Get current date range based on selected preset
  const dateRange = useMemo(() => {
    if (selectedPreset === 'Custom' && customStartDate && customEndDate) {
      return { start: customStartDate, end: customEndDate };
    }
    const preset = dateRangePresets.find(p => p.label === selectedPreset);
    return preset ? preset.getValue() : dateRangePresets[2].getValue(); // Default to This Month
  }, [selectedPreset, customStartDate, customEndDate]);

  // Fetch reports when date range or groupBy changes
  useEffect(() => {
    fetchAllReports(dateRange.start, dateRange.end, groupBy);
  }, [dateRange.start, dateRange.end, groupBy, fetchAllReports]);

  // Prepare overview stats
  const overviewStats = useMemo(() => {
    if (!overview) return [];

    return [
      {
        label: 'Total Revenue',
        value: `$${overview.revenue.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        change: `${overview.revenue.change >= 0 ? '+' : ''}${overview.revenue.change}%`,
        trend: overview.revenue.change >= 0 ? 'up' : 'down',
        period: 'vs previous period',
        icon: DollarSign,
        bgColor: 'bg-sage',
      },
      {
        label: 'Total Appointments',
        value: overview.appointments.value.toLocaleString(),
        change: `${overview.appointments.change >= 0 ? '+' : ''}${overview.appointments.change}%`,
        trend: overview.appointments.change >= 0 ? 'up' : 'down',
        period: 'vs previous period',
        icon: CalendarCheck,
        bgColor: 'bg-lavender',
      },
      {
        label: 'New Clients',
        value: overview.newClients.value.toLocaleString(),
        change: `${overview.newClients.change >= 0 ? '+' : ''}${overview.newClients.change}%`,
        trend: overview.newClients.change >= 0 ? 'up' : 'down',
        period: 'vs previous period',
        icon: UserCheck,
        bgColor: 'bg-peach',
      },
      {
        label: 'Avg. Service Duration',
        value: `${overview.avgServiceDuration.value} ${overview.avgServiceDuration.unit}`,
        change: '-',
        trend: 'neutral',
        period: 'average',
        icon: Clock,
        bgColor: 'bg-mint',
      },
    ];
  }, [overview]);

  // Prepare revenue by service data
  const revenueByService = useMemo(() => {
    if (!servicesReport?.categories) return [];

    return servicesReport.categories.slice(0, 5).map((cat, index) => ({
      name: cat.name,
      revenue: cat.revenue,
      percentage: cat.percentage,
      color: categoryColors[index % categoryColors.length],
    }));
  }, [servicesReport]);

  // Prepare top staff data
  const topStaff = useMemo(() => {
    if (!staffReport?.staff) return [];

    return staffReport.staff.slice(0, 5).map(s => ({
      name: s.name,
      role: s.role.charAt(0).toUpperCase() + s.role.slice(1),
      revenue: s.revenue,
      appointments: s.appointments,
      rating: s.rating,
    }));
  }, [staffReport]);

  // Prepare recent transactions
  const recentTransactions = useMemo(() => {
    if (!revenueReport?.recentTransactions) return [];

    return revenueReport.recentTransactions.map(t => ({
      id: t.id,
      client: t.client,
      service: t.service,
      amount: t.amount,
      date: new Date(t.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
      status: t.status,
    }));
  }, [revenueReport]);

  // Prepare weekly/timeline data for chart
  const timelineData = useMemo(() => {
    if (!revenueReport?.timeline) return [];

    return revenueReport.timeline.map(item => {
      const date = new Date(item.date);
      let label: string;

      if (groupBy === 'daily') {
        label = date.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (groupBy === 'weekly') {
        label = `W${Math.ceil(date.getDate() / 7)}`;
      } else {
        label = date.toLocaleDateString('en-US', { month: 'short' });
      }

      return {
        label,
        revenue: item.revenue,
        appointments: item.count,
      };
    });
  }, [revenueReport, groupBy]);

  const maxRevenue = Math.max(...timelineData.map((d) => d.revenue), 1);
  const totalWeeklyRevenue = timelineData.reduce((sum, d) => sum + d.revenue, 0);

  // Calculate change for weekly revenue (from revenueReport summary)
  const revenueChange = revenueReport?.summary.percentageChange || 0;

  // Handle preset selection
  const handlePresetSelect = (presetLabel: string) => {
    setSelectedPreset(presetLabel);
    setShowDatePicker(false);
  };

  // Handle custom date range
  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      setSelectedPreset('Custom');
      setShowDatePicker(false);
    }
  };

  // Export report data as CSV
  const handleExportCSV = useCallback(() => {
    const rows: string[][] = [];

    // Header section
    rows.push(['Report Export', `${dateRange.start} to ${dateRange.end}`]);
    rows.push([]);

    // Overview section
    if (overview) {
      rows.push(['OVERVIEW']);
      rows.push(['Metric', 'Value', 'Change']);
      rows.push(['Total Revenue', `$${overview.revenue.value}`, `${overview.revenue.change}%`]);
      rows.push(['Total Appointments', String(overview.appointments.value), `${overview.appointments.change}%`]);
      rows.push(['New Clients', String(overview.newClients.value), `${overview.newClients.change}%`]);
      rows.push(['Avg Service Duration', `${overview.avgServiceDuration.value} ${overview.avgServiceDuration.unit}`, '-']);
      rows.push([]);
    }

    // Revenue timeline section
    if (revenueReport?.timeline && revenueReport.timeline.length > 0) {
      rows.push(['REVENUE TIMELINE']);
      rows.push(['Date', 'Revenue', 'Transactions']);
      revenueReport.timeline.forEach(item => {
        rows.push([item.date, `$${item.revenue}`, String(item.count)]);
      });
      rows.push([]);
    }

    // Services breakdown section
    if (servicesReport?.categories && servicesReport.categories.length > 0) {
      rows.push(['REVENUE BY SERVICE CATEGORY']);
      rows.push(['Category', 'Revenue', 'Percentage', 'Bookings']);
      servicesReport.categories.forEach(cat => {
        rows.push([cat.name, `$${cat.revenue}`, `${cat.percentage}%`, String(cat.bookings || cat.count)]);
      });
      rows.push([]);
    }

    // Staff performance section
    if (staffReport?.staff && staffReport.staff.length > 0) {
      rows.push(['STAFF PERFORMANCE']);
      rows.push(['Name', 'Role', 'Revenue', 'Appointments', 'Rating']);
      staffReport.staff.forEach(s => {
        rows.push([s.name, s.role, `$${s.revenue}`, String(s.appointments), String(s.rating)]);
      });
      rows.push([]);
    }

    // Transactions section
    if (revenueReport?.recentTransactions && revenueReport.recentTransactions.length > 0) {
      rows.push(['RECENT TRANSACTIONS']);
      rows.push(['ID', 'Client', 'Service', 'Amount', 'Date', 'Status']);
      revenueReport.recentTransactions.forEach(tx => {
        rows.push([tx.id, tx.client, tx.service, `$${tx.amount}`, tx.date, tx.status]);
      });
      rows.push([]);
    }

    // Client metrics section
    if (clientsReport?.summary) {
      rows.push(['CLIENT METRICS']);
      rows.push(['Metric', 'Value']);
      rows.push(['Retention Rate', `${clientsReport.summary.retentionRate}%`]);
      rows.push(['Unique Visitors', String(clientsReport.summary.uniqueVisitors)]);
      rows.push(['Total Clients', String(clientsReport.summary.totalClients)]);
      rows.push(['New Clients', String(clientsReport.summary.newClients)]);
    }

    // Convert to CSV string
    const csvContent = rows.map(row =>
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma or quote
        const escaped = String(cell).replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')
          ? `"${escaped}"`
          : escaped;
      }).join(',')
    ).join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `spa-report-${dateRange.start}-to-${dateRange.end}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [dateRange, overview, revenueReport, servicesReport, staffReport, clientsReport]);

  // Get all transactions (when showAllTransactions is true)
  const displayedTransactions = useMemo(() => {
    if (!revenueReport?.recentTransactions) return [];

    const transactions = revenueReport.recentTransactions.map(t => ({
      id: t.id,
      client: t.client,
      service: t.service,
      amount: t.amount,
      date: new Date(t.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
      status: t.status,
    }));

    return showAllTransactions ? transactions : transactions.slice(0, 5);
  }, [revenueReport, showAllTransactions]);

  return (
    <div className="min-h-screen bg-cream flex">
      <AppSidebar currentPage="reports" sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
              <h1 className="text-2xl font-bold text-charcoal">Reports</h1>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 text-charcoal/60 hover:text-charcoal relative">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-all"
              >
                <Download className="w-5 h-5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="bg-white border-b border-charcoal/10 px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 relative">
              <span className="text-sm text-charcoal/60">Showing data for:</span>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-2 px-4 py-2 bg-charcoal/5 rounded-xl text-charcoal font-medium hover:bg-charcoal/10 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                {selectedPreset}
                <ChevronDown className="w-4 h-4" />
              </button>

              {/* Date Range Dropdown */}
              {showDatePicker && (
                <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-charcoal/10 p-4 z-50 min-w-[280px]">
                  <div className="space-y-2 mb-4">
                    {dateRangePresets.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => handlePresetSelect(preset.label)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedPreset === preset.label
                            ? 'bg-sage/10 text-sage font-medium'
                            : 'hover:bg-charcoal/5 text-charcoal'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-charcoal/10 pt-4">
                    <p className="text-sm font-medium text-charcoal mb-2">Custom Range</p>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="flex-1 px-3 py-2 border border-charcoal/20 rounded-lg text-sm"
                      />
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="flex-1 px-3 py-2 border border-charcoal/20 rounded-lg text-sm"
                      />
                    </div>
                    <button
                      onClick={handleCustomDateApply}
                      disabled={!customStartDate || !customEndDate}
                      className="w-full px-3 py-2 bg-sage text-white rounded-lg text-sm font-medium hover:bg-sage-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGroupBy('daily')}
                className={`px-4 py-2 text-sm transition-colors rounded-lg ${
                  groupBy === 'daily' ? 'bg-sage/10 text-sage font-medium' : 'text-charcoal/60 hover:text-charcoal'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setGroupBy('weekly')}
                className={`px-4 py-2 text-sm transition-colors rounded-lg ${
                  groupBy === 'weekly' ? 'bg-sage/10 text-sage font-medium' : 'text-charcoal/60 hover:text-charcoal'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setGroupBy('monthly')}
                className={`px-4 py-2 text-sm transition-colors rounded-lg ${
                  groupBy === 'monthly' ? 'bg-sage/10 text-sage font-medium' : 'text-charcoal/60 hover:text-charcoal'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
        </div>

        {/* Reports Content */}
        <div className="flex-1 p-6 overflow-auto">
          <FeatureGate feature="reports">
            {/* Loading State */}
            {loading && !overview && (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 text-sage animate-spin" />
                  <p className="text-charcoal/60">Loading reports...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-rose/10 border border-rose/20 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-rose" />
                  <p className="text-rose-dark">{error}</p>
                </div>
              </div>
            )}

            {/* Overview Stats */}
            {overviewStats.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {overviewStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="bg-white rounded-2xl p-6 border border-charcoal/5 shadow-soft"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        {stat.trend !== 'neutral' && (
                          <div
                            className={`flex items-center gap-1 text-sm font-medium ${
                              stat.trend === 'up' ? 'text-sage-dark' : 'text-rose-dark'
                            }`}
                          >
                            {stat.trend === 'up' ? (
                              <ArrowUpRight className="w-4 h-4" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4" />
                            )}
                            {stat.change}
                          </div>
                        )}
                      </div>
                      <p className="text-3xl font-bold text-charcoal mb-1">{stat.value}</p>
                      <p className="text-sm text-charcoal/60">{stat.label}</p>
                      <p className="text-xs text-charcoal/40 mt-1">{stat.period}</p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Revenue Chart */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-charcoal/5 shadow-soft p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-charcoal">
                      {groupBy === 'daily' ? 'Daily' : groupBy === 'weekly' ? 'Weekly' : 'Monthly'} Revenue
                    </h2>
                    <p className="text-sm text-charcoal/60">Revenue breakdown by {groupBy === 'daily' ? 'day' : groupBy === 'weekly' ? 'week' : 'month'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-charcoal">
                      ${totalWeeklyRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <p className={`text-sm flex items-center justify-end gap-1 ${revenueChange >= 0 ? 'text-sage-dark' : 'text-rose-dark'}`}>
                      <TrendingUp className="w-4 h-4" />
                      {revenueChange >= 0 ? '+' : ''}{revenueChange}% from previous period
                    </p>
                  </div>
                </div>

                {/* Simple Bar Chart */}
                {timelineData.length > 0 ? (
                  <div className="flex items-end gap-4 h-48">
                    {timelineData.slice(-7).map((data, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center">
                        <div className="w-full flex flex-col items-center">
                          <span className="text-xs text-charcoal/60 mb-2">
                            ${data.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                          <div
                            className="w-full bg-sage rounded-t-lg transition-all hover:bg-sage-dark"
                            style={{ height: `${(data.revenue / maxRevenue) * 160}px`, minHeight: '4px' }}
                          />
                        </div>
                        <span className="text-xs font-medium text-charcoal/60 mt-2">{data.label}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 text-charcoal/40">
                    No data available for this period
                  </div>
                )}
              </div>

              {/* Revenue by Service */}
              <div className="bg-white rounded-2xl border border-charcoal/5 shadow-soft p-6">
                <h2 className="text-lg font-semibold text-charcoal mb-6">Revenue by Category</h2>
                {revenueByService.length > 0 ? (
                  <div className="space-y-4">
                    {revenueByService.map((service) => (
                      <div key={service.name}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-charcoal">{service.name}</span>
                          <span className="text-sm font-medium text-charcoal">
                            ${service.revenue.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 bg-charcoal/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${service.color} rounded-full transition-all`}
                            style={{ width: `${service.percentage}%` }}
                          />
                        </div>
                        <p className="text-xs text-charcoal/50 mt-1">{service.percentage}% of total</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 text-charcoal/40 text-sm">
                    No service data available
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Staff */}
              <div className="bg-white rounded-2xl border border-charcoal/5 shadow-soft">
                <div className="p-6 border-b border-charcoal/10">
                  <h2 className="text-lg font-semibold text-charcoal">Top Performing Staff</h2>
                  <p className="text-sm text-charcoal/60">Based on revenue this period</p>
                </div>
                {topStaff.length > 0 ? (
                  <div className="divide-y divide-charcoal/10">
                    {topStaff.map((staff, index) => (
                      <div key={staff.name} className="flex items-center gap-4 p-4 hover:bg-cream/50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-sage/20 flex items-center justify-center text-sage font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-charcoal">{staff.name}</p>
                          <p className="text-sm text-charcoal/60">{staff.role}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-charcoal">${staff.revenue.toLocaleString()}</p>
                          <p className="text-xs text-charcoal/50">{staff.appointments} appointments</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 text-charcoal/40 text-sm">
                    No staff data available
                  </div>
                )}
              </div>

              {/* Recent Transactions */}
              <div className="bg-white rounded-2xl border border-charcoal/5 shadow-soft">
                <div className="p-6 border-b border-charcoal/10">
                  <h2 className="text-lg font-semibold text-charcoal">
                    {showAllTransactions ? 'All Transactions' : 'Recent Transactions'}
                  </h2>
                  <p className="text-sm text-charcoal/60">
                    {showAllTransactions
                      ? `Showing all ${revenueReport?.recentTransactions?.length || 0} transactions`
                      : 'Latest payment activity'}
                  </p>
                </div>
                {displayedTransactions.length > 0 ? (
                  <div className={`divide-y divide-charcoal/10 ${showAllTransactions ? 'max-h-96 overflow-y-auto' : ''}`}>
                    {displayedTransactions.map((tx) => (
                      <div key={tx.id} className="flex items-center gap-4 p-4 hover:bg-cream/50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-sage" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-charcoal">{tx.client}</p>
                          <p className="text-sm text-charcoal/60">{tx.service}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-charcoal">${tx.amount}</p>
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-charcoal/50">{tx.date}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
                                statusColors[tx.status] || 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 text-charcoal/40 text-sm">
                    No transactions available
                  </div>
                )}
                {revenueReport?.recentTransactions && revenueReport.recentTransactions.length > 5 && (
                  <div className="p-4 border-t border-charcoal/10">
                    <button
                      onClick={() => setShowAllTransactions(!showAllTransactions)}
                      className="w-full text-sm text-sage hover:text-sage-dark font-medium transition-colors"
                    >
                      {showAllTransactions ? 'Show Less' : `View All Transactions (${revenueReport.recentTransactions.length})`}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-gradient-to-br from-sage to-sage-dark rounded-2xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Client Retention</h3>
                <p className="text-4xl font-bold mb-2">
                  {clientsReport?.summary.retentionRate ?? '--'}%
                </p>
                <p className="text-white/80 text-sm">of clients returned this period</p>
              </div>
              <div className="bg-gradient-to-br from-lavender to-lavender-dark rounded-2xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Unique Visitors</h3>
                <p className="text-4xl font-bold mb-2">
                  {clientsReport?.summary.uniqueVisitors?.toLocaleString() ?? '--'}
                </p>
                <p className="text-white/80 text-sm">clients visited this period</p>
              </div>
              <div className="bg-gradient-to-br from-peach to-peach-dark rounded-2xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Avg. Ticket Size</h3>
                <p className="text-4xl font-bold mb-2">
                  ${servicesReport?.summary.avgRevenuePerBooking?.toFixed(0) ?? '--'}
                </p>
                <p className="text-white/80 text-sm">per appointment average</p>
              </div>
            </div>
          </FeatureGate>
        </div>
      </main>

      {/* Click outside to close date picker */}
      {showDatePicker && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDatePicker(false)}
        />
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <AuthGuard>
      <ReportsContent />
    </AuthGuard>
  );
}
