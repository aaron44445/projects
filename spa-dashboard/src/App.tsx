import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SpaDashboard from './SpaDashboard';
// Clients
import ClientListPage from './pages/clients/ClientListPage';
import ClientDetailPage from './pages/clients/ClientDetailPage';
import ClientFormPage from './pages/clients/ClientFormPage';
// Appointments
import AppointmentListPage from './pages/appointments/AppointmentListPage';
import AppointmentDetailPage from './pages/appointments/AppointmentDetailPage';
import AppointmentFormPage from './pages/appointments/AppointmentFormPage';
// Services
import ServiceListPage from './pages/services/ServiceListPage';
import ServiceFormPage from './pages/services/ServiceFormPage';
// Staff
import StaffListPage from './pages/staff/StaffListPage';
import StaffFormPage from './pages/staff/StaffFormPage';
// Products
import ProductListPage from './pages/products/ProductListPage';
import ProductFormPage from './pages/products/ProductFormPage';
// Transactions
import TransactionListPage from './pages/transactions/TransactionListPage';
import TransactionFormPage from './pages/transactions/TransactionFormPage';
// Marketplace
import MarketplacePage from './pages/marketplace/MarketplacePage';
import MarketplaceProfilePage from './pages/marketplace/MarketplaceProfilePage';
import MarketplaceBookingsPage from './pages/marketplace/MarketplaceBookingsPage';
import MarketplaceReviewsPage from './pages/marketplace/MarketplaceReviewsPage';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Dashboard */}
      <Route path="/" element={<ProtectedRoute><SpaDashboard /></ProtectedRoute>} />

      {/* Clients */}
      <Route path="/clients" element={<ProtectedRoute><ClientListPage /></ProtectedRoute>} />
      <Route path="/clients/new" element={<ProtectedRoute><ClientFormPage /></ProtectedRoute>} />
      <Route path="/clients/:id" element={<ProtectedRoute><ClientDetailPage /></ProtectedRoute>} />
      <Route path="/clients/:id/edit" element={<ProtectedRoute><ClientFormPage /></ProtectedRoute>} />

      {/* Appointments */}
      <Route path="/appointments" element={<ProtectedRoute><AppointmentListPage /></ProtectedRoute>} />
      <Route path="/appointments/new" element={<ProtectedRoute><AppointmentFormPage /></ProtectedRoute>} />
      <Route path="/appointments/:id" element={<ProtectedRoute><AppointmentDetailPage /></ProtectedRoute>} />
      <Route path="/appointments/:id/edit" element={<ProtectedRoute><AppointmentFormPage /></ProtectedRoute>} />

      {/* Services */}
      <Route path="/services" element={<ProtectedRoute><ServiceListPage /></ProtectedRoute>} />
      <Route path="/services/new" element={<ProtectedRoute><ServiceFormPage /></ProtectedRoute>} />
      <Route path="/services/:id" element={<ProtectedRoute><ServiceFormPage /></ProtectedRoute>} />

      {/* Staff */}
      <Route path="/staff" element={<ProtectedRoute><StaffListPage /></ProtectedRoute>} />
      <Route path="/staff/new" element={<ProtectedRoute><StaffFormPage /></ProtectedRoute>} />
      <Route path="/staff/:id" element={<ProtectedRoute><StaffFormPage /></ProtectedRoute>} />

      {/* Products */}
      <Route path="/products" element={<ProtectedRoute><ProductListPage /></ProtectedRoute>} />
      <Route path="/products/new" element={<ProtectedRoute><ProductFormPage /></ProtectedRoute>} />
      <Route path="/products/:id" element={<ProtectedRoute><ProductFormPage /></ProtectedRoute>} />

      {/* Transactions */}
      <Route path="/transactions" element={<ProtectedRoute><TransactionListPage /></ProtectedRoute>} />
      <Route path="/transactions/new" element={<ProtectedRoute><TransactionFormPage /></ProtectedRoute>} />

      {/* Marketplace */}
      <Route path="/marketplace" element={<ProtectedRoute><MarketplacePage /></ProtectedRoute>} />
      <Route path="/marketplace/profile" element={<ProtectedRoute><MarketplaceProfilePage /></ProtectedRoute>} />
      <Route path="/marketplace/bookings" element={<ProtectedRoute><MarketplaceBookingsPage /></ProtectedRoute>} />
      <Route path="/marketplace/reviews" element={<ProtectedRoute><MarketplaceReviewsPage /></ProtectedRoute>} />

      {/* Settings placeholder */}
      <Route path="/settings" element={<ProtectedRoute><ComingSoon title="Settings" /></ProtectedRoute>} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="p-6 flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-500">This feature is coming soon!</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
