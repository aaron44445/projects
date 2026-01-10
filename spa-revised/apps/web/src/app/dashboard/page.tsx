'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { ProtectedRoute } from '@/components/ProtectedRoute';

function DashboardContent() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold text-indigo-600">Pecase</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Your Dashboard
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">
                Account Information
              </h3>
              <dl className="mt-4 space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-lg text-gray-900">{user?.email}</dd>
                </div>
                {user?.salonName && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Salon Name
                    </dt>
                    <dd className="text-lg text-gray-900">{user.salonName}</dd>
                  </div>
                )}
                {user?.phone && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="text-lg text-gray-900">{user.phone}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="mt-8 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <p className="text-indigo-900">
                This is a protected page. You can only access it if you are
                logged in.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
