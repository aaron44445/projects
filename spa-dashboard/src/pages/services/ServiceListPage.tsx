import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, Service, PaginationMeta } from '../../lib/api';
import { Scissors, Plus, Clock, DollarSign, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';

export default function ServiceListPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadServices();
  }, [showInactive]);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const result = await api.getServices({ limit: 50, active: !showInactive ? true : undefined });
      setServices(result.data);
      setMeta(result.meta);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Scissors className="w-7 h-7 text-teal-600" />
            Services
          </h1>
          <p className="text-gray-500 mt-1">{meta?.total || 0} services</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="flex items-center gap-2 text-sm text-gray-600"
          >
            {showInactive ? <ToggleRight className="w-5 h-5 text-teal-600" /> : <ToggleLeft className="w-5 h-5" />}
            Show inactive
          </button>
          <Link
            to="/services/new"
            className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
          >
            <Plus className="w-5 h-5" /> Add Service
          </Link>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6">{error}</div>}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Scissors className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No services yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              onClick={() => navigate(`/services/${service.id}`)}
              className={`bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition ${!service.isActive ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{service.name}</h3>
                {!service.isActive && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Inactive</span>
                )}
              </div>
              {service.description && (
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{service.description}</p>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-gray-600">
                  <Clock className="w-4 h-4" /> {service.durationMinutes} min
                </span>
                <span className="flex items-center gap-1 font-semibold text-teal-600">
                  <DollarSign className="w-4 h-4" /> {Number(service.price).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
