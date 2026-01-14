'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSubscription, AddOnId } from '@/contexts/SubscriptionContext';
import {
  Building2,
  Clock,
  Scissors,
  Users,
  Palette,
  CreditCard,
  Bell,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Plus,
  Trash2,
  Upload,
  Zap,
  Check,
  Lock,
  Calendar,
  Globe,
  BarChart3,
  MessageSquare,
  Gift,
  Star,
  Layers,
  Shield,
} from 'lucide-react';

// Step configuration
const steps = [
  { id: 'plan', title: 'Choose Plan', icon: Zap },
  { id: 'business', title: 'Business Info', icon: Building2 },
  { id: 'hours', title: 'Working Hours', icon: Clock },
  { id: 'services', title: 'Services', icon: Scissors },
  { id: 'staff', title: 'Team', icon: Users },
  { id: 'branding', title: 'Branding', icon: Palette },
  { id: 'clientPayments', title: 'Client Payments', icon: CreditCard },
  { id: 'notifications', title: 'Notifications', icon: Bell },
  { id: 'subscription', title: 'Start Trial', icon: Shield },
  { id: 'complete', title: 'Complete', icon: CheckCircle2 },
];

// Available add-ons
const addOns = [
  { id: 'online_booking', name: 'Online Booking', price: 25, icon: Globe, description: 'Let clients book 24/7 from your website' },
  { id: 'payment_processing', name: 'Payment Processing', price: 25, icon: CreditCard, description: 'Accept cards, Apple Pay, Google Pay' },
  { id: 'reminders', name: 'SMS/Email Reminders', price: 25, icon: MessageSquare, description: 'Reduce no-shows with automated reminders' },
  { id: 'reports', name: 'Reports & Analytics', price: 25, icon: BarChart3, description: 'Revenue dashboards, staff performance' },
  { id: 'reviews', name: 'Reviews & Ratings', price: 25, icon: Star, description: 'Collect and display client reviews' },
  { id: 'memberships', name: 'Packages & Memberships', price: 25, icon: Layers, description: 'Sell packages and recurring memberships' },
  { id: 'gift_cards', name: 'Gift Cards', price: 25, icon: Gift, description: 'Sell and redeem digital gift cards' },
  { id: 'marketing', name: 'Marketing Automation', price: 25, icon: Sparkles, description: 'Automated campaigns and promotions' },
];

const businessTypes = [
  { value: 'salon', label: 'Hair Salon' },
  { value: 'spa', label: 'Day Spa' },
  { value: 'barbershop', label: 'Barbershop' },
  { value: 'nails', label: 'Nail Salon' },
  { value: 'beauty', label: 'Beauty Studio' },
  { value: 'wellness', label: 'Wellness Center' },
  { value: 'med_spa', label: 'Medical Spa' },
  { value: 'other', label: 'Other' },
];

const defaultHours = [
  { day: 'Monday', open: '09:00', close: '18:00', isOpen: true },
  { day: 'Tuesday', open: '09:00', close: '18:00', isOpen: true },
  { day: 'Wednesday', open: '09:00', close: '18:00', isOpen: true },
  { day: 'Thursday', open: '09:00', close: '18:00', isOpen: true },
  { day: 'Friday', open: '09:00', close: '18:00', isOpen: true },
  { day: 'Saturday', open: '10:00', close: '16:00', isOpen: true },
  { day: 'Sunday', open: '10:00', close: '16:00', isOpen: false },
];

const serviceCategories = [
  { name: 'Hair', services: ['Haircut', 'Hair Color', 'Highlights', 'Blowout', 'Hair Treatment'] },
  { name: 'Nails', services: ['Manicure', 'Pedicure', 'Gel Nails', 'Nail Art', 'Acrylic Nails'] },
  { name: 'Skin', services: ['Facial', 'Chemical Peel', 'Microdermabrasion', 'LED Therapy'] },
  { name: 'Body', services: ['Massage', 'Body Wrap', 'Scrub', 'Waxing'] },
  { name: 'Makeup', services: ['Full Makeup', 'Bridal Makeup', 'Lash Extensions', 'Brow Shaping'] },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { setActiveAddOns } = useSubscription();
  const [currentStep, setCurrentStep] = useState(0);
  const [useAI, setUseAI] = useState(false);

  // Plan selection state
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

  // Subscription payment state
  const [subscriptionInfo, setSubscriptionInfo] = useState({
    cardNumber: '',
    expiry: '',
    cvc: '',
    nameOnCard: '',
  });
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});

  const validateCard = () => {
    const errors: Record<string, string> = {};

    // Card number validation (16 digits)
    const cardDigits = subscriptionInfo.cardNumber.replace(/\s/g, '');
    if (!cardDigits) {
      errors.cardNumber = 'Card number is required';
    } else if (cardDigits.length !== 16 || !/^\d+$/.test(cardDigits)) {
      errors.cardNumber = 'Enter a valid 16-digit card number';
    }

    // Expiry validation (MM/YY format)
    if (!subscriptionInfo.expiry) {
      errors.expiry = 'Expiry date is required';
    } else if (!/^\d{2}\/\d{2}$/.test(subscriptionInfo.expiry)) {
      errors.expiry = 'Use MM/YY format';
    } else {
      const [month, year] = subscriptionInfo.expiry.split('/').map(Number);
      const now = new Date();
      const expDate = new Date(2000 + year, month - 1);
      if (month < 1 || month > 12) {
        errors.expiry = 'Invalid month';
      } else if (expDate < now) {
        errors.expiry = 'Card has expired';
      }
    }

    // CVC validation (3-4 digits)
    if (!subscriptionInfo.cvc) {
      errors.cvc = 'CVC is required';
    } else if (!/^\d{3,4}$/.test(subscriptionInfo.cvc)) {
      errors.cvc = 'Enter a valid CVC';
    }

    // Name validation
    if (!subscriptionInfo.nameOnCard.trim()) {
      errors.nameOnCard = 'Name on card is required';
    }

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns((prev) =>
      prev.includes(addOnId) ? prev.filter((id) => id !== addOnId) : [...prev, addOnId]
    );
  };

  const calculateMonthlyTotal = () => {
    const basePlanPrice = 50;
    const addOnsPrice = selectedAddOns.length * 25;
    return basePlanPrice + addOnsPrice;
  };

  // Form state
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    type: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    description: '',
  });

  const [hours, setHours] = useState(defaultHours);

  const [services, setServices] = useState<
    Array<{ name: string; duration: number; price: number; category: string }>
  >([]);

  const [staff, setStaff] = useState<
    Array<{ name: string; email: string; role: string; services: string[] }>
  >([]);

  const [branding, setBranding] = useState({
    primaryColor: '#C7DCC8',
    secondaryColor: '#FAF8F3',
    logo: null as File | null,
  });

  const [payments, setPayments] = useState({
    stripe: false,
    square: false,
    paypal: false,
    cash: true,
    depositRequired: false,
    depositPercentage: 20,
  });

  const [notifications, setNotifications] = useState({
    appointmentReminders: true,
    reminderTiming: '24',
    marketingEmails: true,
    smsNotifications: true,
    emailNotifications: true,
  });

  const nextStep = () => {
    // When completing the subscription step, validate card and save the add-ons
    if (steps[currentStep].id === 'subscription') {
      if (!validateCard()) {
        return; // Don't proceed if card validation fails
      }
      setActiveAddOns(selectedAddOns as AddOnId[]);
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addService = () => {
    setServices([...services, { name: '', duration: 30, price: 0, category: '' }]);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: string, value: string | number) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  const addStaffMember = () => {
    setStaff([...staff, { name: '', email: '', role: 'staff', services: [] }]);
  };

  const removeStaffMember = (index: number) => {
    setStaff(staff.filter((_, i) => i !== index));
  };

  const updateStaffMember = (index: number, field: string, value: string | string[]) => {
    const updated = [...staff];
    updated[index] = { ...updated[index], [field]: value };
    setStaff(updated);
  };

  const addQuickServices = (category: string, serviceNames: string[]) => {
    const newServices = serviceNames.map((name) => ({
      name,
      duration: 30,
      price: 50,
      category,
    }));
    setServices([...services, ...newServices]);
  };

  const renderStep = () => {
    switch (steps[currentStep].id) {
      case 'plan':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-charcoal mb-2">Choose your plan</h2>
              <p className="text-charcoal/60">
                Start with the Essentials plan, then add only the features you need. Your 14-day free trial includes everything.
              </p>
            </div>

            {/* Base Plan */}
            <div className="bg-gradient-to-br from-sage/10 to-sage/5 rounded-2xl p-6 border-2 border-sage/30">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-charcoal">Essentials</h3>
                    <span className="px-2 py-0.5 bg-sage text-white text-xs font-medium rounded-full">
                      Included
                    </span>
                  </div>
                  <p className="text-charcoal/60">Everything you need to get started</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-charcoal">$50</p>
                  <p className="text-sm text-charcoal/60">/month</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  'Calendar & Scheduling',
                  'Client Management',
                  'Staff Management (up to 10)',
                  'Service Management',
                  'Basic Dashboard',
                  'Mobile Responsive',
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sage" />
                    <span className="text-sm text-charcoal">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Add-ons Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-charcoal">Add-on Features</h3>
                  <p className="text-sm text-charcoal/60">$25/month each - only pay for what you use</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-charcoal/60">Selected: {selectedAddOns.length}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addOns.map((addOn) => {
                  const Icon = addOn.icon;
                  const isSelected = selectedAddOns.includes(addOn.id);
                  return (
                    <div
                      key={addOn.id}
                      onClick={() => toggleAddOn(addOn.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-sage bg-sage/5'
                          : 'border-charcoal/10 hover:border-sage/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-sage text-white' : 'bg-charcoal/5 text-charcoal/60'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-charcoal">{addOn.name}</h4>
                            <span className="text-sm font-semibold text-charcoal">+$25</span>
                          </div>
                          <p className="text-sm text-charcoal/60">{addOn.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total */}
            <div className="bg-charcoal rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/80">Your monthly total</span>
                <div className="text-right">
                  <p className="text-3xl font-bold">${calculateMonthlyTotal()}</p>
                  <p className="text-sm text-white/60">/month after trial</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-4 border-t border-white/20">
                <Sparkles className="w-5 h-5 text-sage-light" />
                <span className="text-sm">Start with a 14-day free trial - no charge today</span>
              </div>
            </div>
          </div>
        );

      case 'business':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-charcoal mb-2">Tell us about your business</h2>
              <p className="text-charcoal/60">
                This information will be used on your booking page and invoices.
              </p>
            </div>

            {/* AI Assistant Toggle */}
            <div className="bg-gradient-to-r from-sage/20 to-lavender/20 rounded-2xl p-6 border border-sage/30">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sage to-sage-dark flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-charcoal mb-1">AI-Guided Setup</h3>
                  <p className="text-sm text-charcoal/60 mb-4">
                    Let our AI assistant help you set up faster by suggesting services, pricing, and
                    settings based on your business type.
                  </p>
                  <button
                    onClick={() => setUseAI(!useAI)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      useAI
                        ? 'bg-sage text-white'
                        : 'bg-white text-charcoal border border-charcoal/20 hover:border-sage'
                    }`}
                  >
                    {useAI ? 'AI Enabled' : 'Enable AI Assistant'}
                  </button>
                </div>
              </div>
            </div>

            {/* Business Type Selection */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-3">Business Type</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {businessTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setBusinessInfo({ ...businessInfo, type: type.value })}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      businessInfo.type === type.value
                        ? 'border-sage bg-sage/10'
                        : 'border-charcoal/10 hover:border-sage/50'
                    }`}
                  >
                    <span className="font-medium text-charcoal">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Business Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Business Name</label>
                <input
                  type="text"
                  value={businessInfo.name}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  placeholder="Serenity Spa & Salon"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={businessInfo.phone}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Email Address</label>
                <input
                  type="email"
                  value={businessInfo.email}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  placeholder="hello@yoursalon.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Website (optional)
                </label>
                <input
                  type="url"
                  value={businessInfo.website}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, website: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  placeholder="https://yoursalon.com"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">Street Address</label>
                <input
                  type="text"
                  value={businessInfo.address}
                  onChange={(e) => setBusinessInfo({ ...businessInfo, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                  placeholder="123 Main Street"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-charcoal mb-2">City</label>
                  <input
                    type="text"
                    value={businessInfo.city}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, city: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                    placeholder="Los Angeles"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">State</label>
                  <input
                    type="text"
                    value={businessInfo.state}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, state: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                    placeholder="CA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">ZIP Code</label>
                  <input
                    type="text"
                    value={businessInfo.zip}
                    onChange={(e) => setBusinessInfo({ ...businessInfo, zip: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                    placeholder="90210"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Business Description (optional)
              </label>
              <textarea
                value={businessInfo.description}
                onChange={(e) => setBusinessInfo({ ...businessInfo, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all resize-none"
                placeholder="Tell clients what makes your business special..."
              />
            </div>
          </div>
        );

      case 'hours':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-charcoal mb-2">Set your working hours</h2>
              <p className="text-charcoal/60">
                These are your default business hours. Staff can have individual schedules.
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

            <div className="bg-lavender/20 rounded-xl p-4 border border-lavender/30">
              <p className="text-sm text-charcoal/70">
                <strong>Tip:</strong> You can customize hours for specific staff members, holidays,
                and special events later in Settings.
              </p>
            </div>
          </div>
        );

      case 'services':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-charcoal mb-2">Add your services</h2>
              <p className="text-charcoal/60">
                Create your service menu. You can always add or edit services later.
              </p>
            </div>

            {/* Quick Add Sections */}
            {useAI && (
              <div className="bg-gradient-to-r from-sage/10 to-lavender/10 rounded-2xl p-6 border border-sage/20">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-5 h-5 text-sage" />
                  <h3 className="font-semibold text-charcoal">Quick Add Popular Services</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {serviceCategories.map((cat) => (
                    <button
                      key={cat.name}
                      onClick={() => addQuickServices(cat.name, cat.services)}
                      className="px-4 py-2 rounded-lg bg-white border border-charcoal/10 hover:border-sage hover:bg-sage/5 transition-all text-sm font-medium text-charcoal"
                    >
                      Add {cat.name} Services
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Services List */}
            <div className="space-y-4">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl border border-charcoal/10 p-4 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-charcoal/60 mb-1">
                          Service Name
                        </label>
                        <input
                          type="text"
                          value={service.name}
                          onChange={(e) => updateService(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                          placeholder="e.g., Haircut"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-charcoal/60 mb-1">
                          Duration (min)
                        </label>
                        <select
                          value={service.duration}
                          onChange={(e) =>
                            updateService(index, 'duration', parseInt(e.target.value))
                          }
                          className="w-full px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                        >
                          {[15, 30, 45, 60, 75, 90, 120, 150, 180].map((min) => (
                            <option key={min} value={min}>
                              {min} min
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-charcoal/60 mb-1">
                          Price
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40">
                            $
                          </span>
                          <input
                            type="number"
                            value={service.price}
                            onChange={(e) =>
                              updateService(index, 'price', parseFloat(e.target.value) || 0)
                            }
                            className="w-full pl-7 pr-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeService(index)}
                      className="p-2 text-charcoal/40 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}

              {services.length === 0 && (
                <div className="text-center py-12 bg-charcoal/5 rounded-xl border-2 border-dashed border-charcoal/20">
                  <Scissors className="w-12 h-12 text-charcoal/30 mx-auto mb-4" />
                  <p className="text-charcoal/60 mb-4">No services added yet</p>
                  <button
                    onClick={addService}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Your First Service
                  </button>
                </div>
              )}

              {services.length > 0 && (
                <button
                  onClick={addService}
                  className="w-full py-3 border-2 border-dashed border-charcoal/20 rounded-xl text-charcoal/60 hover:border-sage hover:text-sage transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Another Service
                </button>
              )}
            </div>
          </div>
        );

      case 'staff':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-charcoal mb-2">Add your team</h2>
              <p className="text-charcoal/60">
                Add staff members who will provide services. Skip this step if you work solo.
              </p>
            </div>

            {/* Staff List */}
            <div className="space-y-4">
              {staff.map((member, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl border border-charcoal/10 p-4 shadow-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-charcoal/60 mb-1">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => updateStaffMember(index, 'name', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                          placeholder="Jane Smith"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-charcoal/60 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={member.email}
                          onChange={(e) => updateStaffMember(index, 'email', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                          placeholder="jane@email.com"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-charcoal/60 mb-1">
                          Role
                        </label>
                        <select
                          value={member.role}
                          onChange={(e) => updateStaffMember(index, 'role', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                        >
                          <option value="staff">Staff</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={() => removeStaffMember(index)}
                      className="p-2 text-charcoal/40 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}

              {staff.length === 0 && (
                <div className="text-center py-12 bg-charcoal/5 rounded-xl border-2 border-dashed border-charcoal/20">
                  <Users className="w-12 h-12 text-charcoal/30 mx-auto mb-4" />
                  <p className="text-charcoal/60 mb-2">No team members added</p>
                  <p className="text-sm text-charcoal/40 mb-4">
                    Working solo? You can skip this step.
                  </p>
                  <button
                    onClick={addStaffMember}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Team Member
                  </button>
                </div>
              )}

              {staff.length > 0 && (
                <button
                  onClick={addStaffMember}
                  className="w-full py-3 border-2 border-dashed border-charcoal/20 rounded-xl text-charcoal/60 hover:border-sage hover:text-sage transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Another Team Member
                </button>
              )}
            </div>

            <div className="bg-peach/20 rounded-xl p-4 border border-peach/30">
              <p className="text-sm text-charcoal/70">
                <strong>Note:</strong> Team members will receive an email invitation to create their
                account and set up their personal schedule.
              </p>
            </div>
          </div>
        );

      case 'branding':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-charcoal mb-2">Customize your brand</h2>
              <p className="text-charcoal/60">
                Make your booking page match your brand identity.
              </p>
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-3">Business Logo</label>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-2xl bg-charcoal/5 border-2 border-dashed border-charcoal/20 flex items-center justify-center overflow-hidden">
                  {branding.logo ? (
                    <img
                      src={URL.createObjectURL(branding.logo)}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Upload className="w-8 h-8 text-charcoal/30" />
                  )}
                </div>
                <div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-charcoal/20 rounded-lg cursor-pointer hover:border-sage transition-colors">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-medium">Upload Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setBranding({ ...branding, logo: file });
                        }
                      }}
                    />
                  </label>
                  <p className="text-xs text-charcoal/40 mt-2">PNG, JPG up to 5MB. Square works best.</p>
                </div>
              </div>
            </div>

            {/* Color Selection */}
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
                      value={branding.primaryColor}
                      onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                      className="w-12 h-12 rounded-lg border border-charcoal/20 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={branding.primaryColor}
                      onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
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
                      value={branding.secondaryColor}
                      onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                      className="w-12 h-12 rounded-lg border border-charcoal/20 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={branding.secondaryColor}
                      onChange={(e) =>
                        setBranding({ ...branding, secondaryColor: e.target.value })
                      }
                      className="flex-1 px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-charcoal mb-3">Preview</label>
              <div
                className="rounded-2xl p-6 border"
                style={{ backgroundColor: branding.secondaryColor }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: branding.primaryColor }}
                  >
                    {businessInfo.name?.[0] || 'S'}
                  </div>
                  <span className="font-semibold text-charcoal">
                    {businessInfo.name || 'Your Salon'}
                  </span>
                </div>
                <button
                  className="px-6 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: branding.primaryColor }}
                >
                  Book Now
                </button>
              </div>
            </div>
          </div>
        );

      case 'clientPayments':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-charcoal mb-2">Accept client payments</h2>
              <p className="text-charcoal/60">
                Choose how you want to accept payments from your clients.
              </p>
            </div>

            {/* Payment Methods */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-charcoal">Payment Methods</label>

              <div
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  payments.stripe ? 'border-sage bg-sage/5' : 'border-charcoal/10 hover:border-sage/50'
                }`}
                onClick={() => setPayments({ ...payments, stripe: !payments.stripe })}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#635BFF]/10 flex items-center justify-center">
                    <span className="text-[#635BFF] font-bold text-lg">S</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-charcoal">Stripe</h3>
                    <p className="text-sm text-charcoal/60">
                      Credit/debit cards, Apple Pay, Google Pay
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={payments.stripe}
                    onChange={() => {}}
                    className="w-5 h-5 rounded border-charcoal/20 text-sage focus:ring-sage"
                  />
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  payments.square ? 'border-sage bg-sage/5' : 'border-charcoal/10 hover:border-sage/50'
                }`}
                onClick={() => setPayments({ ...payments, square: !payments.square })}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-black/5 flex items-center justify-center">
                    <span className="font-bold text-lg">Sq</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-charcoal">Square</h3>
                    <p className="text-sm text-charcoal/60">In-person and online payments</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={payments.square}
                    onChange={() => {}}
                    className="w-5 h-5 rounded border-charcoal/20 text-sage focus:ring-sage"
                  />
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  payments.paypal ? 'border-sage bg-sage/5' : 'border-charcoal/10 hover:border-sage/50'
                }`}
                onClick={() => setPayments({ ...payments, paypal: !payments.paypal })}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#003087]/10 flex items-center justify-center">
                    <span className="text-[#003087] font-bold text-lg">P</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-charcoal">PayPal</h3>
                    <p className="text-sm text-charcoal/60">PayPal and Venmo payments</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={payments.paypal}
                    onChange={() => {}}
                    className="w-5 h-5 rounded border-charcoal/20 text-sage focus:ring-sage"
                  />
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  payments.cash ? 'border-sage bg-sage/5' : 'border-charcoal/10 hover:border-sage/50'
                }`}
                onClick={() => setPayments({ ...payments, cash: !payments.cash })}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-sage/10 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-sage" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-charcoal">Cash / Pay at Location</h3>
                    <p className="text-sm text-charcoal/60">Accept payment in person</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={payments.cash}
                    onChange={() => {}}
                    className="w-5 h-5 rounded border-charcoal/20 text-sage focus:ring-sage"
                  />
                </div>
              </div>
            </div>

            {/* Deposit Settings */}
            <div className="bg-charcoal/5 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={payments.depositRequired}
                  onChange={(e) =>
                    setPayments({ ...payments, depositRequired: e.target.checked })
                  }
                  className="w-5 h-5 mt-1 rounded border-charcoal/20 text-sage focus:ring-sage"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-charcoal">Require booking deposit</h3>
                  <p className="text-sm text-charcoal/60 mb-4">
                    Reduce no-shows by collecting a deposit when clients book online.
                  </p>
                  {payments.depositRequired && (
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-charcoal/60">Deposit amount:</label>
                      <select
                        value={payments.depositPercentage}
                        onChange={(e) =>
                          setPayments({
                            ...payments,
                            depositPercentage: parseInt(e.target.value),
                          })
                        }
                        className="px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                      >
                        <option value={10}>10% of service</option>
                        <option value={20}>20% of service</option>
                        <option value={50}>50% of service</option>
                        <option value={100}>Full amount</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-charcoal mb-2">Notification preferences</h2>
              <p className="text-charcoal/60">
                Configure how you and your clients receive updates.
              </p>
            </div>

            {/* Client Notifications */}
            <div className="space-y-4">
              <h3 className="font-semibold text-charcoal">Client Notifications</h3>

              <div className="bg-white rounded-xl border border-charcoal/10 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-charcoal">Appointment Reminders</h4>
                    <p className="text-sm text-charcoal/60">
                      Automatically remind clients about upcoming appointments
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.appointmentReminders}
                      onChange={(e) =>
                        setNotifications({
                          ...notifications,
                          appointmentReminders: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-charcoal/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sage/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage"></div>
                  </label>
                </div>

                {notifications.appointmentReminders && (
                  <div className="flex items-center gap-3 pt-4 border-t border-charcoal/10">
                    <label className="text-sm text-charcoal/60">Send reminder:</label>
                    <select
                      value={notifications.reminderTiming}
                      onChange={(e) =>
                        setNotifications({ ...notifications, reminderTiming: e.target.value })
                      }
                      className="px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                    >
                      <option value="1">1 hour before</option>
                      <option value="2">2 hours before</option>
                      <option value="24">24 hours before</option>
                      <option value="48">48 hours before</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-charcoal/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-charcoal">Marketing Emails</h4>
                    <p className="text-sm text-charcoal/60">
                      Send promotional emails and special offers to clients
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.marketingEmails}
                      onChange={(e) =>
                        setNotifications({ ...notifications, marketingEmails: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-charcoal/20 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sage/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Notification Channels */}
            <div className="space-y-4">
              <h3 className="font-semibold text-charcoal">Notification Channels</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    notifications.emailNotifications
                      ? 'border-sage bg-sage/5'
                      : 'border-charcoal/10'
                  }`}
                  onClick={() =>
                    setNotifications({
                      ...notifications,
                      emailNotifications: !notifications.emailNotifications,
                    })
                  }
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={notifications.emailNotifications}
                      onChange={() => {}}
                      className="w-5 h-5 rounded border-charcoal/20 text-sage focus:ring-sage"
                    />
                    <div>
                      <h4 className="font-medium text-charcoal">Email</h4>
                      <p className="text-sm text-charcoal/60">Detailed notifications via email</p>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    notifications.smsNotifications
                      ? 'border-sage bg-sage/5'
                      : 'border-charcoal/10'
                  }`}
                  onClick={() =>
                    setNotifications({
                      ...notifications,
                      smsNotifications: !notifications.smsNotifications,
                    })
                  }
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={notifications.smsNotifications}
                      onChange={() => {}}
                      className="w-5 h-5 rounded border-charcoal/20 text-sage focus:ring-sage"
                    />
                    <div>
                      <h4 className="font-medium text-charcoal">SMS</h4>
                      <p className="text-sm text-charcoal/60">Quick text message reminders</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'subscription':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-charcoal mb-2">Start your free trial</h2>
              <p className="text-charcoal/60">
                Add a payment method to start your 14-day free trial. You won&apos;t be charged until your trial ends.
              </p>
            </div>

            {/* Plan Summary */}
            <div className="bg-gradient-to-br from-sage/10 to-lavender/10 rounded-2xl p-6 border border-sage/20">
              <h3 className="font-semibold text-charcoal mb-4">Your Plan</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-charcoal/10">
                  <span className="text-charcoal">Essentials (base plan)</span>
                  <span className="font-semibold text-charcoal">$50/mo</span>
                </div>
                {selectedAddOns.length > 0 && (
                  <>
                    {selectedAddOns.map((addOnId) => {
                      const addOn = addOns.find((a) => a.id === addOnId);
                      return (
                        <div key={addOnId} className="flex items-center justify-between text-sm">
                          <span className="text-charcoal/70">{addOn?.name}</span>
                          <span className="text-charcoal">$25/mo</span>
                        </div>
                      );
                    })}
                  </>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-charcoal/10">
                  <span className="font-semibold text-charcoal">Monthly Total</span>
                  <span className="text-xl font-bold text-charcoal">${calculateMonthlyTotal()}/mo</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-sage/20 rounded-lg">
                <div className="flex items-center gap-2 text-sage-dark">
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm font-medium">14-day free trial - first charge on Feb 27, 2026</span>
                </div>
              </div>
            </div>

            {/* Payment Form */}
            <div className="space-y-6">
              <h3 className="font-semibold text-charcoal">Payment Method</h3>

              <div className="bg-white rounded-xl border border-charcoal/10 p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Card Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={subscriptionInfo.cardNumber}
                      onChange={(e) => {
                        // Format card number with spaces
                        const value = e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
                        setSubscriptionInfo({ ...subscriptionInfo, cardNumber: value.slice(0, 19) });
                        if (cardErrors.cardNumber) setCardErrors({ ...cardErrors, cardNumber: '' });
                      }}
                      placeholder="1234 5678 9012 3456"
                      className={`w-full px-4 py-3 rounded-lg border ${cardErrors.cardNumber ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-charcoal/20 focus:border-sage focus:ring-sage/20'} focus:ring-2 outline-none transition-all`}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <div className="w-8 h-5 bg-[#1A1F71] rounded text-white text-xs flex items-center justify-center font-bold">
                        VISA
                      </div>
                      <div className="w-8 h-5 bg-gradient-to-r from-[#EB001B] to-[#F79E1B] rounded" />
                    </div>
                  </div>
                  {cardErrors.cardNumber && (
                    <p className="text-sm text-rose-500 mt-1">{cardErrors.cardNumber}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">
                      Expiry Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={subscriptionInfo.expiry}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + '/' + value.slice(2, 4);
                        }
                        setSubscriptionInfo({ ...subscriptionInfo, expiry: value });
                        if (cardErrors.expiry) setCardErrors({ ...cardErrors, expiry: '' });
                      }}
                      placeholder="MM/YY"
                      maxLength={5}
                      className={`w-full px-4 py-3 rounded-lg border ${cardErrors.expiry ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-charcoal/20 focus:border-sage focus:ring-sage/20'} focus:ring-2 outline-none transition-all`}
                    />
                    {cardErrors.expiry && (
                      <p className="text-sm text-rose-500 mt-1">{cardErrors.expiry}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">
                      CVC <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={subscriptionInfo.cvc}
                        onChange={(e) => {
                          setSubscriptionInfo({ ...subscriptionInfo, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) });
                          if (cardErrors.cvc) setCardErrors({ ...cardErrors, cvc: '' });
                        }}
                        placeholder="123"
                        maxLength={4}
                        className={`w-full px-4 py-3 rounded-lg border ${cardErrors.cvc ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-charcoal/20 focus:border-sage focus:ring-sage/20'} focus:ring-2 outline-none transition-all`}
                      />
                      <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/30" />
                    </div>
                    {cardErrors.cvc && (
                      <p className="text-sm text-rose-500 mt-1">{cardErrors.cvc}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Name on Card <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={subscriptionInfo.nameOnCard}
                    onChange={(e) => {
                      setSubscriptionInfo({ ...subscriptionInfo, nameOnCard: e.target.value });
                      if (cardErrors.nameOnCard) setCardErrors({ ...cardErrors, nameOnCard: '' });
                    }}
                    placeholder="John Smith"
                    className={`w-full px-4 py-3 rounded-lg border ${cardErrors.nameOnCard ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-charcoal/20 focus:border-sage focus:ring-sage/20'} focus:ring-2 outline-none transition-all`}
                  />
                  {cardErrors.nameOnCard && (
                    <p className="text-sm text-rose-500 mt-1">{cardErrors.nameOnCard}</p>
                  )}
                </div>
              </div>

              {/* Security Notice */}
              <div className="flex items-start gap-3 p-4 bg-charcoal/5 rounded-xl">
                <Shield className="w-5 h-5 text-sage mt-0.5" />
                <div className="text-sm text-charcoal/70">
                  <p className="font-medium text-charcoal mb-1">Secure Payment</p>
                  <p>Your payment information is encrypted and processed securely by Stripe. We never store your full card details.</p>
                </div>
              </div>

              {/* Terms */}
              <p className="text-xs text-charcoal/50 text-center">
                By starting your trial, you agree to our{' '}
                <Link href="/terms" className="text-sage hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-sage hover:underline">Privacy Policy</Link>.
                Your subscription will automatically renew at ${calculateMonthlyTotal()}/month after your trial ends unless you cancel.
              </p>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sage to-sage-dark flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-charcoal mb-4">Your trial has started!</h2>
            <p className="text-lg text-charcoal/60 mb-8 max-w-md mx-auto">
              Your {businessInfo.name || 'business'} is ready to start accepting bookings. Welcome
              to Peacase!
            </p>

            {/* Trial Info */}
            <div className="bg-gradient-to-br from-sage/10 to-lavender/10 rounded-2xl p-6 max-w-lg mx-auto mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-6 h-6 text-sage" />
                <div>
                  <p className="font-semibold text-charcoal">14-Day Free Trial Active</p>
                  <p className="text-sm text-charcoal/60">Your trial ends on Feb 27, 2026</p>
                </div>
              </div>
              <div className="bg-white/60 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-charcoal/70">Plan after trial</span>
                  <span className="font-bold text-charcoal">${calculateMonthlyTotal()}/month</span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-charcoal/5 rounded-2xl p-6 max-w-lg mx-auto text-left mb-8">
              <h3 className="font-semibold text-charcoal mb-4">Setup Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-charcoal/60">Plan</span>
                  <span className="font-medium text-charcoal">
                    Essentials{selectedAddOns.length > 0 ? ` + ${selectedAddOns.length} add-ons` : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal/60">Business Type</span>
                  <span className="font-medium text-charcoal">
                    {businessTypes.find((t) => t.value === businessInfo.type)?.label || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal/60">Services</span>
                  <span className="font-medium text-charcoal">{services.length} services</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal/60">Team Members</span>
                  <span className="font-medium text-charcoal">
                    {staff.length === 0 ? 'Solo' : `${staff.length} members`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal/60">Payment Methods</span>
                  <span className="font-medium text-charcoal">
                    {[
                      payments.stripe && 'Stripe',
                      payments.square && 'Square',
                      payments.paypal && 'PayPal',
                      payments.cash && 'Cash',
                    ]
                      .filter(Boolean)
                      .join(', ') || 'None'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark transition-all shadow-lg hover:shadow-xl"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/settings"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-charcoal border border-charcoal/20 rounded-xl font-semibold hover:border-sage transition-all"
              >
                Review Settings
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-charcoal/10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sage to-sage-dark flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="font-display font-bold text-xl text-charcoal">peacase</span>
          </Link>
          <div className="text-sm text-charcoal/60">
            Step {currentStep + 1} of {steps.length}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Step Indicators */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-8 space-y-2">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isComplete = index < currentStep;

                return (
                  <button
                    key={step.id}
                    onClick={() => index <= currentStep && setCurrentStep(index)}
                    disabled={index > currentStep}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                      isActive
                        ? 'bg-sage text-white'
                        : isComplete
                          ? 'bg-sage/10 text-sage hover:bg-sage/20'
                          : 'text-charcoal/40 cursor-not-allowed'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{step.title}</span>
                    {isComplete && <CheckCircle2 className="w-4 h-4 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Mobile Progress Bar */}
            <div className="lg:hidden mb-8">
              <div className="flex items-center gap-1 mb-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      index <= currentStep ? 'bg-sage' : 'bg-charcoal/10'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-charcoal/60">{steps[currentStep].title}</p>
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-2xl shadow-soft border border-charcoal/5 p-8">
              {renderStep()}
            </div>

            {/* Navigation Buttons */}
            {steps[currentStep].id !== 'complete' && (
              <div className="flex justify-between mt-6">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                    currentStep === 0
                      ? 'text-charcoal/30 cursor-not-allowed'
                      : 'text-charcoal hover:bg-charcoal/5'
                  }`}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>

                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 px-8 py-3 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark transition-all shadow-lg hover:shadow-xl"
                >
                  {steps[currentStep].id === 'subscription'
                    ? 'Start Free Trial'
                    : currentStep === steps.length - 2
                      ? 'Complete Setup'
                      : 'Continue'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
