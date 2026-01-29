'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import {
  Menu,
  CalendarOff,
  Plus,
  Calendar,
  Clock,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Trash2,
} from 'lucide-react';
import { StaffAuthGuard } from '@/components/StaffAuthGuard';
import { StaffPortalSidebar } from '@/components/StaffPortalSidebar';
import { api, ApiError } from '@/lib/api';
import { Modal } from '@peacase/ui';

interface TimeOffRequest {
  id: string;
  startDate: string;
  endDate: string;
  type: 'vacation' | 'sick' | 'personal' | 'other';
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

const TYPE_LABELS: Record<TimeOffRequest['type'], string> = {
  vacation: 'PTO',
  sick: 'Sick Leave',
  personal: 'Personal',
  other: 'Other',
};

function TimeOffContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    type: 'vacation' as 'vacation' | 'sick' | 'personal' | 'other',
    reason: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<TimeOffRequest[]>('/staff-portal/time-off');
      if (response.success && response.data) {
        setRequests(response.data);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to load time-off requests');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.startDate || !formData.endDate || !formData.reason) {
      setFormError('Please fill in all fields');
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setFormError('End date must be after start date');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post<TimeOffRequest>('/staff-portal/time-off', formData);
      if (response.success && response.data) {
        setRequests((prev) => [response.data!, ...prev]);
        setShowNewRequest(false);
        setFormData({ startDate: '', endDate: '', type: 'vacation', reason: '' });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else {
        setFormError('Failed to submit request');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async (id: string) => {
    setIsSubmitting(true);

    try {
      const response = await api.delete<void>(`/staff-portal/time-off/${id}`);
      if (response.success) {
        setRequests((prev) => prev.filter((r) => r.id !== id));
        setDeleteConfirm(null);
      }
    } catch (err) {
      console.error('Failed to cancel request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            Approved
          </span>
        );
      case 'denied':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-rose-100 text-rose-700">
            <XCircle className="w-4 h-4" />
            Denied
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700">
            <Clock className="w-4 h-4" />
            Pending
          </span>
        );
    }
  };

  const canCancel = (request: TimeOffRequest) => {
    if (request.status !== 'pending') return false;
    const startDate = new Date(request.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return startDate >= today;
  };

  const getDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays === 1 ? '1 day' : `${diffDays} days`;
  };

  // Get minimum date for form (tomorrow)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
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
                <h1 className="text-2xl font-bold text-charcoal">Time Off</h1>
                <p className="text-sm text-charcoal/60">Manage your time-off requests</p>
              </div>
            </div>

            <button
              onClick={() => setShowNewRequest(true)}
              className="flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Request Time Off</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 overflow-auto">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-sage animate-spin mx-auto mb-4" />
                <p className="text-charcoal/60">Loading requests...</p>
              </div>
            </div>
          )}

          {error && !isLoading && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-4" />
              <p className="text-rose-700 font-medium mb-2">Failed to load requests</p>
              <p className="text-rose-600 text-sm mb-4">{error}</p>
              <button
                onClick={fetchRequests}
                className="px-4 py-2 bg-rose-100 text-rose-700 rounded-xl font-medium hover:bg-rose-200 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {!isLoading && !error && (
            <div className="space-y-6">
              {/* Requests List */}
              {requests.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-soft border border-charcoal/5 p-12 text-center">
                  <CalendarOff className="w-12 h-12 text-charcoal/20 mx-auto mb-4" />
                  <p className="text-charcoal/60 mb-2">No time-off requests yet</p>
                  <p className="text-sm text-charcoal/40 mb-4">
                    Request time off by clicking the button above
                  </p>
                  <button
                    onClick={() => setShowNewRequest(true)}
                    className="px-4 py-2 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors"
                  >
                    Request Time Off
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-white rounded-2xl shadow-soft border border-charcoal/5 p-6"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            {getStatusBadge(request.status)}
                            <span className="text-sm text-charcoal/60">
                              {TYPE_LABELS[request.type]}
                            </span>
                            <span className="text-sm text-charcoal/40">
                              {getDuration(request.startDate, request.endDate)}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mb-2">
                            <Calendar className="w-5 h-5 text-sage" />
                            <span className="font-medium text-charcoal">
                              {formatDate(request.startDate)}
                              {request.startDate !== request.endDate && (
                                <> - {formatDate(request.endDate)}</>
                              )}
                            </span>
                          </div>

                          <p className="text-charcoal/70 ml-8">{request.reason}</p>

                          {request.reviewNotes && (
                            <div className="mt-3 ml-8 p-3 bg-charcoal/5 rounded-lg">
                              <p className="text-sm text-charcoal/60">
                                <span className="font-medium">Manager note:</span>{' '}
                                {request.reviewNotes}
                              </p>
                            </div>
                          )}

                          <p className="text-xs text-charcoal/40 mt-3 ml-8">
                            Submitted {formatDate(request.createdAt)}
                          </p>
                        </div>

                        {canCancel(request) && (
                          <button
                            onClick={() => setDeleteConfirm(request.id)}
                            className="flex items-center gap-2 px-3 py-2 border border-rose-200 text-rose-600 rounded-lg font-medium hover:bg-rose-50 transition-colors text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* New Request Modal */}
      <Modal
        isOpen={showNewRequest}
        onClose={() => {
          setShowNewRequest(false);
          setFormData({ startDate: '', endDate: '', type: 'vacation', reason: '' });
          setFormError(null);
        }}
        title="Request Time Off"
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {formError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700">{formError}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, startDate: e.target.value }))
                }
                min={getMinDate()}
                required
                className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, endDate: e.target.value }))
                }
                min={formData.startDate || getMinDate()}
                required
                className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Type
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, type: e.target.value as typeof formData.type }))
              }
              className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
            >
              <option value="vacation">Vacation / PTO</option>
              <option value="sick">Sick Leave</option>
              <option value="personal">Personal Day</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">Reason</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="e.g., Family vacation, Medical appointment, Personal day..."
              required
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowNewRequest(false);
                setFormData({ startDate: '', endDate: '', type: 'vacation', reason: '' });
                setFormError(null);
              }}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-charcoal/20 text-charcoal rounded-xl font-medium hover:bg-charcoal/5 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Submit Request
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Cancel Request?"
        size="sm"
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-rose-500" />
          </div>
          <p className="text-charcoal/60 mb-6">
            Are you sure you want to cancel this time-off request? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-charcoal/20 text-charcoal rounded-xl font-medium hover:bg-charcoal/5 transition-colors disabled:opacity-50"
            >
              Keep Request
            </button>
            <button
              onClick={() => deleteConfirm && handleCancelRequest(deleteConfirm)}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-rose-500 text-white rounded-xl font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Cancel Request
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function StaffTimeOffPage() {
  return (
    <StaffAuthGuard>
      <TimeOffContent />
    </StaffAuthGuard>
  );
}
