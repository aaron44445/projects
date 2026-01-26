'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Add-on definitions with setup guides
export const ADD_ON_DETAILS = {
  online_booking: {
    id: 'online_booking',
    name: 'Online Booking',
    description: 'Let clients book 24/7 from your website',
    price: 25,
    setupSteps: [
      'Go to Settings > Online Booking to customize your booking page',
      'Set your booking rules (advance notice, cancellation policy)',
      'Add your booking link to your website or share directly with clients',
      'Enable email confirmations for new bookings',
    ],
    helpUrl: '/settings?tab=online-booking',
  },
  payment_processing: {
    id: 'payment_processing',
    name: 'Payment Processing',
    description: 'Accept cards, Apple Pay, Google Pay',
    price: 25,
    setupSteps: [
      'Go to Settings > Payments to connect your Stripe account',
      'Complete Stripe verification (takes 1-2 business days)',
      'Set up deposit requirements for bookings (optional)',
      'Configure tipping options for clients',
    ],
    helpUrl: '/settings?tab=payments',
  },
  reminders: {
    id: 'reminders',
    name: 'SMS/Email Reminders',
    description: 'Reduce no-shows with automated reminders',
    price: 25,
    setupSteps: [
      'Go to Settings > Notifications to configure reminders',
      'Choose reminder timing (24h, 48h before appointment)',
      'Customize your reminder message templates',
      'Enable SMS reminders (requires phone number collection)',
    ],
    helpUrl: '/settings?tab=notifications',
  },
  reports: {
    id: 'reports',
    name: 'Reports & Analytics',
    description: 'Revenue dashboards, staff performance',
    price: 25,
    setupSteps: [
      'Access detailed reports from the Reports page',
      'View revenue trends, top services, and staff performance',
      'Export reports to PDF or CSV for accounting',
      'Set up weekly email summaries (optional)',
    ],
    helpUrl: '/reports',
  },
  reviews: {
    id: 'reviews',
    name: 'Reviews & Ratings',
    description: 'Collect and display client reviews',
    price: 25,
    setupSteps: [
      'Automatic review requests are sent after appointments',
      'Moderate reviews in Settings > Reviews',
      'Display approved reviews on your booking page',
      'Respond to reviews to engage with clients',
    ],
    helpUrl: '/settings?tab=reviews',
  },
  memberships: {
    id: 'memberships',
    name: 'Packages & Memberships',
    description: 'Sell packages and recurring memberships',
    price: 25,
    setupSteps: [
      'Create packages in Services > Packages',
      'Set up membership tiers with recurring billing',
      'Assign package services and validity periods',
      'Track package redemptions per client',
    ],
    helpUrl: '/services?tab=packages',
  },
  gift_cards: {
    id: 'gift_cards',
    name: 'Gift Cards',
    description: 'Sell and redeem digital gift cards',
    price: 25,
    setupSteps: [
      'Enable gift cards in Settings > Gift Cards',
      'Customize gift card designs and denominations',
      'Share your gift card purchase link with clients',
      'Track and redeem gift cards at checkout',
    ],
    helpUrl: '/settings?tab=gift-cards',
  },
  marketing: {
    id: 'marketing',
    name: 'Marketing Automation',
    description: 'Automated campaigns and promotions',
    price: 25,
    setupSteps: [
      'Create campaigns in Marketing > Campaigns',
      'Set up automated birthday and re-engagement emails',
      'Design promotional offers and track redemptions',
      'Segment clients for targeted messaging',
    ],
    helpUrl: '/marketing',
  },
};

export type AddOnId = keyof typeof ADD_ON_DETAILS;

interface SubscriptionContextType {
  activeAddOns: AddOnId[];
  setActiveAddOns: (addOns: AddOnId[]) => void;
  hasAddOn: (addOnId: AddOnId) => boolean;
  monthlyTotal: number;
  trialEndsAt: Date | null;
  isTrialActive: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [activeAddOns, setActiveAddOnsState] = useState<AddOnId[]>([]);
  const [trialEndsAt, setTrialEndsAt] = useState<Date | null>(null);

  // Load subscription from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('peacase_subscription');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setActiveAddOnsState(data.addOns || []);
        setTrialEndsAt(data.trialEndsAt ? new Date(data.trialEndsAt) : null);
      } catch {
        // Invalid data, start fresh
      }
    }
  }, []);

  // Save subscription to localStorage
  const setActiveAddOns = (addOns: AddOnId[]) => {
    setActiveAddOnsState(addOns);

    // Calculate trial end date (14 days from now if not set)
    const trialEnd = trialEndsAt || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    if (!trialEndsAt) {
      setTrialEndsAt(trialEnd);
    }

    localStorage.setItem('peacase_subscription', JSON.stringify({
      addOns,
      trialEndsAt: trialEnd.toISOString(),
    }));
  };

  const hasAddOn = (addOnId: AddOnId) => activeAddOns.includes(addOnId);

  const monthlyTotal = 50 + (activeAddOns.length * 25); // Base + add-ons

  const isTrialActive = trialEndsAt ? new Date() < trialEndsAt : true;

  return (
    <SubscriptionContext.Provider
      value={{
        activeAddOns,
        setActiveAddOns,
        hasAddOn,
        monthlyTotal,
        trialEndsAt,
        isTrialActive,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
