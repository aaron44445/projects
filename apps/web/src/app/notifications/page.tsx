'use client';

import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Card } from '@peacase/ui';
import { RefreshCw, Send, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function NotificationsPage() {
  const [filters, setFilters] = useState<{
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page: number;
  }>({
    page: 1,
  });

  const { notifications, stats, loading, error, pagination, refresh, resendNotification } = useNotifications(filters);
  const [resending, setResending] = useState<string | null>(null);

  const handleResend = async (notificationId: string) => {
    setResending(notificationId);
    const success = await resendNotification(notificationId);
    setResending(null);

    if (success) {
      alert('Notification resent successfully');
    } else {
      alert('Failed to resend notification');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'sent':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colorMap: Record<string, string> = {
      delivered: 'bg-green-100 text-green-800',
      sent: 'bg-blue-100 text-blue-800',
      failed: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${colorMap[status] || 'bg-gray-100 text-gray-800'}`}>
        {getStatusIcon(status)}
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Notification History</h1>
        <button
          onClick={refresh}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <div className="text-sm font-medium text-gray-600 mb-2">Total Sent</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="text-sm font-medium text-gray-600 mb-2">Delivered</div>
              <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="text-sm font-medium text-gray-600 mb-2">Failed</div>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            </div>
          </Card>

          <Card>
            <div className="p-4">
              <div className="text-sm font-medium text-gray-600 mb-2">Success Rate</div>
              <div className="text-2xl font-bold">{stats.successRate}%</div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <select
                value={filters.type || 'all'}
                onChange={(e) => setFilters({ ...filters, type: e.target.value === 'all' ? undefined : e.target.value, page: 1 })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="all">All types</option>
                <option value="booking_confirmation">Booking Confirmation</option>
                <option value="appointment_reminder">Appointment Reminder</option>
                <option value="cancellation">Cancellation</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <select
                value={filters.status || 'all'}
                onChange={(e) => setFilters({ ...filters, status: e.target.value === 'all' ? undefined : e.target.value, page: 1 })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="all">All statuses</option>
                <option value="delivered">Delivered</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value || undefined, page: 1 })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value || undefined, page: 1 })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Notifications List */}
      <Card>
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Recent Notifications</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading notifications...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No notifications found</div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusBadge(notification.status)}
                        <span className="text-sm font-medium capitalize">
                          {notification.type.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          <span className="font-medium">Client:</span>{' '}
                          {notification.client.firstName} {notification.client.lastName}
                        </div>
                        {notification.appointment && (
                          <div>
                            <span className="font-medium">Service:</span>{' '}
                            {notification.appointment.service.name}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Channels:</span>{' '}
                          {notification.channels}
                        </div>
                        <div>
                          <span className="font-medium">Sent:</span>{' '}
                          {formatDate(notification.createdAt)}
                        </div>
                      </div>

                      {/* Channel-specific status */}
                      <div className="mt-2 space-y-1">
                        {notification.emailStatus && (
                          <div className="text-xs text-gray-500">
                            Email: {notification.emailStatus}
                            {notification.emailError && (
                              <span className="text-red-500 ml-2">({notification.emailError})</span>
                            )}
                          </div>
                        )}
                        {notification.smsStatus && (
                          <div className="text-xs text-gray-500">
                            SMS: {notification.smsStatus}
                            {notification.smsError && (
                              <span className="text-red-500 ml-2">({notification.smsError})</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {notification.status === 'failed' && (
                      <button
                        onClick={() => handleResend(notification.id)}
                        disabled={resending === notification.id}
                        className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-1 disabled:opacity-50"
                      >
                        <Send className="h-3 w-3" />
                        {resending === notification.id ? 'Resending...' : 'Resend'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && notifications.length > 0 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {notifications.length} of {pagination.total} notifications
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  disabled={filters.page === 1}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <div className="flex items-center px-4 text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <button
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  disabled={filters.page >= pagination.totalPages}
                  className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
