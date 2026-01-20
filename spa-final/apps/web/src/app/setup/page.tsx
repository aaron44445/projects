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
  Globe,
  Star,
  Megaphone,
  FileText,
  Calendar,
  ExternalLink,
  Copy,
  Eye,
  Settings,
  Gift,
} from 'lucide-react';

// Setup item types - all 8 optional setup modules
type SetupItem = 'staff' | 'branding' | 'emailTemplates' | 'clientPayments' | 'marketing' | 'reviews' | 'onlineBooking' | 'notifications';

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
  emailTemplates: {
    id: 'emailTemplates',
    title: 'Email Templates',
    subtitle: 'Customize your appointment and marketing emails',
    icon: FileText,
  },
  clientPayments: {
    id: 'clientPayments',
    title: 'Set Up Payments',
    subtitle: 'Configure payment methods and deposits',
    icon: CreditCard,
  },
  marketing: {
    id: 'marketing',
    title: 'Marketing Setup',
    subtitle: 'Configure automated campaigns and promotions',
    icon: Megaphone,
  },
  reviews: {
    id: 'reviews',
    title: 'Reviews & Ratings',
    subtitle: 'Set up review collection and display settings',
    icon: Star,
  },
  onlineBooking: {
    id: 'onlineBooking',
    title: 'Online Booking',
    subtitle: 'Configure your booking widget for your website',
    icon: Globe,
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

// Email Templates form
interface EmailTemplatesFormData {
  confirmationSubject: string;
  confirmationBody: string;
  reminderSubject: string;
  reminderBody: string;
  cancellationSubject: string;
  cancellationBody: string;
  includeBusinessLogo: boolean;
  includeBookingDetails: boolean;
  includeDirections: boolean;
}

// Marketing form
interface MarketingFormData {
  enableWelcomeEmail: boolean;
  welcomeEmailDelay: number;
  enableBirthdayEmail: boolean;
  birthdayDiscount: number;
  enableWinbackEmail: boolean;
  winbackDays: number;
  enableReferrals: boolean;
  referralDiscount: number;
}

// Reviews form
interface ReviewsFormData {
  autoRequestReviews: boolean;
  requestDelayHours: number;
  minimumRatingToShow: number;
  showOnBookingWidget: boolean;
  enableGoogleReviewLink: boolean;
  googleReviewUrl: string;
}

// Online Booking form
interface OnlineBookingFormData {
  allowOnlineBooking: boolean;
  requireDeposit: boolean;
  depositAmount: number;
  allowSameDay: boolean;
  minAdvanceHours: number;
  maxAdvanceDays: number;
  showPrices: boolean;
  showDuration: boolean;
  allowNotes: boolean;
  requirePhone: boolean;
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

  // Email Templates state
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplatesFormData>({
    confirmationSubject: 'Your appointment at {{business_name}} is confirmed',
    confirmationBody: 'Hi {{client_name}},\n\nYour appointment has been confirmed for {{date}} at {{time}}.\n\nService: {{service_name}}\nWith: {{staff_name}}\n\nSee you soon!\n{{business_name}}',
    reminderSubject: 'Reminder: Your appointment is tomorrow',
    reminderBody: 'Hi {{client_name}},\n\nThis is a friendly reminder about your upcoming appointment:\n\n{{date}} at {{time}}\nService: {{service_name}}\n\nSee you soon!\n{{business_name}}',
    cancellationSubject: 'Your appointment has been cancelled',
    cancellationBody: 'Hi {{client_name}},\n\nYour appointment on {{date}} at {{time}} has been cancelled.\n\nIf you need to reschedule, please book again at your convenience.\n\n{{business_name}}',
    includeBusinessLogo: true,
    includeBookingDetails: true,
    includeDirections: false,
  });

  // Marketing state
  const [marketing, setMarketing] = useState<MarketingFormData>({
    enableWelcomeEmail: true,
    welcomeEmailDelay: 0,
    enableBirthdayEmail: true,
    birthdayDiscount: 10,
    enableWinbackEmail: true,
    winbackDays: 60,
    enableReferrals: false,
    referralDiscount: 15,
  });

  // Reviews state
  const [reviews, setReviews] = useState<ReviewsFormData>({
    autoRequestReviews: true,
    requestDelayHours: 24,
    minimumRatingToShow: 4,
    showOnBookingWidget: true,
    enableGoogleReviewLink: false,
    googleReviewUrl: '',
  });

  // Online Booking state
  const [onlineBooking, setOnlineBooking] = useState<OnlineBookingFormData>({
    allowOnlineBooking: true,
    requireDeposit: false,
    depositAmount: 20,
    allowSameDay: true,
    minAdvanceHours: 2,
    maxAdvanceDays: 60,
    showPrices: true,
    showDuration: true,
    allowNotes: true,
    requirePhone: true,
  });

  // Parse URL params on mount
  useEffect(() => {
    const items = searchParams.get('items');
    if (items) {
      const validItems = ['staff', 'branding', 'emailTemplates', 'clientPayments', 'marketing', 'reviews', 'onlineBooking', 'notifications'];
      const parsed = items.split(',').filter((item): item is SetupItem =>
        validItems.includes(item)
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

  const submitEmailTemplates = async () => {
    try {
      await api.patch('/salon', {
        settings: {
          emailTemplates: {
            confirmation: {
              subject: emailTemplates.confirmationSubject,
              body: emailTemplates.confirmationBody,
            },
            reminder: {
              subject: emailTemplates.reminderSubject,
              body: emailTemplates.reminderBody,
            },
            cancellation: {
              subject: emailTemplates.cancellationSubject,
              body: emailTemplates.cancellationBody,
            },
            includeBusinessLogo: emailTemplates.includeBusinessLogo,
            includeBookingDetails: emailTemplates.includeBookingDetails,
            includeDirections: emailTemplates.includeDirections,
          },
        },
      });
      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Failed to save email templates. Please try again.');
      }
      return false;
    }
  };

  const submitMarketing = async () => {
    try {
      await api.patch('/salon', {
        settings: {
          marketing: {
            welcomeEmail: {
              enabled: marketing.enableWelcomeEmail,
              delayHours: marketing.welcomeEmailDelay,
            },
            birthdayEmail: {
              enabled: marketing.enableBirthdayEmail,
              discountPercent: marketing.birthdayDiscount,
            },
            winbackEmail: {
              enabled: marketing.enableWinbackEmail,
              daysInactive: marketing.winbackDays,
            },
            referrals: {
              enabled: marketing.enableReferrals,
              discountPercent: marketing.referralDiscount,
            },
          },
        },
      });
      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Failed to save marketing settings. Please try again.');
      }
      return false;
    }
  };

  const submitReviews = async () => {
    try {
      await api.patch('/salon', {
        settings: {
          reviews: {
            autoRequest: reviews.autoRequestReviews,
            requestDelayHours: reviews.requestDelayHours,
            minimumRatingToShow: reviews.minimumRatingToShow,
            showOnBookingWidget: reviews.showOnBookingWidget,
            googleReview: {
              enabled: reviews.enableGoogleReviewLink,
              url: reviews.googleReviewUrl,
            },
          },
        },
      });
      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Failed to save review settings. Please try again.');
      }
      return false;
    }
  };

  const submitOnlineBooking = async () => {
    try {
      await api.patch('/salon', {
        settings: {
          onlineBooking: {
            enabled: onlineBooking.allowOnlineBooking,
            requireDeposit: onlineBooking.requireDeposit,
            depositAmount: onlineBooking.depositAmount,
            allowSameDay: onlineBooking.allowSameDay,
            minAdvanceHours: onlineBooking.minAdvanceHours,
            maxAdvanceDays: onlineBooking.maxAdvanceDays,
            showPrices: onlineBooking.showPrices,
            showDuration: onlineBooking.showDuration,
            allowNotes: onlineBooking.allowNotes,
            requirePhone: onlineBooking.requirePhone,
          },
        },
      });
      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Failed to save online booking settings. Please try again.');
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
        case 'emailTemplates':
          success = await submitEmailTemplates();
          break;
        case 'clientPayments':
          success = await submitPayments();
          break;
        case 'marketing':
          success = await submitMarketing();
          break;
        case 'reviews':
          success = await submitReviews();
          break;
        case 'onlineBooking':
          success = await submitOnlineBooking();
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

      case 'emailTemplates':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-charcoal mb-2">Email Templates</h3>
              <p className="text-sm text-charcoal/60">
                Customize the emails sent to your clients. Use variables like {'{'}{'{'}'client_name{'}'}{'}'} to personalize messages.
              </p>
            </div>

            {/* Variables Reference */}
            <div className="p-4 bg-sage/5 border border-sage/20 rounded-xl">
              <p className="text-xs font-medium text-sage mb-2">Available Variables:</p>
              <div className="flex flex-wrap gap-2">
                {['{{client_name}}', '{{business_name}}', '{{date}}', '{{time}}', '{{service_name}}', '{{staff_name}}'].map((v) => (
                  <code key={v} className="text-xs bg-sage/10 text-sage px-2 py-1 rounded">{v}</code>
                ))}
              </div>
            </div>

            {/* Confirmation Email */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-charcoal">Booking Confirmation</h4>
              <div>
                <label className="block text-xs text-charcoal/60 mb-1">Subject Line</label>
                <input
                  type="text"
                  value={emailTemplates.confirmationSubject}
                  onChange={(e) => setEmailTemplates({ ...emailTemplates, confirmationSubject: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-charcoal/60 mb-1">Message Body</label>
                <textarea
                  value={emailTemplates.confirmationBody}
                  onChange={(e) => setEmailTemplates({ ...emailTemplates, confirmationBody: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm resize-none"
                />
              </div>
            </div>

            {/* Reminder Email */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-charcoal">Appointment Reminder</h4>
              <div>
                <label className="block text-xs text-charcoal/60 mb-1">Subject Line</label>
                <input
                  type="text"
                  value={emailTemplates.reminderSubject}
                  onChange={(e) => setEmailTemplates({ ...emailTemplates, reminderSubject: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-charcoal/60 mb-1">Message Body</label>
                <textarea
                  value={emailTemplates.reminderBody}
                  onChange={(e) => setEmailTemplates({ ...emailTemplates, reminderBody: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm resize-none"
                />
              </div>
            </div>

            {/* Email Options */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-charcoal">Email Options</h4>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={emailTemplates.includeBusinessLogo}
                  onChange={(e) => setEmailTemplates({ ...emailTemplates, includeBusinessLogo: e.target.checked })}
                  className="w-5 h-5 rounded border-charcoal/20 text-sage focus:ring-sage"
                />
                <span className="text-sm text-charcoal">Include business logo in emails</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={emailTemplates.includeBookingDetails}
                  onChange={(e) => setEmailTemplates({ ...emailTemplates, includeBookingDetails: e.target.checked })}
                  className="w-5 h-5 rounded border-charcoal/20 text-sage focus:ring-sage"
                />
                <span className="text-sm text-charcoal">Include full booking details</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={emailTemplates.includeDirections}
                  onChange={(e) => setEmailTemplates({ ...emailTemplates, includeDirections: e.target.checked })}
                  className="w-5 h-5 rounded border-charcoal/20 text-sage focus:ring-sage"
                />
                <span className="text-sm text-charcoal">Include directions/map link</span>
              </label>
            </div>
          </div>
        );

      case 'marketing':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-charcoal mb-2">Marketing Automation</h3>
              <p className="text-sm text-charcoal/60">
                Set up automated campaigns to keep clients engaged and coming back.
              </p>
            </div>

            {/* Welcome Email */}
            <div className="p-4 rounded-xl border border-charcoal/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-charcoal/60" />
                  <div>
                    <h4 className="font-medium text-charcoal">Welcome Email</h4>
                    <p className="text-xs text-charcoal/50">Send a welcome message to new clients</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketing.enableWelcomeEmail}
                    onChange={(e) => setMarketing({ ...marketing, enableWelcomeEmail: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-charcoal/20 peer-focus:ring-2 peer-focus:ring-sage/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage"></div>
                </label>
              </div>
            </div>

            {/* Birthday Email */}
            <div className="p-4 rounded-xl border border-charcoal/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Gift className="w-5 h-5 text-charcoal/60" />
                  <div>
                    <h4 className="font-medium text-charcoal">Birthday Email</h4>
                    <p className="text-xs text-charcoal/50">Celebrate clients with a special offer</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketing.enableBirthdayEmail}
                    onChange={(e) => setMarketing({ ...marketing, enableBirthdayEmail: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-charcoal/20 peer-focus:ring-2 peer-focus:ring-sage/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage"></div>
                </label>
              </div>
              {marketing.enableBirthdayEmail && (
                <div className="ml-8">
                  <label className="block text-xs text-charcoal/60 mb-1">Birthday discount</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={marketing.birthdayDiscount}
                      onChange={(e) => setMarketing({ ...marketing, birthdayDiscount: parseInt(e.target.value) || 0 })}
                      className="w-20 px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                    />
                    <span className="text-sm text-charcoal/60">% off</span>
                  </div>
                </div>
              )}
            </div>

            {/* Win-back Email */}
            <div className="p-4 rounded-xl border border-charcoal/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-charcoal/60" />
                  <div>
                    <h4 className="font-medium text-charcoal">Win-back Campaign</h4>
                    <p className="text-xs text-charcoal/50">Reach out to inactive clients</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketing.enableWinbackEmail}
                    onChange={(e) => setMarketing({ ...marketing, enableWinbackEmail: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-charcoal/20 peer-focus:ring-2 peer-focus:ring-sage/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage"></div>
                </label>
              </div>
              {marketing.enableWinbackEmail && (
                <div className="ml-8">
                  <label className="block text-xs text-charcoal/60 mb-1">Send after days inactive</label>
                  <select
                    value={marketing.winbackDays}
                    onChange={(e) => setMarketing({ ...marketing, winbackDays: parseInt(e.target.value) })}
                    className="px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                  >
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                    <option value="90">90 days</option>
                    <option value="120">120 days</option>
                  </select>
                </div>
              )}
            </div>

            {/* Referrals */}
            <div className="p-4 rounded-xl border border-charcoal/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-charcoal/60" />
                  <div>
                    <h4 className="font-medium text-charcoal">Referral Program</h4>
                    <p className="text-xs text-charcoal/50">Reward clients for referrals</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketing.enableReferrals}
                    onChange={(e) => setMarketing({ ...marketing, enableReferrals: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-charcoal/20 peer-focus:ring-2 peer-focus:ring-sage/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage"></div>
                </label>
              </div>
              {marketing.enableReferrals && (
                <div className="ml-8">
                  <label className="block text-xs text-charcoal/60 mb-1">Referral discount (for both)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={marketing.referralDiscount}
                      onChange={(e) => setMarketing({ ...marketing, referralDiscount: parseInt(e.target.value) || 0 })}
                      className="w-20 px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                    />
                    <span className="text-sm text-charcoal/60">% off</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'reviews':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-charcoal mb-2">Reviews & Ratings</h3>
              <p className="text-sm text-charcoal/60">
                Collect and display client feedback to build trust and attract new clients.
              </p>
            </div>

            {/* Auto-request reviews */}
            <div className="p-4 rounded-xl border border-charcoal/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-charcoal/60" />
                  <div>
                    <h4 className="font-medium text-charcoal">Automatic Review Requests</h4>
                    <p className="text-xs text-charcoal/50">Request reviews after appointments</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reviews.autoRequestReviews}
                    onChange={(e) => setReviews({ ...reviews, autoRequestReviews: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-charcoal/20 peer-focus:ring-2 peer-focus:ring-sage/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage"></div>
                </label>
              </div>
              {reviews.autoRequestReviews && (
                <div className="ml-8">
                  <label className="block text-xs text-charcoal/60 mb-1">Send request after</label>
                  <select
                    value={reviews.requestDelayHours}
                    onChange={(e) => setReviews({ ...reviews, requestDelayHours: parseInt(e.target.value) })}
                    className="px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                  >
                    <option value="1">1 hour</option>
                    <option value="24">24 hours</option>
                    <option value="48">48 hours</option>
                    <option value="72">3 days</option>
                  </select>
                </div>
              )}
            </div>

            {/* Display settings */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-charcoal">Display Settings</h4>
              <div>
                <label className="block text-xs text-charcoal/60 mb-1">
                  Minimum rating to display publicly
                </label>
                <select
                  value={reviews.minimumRatingToShow}
                  onChange={(e) => setReviews({ ...reviews, minimumRatingToShow: parseInt(e.target.value) })}
                  className="px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                >
                  <option value="1">Show all reviews (1+ stars)</option>
                  <option value="3">Show 3+ star reviews</option>
                  <option value="4">Show 4+ star reviews</option>
                  <option value="5">Show only 5 star reviews</option>
                </select>
              </div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={reviews.showOnBookingWidget}
                  onChange={(e) => setReviews({ ...reviews, showOnBookingWidget: e.target.checked })}
                  className="w-5 h-5 rounded border-charcoal/20 text-sage focus:ring-sage"
                />
                <span className="text-sm text-charcoal">Show reviews on booking widget</span>
              </label>
            </div>

            {/* Google Reviews Link */}
            <div className="p-4 rounded-xl border border-charcoal/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-5 h-5 text-charcoal/60" />
                  <div>
                    <h4 className="font-medium text-charcoal">Google Review Link</h4>
                    <p className="text-xs text-charcoal/50">Also ask clients to review on Google</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reviews.enableGoogleReviewLink}
                    onChange={(e) => setReviews({ ...reviews, enableGoogleReviewLink: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-charcoal/20 peer-focus:ring-2 peer-focus:ring-sage/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage"></div>
                </label>
              </div>
              {reviews.enableGoogleReviewLink && (
                <div className="ml-8">
                  <label className="block text-xs text-charcoal/60 mb-1">Google review URL</label>
                  <input
                    type="url"
                    value={reviews.googleReviewUrl}
                    onChange={(e) => setReviews({ ...reviews, googleReviewUrl: e.target.value })}
                    placeholder="https://g.page/r/your-business/review"
                    className="w-full px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                  />
                  <p className="text-xs text-charcoal/40 mt-1">
                    Find this in Google Business Profile → Share review form
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 'onlineBooking':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-charcoal mb-2">Online Booking Settings</h3>
              <p className="text-sm text-charcoal/60">
                Configure how clients can book appointments through your website.
              </p>
            </div>

            {/* Enable Online Booking */}
            <div className="p-4 rounded-xl border-2 border-sage/30 bg-sage/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-sage" />
                  <div>
                    <h4 className="font-medium text-charcoal">Enable Online Booking</h4>
                    <p className="text-xs text-charcoal/50">Allow clients to book 24/7</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlineBooking.allowOnlineBooking}
                    onChange={(e) => setOnlineBooking({ ...onlineBooking, allowOnlineBooking: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-charcoal/20 peer-focus:ring-2 peer-focus:ring-sage/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage"></div>
                </label>
              </div>
            </div>

            {onlineBooking.allowOnlineBooking && (
              <>
                {/* Booking Rules */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-charcoal">Booking Rules</h4>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={onlineBooking.allowSameDay}
                      onChange={(e) => setOnlineBooking({ ...onlineBooking, allowSameDay: e.target.checked })}
                      className="w-5 h-5 rounded border-charcoal/20 text-sage focus:ring-sage"
                    />
                    <span className="text-sm text-charcoal">Allow same-day bookings</span>
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-charcoal/60 mb-1">Minimum advance notice</label>
                      <select
                        value={onlineBooking.minAdvanceHours}
                        onChange={(e) => setOnlineBooking({ ...onlineBooking, minAdvanceHours: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                      >
                        <option value="1">1 hour</option>
                        <option value="2">2 hours</option>
                        <option value="4">4 hours</option>
                        <option value="12">12 hours</option>
                        <option value="24">24 hours</option>
                        <option value="48">48 hours</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-charcoal/60 mb-1">Maximum advance booking</label>
                      <select
                        value={onlineBooking.maxAdvanceDays}
                        onChange={(e) => setOnlineBooking({ ...onlineBooking, maxAdvanceDays: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                      >
                        <option value="14">2 weeks</option>
                        <option value="30">1 month</option>
                        <option value="60">2 months</option>
                        <option value="90">3 months</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Deposit Settings */}
                <div className="p-4 rounded-xl border border-charcoal/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-charcoal/60" />
                      <div>
                        <h4 className="font-medium text-charcoal">Require Deposit</h4>
                        <p className="text-xs text-charcoal/50">Reduce no-shows with upfront payment</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={onlineBooking.requireDeposit}
                        onChange={(e) => setOnlineBooking({ ...onlineBooking, requireDeposit: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-charcoal/20 peer-focus:ring-2 peer-focus:ring-sage/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage"></div>
                    </label>
                  </div>
                  {onlineBooking.requireDeposit && (
                    <div className="ml-8">
                      <label className="block text-xs text-charcoal/60 mb-1">Deposit amount</label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-charcoal/60">$</span>
                        <input
                          type="number"
                          min="5"
                          max="500"
                          value={onlineBooking.depositAmount}
                          onChange={(e) => setOnlineBooking({ ...onlineBooking, depositAmount: parseInt(e.target.value) || 0 })}
                          className="w-24 px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Display Options */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-charcoal">Display Options</h4>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={onlineBooking.showPrices}
                      onChange={(e) => setOnlineBooking({ ...onlineBooking, showPrices: e.target.checked })}
                      className="w-5 h-5 rounded border-charcoal/20 text-sage focus:ring-sage"
                    />
                    <span className="text-sm text-charcoal">Show service prices</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={onlineBooking.showDuration}
                      onChange={(e) => setOnlineBooking({ ...onlineBooking, showDuration: e.target.checked })}
                      className="w-5 h-5 rounded border-charcoal/20 text-sage focus:ring-sage"
                    />
                    <span className="text-sm text-charcoal">Show service duration</span>
                  </label>
                </div>

                {/* Client Requirements */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-charcoal">Client Requirements</h4>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={onlineBooking.requirePhone}
                      onChange={(e) => setOnlineBooking({ ...onlineBooking, requirePhone: e.target.checked })}
                      className="w-5 h-5 rounded border-charcoal/20 text-sage focus:ring-sage"
                    />
                    <span className="text-sm text-charcoal">Require phone number</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={onlineBooking.allowNotes}
                      onChange={(e) => setOnlineBooking({ ...onlineBooking, allowNotes: e.target.checked })}
                      className="w-5 h-5 rounded border-charcoal/20 text-sage focus:ring-sage"
                    />
                    <span className="text-sm text-charcoal">Allow booking notes</span>
                  </label>
                </div>
              </>
            )}
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
