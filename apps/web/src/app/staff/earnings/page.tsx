'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Menu,
  Calendar,
  DollarSign,
  TrendingUp,
  Loader2,
  AlertCircle,
  Download,
} from 'lucide-react';
import { StaffAuthGuard } from '@/components/StaffAuthGuard';
import { StaffPortalSidebar } from '@/components/StaffPortalSidebar';
import { api, ApiError } from '@/lib/api';

interface EarningsRecord {
  id: string;
  date: string;
  clientFirstName: string;
  clientLastName: string;
  serviceName: string;
  servicePrice: number;
  commission: number;
  commissionRate: number;
  tip: number;
  total: number;
}

interface EarningsSummary {
  totalCommission: number;
  totalTips: number;
  totalEarnings: number;
  appointmentCount: number;
  averagePerAppointment: number;
}

interface EarningsData {
  records: EarningsRecord[];
  summary: EarningsSummary;
  period: {
    start: string;
    end: string;
    label: string;
    isCurrent: boolean;
  };
  staffCanViewClientContact: boolean;
}

interface PayPeriod {
  index: number;
  start: string;
  end: string;
  label: string;
  isCurrent: boolean;
}

function EarningsContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);

  // Pay period state
  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([]);
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(0);
  const [periodsLoaded, setPeriodsLoaded] = useState(false);

  // Helper function for client name formatting based on visibility settings
  const formatClientName = (
    firstName: string,
    lastName: string,
    canViewContact: boolean
  ): string => {
    if (canViewContact) {
      return `${firstName} ${lastName}`;
    }
    // Show first name + last initial only (e.g., "Sarah M.")
    return `${firstName} ${lastName.charAt(0)}.`;
  };

  // Handle CSV export
  const handleExport = useCallback(async () => {
    if (payPeriods.length === 0) return;
    const period = payPeriods[selectedPeriodIndex];
    if (!period) return;

    // Get auth token for the request
    const token = localStorage.getItem('staffAccessToken');
    if (!token) return;

    try {
      const exportUrl = `${process.env.NEXT_PUBLIC_API_URL}/staff-portal/earnings/export?start=${period.start}&end=${period.end}`;

      const response = await fetch(exportUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `earnings_${period.start.split('T')[0]}_to_${period.end.split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, [payPeriods, selectedPeriodIndex]);

  // Fetch pay periods on mount
  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        const response = await api.get<PayPeriod[]>('/staff-portal/earnings/periods');
        if (response.success && response.data) {
          setPayPeriods(response.data);
          setPeriodsLoaded(true);
        }
      } catch (err) {
        console.error('Failed to load pay periods:', err);
        setPeriodsLoaded(true); // Still allow fetching earnings with defaults
      }
    };
    fetchPeriods();
  }, []);

  const fetchEarnings = useCallback(async () => {
    if (!periodsLoaded) return;

    setIsLoading(true);
    setError(null);

    try {
      const selectedPeriod = payPeriods[selectedPeriodIndex];
      const url = selectedPeriod
        ? `/staff-portal/earnings?start=${selectedPeriod.start}&end=${selectedPeriod.end}`
        : '/staff-portal/earnings';

      const response = await api.get<EarningsData>(url);
      if (response.success && response.data) {
        setEarningsData(response.data);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load earnings data');
      }
    } finally {
      setIsLoading(false);
    }
  }, [payPeriods, selectedPeriodIndex, periodsLoaded]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const selectedPeriod = payPeriods[selectedPeriodIndex];
  const periodLabel = selectedPeriod?.label || earningsData?.period?.label || 'Current Period';

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
                <h1 className="text-2xl font-bold text-charcoal">Earnings</h1>
                <p className="text-sm text-charcoal/60">{periodLabel}</p>
              </div>
            </div>

            {/* Pay Period Selector and Export */}
            <div className="flex items-center gap-3">
              <select
                value={selectedPeriodIndex}
                onChange={(e) => setSelectedPeriodIndex(Number(e.target.value))}
                className="px-4 py-2 border border-charcoal/20 rounded-xl text-charcoal bg-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none"
              >
                {payPeriods.map((period) => (
                  <option key={period.index} value={period.index}>
                    {period.label} {period.isCurrent ? '(Current)' : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={handleExport}
                disabled={!earningsData || earningsData.records.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </header>

        {/* Earnings Content */}
        <div className="flex-1 p-6 overflow-auto">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-sage animate-spin mx-auto mb-4" />
                <p className="text-charcoal/60">Loading earnings...</p>
              </div>
            </div>
          )}

          {error && !isLoading && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-4" />
              <p className="text-rose-700 font-medium mb-2">Failed to load earnings</p>
              <p className="text-rose-600 text-sm mb-4">{error}</p>
              <button
                onClick={fetchEarnings}
                className="px-4 py-2 bg-rose-100 text-rose-700 rounded-xl font-medium hover:bg-rose-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {!isLoading && !error && earningsData && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Earnings */}
                <div className="bg-white rounded-2xl shadow-soft border border-charcoal/5 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-sage/20 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-sage" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-charcoal">
                    {formatCurrency(earningsData.summary.totalEarnings)}
                  </p>
                  <p className="text-sm text-charcoal/60">Total Earnings</p>
                </div>

                {/* Commission */}
                <div className="bg-white rounded-2xl shadow-soft border border-charcoal/5 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-lavender/30 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-lavender-dark" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-charcoal">
                    {formatCurrency(earningsData.summary.totalCommission)}
                  </p>
                  <p className="text-sm text-charcoal/60">Commission</p>
                </div>

                {/* Tips */}
                <div className="bg-white rounded-2xl shadow-soft border border-charcoal/5 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-amber-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-charcoal">
                    {formatCurrency(earningsData.summary.totalTips)}
                  </p>
                  <p className="text-sm text-charcoal/60">Tips</p>
                </div>

                {/* Average Per Appointment */}
                <div className="bg-white rounded-2xl shadow-soft border border-charcoal/5 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-charcoal">
                    {formatCurrency(earningsData.summary.averagePerAppointment)}
                  </p>
                  <p className="text-sm text-charcoal/60">
                    Avg / {earningsData.summary.appointmentCount} appointments
                  </p>
                </div>
              </div>

              {/* Earnings Table */}
              <div className="bg-white rounded-2xl shadow-soft border border-charcoal/5 overflow-hidden">
                <div className="p-5 border-b border-charcoal/10 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-charcoal">Earnings Breakdown</h2>
                  <span className="text-sm text-charcoal/60">
                    {earningsData.records.length} records
                  </span>
                </div>

                {earningsData.records.length === 0 ? (
                  <div className="p-12 text-center">
                    <DollarSign className="w-12 h-12 text-charcoal/20 mx-auto mb-4" />
                    <p className="text-charcoal/60">No earnings records for this period</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-charcoal/5">
                        <tr>
                          <th className="text-left px-5 py-3 text-sm font-medium text-charcoal/70">
                            Date
                          </th>
                          <th className="text-left px-5 py-3 text-sm font-medium text-charcoal/70">
                            Client
                          </th>
                          <th className="text-left px-5 py-3 text-sm font-medium text-charcoal/70">
                            Service
                          </th>
                          <th className="text-right px-5 py-3 text-sm font-medium text-charcoal/70">
                            Service Price
                          </th>
                          <th className="text-right px-5 py-3 text-sm font-medium text-charcoal/70">
                            Commission
                          </th>
                          <th className="text-right px-5 py-3 text-sm font-medium text-charcoal/70">
                            Tip
                          </th>
                          <th className="text-right px-5 py-3 text-sm font-medium text-charcoal/70">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-charcoal/10">
                        {earningsData.records.map((record) => (
                          <tr key={record.id} className="hover:bg-charcoal/5 transition-colors">
                            <td className="px-5 py-4 text-sm text-charcoal">
                              {formatDate(record.date)}
                            </td>
                            <td className="px-5 py-4 text-sm text-charcoal font-medium">
                              {formatClientName(
                                record.clientFirstName,
                                record.clientLastName,
                                earningsData.staffCanViewClientContact
                              )}
                            </td>
                            <td className="px-5 py-4 text-sm text-charcoal/70">
                              {record.serviceName}
                            </td>
                            <td className="px-5 py-4 text-sm text-charcoal/70 text-right">
                              {formatCurrency(record.servicePrice)}
                            </td>
                            <td className="px-5 py-4 text-sm text-right">
                              <span className="text-sage font-medium">
                                {formatCurrency(record.commission)}
                              </span>
                              <span className="text-charcoal/50 text-xs ml-1">
                                ({record.commissionRate}%)
                              </span>
                            </td>
                            <td className="px-5 py-4 text-sm text-charcoal/70 text-right">
                              {record.tip > 0 ? formatCurrency(record.tip) : '-'}
                            </td>
                            <td className="px-5 py-4 text-sm text-charcoal font-bold text-right">
                              {formatCurrency(record.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-sage/10 border-t-2 border-sage/30">
                        <tr>
                          <td colSpan={4} className="px-5 py-4 text-sm font-bold text-charcoal">
                            Totals
                          </td>
                          <td className="px-5 py-4 text-sm font-bold text-sage text-right">
                            {formatCurrency(earningsData.summary.totalCommission)}
                          </td>
                          <td className="px-5 py-4 text-sm font-bold text-charcoal text-right">
                            {formatCurrency(earningsData.summary.totalTips)}
                          </td>
                          <td className="px-5 py-4 text-sm font-bold text-sage text-right">
                            {formatCurrency(earningsData.summary.totalEarnings)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function StaffEarningsPage() {
  return (
    <StaffAuthGuard>
      <EarningsContent />
    </StaffAuthGuard>
  );
}
