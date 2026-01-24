'use client';

import { useState, useEffect, useCallback } from 'react';

// Cookie consent categories
export type CookieCategory = 'essential' | 'analytics' | 'marketing';

// Consent preferences structure
export interface CookieConsentPreferences {
  essential: boolean; // Always true, cannot be disabled
  analytics: boolean;
  marketing: boolean;
}

// Full consent state stored in localStorage
export interface CookieConsentState {
  preferences: CookieConsentPreferences;
  consentedAt: string; // ISO timestamp
  version: string; // For invalidating old consents when policy changes
}

const CONSENT_KEY = 'cookie-consent';
const CONSENT_VERSION = '1.0.0';

// Default preferences (essential only)
const defaultPreferences: CookieConsentPreferences = {
  essential: true,
  analytics: false,
  marketing: false,
};

// Accept all preferences
const acceptAllPreferences: CookieConsentPreferences = {
  essential: true,
  analytics: true,
  marketing: true,
};

function getStoredConsent(): CookieConsentState | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return null;

    const parsed: CookieConsentState = JSON.parse(stored);

    // Invalidate if version changed
    if (parsed.version !== CONSENT_VERSION) {
      localStorage.removeItem(CONSENT_KEY);
      return null;
    }

    return parsed;
  } catch {
    // Invalid JSON, clear it
    localStorage.removeItem(CONSENT_KEY);
    return null;
  }
}

function saveConsent(preferences: CookieConsentPreferences): CookieConsentState {
  const state: CookieConsentState = {
    preferences: {
      ...preferences,
      essential: true, // Always force essential to true
    },
    consentedAt: new Date().toISOString(),
    version: CONSENT_VERSION,
  };

  localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
  return state;
}

export interface UseCookieConsentReturn {
  // Current consent state (null if not yet consented)
  consent: CookieConsentState | null;

  // Whether the banner needs to be shown
  needsConsent: boolean;

  // Loading state (waiting for localStorage check)
  isLoading: boolean;

  // Accept all cookies
  acceptAll: () => void;

  // Reject all optional cookies (essential only)
  rejectAll: () => void;

  // Save custom preferences
  savePreferences: (preferences: CookieConsentPreferences) => void;

  // Clear consent (for re-opening preferences)
  clearConsent: () => void;

  // Check if a specific category is consented
  hasConsent: (category: CookieCategory) => boolean;
}

export function useCookieConsent(): UseCookieConsentReturn {
  const [consent, setConsent] = useState<CookieConsentState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored consent on mount
  useEffect(() => {
    const stored = getStoredConsent();
    setConsent(stored);
    setIsLoading(false);
  }, []);

  const acceptAll = useCallback(() => {
    const state = saveConsent(acceptAllPreferences);
    setConsent(state);

    // Dispatch event for other components to react
    window.dispatchEvent(new CustomEvent('cookieConsentChange', { detail: state }));
  }, []);

  const rejectAll = useCallback(() => {
    const state = saveConsent(defaultPreferences);
    setConsent(state);

    window.dispatchEvent(new CustomEvent('cookieConsentChange', { detail: state }));
  }, []);

  const savePreferences = useCallback((preferences: CookieConsentPreferences) => {
    const state = saveConsent(preferences);
    setConsent(state);

    window.dispatchEvent(new CustomEvent('cookieConsentChange', { detail: state }));
  }, []);

  const clearConsent = useCallback(() => {
    localStorage.removeItem(CONSENT_KEY);
    setConsent(null);

    window.dispatchEvent(new CustomEvent('cookieConsentChange', { detail: null }));
  }, []);

  const hasConsent = useCallback((category: CookieCategory): boolean => {
    if (category === 'essential') return true; // Always consented
    if (!consent) return false;
    return consent.preferences[category] ?? false;
  }, [consent]);

  return {
    consent,
    needsConsent: !isLoading && consent === null,
    isLoading,
    acceptAll,
    rejectAll,
    savePreferences,
    clearConsent,
    hasConsent,
  };
}

// Export a function to programmatically open the consent dialog
// This can be called from anywhere (e.g., footer link)
export function reopenCookieConsent(): void {
  window.dispatchEvent(new CustomEvent('reopenCookieConsent'));
}

// Export utility to check consent without hook (for scripts that run outside React)
export function getCookieConsent(): CookieConsentState | null {
  return getStoredConsent();
}

export function hasCookieConsent(category: CookieCategory): boolean {
  if (category === 'essential') return true;
  const consent = getStoredConsent();
  if (!consent) return false;
  return consent.preferences[category] ?? false;
}
