import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, StaffWithRelations, PaginationMeta } from '../../lib/api';
import { UserCircle, Plus, Loader2, ToggleLeft, ToggleRight, Scissors } from 'lucide-react';

export default function StaffListPage() {
  const [staff, setStaff] = useState<StaffWithRelations[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadStaff();
  }, [showInactive]);

  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const result = await api.getStaff({ limit: 50, active: !showInactive ? true : undefined });
      setStaff(result.data);
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
            <UserCircle className="w-7 h-7 text-teal-600" />
            Staff
          </h1>
          <p className="text-gray-500 mt-1">{meta?.total || 0} staff members</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowInactive(!showInactive)} className="flex items-center gap-2 text-sm text-gray-600">
            {showInactive ? <ToggleRight className="w-5 h-5 text-teal-600" /> : <ToggleLeft className="w-5 h-5" />}
            Show inactive
          </button>
          <Link to="/staff/new" className="inline-flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">
            <Plus className="w-5 h-5" /> Add Staff
          </Link>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6">{error}</div>}

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-teal-600 animate-spin" /></div>
      ) : staff.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <UserCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No staff members yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => (
            <div
              key={member.id}
              onClick={() => navigate(`/staff/${member.id}`)}
              className={`bg-white rounded-lg shadow p-6 cursor-pointer hover:shadow-md transition ${!member.isActive ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center">
                  <span className="text-teal-700 font-bold text-xl">{member.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{member.name}</h3>
                    {!member.isActive && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Inactive</span>}
                  </div>
                  {member.title && <p className="text-sm text-gray-500">{member.title}</p>}
                </div>
              </div>
              {member.staffServices.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <Scissors className="w-3 h-3" /> Services
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {member.staffServices.slice(0, 3).map((ss) => (
                      <span key={ss.service.id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {ss.service.name}
                      </span>
                    ))}
                    {member.staffServices.length > 3 && (
                      <span className="text-xs text-gray-500">+{member.staffServices.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
