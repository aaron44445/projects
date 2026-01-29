'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Download,
  Trash2,
  Shield,
  Bell,
  Megaphone,
  Check,
  X,
  Loader2,
  AlertCircle,
  ChevronLeft,
  Info,
} from 'lucide-react';
import { useClientAuth } from '@/contexts/ClientAuthContext';
import { TOKEN_KEYS } from '@/types/auth';
import { API_CONFIG } from '@/config/api';
import { Modal } from '@peacase/ui';

interface ClientData {
  personalInformation: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    country: string | null;
    birthday: string | null;
    createdAt: string;
    updatedAt: string;
  };
  preferences: {
    communicationPreference: string | null;
    optedInReminders: boolean;
    optedInMarketing: boolean;
    preferredStaffId: string | null;
    preferredLocationId: string | null;
  };
  consentRecords: {
    dataConsentGiven: boolean;
    dataConsentAt: string | null;
  };
  summary: {
    totalAppointments: number;
    totalPayments: number;
    totalSpent: number;
    totalNotes: number;
    totalPackages: number;
    totalReviews: number;
    totalFormResponses: number;
  };
}

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

function DeleteAccountModal({ isOpen, onClose, onConfirm, isDeleting }: DeleteModalProps) {
  const [confirmText, setConfirmText] = useState('');

  const canDelete = confirmText.toLowerCase() === 'delete my account';

  // Calculate scheduled deletion date (30 days from now)
  const scheduledDate = new Date();
  scheduledDate.setDate(scheduledDate.getDate() + 30);
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Account Deletion"
      description="30-day grace period applies"
      size="md"
    >
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
        <p className="text-sm text-amber-700">
          <strong>30-Day Grace Period:</strong> Your data will be scheduled for deletion on <strong>{formattedDate}</strong>. You can cancel this request anytime before that date.
        </p>
      </div>

      <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-4">
        <p className="text-sm text-rose-700">
          <strong>After the grace period, the following will be permanently deleted:</strong>
        </p>
        <ul className="mt-2 text-sm text-rose-700 list-disc list-inside space-y-1">
          <li>Personal information (name, email, phone, address)</li>
          <li>Notes and preferences</li>
          <li>Reviews you submitted</li>
          <li>Loyalty points</li>
        </ul>
        <p className="mt-2 text-sm text-rose-700">
          <em>Payment and appointment history will be anonymized for business records.</em>
        </p>
      </div>

      <p className="text-sm text-charcoal/70 mb-3">
        To confirm, please type <strong>delete my account</strong> below:
      </p>

      <input
        type="text"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        placeholder="Type here to confirm"
        className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-colors mb-4"
      />

      <div className="flex gap-3">
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="flex-1 px-4 py-3 border border-charcoal/20 text-charcoal rounded-xl font-medium hover:bg-charcoal/5 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={!canDelete || isDeleting}
          className="flex-1 px-4 py-3 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isDeleting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Requesting...
            </>
          ) : (
            <>
              <Trash2 className="w-5 h-5" />
              Request Deletion
            </>
          )}
        </button>
      </div>
    </Modal>
  );
}

export default function ClientDataPage() {
  const router = useRouter();
  const { client, isLoading: authLoading, isAuthenticated, logout } = useClientAuth();

  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isUpdatingMarketing, setIsUpdatingMarketing] = useState(false);
  const [isUpdatingConsent, setIsUpdatingConsent] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getAccessToken = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEYS.client.access);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/portal/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch client data
  const fetchClientData = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_CONFIG.apiUrl}/gdpr/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setClientData(data.data);
      } else {
        setError(data.error?.message || 'Failed to load your data');
      }
    } catch (err) {
      setError('Failed to connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchClientData();
    }
  }, [isAuthenticated, fetchClientData]);

  // Show success message temporarily
  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  // Handle data export/download
  const handleExportData = async () => {
    const token = getAccessToken();
    if (!token) return;

    setIsExporting(true);

    try {
      const response = await fetch(`${API_CONFIG.apiUrl}/gdpr/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        // Create and download JSON file
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const firstName = clientData?.personalInformation?.firstName || 'user';
        const lastName = clientData?.personalInformation?.lastName || '';
        a.download = `my-data-${firstName}-${lastName}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showSuccess('Your data has been downloaded successfully!');
      } else {
        setError(data.error?.message || 'Failed to export data');
      }
    } catch (err) {
      setError('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle marketing preference update
  const handleUpdateMarketing = async (optedIn: boolean) => {
    const token = getAccessToken();
    if (!token) return;

    setIsUpdatingMarketing(true);

    try {
      const response = await fetch(`${API_CONFIG.apiUrl}/gdpr/consent`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ optedInMarketing: optedIn }),
      });

      const data = await response.json();

      if (data.success) {
        setClientData(prev => prev ? {
          ...prev,
          preferences: {
            ...prev.preferences,
            optedInMarketing: optedIn,
          },
        } : null);
        showSuccess(optedIn ? 'Marketing preferences enabled' : 'Marketing preferences disabled');
      } else {
        setError(data.error?.message || 'Failed to update preferences');
      }
    } catch (err) {
      setError('Failed to update preferences. Please try again.');
    } finally {
      setIsUpdatingMarketing(false);
    }
  };

  // Handle data consent withdrawal
  const handleWithdrawConsent = async () => {
    const token = getAccessToken();
    if (!token) return;

    setIsUpdatingConsent(true);

    try {
      const response = await fetch(`${API_CONFIG.apiUrl}/gdpr/consent`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dataConsent: false }),
      });

      const data = await response.json();

      if (data.success) {
        setClientData(prev => prev ? {
          ...prev,
          consentRecords: {
            ...prev.consentRecords,
            dataConsentGiven: false,
          },
        } : null);
        showSuccess('Data consent has been withdrawn');
      } else {
        setError(data.error?.message || 'Failed to update consent');
      }
    } catch (err) {
      setError('Failed to update consent. Please try again.');
    } finally {
      setIsUpdatingConsent(false);
    }
  };

  // Handle account deletion request
  const handleDeleteAccount = async () => {
    const token = getAccessToken();
    if (!token) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`${API_CONFIG.apiUrl}/gdpr/delete-request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: 'User requested deletion via data management page' }),
      });

      const data = await response.json();

      if (data.success) {
        setShowDeleteModal(false);
        // Show success message with scheduled deletion date
        const scheduledDate = new Date(data.data.scheduledDeletion);
        const formattedDate = scheduledDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        setSuccessMessage(`Deletion scheduled for ${formattedDate}. Check your email for details.`);
        // Keep the success message visible longer for important info
        setTimeout(() => setSuccessMessage(null), 8000);
      } else {
        setError(data.error?.message || 'Failed to submit deletion request');
        setShowDeleteModal(false);
      }
    } catch (err) {
      setError('Failed to submit deletion request. Please try again.');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Show loading state
  if (authLoading || (isLoading && !clientData)) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-sage animate-spin mx-auto mb-4" />
          <p className="text-charcoal/60">Loading your data...</p>
        </div>
      </div>
    );
  }

  // Show not authenticated state
  if (!isAuthenticated) {
    return null; // Router will redirect
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Success Toast */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-sage text-white px-6 py-3 rounded-xl shadow-card flex items-center gap-2 animate-fade-in">
          <Check className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-charcoal/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-charcoal/60 hover:text-charcoal rounded-lg hover:bg-charcoal/5 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-charcoal">Your Data & Privacy</h1>
              <p className="text-sm text-charcoal/60">Manage your personal data and privacy settings</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-sage" />
            <span className="text-sm font-medium text-sage">GDPR Compliant</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Error Banner */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-rose-700 font-medium">Something went wrong</p>
              <p className="text-sm text-rose-600">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Personal Information Section */}
        <section className="bg-white rounded-2xl shadow-soft border border-charcoal/5 overflow-hidden">
          <div className="p-5 border-b border-charcoal/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sage/20 flex items-center justify-center">
                <User className="w-5 h-5 text-sage" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-charcoal">Personal Information</h2>
                <p className="text-sm text-charcoal/60">The information we have stored about you</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            {clientData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-cream rounded-xl">
                  <User className="w-5 h-5 text-charcoal/40" />
                  <div>
                    <p className="text-xs text-charcoal/50 uppercase tracking-wide">Name</p>
                    <p className="text-charcoal font-medium">
                      {clientData.personalInformation.firstName} {clientData.personalInformation.lastName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-cream rounded-xl">
                  <Mail className="w-5 h-5 text-charcoal/40" />
                  <div>
                    <p className="text-xs text-charcoal/50 uppercase tracking-wide">Email</p>
                    <p className="text-charcoal font-medium">{clientData.personalInformation.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-cream rounded-xl">
                  <Phone className="w-5 h-5 text-charcoal/40" />
                  <div>
                    <p className="text-xs text-charcoal/50 uppercase tracking-wide">Phone</p>
                    <p className="text-charcoal font-medium">
                      {clientData.personalInformation.phone || 'Not provided'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-cream rounded-xl">
                  <MapPin className="w-5 h-5 text-charcoal/40" />
                  <div>
                    <p className="text-xs text-charcoal/50 uppercase tracking-wide">Address</p>
                    <p className="text-charcoal font-medium">
                      {clientData.personalInformation.address
                        ? `${clientData.personalInformation.address}, ${clientData.personalInformation.city || ''} ${clientData.personalInformation.state || ''} ${clientData.personalInformation.zip || ''}`
                        : 'Not provided'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-cream rounded-xl">
                  <Calendar className="w-5 h-5 text-charcoal/40" />
                  <div>
                    <p className="text-xs text-charcoal/50 uppercase tracking-wide">Account Created</p>
                    <p className="text-charcoal font-medium">
                      {formatDate(clientData.personalInformation.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-charcoal/60">Unable to load personal information</p>
            )}
          </div>
        </section>

        {/* Consent Management Section */}
        <section className="bg-white rounded-2xl shadow-soft border border-charcoal/5 overflow-hidden">
          <div className="p-5 border-b border-charcoal/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-lavender/30 flex items-center justify-center">
                <Shield className="w-5 h-5 text-lavender-dark" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-charcoal">Data Consent</h2>
                <p className="text-sm text-charcoal/60">Your consent status and options</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {clientData && (
              <>
                <div className="flex items-center justify-between p-4 bg-cream rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      clientData.consentRecords.dataConsentGiven ? 'bg-sage/20' : 'bg-charcoal/10'
                    }`}>
                      {clientData.consentRecords.dataConsentGiven ? (
                        <Check className="w-5 h-5 text-sage" />
                      ) : (
                        <X className="w-5 h-5 text-charcoal/40" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-charcoal">Data Processing Consent</p>
                      <p className="text-sm text-charcoal/60">
                        {clientData.consentRecords.dataConsentGiven
                          ? `Consent given on ${formatDate(clientData.consentRecords.dataConsentAt)}`
                          : 'Consent not given'}
                      </p>
                    </div>
                  </div>
                  {clientData.consentRecords.dataConsentGiven && (
                    <button
                      onClick={handleWithdrawConsent}
                      disabled={isUpdatingConsent}
                      className="px-4 py-2 border border-charcoal/20 text-charcoal rounded-xl text-sm font-medium hover:bg-charcoal/5 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {isUpdatingConsent ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : null}
                      Withdraw Consent
                    </button>
                  )}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700">
                    Withdrawing consent may limit your ability to use some services. You can re-enable consent at any time by agreeing to our terms when booking.
                  </p>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Communication Preferences Section */}
        <section className="bg-white rounded-2xl shadow-soft border border-charcoal/5 overflow-hidden">
          <div className="p-5 border-b border-charcoal/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-peach/30 flex items-center justify-center">
                <Bell className="w-5 h-5 text-peach-dark" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-charcoal">Communication Preferences</h2>
                <p className="text-sm text-charcoal/60">Control how we communicate with you</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-3">
            {clientData && (
              <>
                {/* Marketing Toggle */}
                <div className="flex items-center justify-between p-4 bg-cream rounded-xl">
                  <div className="flex items-center gap-3">
                    <Megaphone className="w-5 h-5 text-charcoal/40" />
                    <div>
                      <p className="font-medium text-charcoal">Marketing Communications</p>
                      <p className="text-sm text-charcoal/60">
                        Receive promotions, offers, and updates
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUpdateMarketing(!clientData.preferences.optedInMarketing)}
                    disabled={isUpdatingMarketing}
                    className={`relative w-14 h-8 rounded-full transition-colors ${
                      clientData.preferences.optedInMarketing ? 'bg-sage' : 'bg-charcoal/20'
                    }`}
                  >
                    {isUpdatingMarketing ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      </div>
                    ) : (
                      <div
                        className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                          clientData.preferences.optedInMarketing ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    )}
                  </button>
                </div>

                {/* Reminders (read-only display) */}
                <div className="flex items-center justify-between p-4 bg-cream rounded-xl">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-charcoal/40" />
                    <div>
                      <p className="font-medium text-charcoal">Appointment Reminders</p>
                      <p className="text-sm text-charcoal/60">
                        {clientData.preferences.optedInReminders
                          ? 'You will receive reminders before your appointments'
                          : 'Appointment reminders are disabled'}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    clientData.preferences.optedInReminders
                      ? 'bg-sage/20 text-sage-dark'
                      : 'bg-charcoal/10 text-charcoal/60'
                  }`}>
                    {clientData.preferences.optedInReminders ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Data Summary Section */}
        {clientData && (
          <section className="bg-white rounded-2xl shadow-soft border border-charcoal/5 overflow-hidden">
            <div className="p-5 border-b border-charcoal/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-mint/30 flex items-center justify-center">
                  <Info className="w-5 h-5 text-mint-dark" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-charcoal">Data Summary</h2>
                  <p className="text-sm text-charcoal/60">Overview of your stored data</p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-cream rounded-xl">
                  <p className="text-2xl font-bold text-charcoal">{clientData.summary.totalAppointments}</p>
                  <p className="text-sm text-charcoal/60">Appointments</p>
                </div>
                <div className="text-center p-4 bg-cream rounded-xl">
                  <p className="text-2xl font-bold text-charcoal">{clientData.summary.totalPayments}</p>
                  <p className="text-sm text-charcoal/60">Payments</p>
                </div>
                <div className="text-center p-4 bg-cream rounded-xl">
                  <p className="text-2xl font-bold text-charcoal">{clientData.summary.totalReviews}</p>
                  <p className="text-sm text-charcoal/60">Reviews</p>
                </div>
                <div className="text-center p-4 bg-cream rounded-xl">
                  <p className="text-2xl font-bold text-charcoal">{clientData.summary.totalPackages}</p>
                  <p className="text-sm text-charcoal/60">Packages</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Actions Section */}
        <section className="bg-white rounded-2xl shadow-soft border border-charcoal/5 overflow-hidden">
          <div className="p-5 border-b border-charcoal/10">
            <h2 className="text-lg font-semibold text-charcoal">Data Actions</h2>
            <p className="text-sm text-charcoal/60">Download or delete your data</p>
          </div>

          <div className="p-5 space-y-4">
            {/* Download Data Button */}
            <div className="flex items-center justify-between p-4 bg-sage/10 rounded-xl border border-sage/20">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-sage" />
                <div>
                  <p className="font-medium text-charcoal">Download My Data</p>
                  <p className="text-sm text-charcoal/60">
                    Get a copy of all your data in JSON format
                  </p>
                </div>
              </div>
              <button
                onClick={handleExportData}
                disabled={isExporting}
                className="px-5 py-2.5 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download
                  </>
                )}
              </button>
            </div>

            {/* Delete Account Button */}
            <div className="flex items-center justify-between p-4 bg-rose-50 rounded-xl border border-rose-200">
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-rose-500" />
                <div>
                  <p className="font-medium text-charcoal">Delete My Account</p>
                  <p className="text-sm text-charcoal/60">
                    Request deletion with 30-day grace period
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-5 py-2.5 border-2 border-rose-300 text-rose-600 rounded-xl font-medium hover:bg-rose-100 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Request Deletion
              </button>
            </div>
          </div>
        </section>

        {/* Footer Info */}
        <div className="text-center text-sm text-charcoal/50 pb-8">
          <p>
            Questions about your data? Contact the salon directly or email support@peacase.com
          </p>
          <p className="mt-1">
            Your privacy matters to us. Learn more in our{' '}
            <a href="/privacy" className="text-sage hover:underline">Privacy Policy</a>
          </p>
        </div>
      </main>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        isDeleting={isDeleting}
      />
    </div>
  );
}
