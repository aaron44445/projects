'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { api } from '@/lib/api';

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

// Plan prices - Professional only
const PLAN_PRICES: Record<string, number> = {
  professional: 49,
};

interface SubscriptionData {
  id: string | null;
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
  currentPeriodStart: string | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  graceEndsAt: string | null;
  addons: string[];
  planDetails: {
    id: string;
    name: string;
    price: number;
    features: string[];
    limits: { maxStaff: number | null; maxClients: number | null };
  };
}

interface SubscriptionContextType {
  subscription: SubscriptionData | null;
  activeAddOns: AddOnId[];
  loading: boolean;
  error: string | null;
  hasAddOn: (addOnId: AddOnId) => boolean;
  addAddon: (addOnId: AddOnId) => Promise<void>;
  removeAddon: (addOnId: AddOnId) => Promise<void>;
  refreshSubscription: () => Promise<void>;
  monthlyTotal: number;
  trialEndsAt: Date | null;
  isTrialActive: boolean;
  plan: string;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch subscription data from API
  const fetchSubscription = useCallback(async () => {
    if (!isAuthenticated) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await api.get('/billing/subscription') as { success: boolean; data?: { subscription: SubscriptionData }; error?: { message: string } };
      if (data.success && data.data) {
        setSubscription(data.data.subscription);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch subscription');
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Set null subscription on error - no free tier
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch subscription on mount and when auth changes
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Add an addon
  const addAddon = async (addOnId: AddOnId) => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated');
    }

    try {
      const data = await api.post('/billing/add-addon', { addonId: addOnId });
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to add addon');
      }

      // Refresh subscription data
      await fetchSubscription();
    } catch (err) {
      console.error('Error adding addon:', err);
      throw err;
    }
  };

  // Remove an addon
  const removeAddon = async (addOnId: AddOnId) => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated');
    }

    try {
      const data = await api.delete(`/billing/remove-addon/${addOnId}`);
      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to remove addon');
      }

      // Refresh subscription data
      await fetchSubscription();
    } catch (err) {
      console.error('Error removing addon:', err);
      throw err;
    }
  };

  // Helper functions
  const activeAddOns = (subscription?.addons || []) as AddOnId[];
  // During trial, all add-ons are accessible
  const isTrialStatus = subscription?.status === 'trialing';
  const hasAddOn = (addOnId: AddOnId) => isTrialStatus || activeAddOns.includes(addOnId);
  const plan = subscription?.plan || 'none';
  const planPrice = PLAN_PRICES[plan] || 0;
  const monthlyTotal = planPrice + activeAddOns.length * 25;
  const trialEndsAt = subscription?.trialEndsAt ? new Date(subscription.trialEndsAt) : null;
  const isTrialActive = isTrialStatus || (trialEndsAt ? new Date() < trialEndsAt : false);

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        activeAddOns,
        loading,
        error,
        hasAddOn,
        addAddon,
        removeAddon,
        refreshSubscription: fetchSubscription,
        monthlyTotal,
        trialEndsAt,
        isTrialActive,
        plan,
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
