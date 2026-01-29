'use client';

import Link from 'next/link';
import { Lock, Sparkles } from 'lucide-react';
import { useSubscription, ADD_ON_DETAILS, AddOnId } from '@/contexts/SubscriptionContext';

interface FeatureGateProps {
  feature: AddOnId;
  children: React.ReactNode;
  /** Show a minimal lock icon instead of full upgrade prompt */
  minimal?: boolean;
  /** Custom class for the wrapper */
  className?: string;
}

/**
 * Wraps content that requires a specific add-on.
 * Shows the content if the user has the add-on, otherwise shows an upgrade prompt.
 */
export function FeatureGate({ feature, children, minimal = false, className = '' }: FeatureGateProps) {
  const { hasAddOn } = useSubscription();

  if (hasAddOn(feature)) {
    return <>{children}</>;
  }

  const addOn = ADD_ON_DETAILS[feature];

  if (minimal) {
    return (
      <div className={`relative ${className}`}>
        <div className="opacity-30 pointer-events-none blur-[1px]">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Link
            href="/settings?tab=subscription"
            className="flex items-center gap-2 px-4 py-2 bg-charcoal/90 text-white rounded-lg text-sm font-medium hover:bg-charcoal transition-colors"
          >
            <Lock className="w-4 h-4" />
            Unlock
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-charcoal/5 to-charcoal/10 rounded-2xl border-2 border-dashed border-charcoal/20 p-8 ${className}`}>
      <div className="text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-charcoal/10 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-charcoal/40" />
        </div>
        <h3 className="text-xl font-bold text-charcoal mb-2">{addOn.name}</h3>
        <p className="text-text-secondary mb-6">{addOn.description}</p>
        <Link
          href="/settings?tab=subscription"
          className="inline-flex items-center gap-2 px-6 py-3 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark transition-all"
        >
          <Sparkles className="w-5 h-5" />
          Add to Your Plan - ${addOn.price}/mo
        </Link>
        <p className="text-xs text-text-muted mt-4">
          Upgrade anytime from Settings &gt; Subscription
        </p>
      </div>
    </div>
  );
}

/**
 * Hook to check if a feature is available
 */
export function useFeatureAccess(feature: AddOnId): boolean {
  const { hasAddOn } = useSubscription();
  return hasAddOn(feature);
}
