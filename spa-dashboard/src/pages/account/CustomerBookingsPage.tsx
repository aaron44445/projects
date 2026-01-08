import { useState } from 'react';
import { Link } from 'react-router-dom';
import PublicLayout from '../../components/PublicLayout';
import {
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';

type BookingStatus = 'all' | 'upcoming' | 'completed' | 'cancelled';

// Placeholder type - will be replaced with actual API types
interface CustomerBooking {
  id: string;
  spaName: string;
  spaSlug: string;
  serviceName: string;
  dateTime: string;
  duration: number;
  totalPrice: number;
  status: string;
  confirmationNumber: string;
  address: string;
}

export default function CustomerBookingsPage() {
  const [statusFilter, setStatusFilter] = useState<BookingStatus>('all');
  const [bookings] = useState<CustomerBooking[]>([]); // Will be populated from API

  const filteredBookings = bookings.filter((booking) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'upcoming') {
      return ['pending', 'confirmed'].includes(booking.status);
    }
    return booking.status === statusFilter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-gray-100 text-gray-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-500 mt-1">View and manage your spa appointments</p>
          </div>
          <Link
            to="/explore"
            className="px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition"
          >
            Book a Spa
          </Link>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
            {(['all', 'upcoming', 'completed', 'cancelled'] as BookingStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                  statusFilter === status
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length > 0 ? (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-teal-300 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {booking.serviceName}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          booking.status
                        )}`}
                      >
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </div>

                    <Link
                      to={`/spa/${booking.spaSlug}`}
                      className="text-teal-600 hover:text-teal-700 font-medium"
                    >
                      {booking.spaName}
                    </Link>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(booking.dateTime)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatTime(booking.dateTime)} ({booking.duration} min)
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{booking.address}</span>
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-gray-400">
                      Confirmation: {booking.confirmationNumber}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      ${booking.totalPrice.toFixed(2)}
                    </p>
                    <Link
                      to={`/account/bookings/${booking.id}`}
                      className="inline-flex items-center gap-1 mt-2 text-sm text-teal-600 hover:text-teal-700"
                    >
                      View Details
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {statusFilter === 'all'
                ? 'No bookings yet'
                : `No ${statusFilter} bookings`}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {statusFilter === 'all'
                ? "You haven't made any spa bookings yet. Discover amazing spas and book your first appointment!"
                : `You don't have any ${statusFilter} bookings.`}
            </p>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition"
            >
              <Search className="w-5 h-5" />
              Explore Spas
            </Link>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}
