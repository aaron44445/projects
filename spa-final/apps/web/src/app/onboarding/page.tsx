'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSubscription, AddOnId } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { api, ApiError } from '@/lib/api';
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
  Check,
  Lock,
  Globe,
  BarChart3,
  MessageSquare,
  Gift,
  Star,
  Layers,
  Shield,
  HelpCircle,
  Lightbulb,
  MapPin,
} from 'lucide-react';

// Step configuration
const steps = [
  { id: 'business', title: 'Business Location', icon: MapPin },
  { id: 'subscription', title: 'Select Plan', icon: CreditCard },
  { id: 'hours', title: 'Working Hours', icon: Clock },
  { id: 'services', title: 'Services', icon: Scissors },
  { id: 'optional', title: 'Optional Setup', icon: Layers },
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

// Default hours by business type
const businessHoursDefaults: Record<string, typeof defaultHours> = {
  salon: [
    { day: 'Monday', open: '09:00', close: '19:00', isOpen: true },
    { day: 'Tuesday', open: '09:00', close: '19:00', isOpen: true },
    { day: 'Wednesday', open: '09:00', close: '19:00', isOpen: true },
    { day: 'Thursday', open: '09:00', close: '20:00', isOpen: true },
    { day: 'Friday', open: '09:00', close: '20:00', isOpen: true },
    { day: 'Saturday', open: '09:00', close: '17:00', isOpen: true },
    { day: 'Sunday', open: '10:00', close: '16:00', isOpen: false },
  ],
  spa: [
    { day: 'Monday', open: '09:00', close: '20:00', isOpen: true },
    { day: 'Tuesday', open: '09:00', close: '20:00', isOpen: true },
    { day: 'Wednesday', open: '09:00', close: '20:00', isOpen: true },
    { day: 'Thursday', open: '09:00', close: '20:00', isOpen: true },
    { day: 'Friday', open: '09:00', close: '21:00', isOpen: true },
    { day: 'Saturday', open: '09:00', close: '18:00', isOpen: true },
    { day: 'Sunday', open: '10:00', close: '17:00', isOpen: true },
  ],
  barbershop: [
    { day: 'Monday', open: '08:00', close: '18:00', isOpen: true },
    { day: 'Tuesday', open: '08:00', close: '18:00', isOpen: true },
    { day: 'Wednesday', open: '08:00', close: '18:00', isOpen: true },
    { day: 'Thursday', open: '08:00', close: '18:00', isOpen: true },
    { day: 'Friday', open: '08:00', close: '18:00', isOpen: true },
    { day: 'Saturday', open: '08:00', close: '16:00', isOpen: true },
    { day: 'Sunday', open: '10:00', close: '16:00', isOpen: false },
  ],
  med_spa: [
    { day: 'Monday', open: '09:00', close: '18:00', isOpen: true },
    { day: 'Tuesday', open: '09:00', close: '18:00', isOpen: true },
    { day: 'Wednesday', open: '09:00', close: '18:00', isOpen: true },
    { day: 'Thursday', open: '09:00', close: '18:00', isOpen: true },
    { day: 'Friday', open: '09:00', close: '17:00', isOpen: true },
    { day: 'Saturday', open: '09:00', close: '14:00', isOpen: true },
    { day: 'Sunday', open: '10:00', close: '16:00', isOpen: false },
  ],
};

const defaultHours = [
  { day: 'Monday', open: '09:00', close: '18:00', isOpen: true },
  { day: 'Tuesday', open: '09:00', close: '18:00', isOpen: true },
  { day: 'Wednesday', open: '09:00', close: '18:00', isOpen: true },
  { day: 'Thursday', open: '09:00', close: '18:00', isOpen: true },
  { day: 'Friday', open: '09:00', close: '18:00', isOpen: true },
  { day: 'Saturday', open: '10:00', close: '16:00', isOpen: true },
  { day: 'Sunday', open: '10:00', close: '16:00', isOpen: false },
];

// Suggested services by business type
const suggestedServices: Record<string, Array<{ name: string; duration: number; price: number; category: string }>> = {
  salon: [
    { name: "Women's Haircut", duration: 45, price: 65, category: 'Hair' },
    { name: "Men's Haircut", duration: 30, price: 35, category: 'Hair' },
    { name: 'Hair Color (Full)', duration: 120, price: 150, category: 'Hair' },
    { name: 'Highlights (Partial)', duration: 90, price: 120, category: 'Hair' },
    { name: 'Blowout & Style', duration: 45, price: 55, category: 'Hair' },
    { name: 'Deep Conditioning Treatment', duration: 30, price: 40, category: 'Hair' },
  ],
  spa: [
    { name: 'Swedish Massage (60 min)', duration: 60, price: 95, category: 'Body' },
    { name: 'Deep Tissue Massage (60 min)', duration: 60, price: 110, category: 'Body' },
    { name: 'Classic Facial', duration: 60, price: 85, category: 'Skin' },
    { name: 'Anti-Aging Facial', duration: 75, price: 120, category: 'Skin' },
    { name: 'Body Wrap', duration: 60, price: 100, category: 'Body' },
    { name: 'Hot Stone Massage', duration: 75, price: 130, category: 'Body' },
  ],
  barbershop: [
    { name: 'Classic Haircut', duration: 30, price: 30, category: 'Hair' },
    { name: 'Haircut & Beard Trim', duration: 45, price: 45, category: 'Hair' },
    { name: 'Beard Trim Only', duration: 20, price: 20, category: 'Hair' },
    { name: 'Hot Towel Shave', duration: 30, price: 35, category: 'Hair' },
    { name: "Kid's Haircut", duration: 20, price: 20, category: 'Hair' },
    { name: 'Head Shave', duration: 30, price: 30, category: 'Hair' },
  ],
  nail_salon: [
    { name: 'Classic Manicure', duration: 30, price: 25, category: 'Nails' },
    { name: 'Classic Pedicure', duration: 45, price: 40, category: 'Nails' },
    { name: 'Gel Manicure', duration: 45, price: 45, category: 'Nails' },
    { name: 'Gel Pedicure', duration: 60, price: 55, category: 'Nails' },
    { name: 'Acrylic Full Set', duration: 60, price: 60, category: 'Nails' },
    { name: 'Nail Art (per nail)', duration: 10, price: 5, category: 'Nails' },
  ],
  med_spa: [
    { name: 'Botox (per unit)', duration: 30, price: 15, category: 'Injectable' },
    { name: 'Dermal Filler (per syringe)', duration: 45, price: 600, category: 'Injectable' },
    { name: 'Chemical Peel', duration: 45, price: 150, category: 'Skin' },
    { name: 'Microneedling', duration: 60, price: 300, category: 'Skin' },
    { name: 'Laser Hair Removal (Small Area)', duration: 30, price: 150, category: 'Laser' },
    { name: 'Hydrafacial', duration: 60, price: 200, category: 'Skin' },
  ],
  massage_studio: [
    { name: 'Swedish Massage (60 min)', duration: 60, price: 85, category: 'Massage' },
    { name: 'Deep Tissue Massage (60 min)', duration: 60, price: 100, category: 'Massage' },
    { name: 'Sports Massage (60 min)', duration: 60, price: 100, category: 'Massage' },
    { name: 'Prenatal Massage (60 min)', duration: 60, price: 90, category: 'Massage' },
    { name: 'Couples Massage (60 min)', duration: 60, price: 170, category: 'Massage' },
    { name: 'Hot Stone Massage (75 min)', duration: 75, price: 120, category: 'Massage' },
  ],
};

// Contextual help content per step
const stepHelp: Record<string, { title: string; tips: string[]; faq: Array<{ q: string; a: string }> }> = {
  business: {
    title: 'Business Location',
    tips: [
      'Your address will appear on booking confirmations and help clients find you.',
      'Make sure to use the exact address that shows on Google Maps.',
      'If you operate from multiple locations, you can add more later.',
    ],
    faq: [
      { q: 'Why do you need my address?', a: 'Your address helps clients find you and is shown on appointment confirmations. It also enables location-based features.' },
      { q: 'Can I add multiple locations?', a: 'Yes! After setup, go to Settings → Locations to add additional business locations.' },
    ],
  },
  subscription: {
    title: 'Choosing Your Plan',
    tips: [
      'Start with Essentials - you can add features anytime.',
      'Online Booking and Reminders are the most popular add-ons.',
      'All add-ons can be enabled/disabled monthly.',
    ],
    faq: [
      { q: 'Can I change my plan later?', a: 'Yes, you can add or remove features at any time from your Settings.' },
      { q: 'Is there a contract?', a: 'No contracts - you can cancel anytime. We bill monthly.' },
    ],
  },
  hours: {
    title: 'Setting Your Hours',
    tips: [
      'These are your default business hours.',
      'Individual staff can have their own schedules.',
      'You can set holiday hours and special closures later.',
    ],
    faq: [
      { q: 'What if my hours vary?', a: 'Set your most common hours here. You can adjust specific dates in the calendar.' },
      { q: 'Can staff have different hours?', a: 'Yes! Each staff member can have their own availability schedule.' },
    ],
  },
  services: {
    title: 'Adding Services',
    tips: [
      'Add at least one service to continue.',
      'You can edit prices and durations anytime.',
      'Group similar services into categories for easier booking.',
    ],
    faq: [
      { q: 'How do I price my services?', a: 'Research local competitors and consider your experience level. You can always adjust later.' },
      { q: 'What about service variations?', a: 'Create separate services for variations (e.g., "Haircut - Short" and "Haircut - Long").' },
    ],
  },
  optional: {
    title: 'Optional Setup',
    tips: [
      'These features can all be configured later.',
      'Skip this step if you want to get started quickly.',
      'Staff invitations can be sent from your dashboard.',
    ],
    faq: [
      { q: 'Should I set these up now?', a: "It's up to you! You can always come back to these in Settings." },
      { q: 'How do I invite staff?', a: 'Go to Staff → Invite and enter their email. They\'ll receive an invitation to join.' },
    ],
  },
};

import { AuthGuard } from '@/components/AuthGuard';

function OnboardingContent() {
  const router = useRouter();
  const { salon, user, refreshSalonData } = useAuth();
  const { setActiveAddOns } = useSubscription();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showHelp, setShowHelp] = useState(true);

  // Plan selection state
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

  // Optional setup checklist state
  const [optionalSetup, setOptionalSetup] = useState({
    staff: false,
    branding: false,
    clientPayments: false,
    notifications: false,
  });

  // Subscription payment state
  const [subscriptionInfo, setSubscriptionInfo] = useState({
    cardNumber: '',
    expiry: '',
    cvc: '',
    nameOnCard: '',
  });
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});

  // Business location state (only NEW info not collected at signup)
  const [businessLocation, setBusinessLocation] = useState({
    address: '',
    city: '',
    state: '',
    zip: '',
    website: '',
  });

  // Get business type from signup data
  const businessType = salon?.businessType || 'salon';

  // Initialize hours with business-type-specific defaults
  const [hours, setHours] = useState(() => {
    return businessHoursDefaults[businessType] || defaultHours;
  });

  const [services, setServices] = useState<
    Array<{ name: string; duration: number; price: number; category: string }>
  >([]);

  // Update hours when business type changes (if salon data loads after initial render)
  useEffect(() => {
    if (businessType && businessHoursDefaults[businessType]) {
      setHours(businessHoursDefaults[businessType]);
    }
  }, [businessType]);

  const validateCard = () => {
    const errors: Record<string, string> = {};

    const cardDigits = subscriptionInfo.cardNumber.replace(/\s/g, '');
    if (!cardDigits) {
      errors.cardNumber = 'Card number is required';
    } else if (cardDigits.length !== 16 || !/^\d+$/.test(cardDigits)) {
      errors.cardNumber = 'Please enter a valid 16-digit card number';
    }

    if (!subscriptionInfo.expiry) {
      errors.expiry = 'Expiry date is required';
    } else if (!/^\d{2}\/\d{2}$/.test(subscriptionInfo.expiry)) {
      errors.expiry = 'Please use MM/YY format';
    } else {
      const [month, year] = subscriptionInfo.expiry.split('/').map(Number);
      const now = new Date();
      const expDate = new Date(2000 + year, month - 1);
      if (month < 1 || month > 12) {
        errors.expiry = 'Please enter a valid month (01-12)';
      } else if (expDate < now) {
        errors.expiry = 'This card has expired';
      }
    }

    if (!subscriptionInfo.cvc) {
      errors.cvc = 'CVC is required';
    } else if (!/^\d{3,4}$/.test(subscriptionInfo.cvc)) {
      errors.cvc = 'Please enter the 3 or 4 digit code on your card';
    }

    if (!subscriptionInfo.nameOnCard.trim()) {
      errors.nameOnCard = 'Please enter the name as it appears on your card';
    }

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateBusinessLocation = () => {
    const errors: Record<string, string> = {};

    if (!businessLocation.address.trim()) {
      errors.address = 'Please enter your street address';
    }
    if (!businessLocation.city.trim()) {
      errors.city = 'Please enter your city';
    }
    if (!businessLocation.state.trim()) {
      errors.state = 'Please enter your state';
    }
    if (!businessLocation.zip.trim()) {
      errors.zip = 'Please enter your ZIP code';
    } else if (!/^\d{5}(-\d{4})?$/.test(businessLocation.zip.trim())) {
      errors.zip = 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)';
    }
    if (businessLocation.website && !/^https?:\/\/.+\..+/.test(businessLocation.website)) {
      errors.website = 'Please enter a valid URL starting with http:// or https://';
    }

    setFieldErrors(errors);
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

  // API submission functions
  const submitBusinessInfo = async () => {
    try {
      await api.post('/onboarding/business-info', {
        address: businessLocation.address,
        city: businessLocation.city,
        state: businessLocation.state,
        zip: businessLocation.zip,
        website: businessLocation.website || undefined,
      });
      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.message.includes('Invalid input')) {
          setSubmitError('Please check all required fields are filled in correctly.');
        } else {
          setSubmitError(error.message);
        }
      } else {
        setSubmitError('Failed to save business info. Please try again.');
      }
      return false;
    }
  };

  const submitWorkingHours = async () => {
    try {
      await api.post('/onboarding/working-hours', {
        hours: hours.map((h) => ({
          day: h.day,
          open: h.open,
          close: h.close,
          isOpen: h.isOpen,
        })),
      });
      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Failed to save working hours. Please try again.');
      }
      return false;
    }
  };

  const submitServices = async () => {
    try {
      await api.post('/onboarding/services', {
        services: services.map((s) => ({
          name: s.name,
          duration: s.duration,
          price: s.price,
          category: s.category,
        })),
      });
      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Failed to save services. Please try again.');
      }
      return false;
    }
  };

  const completeOnboarding = async () => {
    try {
      await api.post('/onboarding/complete', {
        addOns: selectedAddOns,
        optionalSetupSelected: optionalSetup,
      });
      // Refresh salon data so OnboardingGuard sees onboardingComplete: true
      await refreshSalonData();
      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Failed to complete onboarding. Please try again.');
      }
      return false;
    }
  };

  const nextStep = async () => {
    setSubmitError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const currentStepId = steps[currentStep].id;

      if (currentStepId === 'business') {
        if (!validateBusinessLocation()) {
          setIsSubmitting(false);
          return;
        }
        const success = await submitBusinessInfo();
        if (!success) {
          setIsSubmitting(false);
          return;
        }
      }

      if (currentStepId === 'subscription') {
        if (!validateCard()) {
          setIsSubmitting(false);
          return;
        }
        setActiveAddOns(selectedAddOns as AddOnId[]);
      }

      if (currentStepId === 'hours') {
        const success = await submitWorkingHours();
        if (!success) {
          setIsSubmitting(false);
          return;
        }
      }

      if (currentStepId === 'services') {
        if (services.length === 0) {
          setSubmitError('Please add at least one service to continue.');
          setIsSubmitting(false);
          return;
        }
        // Validate services have names
        const invalidServices = services.filter(s => !s.name.trim());
        if (invalidServices.length > 0) {
          setSubmitError('Please enter a name for all services.');
          setIsSubmitting(false);
          return;
        }
        const success = await submitServices();
        if (!success) {
          setIsSubmitting(false);
          return;
        }
      }

      if (currentStepId === 'optional') {
        const success = await completeOnboarding();
        if (!success) {
          setIsSubmitting(false);
          return;
        }
        // If user selected items to set up, redirect to the settings page for the first one
        const selectedItems = Object.entries(optionalSetup).filter(([, v]) => v).map(([k]) => k);
        if (selectedItems.length > 0) {
          const settingsRoutes: Record<string, string> = {
            staff: '/staff',
            branding: '/settings?tab=branding',
            clientPayments: '/settings?tab=payments',
            notifications: '/settings?tab=notifications',
          };
          const firstSelected = selectedItems[0];
          router.push(settingsRoutes[firstSelected] || '/dashboard');
          return;
        }
        // No items selected - show complete screen
        setCurrentStep(currentStep + 1);
        setIsSubmitting(false);
        return;
      }

      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const skipToComplete = async () => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const success = await completeOnboarding();
      if (success) {
        setCurrentStep(steps.findIndex((s) => s.id === 'complete'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setSubmitError(null);
      setFieldErrors({});
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

  const addSuggestedServices = () => {
    const suggested = suggestedServices[businessType] || suggestedServices['salon'];
    // Only add services that aren't already added
    const existingNames = new Set(services.map(s => s.name.toLowerCase()));
    const newServices = suggested.filter(s => !existingNames.has(s.name.toLowerCase()));
    setServices([...services, ...newServices]);
  };

  const useDefaultHours = () => {
    const defaultForType = businessHoursDefaults[businessType] || defaultHours;
    setHours(defaultForType);
  };

  // Get display name for business type
  const businessTypeLabel = {
    salon: 'Hair Salon',
    spa: 'Day Spa',
    barbershop: 'Barbershop',
    nail_salon: 'Nail Salon',
    med_spa: 'Medical Spa',
    massage_studio: 'Massage Studio',
    wellness: 'Wellness Center',
    beauty: 'Beauty Studio',
    other: 'Business',
  }[businessType] || 'Business';

  // Contextual help sidebar
  const renderHelpSidebar = () => {
    const currentStepId = steps[currentStep].id;
    const help = stepHelp[currentStepId];

    if (!help || currentStepId === 'complete') return null;

    return (
      <div className="hidden xl:block w-80 flex-shrink-0">
        <div className="sticky top-8 bg-gradient-to-br from-sage/5 to-lavender/10 rounded-2xl border border-sage/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-sage/20 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-sage" />
            </div>
            <h3 className="font-semibold text-charcoal">Tips & Help</h3>
          </div>

          {/* Tips */}
          <div className="space-y-3 mb-6">
            {help.tips.map((tip, i) => (
              <div key={i} className="flex gap-2">
                <Check className="w-4 h-4 text-sage flex-shrink-0 mt-0.5" />
                <p className="text-sm text-charcoal/70">{tip}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          {currentStepId === 'hours' && (
            <button
              onClick={useDefaultHours}
              className="w-full mb-4 py-2 px-4 bg-sage/10 text-sage rounded-lg text-sm font-medium hover:bg-sage/20 transition-colors"
            >
              Use Suggested Hours for {businessTypeLabel}
            </button>
          )}

          {currentStepId === 'services' && (
            <button
              onClick={addSuggestedServices}
              className="w-full mb-4 py-2 px-4 bg-sage/10 text-sage rounded-lg text-sm font-medium hover:bg-sage/20 transition-colors"
            >
              Add Popular {businessTypeLabel} Services
            </button>
          )}

          {/* FAQ */}
          <div className="border-t border-sage/20 pt-4">
            <p className="text-xs font-medium text-charcoal/50 uppercase tracking-wide mb-3">Common Questions</p>
            <div className="space-y-3">
              {help.faq.map((item, i) => (
                <div key={i}>
                  <p className="text-sm font-medium text-charcoal">{item.q}</p>
                  <p className="text-sm text-charcoal/60 mt-1">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (steps[currentStep].id) {
      case 'business':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-charcoal mb-2">Where is your business located?</h2>
              <p className="text-charcoal/60">
                We&apos;ll use this address for booking confirmations and to help clients find you.
              </p>
            </div>

            {/* Show pre-filled info from signup */}
            <div className="bg-sage/5 rounded-xl p-4 border border-sage/20">
              <p className="text-sm text-charcoal/60 mb-2">From your signup:</p>
              <div className="flex flex-wrap gap-4">
                <div>
                  <span className="text-xs text-charcoal/50">Business</span>
                  <p className="font-medium text-charcoal">{salon?.name || 'Your Business'}</p>
                </div>
                <div>
                  <span className="text-xs text-charcoal/50">Type</span>
                  <p className="font-medium text-charcoal">{businessTypeLabel}</p>
                </div>
                <div>
                  <span className="text-xs text-charcoal/50">Email</span>
                  <p className="font-medium text-charcoal">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Address Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Street Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={businessLocation.address}
                  onChange={(e) => {
                    setBusinessLocation({ ...businessLocation, address: e.target.value });
                    if (fieldErrors.address) setFieldErrors({ ...fieldErrors, address: '' });
                  }}
                  className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.address ? 'border-rose-500' : 'border-charcoal/20'} focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all`}
                  placeholder="123 Main Street"
                />
                {fieldErrors.address && (
                  <p className="mt-1.5 text-sm text-rose-500">{fieldErrors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={businessLocation.city}
                    onChange={(e) => {
                      setBusinessLocation({ ...businessLocation, city: e.target.value });
                      if (fieldErrors.city) setFieldErrors({ ...fieldErrors, city: '' });
                    }}
                    className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.city ? 'border-rose-500' : 'border-charcoal/20'} focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all`}
                    placeholder="Los Angeles"
                  />
                  {fieldErrors.city && (
                    <p className="mt-1.5 text-sm text-rose-500">{fieldErrors.city}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={businessLocation.state}
                    onChange={(e) => {
                      setBusinessLocation({ ...businessLocation, state: e.target.value });
                      if (fieldErrors.state) setFieldErrors({ ...fieldErrors, state: '' });
                    }}
                    className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.state ? 'border-rose-500' : 'border-charcoal/20'} focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all`}
                    placeholder="CA"
                  />
                  {fieldErrors.state && (
                    <p className="mt-1.5 text-sm text-rose-500">{fieldErrors.state}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    ZIP Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={businessLocation.zip}
                    onChange={(e) => {
                      setBusinessLocation({ ...businessLocation, zip: e.target.value });
                      if (fieldErrors.zip) setFieldErrors({ ...fieldErrors, zip: '' });
                    }}
                    className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.zip ? 'border-rose-500' : 'border-charcoal/20'} focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all`}
                    placeholder="90210"
                  />
                  {fieldErrors.zip && (
                    <p className="mt-1.5 text-sm text-rose-500">{fieldErrors.zip}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Website <span className="text-charcoal/40">(optional)</span>
                </label>
                <input
                  type="url"
                  value={businessLocation.website}
                  onChange={(e) => {
                    setBusinessLocation({ ...businessLocation, website: e.target.value });
                    if (fieldErrors.website) setFieldErrors({ ...fieldErrors, website: '' });
                  }}
                  className={`w-full px-4 py-3 rounded-xl border ${fieldErrors.website ? 'border-rose-500' : 'border-charcoal/20'} focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all`}
                  placeholder="https://yourbusiness.com"
                />
                {fieldErrors.website && (
                  <p className="mt-1.5 text-sm text-rose-500">{fieldErrors.website}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'subscription':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-charcoal mb-2">Select your plan</h2>
              <p className="text-charcoal/60">
                Start with the Essentials plan, then add only the features you need.
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
                  <p className="text-sm text-white/60">/month</p>
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
                        const value = e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
                        setSubscriptionInfo({ ...subscriptionInfo, cardNumber: value.slice(0, 19) });
                        if (cardErrors.cardNumber) setCardErrors({ ...cardErrors, cardNumber: '' });
                      }}
                      placeholder="1234 5678 9012 3456"
                      className={`w-full px-4 py-3 rounded-lg border ${cardErrors.cardNumber ? 'border-rose-500' : 'border-charcoal/20'} focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all`}
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
                      className={`w-full px-4 py-3 rounded-lg border ${cardErrors.expiry ? 'border-rose-500' : 'border-charcoal/20'} focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all`}
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
                        className={`w-full px-4 py-3 rounded-lg border ${cardErrors.cvc ? 'border-rose-500' : 'border-charcoal/20'} focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all`}
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
                    className={`w-full px-4 py-3 rounded-lg border ${cardErrors.nameOnCard ? 'border-rose-500' : 'border-charcoal/20'} focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all`}
                  />
                  {cardErrors.nameOnCard && (
                    <p className="text-sm text-rose-500 mt-1">{cardErrors.nameOnCard}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-charcoal/5 rounded-xl">
                <Shield className="w-5 h-5 text-sage mt-0.5" />
                <div className="text-sm text-charcoal/70">
                  <p className="font-medium text-charcoal mb-1">Secure Payment</p>
                  <p>Your payment information is encrypted and processed securely by Stripe. We never store your full card details.</p>
                </div>
              </div>

              <p className="text-xs text-charcoal/50 text-center">
                By continuing, you agree to our{' '}
                <Link href="/terms" className="text-sage hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-sage hover:underline">Privacy Policy</Link>.
                Your subscription will be ${calculateMonthlyTotal()}/month.
              </p>
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

            {/* Mobile quick action */}
            <div className="xl:hidden">
              <button
                onClick={useDefaultHours}
                className="w-full py-3 px-4 bg-sage/10 text-sage rounded-xl text-sm font-medium hover:bg-sage/20 transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Use Suggested Hours for {businessTypeLabel}
              </button>
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
          </div>
        );

      case 'services':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-charcoal mb-2">Add your services</h2>
              <p className="text-charcoal/60">
                Create your service menu. You need at least one service to continue.
              </p>
            </div>

            {/* Mobile quick action */}
            <div className="xl:hidden">
              <button
                onClick={addSuggestedServices}
                className="w-full py-3 px-4 bg-sage/10 text-sage rounded-xl text-sm font-medium hover:bg-sage/20 transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Add Popular {businessTypeLabel} Services
              </button>
            </div>

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

      case 'optional':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-charcoal mb-2">What would you like to set up first?</h2>
              <p className="text-charcoal/60">
                Select an item to configure it in settings, or skip to go straight to your dashboard.
              </p>
            </div>

            {/* Checklist */}
            <div className="space-y-4">
              <div
                className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  optionalSetup.staff ? 'border-sage bg-sage/5' : 'border-charcoal/10 hover:border-sage/50'
                }`}
                onClick={() => setOptionalSetup({ ...optionalSetup, staff: !optionalSetup.staff })}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                    optionalSetup.staff ? 'border-sage bg-sage' : 'border-charcoal/30'
                  }`}>
                    {optionalSetup.staff && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-charcoal/60" />
                      <h3 className="font-semibold text-charcoal">Add Staff Members</h3>
                    </div>
                    <p className="text-sm text-charcoal/60 mt-1 ml-8">
                      Invite team members and set up their schedules
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  optionalSetup.branding ? 'border-sage bg-sage/5' : 'border-charcoal/10 hover:border-sage/50'
                }`}
                onClick={() => setOptionalSetup({ ...optionalSetup, branding: !optionalSetup.branding })}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                    optionalSetup.branding ? 'border-sage bg-sage' : 'border-charcoal/30'
                  }`}>
                    {optionalSetup.branding && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Palette className="w-5 h-5 text-charcoal/60" />
                      <h3 className="font-semibold text-charcoal">Customize Branding</h3>
                    </div>
                    <p className="text-sm text-charcoal/60 mt-1 ml-8">
                      Upload logo and set brand colors
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  optionalSetup.clientPayments ? 'border-sage bg-sage/5' : 'border-charcoal/10 hover:border-sage/50'
                }`}
                onClick={() => setOptionalSetup({ ...optionalSetup, clientPayments: !optionalSetup.clientPayments })}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                    optionalSetup.clientPayments ? 'border-sage bg-sage' : 'border-charcoal/30'
                  }`}>
                    {optionalSetup.clientPayments && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5 text-charcoal/60" />
                      <h3 className="font-semibold text-charcoal">Set Up Client Payments</h3>
                    </div>
                    <p className="text-sm text-charcoal/60 mt-1 ml-8">
                      Configure payment methods and deposits
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  optionalSetup.notifications ? 'border-sage bg-sage/5' : 'border-charcoal/10 hover:border-sage/50'
                }`}
                onClick={() => setOptionalSetup({ ...optionalSetup, notifications: !optionalSetup.notifications })}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                    optionalSetup.notifications ? 'border-sage bg-sage' : 'border-charcoal/30'
                  }`}>
                    {optionalSetup.notifications && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-charcoal/60" />
                      <h3 className="font-semibold text-charcoal">Configure Notifications</h3>
                    </div>
                    <p className="text-sm text-charcoal/60 mt-1 ml-8">
                      Set up reminders and communication preferences
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sage to-sage-dark flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-charcoal mb-4">You&apos;re all set!</h2>
            <p className="text-lg text-charcoal/60 mb-8 max-w-md mx-auto">
              {salon?.name || 'Your business'} is ready to start accepting bookings. Welcome to Peacase!
            </p>

            {/* Summary */}
            <div className="bg-charcoal/5 rounded-2xl p-6 max-w-lg mx-auto text-left mb-8">
              <h3 className="font-semibold text-charcoal mb-4">Setup Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-charcoal/60">Business</span>
                  <span className="font-medium text-charcoal">{salon?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal/60">Type</span>
                  <span className="font-medium text-charcoal">{businessTypeLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal/60">Plan</span>
                  <span className="font-medium text-charcoal">
                    Essentials{selectedAddOns.length > 0 ? ` + ${selectedAddOns.length} add-ons` : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal/60">Monthly Cost</span>
                  <span className="font-medium text-charcoal">${calculateMonthlyTotal()}/month</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal/60">Services</span>
                  <span className="font-medium text-charcoal">{services.length} services</span>
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
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
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

      <div className="max-w-7xl mx-auto px-6 py-8">
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

              {/* Error Message */}
              {submitError && (
                <div className="mt-6 p-4 bg-rose-50 border border-rose-200 rounded-xl">
                  <p className="text-sm text-rose-600">{submitError}</p>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            {steps[currentStep].id !== 'complete' && (
              <div className="flex justify-between mt-6">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0 || isSubmitting}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                    currentStep === 0 || isSubmitting
                      ? 'text-charcoal/30 cursor-not-allowed'
                      : 'text-charcoal hover:bg-charcoal/5'
                  }`}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>

                <div className="flex gap-3">
                  {steps[currentStep].id === 'optional' && (
                    <button
                      onClick={skipToComplete}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-6 py-3 bg-white text-charcoal border border-charcoal/20 rounded-xl font-medium hover:border-sage transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : 'Skip All & Go to Dashboard'}
                    </button>
                  )}

                  <button
                    onClick={nextStep}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-8 py-3 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {isSubmitting
                      ? 'Saving...'
                      : steps[currentStep].id === 'optional'
                        ? Object.values(optionalSetup).some(v => v)
                          ? 'Continue to Settings'
                          : 'Go to Dashboard'
                        : 'Continue'}
                    {!isSubmitting && <ArrowRight className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Help Sidebar */}
          {renderHelpSidebar()}
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <AuthGuard>
      <OnboardingContent />
    </AuthGuard>
  );
}
