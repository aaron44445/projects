import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, MarketplaceBooking, PaginationMeta } from '../../lib/api';

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'completed', 'cancelled', 'no-show'];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  'no-show': 'bg-gray-100 text-gray-700',
};

export default function MarketplaceBookingsPage() {
  const [bookings, setBookings] = useState<MarketplaceBooking[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBookings();
  }, [statusFilter, page]);

  async function loadBookings() {
    try {
      setLoading(true);
      setError('');
      const result = await api.getMarketplaceBookings({
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        limit: 20,
      });
      setBookings(result.bookings);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(bookingId: string, newStatus: string) {
    try {
      setUpdating(bookingId);
      await api.updateMarketplaceBookingStatus(bookingId, newStatus);
      await loadBookings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdating(null);
    }
  }

  function formatDateTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Marketplace Bookings</h1>
        <Link
          to="/marketplace"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Back to Marketplace
        </Link>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <div className="flex gap-2">
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`px-4 py-2 text-sm rounded-lg capitalize ${
                statusFilter === status
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : bookings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No bookings found</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date/Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Staff
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{booking.customerName}</div>
                    <div className="text-sm text-gray-500">{booking.customerEmail}</div>
                    {booking.customerPhone && (
                      <div className="text-sm text-gray-500">{booking.customerPhone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900">{booking.service.name}</div>
                    <div className="text-sm text-gray-500">{booking.duration} min</div>
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {formatDateTime(booking.dateTime)}
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {booking.staff?.name || 'Any available'}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    ${Number(booking.totalPrice).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full capitalize ${
                        STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {updating === booking.id ? (
                      <span className="text-sm text-gray-500">Updating...</span>
                    ) : (
                      <div className="flex justify-end gap-2">
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                              className="text-sm text-green-600 hover:text-green-700"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'completed')}
                              className="text-sm text-blue-600 hover:text-blue-700"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(booking.id, 'no-show')}
                              className="text-sm text-gray-600 hover:text-gray-700"
                            >
                              No-Show
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {(page - 1) * pagination.limit + 1} to{' '}
            {Math.min(page * pagination.limit, pagination.total)} of {pagination.total} bookings
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
