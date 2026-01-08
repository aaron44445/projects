import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, Client, Service, StaffWithRelations } from '../../lib/api';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

export default function AppointmentFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    clientId: '',
    staffId: '',
    serviceId: '',
    startTime: '',
    notes: '',
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [clientsRes, servicesRes, staffRes] = await Promise.all([
        api.getClients({ limit: 100 }),
        api.getServices({ active: true, limit: 100 }),
        api.getStaff({ active: true, limit: 100 }),
      ]);
      setClients(clientsRes.data);
      setServices(servicesRes.data);
      setStaff(staffRes.data);

      if (isEditing && id) {
        const apt = await api.getAppointment(id);
        setFormData({
          clientId: apt.client.id,
          staffId: apt.staff.id,
          serviceId: apt.service.id,
          startTime: apt.startTime.slice(0, 16),
          notes: apt.notes || '',
        });
      } else {
        // Default to tomorrow at 9am
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        setFormData(prev => ({
          ...prev,
          startTime: tomorrow.toISOString().slice(0, 16),
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const data = {
        clientId: formData.clientId,
        staffId: formData.staffId,
        serviceId: formData.serviceId,
        startTime: new Date(formData.startTime).toISOString(),
        notes: formData.notes || null,
      };

      if (isEditing) {
        await api.updateAppointment(id!, data);
      } else {
        await api.createAppointment(data);
      }
      navigate('/appointments');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  const selectedService = services.find(s => s.id === formData.serviceId);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to={isEditing ? `/appointments/${id}` : '/appointments'} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Appointment' : 'Book Appointment'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6">{error}</div>
        )}

        <div className="space-y-5">
          {/* Client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client <span className="text-red-500">*</span>
            </label>
            <select
              name="clientId"
              value={formData.clientId}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            >
              <option value="">Select client</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Service */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service <span className="text-red-500">*</span>
            </label>
            <select
              name="serviceId"
              value={formData.serviceId}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            >
              <option value="">Select service</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} - ${Number(s.price).toFixed(2)} ({s.durationMinutes} min)
                </option>
              ))}
            </select>
            {selectedService && (
              <p className="mt-1 text-sm text-gray-500">
                Duration: {selectedService.durationMinutes} minutes | Price: ${Number(selectedService.price).toFixed(2)}
              </p>
            )}
          </div>

          {/* Staff */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Staff <span className="text-red-500">*</span>
            </label>
            <select
              name="staffId"
              value={formData.staffId}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            >
              <option value="">Select staff</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.title ? `(${s.title})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Date/Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date & Time <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none"
              placeholder="Special requests or notes..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t">
          <Link to={isEditing ? `/appointments/${id}` : '/appointments'} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEditing ? 'Save Changes' : 'Book Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
}
