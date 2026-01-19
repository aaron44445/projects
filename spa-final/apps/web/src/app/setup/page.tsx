'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { api, ApiError } from '@/lib/api';
import { AuthGuard } from '@/components/AuthGuard';
import {
  Users,
  Palette,
  CreditCard,
  Bell,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  Mail,
  MessageSquare,
  Clock,
  X,
} from 'lucide-react';

// Setup item types
type SetupItem = 'staff' | 'branding' | 'clientPayments' | 'notifications';

interface SetupStep {
  id: SetupItem;
  title: string;
  subtitle: string;
  icon: React.ElementType;
}

const setupSteps: Record<SetupItem, SetupStep> = {
  staff: {
    id: 'staff',
    title: 'Add Staff Members',
    subtitle: 'Invite your team and set up their schedules',
    icon: Users,
  },
  branding: {
    id: 'branding',
    title: 'Customize Branding',
    subtitle: 'Upload your logo and set brand colors',
    icon: Palette,
  },
  clientPayments: {
    id: 'clientPayments',
    title: 'Set Up Client Payments',
    subtitle: 'Configure payment methods and deposits',
    icon: CreditCard,
  },
  notifications: {
    id: 'notifications',
    title: 'Configure Notifications',
    subtitle: 'Set up reminders and communication preferences',
    icon: Bell,
  },
};

// Staff member form
interface StaffFormData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'staff' | 'admin';
}

// Branding form
interface BrandingFormData {
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
}

// Payments form
interface PaymentsFormData {
  acceptCreditCards: boolean;
  acceptCash: boolean;
  requireDeposit: boolean;
  depositPercent: number;
  taxRate: number;
}

// Notifications form
interface NotificationsFormData {
  emailReminders: boolean;
  smsReminders: boolean;
  reminderHoursBefore: number;
  confirmationEmail: boolean;
  marketingEmails: boolean;
}

function SetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { salon, user } = useAuth();

  // Parse selected items from URL params
  const [selectedItems, setSelectedItems] = useState<SetupItem[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [completedItems, setCompletedItems] = useState<SetupItem[]>([]);

  // Staff state
  const [staffMembers, setStaffMembers] = useState<StaffFormData[]>([
    { id: '1', email: '', firstName: '', lastName: '', phone: '', role: 'staff' },
  ]);

  // Branding state
  const [branding, setBranding] = useState<BrandingFormData>({
    logoUrl: '',
    primaryColor: '#7C9A82',
    accentColor: '#B5A8D5',
    fontFamily: 'Inter',
  });

  // Payments state
  const [payments, setPayments] = useState<PaymentsFormData>({
    acceptCreditCards: true,
    acceptCash: true,
    requireDeposit: false,
    depositPercent: 20,
    taxRate: 0,
  });

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationsFormData>({
    emailReminders: true,
    smsReminders: false,
    reminderHoursBefore: 24,
    confirmationEmail: true,
    marketingEmails: false,
  });

  // Parse URL params on mount
  useEffect(() => {
    const items = searchParams.get('items');
    if (items) {
      const parsed = items.split(',').filter((item): item is SetupItem =>
        ['staff', 'branding', 'clientPayments', 'notifications'].includes(item)
      );
      if (parsed.length > 0) {
        setSelectedItems(parsed);
      } else {
        // No valid items, go to dashboard
        router.push('/dashboard');
      }
    } else {
      // No items specified, go to dashboard
      router.push('/dashboard');
    }
  }, [searchParams, router]);

  const currentItem = selectedItems[currentStepIndex];
  const currentStep = currentItem ? setupSteps[currentItem] : null;
  const isLastStep = currentStepIndex === selectedItems.length - 1;

  // Add staff member
  const addStaffMember = () => {
    setStaffMembers([
      ...staffMembers,
      { id: Date.now().toString(), email: '', firstName: '', lastName: '', phone: '', role: 'staff' },
    ]);
  };

  // Remove staff member
  const removeStaffMember = (id: string) => {
    setStaffMembers(staffMembers.filter((m) => m.id !== id));
  };

  // Update staff member
  const updateStaffMember = (id: string, field: keyof StaffFormData, value: string) => {
    setStaffMembers(
      staffMembers.map((m) => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  // Submit handlers for each step
  const submitStaff = async () => {
    // Filter out empty entries
    const validStaff = staffMembers.filter(
      (m) => m.email.trim() && m.firstName.trim() && m.lastName.trim()
    );

    if (validStaff.length === 0) {
      // Skip if no staff added
      return true;
    }

    try {
      // Create staff members one by one
      for (const member of validStaff) {
        await api.post('/staff', {
          email: member.email,
          firstName: member.firstName,
          lastName: member.lastName,
          phone: member.phone || undefined,
          role: member.role,
        });
      }
      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Failed to add staff members. Please try again.');
      }
      return false;
    }
  };

  const submitBranding = async () => {
    try {
      await api.patch('/salon', {
        settings: {
          branding: {
            logoUrl: branding.logoUrl || undefined,
            primaryColor: branding.primaryColor,
            accentColor: branding.accentColor,
            fontFamily: branding.fontFamily,
          },
        },
      });
      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Failed to save branding. Please try again.');
      }
      return false;
    }
  };

  const submitPayments = async () => {
    try {
      await api.patch('/salon', {
        settings: {
          payments: {
            acceptCreditCards: payments.acceptCreditCards,
            acceptCash: payments.acceptCash,
            requireDeposit: payments.requireDeposit,
            depositPercent: payments.depositPercent,
            taxRate: payments.taxRate,
          },
        },
      });
      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Failed to save payment settings. Please try again.');
      }
      return false;
    }
  };

  const submitNotifications = async () => {
    try {
      await api.patch('/salon', {
        settings: {
          notifications: {
            emailReminders: notifications.emailReminders,
            smsReminders: notifications.smsReminders,
            reminderHoursBefore: notifications.reminderHoursBefore,
            confirmationEmail: notifications.confirmationEmail,
            marketingEmails: notifications.marketingEmails,
          },
        },
      });
      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Failed to save notification settings. Please try again.');
      }
      return false;
    }
  };

  // Handle next step
  const handleNext = async () => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      let success = false;

      switch (currentItem) {
        case 'staff':
          success = await submitStaff();
          break;
        case 'branding':
          success = await submitBranding();
          break;
        case 'clientPayments':
          success = await submitPayments();
          break;
        case 'notifications':
          success = await submitNotifications();
          break;
        default:
          success = true;
      }

      if (!success) {
        return;
      }

      // Mark as completed
      setCompletedItems([...completedItems, currentItem]);

      if (isLastStep) {
        // All done, go to dashboard
        router.push('/dashboard');
      } else {
        // Move to next step
        setCurrentStepIndex(currentStepIndex + 1);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle skip
  const handleSkip = () => {
    if (isLastStep) {
      router.push('/dashboard');
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  // Handle back
  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setSubmitError(null);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentItem) {
      case 'staff':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-charcoal mb-2">Team Members</h3>
              <p className="text-sm text-charcoal/60">
                Add your staff members. They&apos;ll receive an email invitation to join.
              </p>
            </div>

            <div className="space-y-4">
              {staffMembers.map((member, index) => (
                <div
                  key={member.id}
                  className="bg-charcoal/5 rounded-xl p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-charcoal">
                      Staff Member {index + 1}
                    </span>
                    {staffMembers.length > 1 && (
                      <button
                        onClick={() => removeStaffMember(member.id)}
                        className="p-1 text-charcoal/40 hover:text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-charcoal/60 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={member.firstName}
                        onChange={(e) =>
                          updateStaffMember(member.id, 'firstName', e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                        placeholder="Jane"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-charcoal/60 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={member.lastName}
                        onChange={(e) =>
                          updateStaffMember(member.id, 'lastName', e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                        placeholder="Smith"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-charcoal/60 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={member.email}
                        onChange={(e) =>
                          updateStaffMember(member.id, 'email', e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                        placeholder="jane@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-charcoal/60 mb-1">
                        Phone (optional)
                      </label>
                      <input
                        type="tel"
                        value={member.phone}
                        onChange={(e) =>
                          updateStaffMember(member.id, 'phone', e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-charcoal/60 mb-1">
                      Role
                    </label>
                    <select
                      value={member.role}
                      onChange={(e) =>
                        updateStaffMember(member.id, 'role', e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                    >
                      <option value="staff">Staff</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              ))}

              <button
                onClick={addStaffMember}
                className="w-full py-3 border-2 border-dashed border-charcoal/20 rounded-xl text-charcoal/60 hover:border-sage hover:text-sage transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Another Team Member
              </button>
            </div>
          </div>
        );

      case 'branding':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-charcoal mb-2">Brand Identity</h3>
              <p className="text-sm text-charcoal/60">
                Customize how your business appears to clients.
              </p>
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Business Logo
              </label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-charcoal/20 flex items-center justify-center bg-charcoal/5">
                  {branding.logoUrl ? (
                    <img
                      src={branding.logoUrl}
                      alt="Logo"
                      className="w-full h-full object-contain rounded-xl"
                    />
                  ) : (
                    <Upload className="w-8 h-8 text-charcoal/30" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="url"
                    value={branding.logoUrl}
                    onChange={(e) =>
                      setBranding({ ...branding, logoUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                    placeholder="https://your-logo-url.com/logo.png"
                  />
                  <p className="text-xs text-charcoal/50 mt-1">
                    Enter a URL to your logo image (PNG or SVG recommended)
                  </p>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={branding.primaryColor}
                    onChange={(e) =>
                      setBranding({ ...branding, primaryColor: e.target.value })
                    }
                    className="w-12 h-12 rounded-lg border border-charcoal/20 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={branding.primaryColor}
                    onChange={(e) =>
                      setBranding({ ...branding, primaryColor: e.target.value })
                    }
                    className="flex-1 px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={branding.accentColor}
                    onChange={(e) =>
                      setBranding({ ...branding, accentColor: e.target.value })
                    }
                    className="w-12 h-12 rounded-lg border border-charcoal/20 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={branding.accentColor}
                    onChange={(e) =>
                      setBranding({ ...branding, accentColor: e.target.value })
                    }
                    className="flex-1 px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Font */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Font Family
              </label>
              <select
                value={branding.fontFamily}
                onChange={(e) =>
                  setBranding({ ...branding, fontFamily: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
              >
                <option value="Inter">Inter (Modern & Clean)</option>
                <option value="Playfair Display">Playfair Display (Elegant)</option>
                <option value="Lato">Lato (Friendly)</option>
                <option value="Montserrat">Montserrat (Bold)</option>
                <option value="Roboto">Roboto (Neutral)</option>
              </select>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-xl border border-charcoal/10 bg-white">
              <p className="text-xs text-charcoal/50 mb-2">Preview</p>
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: branding.primaryColor + '10' }}
              >
                <h4
                  className="text-lg font-semibold mb-1"
                  style={{ color: branding.primaryColor, fontFamily: branding.fontFamily }}
                >
                  {salon?.name || 'Your Business'}
                </h4>
                <p
                  className="text-sm"
                  style={{ color: branding.accentColor }}
                >
                  Book your appointment today
                </p>
              </div>
            </div>
          </div>
        );

      case 'clientPayments':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-charcoal mb-2">Payment Settings</h3>
              <p className="text-sm text-charcoal/60">
                Configure how you accept payments from clients.
              </p>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-charcoal">
                Accepted Payment Methods
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-charcoal/10 cursor-pointer hover:bg-charcoal/5">
                  <input
                    type="checkbox"
                    checked={payments.acceptCreditCards}
                    onChange={(e) =>
                      setPayments({ ...payments, acceptCreditCards: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-charcoal/20 text-sage focus:ring-sage"
                  />
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-charcoal/60" />
                    <span className="text-sm text-charcoal">Credit/Debit Cards</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-charcoal/10 cursor-pointer hover:bg-charcoal/5">
                  <input
                    type="checkbox"
                    checked={payments.acceptCash}
                    onChange={(e) =>
                      setPayments({ ...payments, acceptCash: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-charcoal/20 text-sage focus:ring-sage"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-charcoal">Cash Payments</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Deposits */}
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={payments.requireDeposit}
                  onChange={(e) =>
                    setPayments({ ...payments, requireDeposit: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-charcoal/20 text-sage focus:ring-sage"
                />
                <span className="text-sm font-medium text-charcoal">
                  Require deposit for bookings
                </span>
              </label>
              {payments.requireDeposit && (
                <div className="ml-8">
                  <label className="block text-xs text-charcoal/60 mb-1">
                    Deposit percentage
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={payments.depositPercent}
                      onChange={(e) =>
                        setPayments({
                          ...payments,
                          depositPercent: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-20 px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                    />
                    <span className="text-sm text-charcoal/60">%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Tax Rate */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Tax Rate
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  value={payments.taxRate}
                  onChange={(e) =>
                    setPayments({
                      ...payments,
                      taxRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-24 px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                />
                <span className="text-sm text-charcoal/60">%</span>
              </div>
              <p className="text-xs text-charcoal/50 mt-1">
                Applied automatically to all services
              </p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> To accept credit card payments, you&apos;ll need to connect
                Stripe in Settings → Payments after completing setup.
              </p>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-charcoal mb-2">Notification Preferences</h3>
              <p className="text-sm text-charcoal/60">
                Configure how you communicate with clients.
              </p>
            </div>

            {/* Reminders */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-charcoal">Appointment Reminders</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-charcoal/10 cursor-pointer hover:bg-charcoal/5">
                  <input
                    type="checkbox"
                    checked={notifications.emailReminders}
                    onChange={(e) =>
                      setNotifications({ ...notifications, emailReminders: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-charcoal/20 text-sage focus:ring-sage"
                  />
                  <Mail className="w-5 h-5 text-charcoal/60" />
                  <span className="text-sm text-charcoal">Email reminders</span>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-charcoal/10 cursor-pointer hover:bg-charcoal/5">
                  <input
                    type="checkbox"
                    checked={notifications.smsReminders}
                    onChange={(e) =>
                      setNotifications({ ...notifications, smsReminders: e.target.checked })
                    }
                    className="w-5 h-5 rounded border-charcoal/20 text-sage focus:ring-sage"
                  />
                  <MessageSquare className="w-5 h-5 text-charcoal/60" />
                  <span className="text-sm text-charcoal">SMS reminders</span>
                  <span className="text-xs bg-sage/10 text-sage px-2 py-0.5 rounded-full ml-auto">
                    Add-on
                  </span>
                </label>
              </div>
            </div>

            {/* Reminder Timing */}
            {(notifications.emailReminders || notifications.smsReminders) && (
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Send reminders
                </label>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-charcoal/40" />
                  <select
                    value={notifications.reminderHoursBefore}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        reminderHoursBefore: parseInt(e.target.value),
                      })
                    }
                    className="px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                  >
                    <option value="2">2 hours before</option>
                    <option value="4">4 hours before</option>
                    <option value="12">12 hours before</option>
                    <option value="24">24 hours before</option>
                    <option value="48">48 hours before</option>
                  </select>
                </div>
              </div>
            )}

            {/* Other Notifications */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-charcoal">Other Notifications</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={notifications.confirmationEmail}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        confirmationEmail: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded border-charcoal/20 text-sage focus:ring-sage"
                  />
                  <span className="text-sm text-charcoal">
                    Send booking confirmation emails
                  </span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={notifications.marketingEmails}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        marketingEmails: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded border-charcoal/20 text-sage focus:ring-sage"
                  />
                  <span className="text-sm text-charcoal">
                    Allow marketing emails to clients
                  </span>
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!currentStep) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage" />
      </div>
    );
  }

  const StepIcon = currentStep.icon;

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-charcoal/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sage to-sage-dark flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="font-display font-bold text-xl text-charcoal">peacase</span>
          </Link>
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-charcoal/60 hover:text-charcoal flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            Skip Setup
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            {selectedItems.map((item, index) => {
              const isComplete = completedItems.includes(item);
              const isCurrent = index === currentStepIndex;
              return (
                <div
                  key={item}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    isComplete
                      ? 'bg-sage'
                      : isCurrent
                        ? 'bg-sage/50'
                        : 'bg-charcoal/10'
                  }`}
                />
              );
            })}
          </div>
          <p className="text-sm text-charcoal/60">
            Step {currentStepIndex + 1} of {selectedItems.length}
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-soft border border-charcoal/5 p-8">
          {/* Step Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-xl bg-sage/10 flex items-center justify-center">
              <StepIcon className="w-7 h-7 text-sage" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-charcoal">{currentStep.title}</h2>
              <p className="text-charcoal/60">{currentStep.subtitle}</p>
            </div>
          </div>

          {/* Step Content */}
          {renderStepContent()}

          {/* Error Message */}
          {submitError && (
            <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl">
              <p className="text-sm text-rose-600">{submitError}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handleBack}
            disabled={currentStepIndex === 0 || isSubmitting}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              currentStepIndex === 0 || isSubmitting
                ? 'text-charcoal/30 cursor-not-allowed'
                : 'text-charcoal hover:bg-charcoal/5'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-white text-charcoal border border-charcoal/20 rounded-xl font-medium hover:border-sage transition-all disabled:opacity-50"
            >
              Skip This Step
            </button>

            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-3 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {isSubmitting
                ? 'Saving...'
                : isLastStep
                  ? 'Finish Setup'
                  : 'Save & Continue'}
              {!isSubmitting && <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <AuthGuard>
      <SetupContent />
    </AuthGuard>
  );
}
