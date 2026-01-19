'use client';

import { useState, useEffect } from 'react';
import {
  Bell,
  Menu,
  Building2,
  Clock,
  CreditCard,
  Mail,
  Shield,
  Palette,
  Globe,
  ChevronRight,
  Upload,
  Check,
  Lock,
  Sparkles,
  Users,
  BarChart3,
  Loader2,
  AlertCircle,
  Copy,
  Calendar,
  ExternalLink,
  Code,
} from 'lucide-react';
import { useSubscription, AddOnId } from '@/contexts/SubscriptionContext';
import { AppSidebar } from '@/components/AppSidebar';
import { AuthGuard } from '@/components/AuthGuard';
import { useSalon, type Salon } from '@/hooks';

const settingsSections = [
  { id: 'business', name: 'Business Info', icon: Building2, description: 'Company details and address' },
  { id: 'hours', name: 'Business Hours', icon: Clock, description: 'Operating hours and holidays' },
  { id: 'subscription', name: 'Subscription', icon: Sparkles, description: 'Manage your plan and add-ons' },
  { id: 'payments', name: 'Payments', icon: CreditCard, description: 'Payment methods and settings', requiredAddOn: 'payment_processing' as AddOnId },
  { id: 'notifications', name: 'Notifications', icon: Mail, description: 'Email and SMS preferences', requiredAddOn: 'reminders' as AddOnId },
  { id: 'booking', name: 'Online Booking', icon: Globe, description: 'Booking page settings', requiredAddOn: 'online_booking' as AddOnId },
  { id: 'branding', name: 'Branding', icon: Palette, description: 'Colors, logo, and appearance' },
  { id: 'security', name: 'Security', icon: Shield, description: 'Password and access settings' },
];

interface BusinessHour {
  day: string;
  open: string;
  close: string;
  isOpen: boolean;
}

const defaultHours: BusinessHour[] = [
  { day: 'Monday', open: '09:00', close: '18:00', isOpen: true },
  { day: 'Tuesday', open: '09:00', close: '18:00', isOpen: true },
  { day: 'Wednesday', open: '09:00', close: '18:00', isOpen: true },
  { day: 'Thursday', open: '09:00', close: '18:00', isOpen: true },
  { day: 'Friday', open: '09:00', close: '18:00', isOpen: true },
  { day: 'Saturday', open: '10:00', close: '16:00', isOpen: true },
  { day: 'Sunday', open: '10:00', close: '16:00', isOpen: false },
];

function SettingsContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('business');
  const [hours, setHours] = useState<BusinessHour[]>(defaultHours);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { activeAddOns, hasAddOn, setActiveAddOns, monthlyTotal, trialEndsAt, isTrialActive } = useSubscription();

  // API hooks
  const { salon, loading: salonLoading, error: salonError, updateSalon, fetchSalon } = useSalon();

  // Form state for business info - initialize from API data
  const [businessForm, setBusinessForm] = useState({
    name: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    timezone: 'America/Los_Angeles',
    description: '',
  });

  // Branding form state
  const [brandingForm, setBrandingForm] = useState({
    primaryColor: '#C7DCC8',
    backgroundColor: '#FAF8F3',
  });

  // Embed widget customization state
  const [embedSettings, setEmbedSettings] = useState({
    buttonText: 'Book Now',
    buttonColor: '#7C9A82',
    position: 'inline' as 'inline' | 'floating',
  });
  const [embedCopied, setEmbedCopied] = useState(false);
  const [activeInstallTab, setActiveInstallTab] = useState('wordpress');

  // Update form when salon data loads
  useEffect(() => {
    if (salon) {
      setBusinessForm({
        name: salon.name || '',
        phone: salon.phone || '',
        email: salon.email || '',
        website: salon.website || '',
        address: salon.address || '',
        city: salon.city || '',
        state: salon.state || '',
        zip: salon.zip || '',
        timezone: salon.timezone || 'America/Los_Angeles',
        description: salon.description || '',
      });
    }
  }, [salon]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      if (activeSection === 'business') {
        await updateSalon({
          name: businessForm.name,
          phone: businessForm.phone || null,
          email: businessForm.email,
          website: businessForm.website || null,
          address: businessForm.address || null,
          city: businessForm.city || null,
          state: businessForm.state || null,
          zip: businessForm.zip || null,
          timezone: businessForm.timezone,
          description: businessForm.description || null,
        });
      }
      // For hours and other sections, we would call appropriate API endpoints
      // For now, simulate save for other sections
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAddOn = (addOnId: AddOnId) => {
    if (hasAddOn(addOnId)) {
      setActiveAddOns(activeAddOns.filter((id) => id !== addOnId));
    } else {
      setActiveAddOns([...activeAddOns, addOnId]);
    }
  };

  // All available add-ons for the subscription page
  const allAddOns: { id: AddOnId; name: string; price: number; icon: typeof Globe; description: string }[] = [
    { id: 'online_booking', name: 'Online Booking', price: 25, icon: Globe, description: 'Let clients book 24/7 from your website' },
    { id: 'payment_processing', name: 'Payment Processing', price: 25, icon: CreditCard, description: 'Accept cards, Apple Pay, Google Pay' },
    { id: 'reminders', name: 'SMS/Email Reminders', price: 25, icon: Mail, description: 'Reduce no-shows with automated reminders' },
    { id: 'reports', name: 'Reports & Analytics', price: 25, icon: BarChart3, description: 'Revenue dashboards, staff performance' },
    { id: 'reviews', name: 'Reviews & Ratings', price: 25, icon: Users, description: 'Collect and display client reviews' },
    { id: 'memberships', name: 'Packages & Memberships', price: 25, icon: Users, description: 'Sell packages and recurring memberships' },
    { id: 'gift_cards', name: 'Gift Cards', price: 25, icon: CreditCard, description: 'Sell and redeem digital gift cards' },
    { id: 'marketing', name: 'Marketing Automation', price: 25, icon: Sparkles, description: 'Automated campaigns and promotions' },
  ];

  const renderSection = () => {
    // Show loading state for business section
    if (activeSection === 'business' && salonLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-sage mx-auto mb-4" />
            <p className="text-charcoal/60">Loading business information...</p>
          </div>
        </div>
      );
    }

    // Show error state
    if (activeSection === 'business' && salonError) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-charcoal mb-2">Failed to Load Settings</h3>
          <p className="text-charcoal/60 mb-6">{salonError}</p>
          <button
            onClick={fetchSalon}
            className="px-6 py-3 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    switch (activeSection) {
      case 'business':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-charcoal mb-1">Business Information</h2>
              <p className="text-charcoal/60">
                Update your business details. This information appears on invoices and your booking page.
              </p>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Business Name</label>
                  <input
                    type="text"
                    value={businessForm.name}
                    onChange={(e) => setBusinessForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={businessForm.phone}
                    onChange={(e) => setBusinessForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Email Address</label>
                  <input
                    type="email"
                    value={businessForm.email}
                    onChange={(e) => setBusinessForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Website</label>
                  <input
                    type="url"
                    value={businessForm.website}
                    onChange={(e) => setBusinessForm((prev) => ({ ...prev, website: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Street Address</label>
                <input
                  type="text"
                  value={businessForm.address}
                  onChange={(e) => setBusinessForm((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-charcoal mb-2">City</label>
                  <input
                    type="text"
                    value={businessForm.city}
                    onChange={(e) => setBusinessForm((prev) => ({ ...prev, city: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">State</label>
                  <input
                    type="text"
                    value={businessForm.state}
                    onChange={(e) => setBusinessForm((prev) => ({ ...prev, state: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">ZIP Code</label>
                  <input
                    type="text"
                    value={businessForm.zip}
                    onChange={(e) => setBusinessForm((prev) => ({ ...prev, zip: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Timezone</label>
                <select
                  value={businessForm.timezone}
                  onChange={(e) => setBusinessForm((prev) => ({ ...prev, timezone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                >
                  <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                  <option value="America/Denver">Mountain Time (US & Canada)</option>
                  <option value="America/Chicago">Central Time (US & Canada)</option>
                  <option value="America/New_York">Eastern Time (US & Canada)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Business Description</label>
                <textarea
                  rows={3}
                  value={businessForm.description}
                  onChange={(e) => setBusinessForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all resize-none"
                />
              </div>
            </div>
          </div>
        );

      case 'hours':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-charcoal mb-1">Business Hours</h2>
              <p className="text-charcoal/60">
                Set your default operating hours. Staff schedules can override these settings.
              </p>
            </div>

            <div className="space-y-3">
              {hours.map((day, index) => (
                <div
                  key={day.day}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                    day.isOpen ? 'border-sage/30 bg-sage/5' : 'border-charcoal/10 bg-charcoal/5'
                  }`}
                >
                  <div className="w-28 flex-shrink-0">
                    <span className="font-medium text-charcoal">{day.day}</span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={day.isOpen}
                      onChange={(e) => {
                        const updated = [...hours];
                        updated[index].isOpen = e.target.checked;
                        setHours(updated);
                      }}
                      className="w-5 h-5 rounded border-charcoal/20 text-sage focus:ring-sage"
                    />
                    <span className="text-sm text-charcoal/60">Open</span>
                  </label>

                  {day.isOpen && (
                    <div className="flex items-center gap-2 ml-auto">
                      <input
                        type="time"
                        value={day.open}
                        onChange={(e) => {
                          const updated = [...hours];
                          updated[index].open = e.target.value;
                          setHours(updated);
                        }}
                        className="px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                      />
                      <span className="text-charcoal/40">to</span>
                      <input
                        type="time"
                        value={day.close}
                        onChange={(e) => {
                          const updated = [...hours];
                          updated[index].close = e.target.value;
                          setHours(updated);
                        }}
                        className="px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                      />
                    </div>
                  )}

                  {!day.isOpen && (
                    <span className="ml-auto text-sm text-charcoal/40">Closed</span>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 bg-lavender/20 rounded-xl border border-lavender/30">
              <p className="text-sm text-charcoal/70">
                <strong>Note:</strong> To set up holiday closures or special hours, go to Calendar
                and use the Block Time feature.
              </p>
            </div>
          </div>
        );

      case 'subscription':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-charcoal mb-1">Subscription & Add-ons</h2>
              <p className="text-charcoal/60">
                Manage your plan and add or remove features as your business needs change.
              </p>
            </div>

            {/* Current Plan */}
            <div className="bg-gradient-to-br from-sage/10 to-lavender/10 rounded-2xl p-6 border border-sage/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-charcoal">Current Plan</h3>
                  <p className="text-charcoal/60">Essentials + {activeAddOns.length} add-ons</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-charcoal">${monthlyTotal}</p>
                  <p className="text-sm text-charcoal/60">/month</p>
                </div>
              </div>

              {isTrialActive && trialEndsAt && (
                <div className="p-3 bg-sage/20 rounded-lg">
                  <div className="flex items-center gap-2 text-sage-dark">
                    <Sparkles className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      Trial ends {trialEndsAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Active Add-ons */}
            {activeAddOns.length > 0 && (
              <div>
                <h3 className="font-semibold text-charcoal mb-4">Your Active Add-ons</h3>
                <div className="space-y-3">
                  {activeAddOns.map((addOnId) => {
                    const addOn = allAddOns.find((a) => a.id === addOnId);
                    if (!addOn) return null;
                    const Icon = addOn.icon;
                    return (
                      <div
                        key={addOnId}
                        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-sage/30"
                      >
                        <div className="w-10 h-10 rounded-lg bg-sage/20 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-sage" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-charcoal">{addOn.name}</p>
                          <p className="text-sm text-charcoal/60">{addOn.description}</p>
                        </div>
                        <span className="text-sm font-semibold text-charcoal">$25/mo</span>
                        <button
                          onClick={() => toggleAddOn(addOnId)}
                          className="px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available Add-ons */}
            <div>
              <h3 className="font-semibold text-charcoal mb-4">Available Add-ons</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allAddOns
                  .filter((addOn) => !hasAddOn(addOn.id))
                  .map((addOn) => {
                    const Icon = addOn.icon;
                    return (
                      <div
                        key={addOn.id}
                        className="p-4 bg-white rounded-xl border border-charcoal/10 hover:border-sage/30 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-charcoal/5 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-charcoal/60" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-charcoal">{addOn.name}</p>
                              <span className="text-sm font-semibold text-charcoal">+$25/mo</span>
                            </div>
                            <p className="text-sm text-charcoal/60 mb-3">{addOn.description}</p>
                            <button
                              onClick={() => toggleAddOn(addOn.id)}
                              className="px-4 py-2 text-sm bg-sage text-white rounded-lg font-medium hover:bg-sage-dark transition-colors"
                            >
                              Add to Plan
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
              {allAddOns.filter((addOn) => !hasAddOn(addOn.id)).length === 0 && (
                <p className="text-center text-charcoal/60 py-8">
                  You have all available add-ons!
                </p>
              )}
            </div>
          </div>
        );

      case 'payments':
        if (!hasAddOn('payment_processing')) {
          return (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-charcoal/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-charcoal/40" />
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-2">Payment Processing</h3>
              <p className="text-charcoal/60 mb-6 max-w-md mx-auto">
                Accept credit cards, Apple Pay, Google Pay, and more with our integrated payment processing.
              </p>
              <button
                onClick={() => {
                  toggleAddOn('payment_processing');
                  setActiveSection('subscription');
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark transition-all"
              >
                <Sparkles className="w-5 h-5" />
                Add to Your Plan - $25/mo
              </button>
            </div>
          );
        }
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-charcoal mb-1">Payment Settings</h2>
              <p className="text-charcoal/60">
                Manage your payment methods and billing preferences.
              </p>
            </div>

            <div className="space-y-4">
              {/* Stripe */}
              <div className="p-6 bg-white rounded-xl border border-charcoal/10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#635BFF]/10 flex items-center justify-center">
                    <span className="text-[#635BFF] font-bold text-lg">S</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-charcoal">Stripe</h3>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                        Connected
                      </span>
                    </div>
                    <p className="text-sm text-charcoal/60 mb-4">
                      Accept credit cards, Apple Pay, and Google Pay
                    </p>
                    <button className="text-sm text-sage hover:text-sage-dark font-medium">
                      Manage Stripe Account
                    </button>
                  </div>
                </div>
              </div>

              {/* Square */}
              <div className="p-6 bg-white rounded-xl border border-charcoal/10">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-black/5 flex items-center justify-center">
                    <span className="font-bold text-lg">Sq</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-charcoal">Square</h3>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-charcoal/10 text-charcoal/60">
                        Not connected
                      </span>
                    </div>
                    <p className="text-sm text-charcoal/60 mb-4">
                      In-person and online payments with Square
                    </p>
                    <button className="text-sm text-sage hover:text-sage-dark font-medium">
                      Connect Square
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Deposit Settings */}
            <div className="p-6 bg-charcoal/5 rounded-xl">
              <h3 className="font-semibold text-charcoal mb-4">Booking Deposits</h3>
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="mt-1 w-5 h-5 rounded border-charcoal/20 text-sage focus:ring-sage"
                  />
                  <div>
                    <p className="font-medium text-charcoal">Require deposit for online bookings</p>
                    <p className="text-sm text-charcoal/60">
                      Reduce no-shows by collecting a deposit when clients book online
                    </p>
                  </div>
                </label>
                <div className="flex items-center gap-3 ml-8">
                  <label className="text-sm text-charcoal/60">Deposit amount:</label>
                  <select className="px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm">
                    <option value="20">20% of service</option>
                    <option value="50">50% of service</option>
                    <option value="100">Full amount</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        if (!hasAddOn('reminders')) {
          return (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-charcoal/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-charcoal/40" />
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-2">SMS/Email Reminders</h3>
              <p className="text-charcoal/60 mb-6 max-w-md mx-auto">
                Reduce no-shows by sending automated appointment reminders via SMS and email.
              </p>
              <button
                onClick={() => {
                  toggleAddOn('reminders');
                  setActiveSection('subscription');
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark transition-all"
              >
                <Sparkles className="w-5 h-5" />
                Add to Your Plan - $25/mo
              </button>
            </div>
          );
        }
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-charcoal mb-1">Notification Settings</h2>
              <p className="text-charcoal/60">
                Configure how you and your clients receive notifications.
              </p>
            </div>

            {/* Client Notifications */}
            <div className="space-y-4">
              <h3 className="font-semibold text-charcoal">Client Notifications</h3>

              <div className="p-4 bg-white rounded-xl border border-charcoal/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-charcoal">Appointment Confirmation</p>
                    <p className="text-sm text-charcoal/60">Send when booking is confirmed</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-charcoal/20 peer-focus:ring-4 peer-focus:ring-sage/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage"></div>
                  </label>
                </div>
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 px-3 py-2 bg-charcoal/5 rounded-lg cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-charcoal/20 text-sage focus:ring-sage" />
                    <span className="text-sm text-charcoal">Email</span>
                  </label>
                  <label className="flex items-center gap-2 px-3 py-2 bg-charcoal/5 rounded-lg cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-charcoal/20 text-sage focus:ring-sage" />
                    <span className="text-sm text-charcoal">SMS</span>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-charcoal/10">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-charcoal">Appointment Reminder</p>
                    <p className="text-sm text-charcoal/60">Remind clients before their appointment</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-charcoal/20 peer-focus:ring-4 peer-focus:ring-sage/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage"></div>
                  </label>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <label className="text-sm text-charcoal/60">Send reminder:</label>
                  <select className="px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm">
                    <option value="24">24 hours before</option>
                    <option value="48">48 hours before</option>
                    <option value="2">2 hours before</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <label className="flex items-center gap-2 px-3 py-2 bg-charcoal/5 rounded-lg cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-charcoal/20 text-sage focus:ring-sage" />
                    <span className="text-sm text-charcoal">Email</span>
                  </label>
                  <label className="flex items-center gap-2 px-3 py-2 bg-charcoal/5 rounded-lg cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-charcoal/20 text-sage focus:ring-sage" />
                    <span className="text-sm text-charcoal">SMS</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Staff Notifications */}
            <div className="space-y-4">
              <h3 className="font-semibold text-charcoal">Staff Notifications</h3>

              <div className="p-4 bg-white rounded-xl border border-charcoal/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-charcoal">New Booking Alert</p>
                    <p className="text-sm text-charcoal/60">Notify staff when a new booking is made</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-charcoal/20 peer-focus:ring-4 peer-focus:ring-sage/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage"></div>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-charcoal/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-charcoal">Cancellation Alert</p>
                    <p className="text-sm text-charcoal/60">Notify staff when a booking is cancelled</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-charcoal/20 peer-focus:ring-4 peer-focus:ring-sage/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'booking':
        if (!hasAddOn('online_booking')) {
          return (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-charcoal/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-charcoal/40" />
              </div>
              <h3 className="text-xl font-bold text-charcoal mb-2">Online Booking</h3>
              <p className="text-charcoal/60 mb-6 max-w-md mx-auto">
                Let clients book appointments 24/7 from your website with a customizable booking page.
              </p>
              <button
                onClick={() => {
                  toggleAddOn('online_booking');
                  setActiveSection('subscription');
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark transition-all"
              >
                <Sparkles className="w-5 h-5" />
                Add to Your Plan - $25/mo
              </button>
            </div>
          );
        }

        const embedCode = `<script src="https://peacase.com/book.js" data-salon="${salon?.slug || 'your-salon'}"${embedSettings.buttonText !== 'Book Now' ? ` data-text="${embedSettings.buttonText}"` : ''}${embedSettings.buttonColor !== '#7C9A82' ? ` data-color="${embedSettings.buttonColor}"` : ''}${embedSettings.position !== 'inline' ? ` data-position="${embedSettings.position}"` : ''}></script>`;

        const copyEmbedCode = () => {
          navigator.clipboard.writeText(embedCode);
          setEmbedCopied(true);
          setTimeout(() => setEmbedCopied(false), 2000);
        };

        const installInstructions: Record<string, { title: string; steps: string[] }> = {
          wordpress: {
            title: 'WordPress',
            steps: [
              'Go to Appearance → Widgets in your WordPress admin',
              'Add a "Custom HTML" widget to your desired location',
              'Paste the embed code above into the widget',
              'Click Save to publish the booking button',
            ],
          },
          squarespace: {
            title: 'Squarespace',
            steps: [
              'Edit the page where you want the booking button',
              'Click Add Section → choose "Code" block',
              'Paste the embed code above',
              'Click Save to publish',
            ],
          },
          wix: {
            title: 'Wix',
            steps: [
              'In the Wix Editor, click Add → Embed → Custom HTML',
              'Click "Enter Code" and paste the embed code',
              'Adjust the size and position as needed',
              'Click Apply, then Publish your site',
            ],
          },
          shopify: {
            title: 'Shopify',
            steps: [
              'Go to Online Store → Themes → Edit',
              'Add a custom Liquid section or use theme.liquid',
              'Paste the embed code before the closing </body> tag',
              'Save and preview your changes',
            ],
          },
          html: {
            title: 'Generic HTML',
            steps: [
              'Open your website\'s HTML file in a text editor',
              'Paste the embed code before the </body> tag',
              'Save the file and upload to your web server',
              'The booking button will appear where you placed it',
            ],
          },
        };

        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-charcoal mb-1">Online Booking Widget</h2>
              <p className="text-charcoal/60">
                Add a booking button to your website with one line of code.
              </p>
            </div>

            {/* Embed Code Section */}
            <div className="p-6 bg-gradient-to-br from-sage/10 to-lavender/10 rounded-2xl border border-sage/20">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-sage/20 flex items-center justify-center flex-shrink-0">
                  <Code className="w-5 h-5 text-sage" />
                </div>
                <div>
                  <h3 className="font-semibold text-charcoal">Your Embed Code</h3>
                  <p className="text-sm text-charcoal/60">Copy and paste this into your website</p>
                </div>
              </div>
              <div className="relative">
                <pre className="bg-charcoal text-cream p-4 rounded-xl text-sm overflow-x-auto font-mono whitespace-pre-wrap break-all">
                  {embedCode}
                </pre>
                <button
                  onClick={copyEmbedCode}
                  className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {embedCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live Preview */}
            <div className="p-6 bg-white rounded-xl border border-charcoal/10">
              <h3 className="font-semibold text-charcoal mb-4">Live Preview</h3>
              <div className="flex items-center justify-center py-8 bg-charcoal/5 rounded-xl">
                <button
                  style={{ backgroundColor: embedSettings.buttonColor }}
                  className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-xl font-semibold shadow-lg hover:opacity-90 transition-opacity"
                >
                  <Calendar className="w-5 h-5" />
                  {embedSettings.buttonText}
                </button>
              </div>
            </div>

            {/* Customization Options */}
            <div className="p-6 bg-white rounded-xl border border-charcoal/10">
              <h3 className="font-semibold text-charcoal mb-4">Customize Your Button</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Button Text</label>
                  <input
                    type="text"
                    value={embedSettings.buttonText}
                    onChange={(e) => setEmbedSettings(prev => ({ ...prev, buttonText: e.target.value }))}
                    placeholder="Book Now"
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Button Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={embedSettings.buttonColor}
                      onChange={(e) => setEmbedSettings(prev => ({ ...prev, buttonColor: e.target.value }))}
                      className="w-12 h-12 rounded-lg border border-charcoal/20 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={embedSettings.buttonColor}
                      onChange={(e) => setEmbedSettings(prev => ({ ...prev, buttonColor: e.target.value }))}
                      className="flex-1 px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Position</label>
                  <select
                    value={embedSettings.position}
                    onChange={(e) => setEmbedSettings(prev => ({ ...prev, position: e.target.value as 'inline' | 'floating' }))}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage outline-none"
                  >
                    <option value="inline">Inline (where you place it)</option>
                    <option value="floating">Floating (bottom-right corner)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Installation Instructions */}
            <div className="p-6 bg-white rounded-xl border border-charcoal/10">
              <h3 className="font-semibold text-charcoal mb-4">Installation Instructions</h3>

              {/* Platform Tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                {Object.entries(installInstructions).map(([key, { title }]) => (
                  <button
                    key={key}
                    onClick={() => setActiveInstallTab(key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeInstallTab === key
                        ? 'bg-sage text-white'
                        : 'bg-charcoal/5 text-charcoal/70 hover:bg-charcoal/10'
                    }`}
                  >
                    {title}
                  </button>
                ))}
              </div>

              {/* Instructions */}
              <div className="space-y-3">
                {installInstructions[activeInstallTab]?.steps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-sage/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-sage">{index + 1}</span>
                    </div>
                    <p className="text-charcoal/70">{step}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-lavender/20 rounded-xl border border-lavender/30">
                <p className="text-sm text-charcoal/70">
                  <strong>Need help?</strong> Contact our support team and we&apos;ll help you install the booking widget on your website.
                </p>
              </div>
            </div>

            {/* Booking Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-charcoal">Booking Settings</h3>

              <div className="p-4 bg-white rounded-xl border border-charcoal/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium text-charcoal">Accept Online Bookings</p>
                    <p className="text-sm text-charcoal/60">Allow clients to book through your booking page</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-charcoal/20 peer-focus:ring-4 peer-focus:ring-sage/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage"></div>
                  </label>
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-charcoal/10">
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Booking Lead Time
                </label>
                <p className="text-sm text-charcoal/60 mb-3">
                  Minimum time before an appointment can be booked
                </p>
                <select className="px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage outline-none">
                  <option value="1">1 hour</option>
                  <option value="2">2 hours</option>
                  <option value="4">4 hours</option>
                  <option value="24">24 hours</option>
                </select>
              </div>

              <div className="p-4 bg-white rounded-xl border border-charcoal/10">
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Cancellation Policy
                </label>
                <p className="text-sm text-charcoal/60 mb-3">
                  Time before appointment that clients can cancel
                </p>
                <select className="px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage outline-none">
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                  <option value="72">72 hours</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'branding':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-charcoal mb-1">Branding</h2>
              <p className="text-charcoal/60">
                Customize the look of your booking page and client communications.
              </p>
            </div>

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-3">Business Logo</label>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-sage/20 border-2 border-dashed border-sage/40 flex items-center justify-center">
                  {salon?.logoUrl ? (
                    <img
                      src={salon.logoUrl}
                      alt="Business logo"
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <span className="text-sage font-bold text-3xl">
                      {salon?.name?.[0] || 'S'}
                    </span>
                  )}
                </div>
                <div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-charcoal/20 rounded-lg cursor-pointer hover:border-sage transition-colors">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-medium">Upload Logo</span>
                    <input type="file" accept="image/*" className="hidden" />
                  </label>
                  <p className="text-xs text-charcoal/40 mt-2">PNG, JPG up to 5MB. Square works best.</p>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-3">Brand Colors</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-charcoal/60 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandingForm.primaryColor}
                      onChange={(e) => setBrandingForm((prev) => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-12 h-12 rounded-lg border border-charcoal/20 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandingForm.primaryColor}
                      onChange={(e) => setBrandingForm((prev) => ({ ...prev, primaryColor: e.target.value }))}
                      className="flex-1 px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-charcoal/60 mb-2">
                    Background Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={brandingForm.backgroundColor}
                      onChange={(e) => setBrandingForm((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-12 h-12 rounded-lg border border-charcoal/20 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandingForm.backgroundColor}
                      onChange={(e) => setBrandingForm((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                      className="flex-1 px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-charcoal mb-1">Security Settings</h2>
              <p className="text-charcoal/60">
                Manage your account security and access settings.
              </p>
            </div>

            {/* Change Password */}
            <div className="p-6 bg-white rounded-xl border border-charcoal/10">
              <h3 className="font-semibold text-charcoal mb-4">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Current Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">New Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  />
                </div>
                <button className="px-6 py-3 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors">
                  Update Password
                </button>
              </div>
            </div>

            {/* Two-Factor Authentication */}
            <div className="p-6 bg-white rounded-xl border border-charcoal/10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-sage/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-sage" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-charcoal mb-1">Two-Factor Authentication</h3>
                  <p className="text-sm text-charcoal/60 mb-4">
                    Add an extra layer of security to your account by requiring a verification code.
                  </p>
                  <button className="px-4 py-2 border border-sage text-sage rounded-lg font-medium hover:bg-sage/10 transition-colors">
                    Enable 2FA
                  </button>
                </div>
              </div>
            </div>

            {/* Active Sessions */}
            <div className="p-6 bg-white rounded-xl border border-charcoal/10">
              <h3 className="font-semibold text-charcoal mb-4">Active Sessions</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-charcoal/5 rounded-lg">
                  <div>
                    <p className="font-medium text-charcoal text-sm">Chrome on Windows</p>
                    <p className="text-xs text-charcoal/60">
                      {salon?.city || 'Unknown'}, {salon?.state || 'Unknown'} - Current session
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-cream flex">
      <AppSidebar currentPage="settings" sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b border-charcoal/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-charcoal/60 hover:text-charcoal lg:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-charcoal">Settings</h1>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 text-charcoal/60 hover:text-charcoal relative">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Settings Navigation */}
          <div className="w-64 bg-white border-r border-charcoal/10 p-4 hidden lg:block overflow-auto">
            <div className="space-y-1">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                const isLocked = section.requiredAddOn && !hasAddOn(section.requiredAddOn);
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                      activeSection === section.id
                        ? 'bg-sage/10 text-sage'
                        : isLocked
                          ? 'text-charcoal/40 hover:bg-charcoal/5'
                          : 'text-charcoal/70 hover:bg-charcoal/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{section.name}</p>
                    </div>
                    {isLocked ? (
                      <Lock className="w-4 h-4 text-charcoal/30" />
                    ) : (
                      <ChevronRight
                        className={`w-4 h-4 transition-transform ${
                          activeSection === section.id ? 'rotate-90' : ''
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Settings Content */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-3xl mx-auto p-6 lg:p-8">
              {/* Mobile Section Selector */}
              <div className="lg:hidden mb-6">
                <select
                  value={activeSection}
                  onChange={(e) => setActiveSection(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage outline-none"
                >
                  {settingsSections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Section Content */}
              <div className="bg-white rounded-2xl shadow-soft border border-charcoal/5 p-6 lg:p-8">
                {renderSection()}

                {/* Save Button */}
                <div className="mt-8 pt-6 border-t border-charcoal/10 flex items-center justify-between">
                  <div>
                    {saved && (
                      <span className="flex items-center gap-2 text-green-600">
                        <Check className="w-4 h-4" />
                        Settings saved
                      </span>
                    )}
                    {saveError && (
                      <span className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        {saveError}
                      </span>
                    )}
                    {!saved && !saveError && (
                      <p className="text-sm text-charcoal/60">Make sure to save your changes</p>
                    )}
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-6 py-3 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}
