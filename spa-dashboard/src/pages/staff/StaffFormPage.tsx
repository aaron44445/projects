import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, Service } from '../../lib/api';
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react';

export default function StaffFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    isActive: true,
    serviceIds: [] as string[],
  });
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const servicesRes = await api.getServices({ active: true, limit: 100 });
      setServices(servicesRes.data);

      if (isEditing && id) {
        const member = await api.getStaffMember(id);
        setFormData({
          name: member.name,
          title: member.title || '',
          isActive: member.isActive,
          serviceIds: member.staffServices.map(ss => ss.service.id),
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(p => ({
      ...p,
      serviceIds: p.serviceIds.includes(serviceId)
        ? p.serviceIds.filter(id => id !== serviceId)
        : [...p.serviceIds, serviceId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    try {
      const data = { ...formData, title: formData.title || null };
      if (isEditing) {
        await api.updateStaff(id!, data);
      } else {
        await api.createStaff(data);
      }
      navigate('/staff');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.deleteStaff(id!);
      navigate('/staff');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/staff" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold">{isEditing ? 'Edit Staff' : 'New Staff'}</h1>
        </div>
        {isEditing && (
          <button onClick={() => setShowDelete(true)} className="text-red-600 hover:text-red-700">
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
        {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6">{error}</div>}

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
              placeholder="e.g., Senior Stylist, Massage Therapist"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Services</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
              {services.map((service) => (
                <label key={service.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={formData.serviceIds.includes(service.id)}
                    onChange={() => handleServiceToggle(service.id)}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span className="text-sm">{service.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData(p => ({ ...p, isActive: e.target.checked }))}
              className="w-4 h-4 text-teal-600 rounded"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <Link to="/staff" className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</Link>
          <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEditing ? 'Save' : 'Create'}
          </button>
        </div>
      </form>

      {showDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Staff Member</h3>
            <p className="text-gray-600 mb-6">This cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDelete(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button onClick={handleDelete} disabled={isDeleting} className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50">
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
