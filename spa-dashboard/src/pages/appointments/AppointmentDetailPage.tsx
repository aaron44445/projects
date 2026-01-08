import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, AppointmentWithRelations, AppointmentStatus } from '../../lib/api';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  User,
  Scissors,
  Phone,
  Mail,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
  NO_SHOW: 'bg-gray-100 text-gray-700',
};

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState<AppointmentWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (id) loadAppointment();
  }, [id]);

  const loadAppointment = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAppointment(id!);
      setAppointment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load appointment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (status: AppointmentStatus) => {
    setIsUpdatingStatus(true);
    try {
      const updated = await api.updateAppointmentStatus(id!, status);
      setAppointment(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.deleteAppointment(id!);
      navigate('/appointments');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg">{error || 'Not found'}</div>
        <Link to="/appointments" className="inline-flex items-center gap-2 text-teal-600 mt-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>
    );
  }

  const formatDate = (str: string) => new Date(str).toLocaleDateString();
  const formatTime = (str: string) => new Date(str).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/appointments" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {formatDate(appointment.startTime)} at {formatTime(appointment.startTime)}
            </h1>
            <p className="text-gray-500">{appointment.service.name} with {appointment.staff.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/appointments/${id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Edit className="w-4 h-4" /> Edit
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Status</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[appointment.status]}`}>
                {appointment.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {appointment.status === 'PENDING' && (
                <button
                  onClick={() => handleStatusChange('CONFIRMED')}
                  disabled={isUpdatingStatus}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" /> Confirm
                </button>
              )}
              {['PENDING', 'CONFIRMED'].includes(appointment.status) && (
                <>
                  <button
                    onClick={() => handleStatusChange('COMPLETED')}
                    disabled={isUpdatingStatus}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" /> Complete
                  </button>
                  <button
                    onClick={() => handleStatusChange('NO_SHOW')}
                    disabled={isUpdatingStatus}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                  >
                    <AlertCircle className="w-4 h-4" /> No Show
                  </button>
                  <button
                    onClick={() => handleStatusChange('CANCELLED')}
                    disabled={isUpdatingStatus}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" /> Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Service Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Service Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Service</p>
                  <p className="font-medium">{appointment.service.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">{appointment.service.durationMinutes} minutes</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Staff</p>
                  <p className="font-medium">{appointment.staff.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-bold">$</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="font-medium">${Number(appointment.service.price).toFixed(2)}</p>
                </div>
              </div>
            </div>
            {appointment.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500 mb-1">Notes</p>
                <p className="text-gray-700">{appointment.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Client Info */}
        <div className="bg-white rounded-lg shadow p-6 h-fit">
          <h2 className="text-lg font-semibold mb-4">Client</h2>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
              <span className="text-teal-700 font-bold text-lg">
                {appointment.client.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <Link to={`/clients/${appointment.client.id}`} className="font-medium text-teal-600 hover:text-teal-700">
                {appointment.client.name}
              </Link>
            </div>
          </div>
          <div className="space-y-3">
            {appointment.client.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <a href={`mailto:${appointment.client.email}`} className="text-teal-600">
                  {appointment.client.email}
                </a>
              </div>
            )}
            {appointment.client.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <a href={`tel:${appointment.client.phone}`} className="text-teal-600">
                  {appointment.client.phone}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Appointment</h3>
            <p className="text-gray-600 mb-6">Are you sure? This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
