import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import PublicLayout from './components/PublicLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SpaDashboard from './SpaDashboard';
// Business Registration
import BusinessRegisterPage from './pages/business/BusinessRegisterPage';
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
// Customer Account
import AccountPage from './pages/account/AccountPage';
import CustomerBookingsPage from './pages/account/CustomerBookingsPage';
import { Loader2 } from 'lucide-react';

/**
 * Protected route for business users (spa owners, managers, staff)
 * Redirects customers to their account page
 */
function BusinessRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isBusiness } = useAuth();

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

  // Redirect customers to their account
  if (!isBusiness) {
    return <Navigate to="/account" replace />;
  }

  return <Layout>{children}</Layout>;
}

/**
 * Protected route for customer users
 * Redirects business users to dashboard
 */
function CustomerRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isCustomer } = useAuth();

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

  // Redirect business users to dashboard
  if (!isCustomer) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

/**
 * Public route - accessible to anyone, redirects authenticated users appropriately
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isCustomer } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  // Redirect authenticated users based on their type
  if (isAuthenticated) {
    return <Navigate to={isCustomer ? '/account' : '/'} replace />;
  }

  return <>{children}</>;
}

/**
 * Home page that shows different content based on auth state
 */
function HomePage() {
  const { isAuthenticated, isLoading, isBusiness } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  // Business users see the dashboard
  if (isAuthenticated && isBusiness) {
    return <Layout><SpaDashboard /></Layout>;
  }

  // Public homepage (for customers and visitors)
  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find Your Perfect Spa Experience
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Discover and book the best spa services near you. From relaxing massages to rejuvenating facials.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="/explore"
              className="px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition"
            >
              Explore Spas
            </a>
            <a
              href="/business/register"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              List Your Spa
            </a>
          </div>
        </div>
      </div>
    </PublicLayout>
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

function PublicComingSoon({ title }: { title: string }) {
  return (
    <PublicLayout>
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-500">This feature is coming soon!</p>
        </div>
      </div>
    </PublicLayout>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* ==================== PUBLIC ROUTES ==================== */}
      {/* Auth pages */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/business/register" element={<PublicRoute><BusinessRegisterPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><PublicComingSoon title="Forgot Password" /></PublicRoute>} />

      {/* Public marketplace pages (accessible to everyone) */}
      <Route path="/explore" element={<PublicComingSoon title="Explore Spas" />} />
      <Route path="/services" element={<PublicComingSoon title="Services" />} />
      <Route path="/about" element={<PublicComingSoon title="About Us" />} />
      <Route path="/spa/:slug" element={<PublicComingSoon title="Spa Details" />} />

      {/* ==================== CUSTOMER ROUTES ==================== */}
      <Route path="/account" element={<CustomerRoute><AccountPage /></CustomerRoute>} />
      <Route path="/account/bookings" element={<CustomerRoute><CustomerBookingsPage /></CustomerRoute>} />
      <Route path="/account/settings" element={<CustomerRoute><PublicLayout><ComingSoon title="Account Settings" /></PublicLayout></CustomerRoute>} />

      {/* ==================== BUSINESS ROUTES ==================== */}
      {/* Dashboard */}
      <Route path="/" element={<HomePage />} />

      {/* Clients */}
      <Route path="/clients" element={<BusinessRoute><ClientListPage /></BusinessRoute>} />
      <Route path="/clients/new" element={<BusinessRoute><ClientFormPage /></BusinessRoute>} />
      <Route path="/clients/:id" element={<BusinessRoute><ClientDetailPage /></BusinessRoute>} />
      <Route path="/clients/:id/edit" element={<BusinessRoute><ClientFormPage /></BusinessRoute>} />

      {/* Appointments */}
      <Route path="/appointments" element={<BusinessRoute><AppointmentListPage /></BusinessRoute>} />
      <Route path="/appointments/new" element={<BusinessRoute><AppointmentFormPage /></BusinessRoute>} />
      <Route path="/appointments/:id" element={<BusinessRoute><AppointmentDetailPage /></BusinessRoute>} />
      <Route path="/appointments/:id/edit" element={<BusinessRoute><AppointmentFormPage /></BusinessRoute>} />

      {/* Services */}
      <Route path="/services-manage" element={<BusinessRoute><ServiceListPage /></BusinessRoute>} />
      <Route path="/services-manage/new" element={<BusinessRoute><ServiceFormPage /></BusinessRoute>} />
      <Route path="/services-manage/:id" element={<BusinessRoute><ServiceFormPage /></BusinessRoute>} />

      {/* Staff */}
      <Route path="/staff" element={<BusinessRoute><StaffListPage /></BusinessRoute>} />
      <Route path="/staff/new" element={<BusinessRoute><StaffFormPage /></BusinessRoute>} />
      <Route path="/staff/:id" element={<BusinessRoute><StaffFormPage /></BusinessRoute>} />

      {/* Products */}
      <Route path="/products" element={<BusinessRoute><ProductListPage /></BusinessRoute>} />
      <Route path="/products/new" element={<BusinessRoute><ProductFormPage /></BusinessRoute>} />
      <Route path="/products/:id" element={<BusinessRoute><ProductFormPage /></BusinessRoute>} />

      {/* Transactions */}
      <Route path="/transactions" element={<BusinessRoute><TransactionListPage /></BusinessRoute>} />
      <Route path="/transactions/new" element={<BusinessRoute><TransactionFormPage /></BusinessRoute>} />

      {/* Marketplace Management */}
      <Route path="/marketplace" element={<BusinessRoute><MarketplacePage /></BusinessRoute>} />
      <Route path="/marketplace/profile" element={<BusinessRoute><MarketplaceProfilePage /></BusinessRoute>} />
      <Route path="/marketplace/bookings" element={<BusinessRoute><MarketplaceBookingsPage /></BusinessRoute>} />
      <Route path="/marketplace/reviews" element={<BusinessRoute><MarketplaceReviewsPage /></BusinessRoute>} />

      {/* Settings */}
      <Route path="/settings" element={<BusinessRoute><ComingSoon title="Settings" /></BusinessRoute>} />

      {/* Static pages */}
      <Route path="/privacy" element={<PublicComingSoon title="Privacy Policy" />} />
      <Route path="/terms" element={<PublicComingSoon title="Terms of Service" />} />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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
