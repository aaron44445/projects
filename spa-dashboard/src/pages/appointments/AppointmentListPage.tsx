import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, AppointmentWithRelations, AppointmentStatus, PaginationMeta } from '../../lib/api';
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Scissors,
  Loader2,
  Filter
} from 'lucide-react';

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-gray-100 text-gray-700',
};

export default function AppointmentListPage() {
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadAppointments();
  }, [page, statusFilter, dateFilter]);

  const loadAppointments = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await api.getAppointments({
        page,
        limit: 20,
        status: statusFilter || undefined,
        startDate: dateFilter ? `${dateFilter}T00:00:00Z` : undefined,
        endDate: dateFilter ? `${dateFilter}T23:59:59Z` : undefined,
      });
      setAppointments(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-teal-600" />
            Appointments
          </h1>
          <p className="text-gray-500 mt-1">
            {meta?.total || 0} appointments
          </p>
        </div>
        <Link
          to="/appointments/new"
          className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 transition"
        >
          <Plus className="w-5 h-5" />
          Book Appointment
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="NO_SHOW">No Show</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No appointments for this date</p>
          <Link
            to="/appointments/new"
            className="inline-flex items-center gap-2 text-teal-600 font-medium mt-2 hover:text-teal-700"
          >
            <Plus className="w-4 h-4" />
            Book an appointment
          </Link>
        </div>
      ) : (
        <>
          {/* Appointment List */}
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                onClick={() => navigate(`/appointments/${apt.id}`)}
                className="bg-white rounded-lg shadow p-4 hover:shadow-md cursor-pointer transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{formatTime(apt.startTime)}</p>
                      <p className="text-sm text-gray-500">{formatTime(apt.endTime)}</p>
                    </div>
                    <div className="border-l border-gray-200 pl-4">
                      <p className="font-medium text-gray-900">{apt.client.name}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Scissors className="w-4 h-4" />
                          {apt.service.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {apt.staff.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {apt.service.durationMinutes} min
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-gray-900">
                      ${Number(apt.service.price).toFixed(2)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[apt.status]}`}>
                      {apt.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * meta.limit + 1} to{' '}
                {Math.min(page * meta.limit, meta.total)} of {meta.total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {meta.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={page === meta.totalPages}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
