'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Cookie, Shield, BarChart3, Megaphone, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { useCookieConsent, type CookieConsentPreferences } from '@/hooks/useCookieConsent';

interface CookieConsentProps {
  // Whether to show for all users or try to detect EU (default: all users)
  euOnly?: boolean;
}

interface CategoryToggleProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  onChange: (enabled: boolean) => void;
}

function CategoryToggle({ id, icon, title, description, enabled, disabled, onChange }: CategoryToggleProps) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-charcoal/[0.03] border border-charcoal/5">
      <div className="w-10 h-10 rounded-lg bg-sage/10 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-medium text-charcoal">{title}</h4>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              id={id}
              checked={enabled}
              disabled={disabled}
              onChange={(e) => onChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className={`
              w-11 h-6 rounded-full peer
              transition-colors duration-200
              ${disabled
                ? 'bg-sage cursor-not-allowed'
                : enabled
                  ? 'bg-sage'
                  : 'bg-charcoal/20'
              }
              after:content-[''] after:absolute after:top-[2px] after:left-[2px]
              after:bg-white after:rounded-full after:h-5 after:w-5
              after:transition-transform after:duration-200
              ${enabled ? 'after:translate-x-5' : 'after:translate-x-0'}
            `} />
          </label>
        </div>
        <p className="text-sm text-charcoal/60 mt-1">{description}</p>
        {disabled && (
          <span className="inline-block mt-2 text-xs text-sage font-medium">Always active</span>
        )}
      </div>
    </div>
  );
}

export function CookieConsent({ euOnly = false }: CookieConsentProps) {
  const { needsConsent, isLoading, acceptAll, rejectAll, savePreferences } = useCookieConsent();
  const [showBanner, setShowBanner] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Custom preferences state
  const [customPrefs, setCustomPrefs] = useState<CookieConsentPreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  // Check if user should see banner
  useEffect(() => {
    if (isLoading) return;

    if (needsConsent) {
      if (euOnly) {
        // Try to detect EU user via timezone (simple heuristic)
        // This is not 100% accurate but good enough for most cases
        // Production apps should use a proper geolocation service
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const euTimezones = [
          'Europe/', 'Atlantic/Canary', 'Atlantic/Faroe', 'Atlantic/Madeira',
          'Atlantic/Reykjavik', 'Africa/Ceuta',
        ];
        const isLikelyEU = euTimezones.some(tz => timezone.startsWith(tz));
        setShowBanner(isLikelyEU);
      } else {
        setShowBanner(true);
      }
    }
  }, [needsConsent, isLoading, euOnly]);

  // Listen for reopen event
  useEffect(() => {
    const handleReopen = () => {
      setShowBanner(true);
      setShowCustomize(false);
      setIsClosing(false);
    };

    window.addEventListener('reopenCookieConsent', handleReopen);
    return () => window.removeEventListener('reopenCookieConsent', handleReopen);
  }, []);

  const handleClose = useCallback((action: 'accept' | 'reject' | 'custom') => {
    setIsClosing(true);

    // Wait for animation before actually closing
    setTimeout(() => {
      if (action === 'accept') {
        acceptAll();
      } else if (action === 'reject') {
        rejectAll();
      } else {
        savePreferences(customPrefs);
      }
      setShowBanner(false);
      setIsClosing(false);
      setShowCustomize(false);
    }, 200);
  }, [acceptAll, rejectAll, savePreferences, customPrefs]);

  if (!showBanner) return null;

  return (
    <>
      {/* Backdrop for customize modal */}
      {showCustomize && (
        <div
          className="fixed inset-0 bg-charcoal/30 backdrop-blur-sm z-[998] transition-opacity duration-200"
          onClick={() => setShowCustomize(false)}
        />
      )}

      {/* Cookie Banner */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-[999]
          transition-all duration-300 ease-out
          ${isClosing ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}
        `}
      >
        <div className="max-w-5xl mx-auto p-4 sm:p-6">
          <div
            className={`
              bg-cream border border-charcoal/10 rounded-2xl shadow-card-xl overflow-hidden
              ${showCustomize ? 'ring-2 ring-sage/20' : ''}
            `}
          >
            {/* Main Banner */}
            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sage to-sage-dark flex items-center justify-center flex-shrink-0 shadow-soft">
                  <Cookie className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-charcoal mb-2">
                    We use cookies
                  </h3>
                  <p className="text-sm text-charcoal/70 leading-relaxed">
                    We use cookies to enhance your experience, analyze site traffic, and for marketing purposes.
                    By clicking "Accept All", you consent to our use of cookies. You can customize your preferences
                    or reject non-essential cookies.
                  </p>

                  {/* Customize Toggle Button */}
                  <button
                    onClick={() => setShowCustomize(!showCustomize)}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm text-sage hover:text-sage-dark font-medium transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Customize preferences
                    {showCustomize ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto flex-shrink-0">
                  <button
                    onClick={() => handleClose('reject')}
                    className="
                      px-5 py-2.5 rounded-xl text-sm font-medium
                      bg-charcoal/5 text-charcoal hover:bg-charcoal/10
                      border border-charcoal/10
                      transition-all duration-200
                      order-2 sm:order-1
                    "
                  >
                    Reject All
                  </button>
                  <button
                    onClick={() => handleClose('accept')}
                    className="
                      px-5 py-2.5 rounded-xl text-sm font-medium
                      bg-gradient-to-r from-sage to-sage-dark text-white
                      hover:shadow-hover
                      transition-all duration-200
                      order-1 sm:order-2
                    "
                  >
                    Accept All
                  </button>
                </div>
              </div>
            </div>

            {/* Customize Section (Expandable) */}
            <div
              className={`
                overflow-hidden transition-all duration-300 ease-out
                ${showCustomize ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
              `}
            >
              <div className="px-6 pb-6 pt-2 border-t border-charcoal/10">
                <div className="grid gap-3 sm:grid-cols-3 mt-4">
                  {/* Essential Cookies */}
                  <CategoryToggle
                    id="essential"
                    icon={<Shield className="w-5 h-5 text-sage" />}
                    title="Essential"
                    description="Required for the website to function. Cannot be disabled."
                    enabled={true}
                    disabled={true}
                    onChange={() => {}}
                  />

                  {/* Analytics Cookies */}
                  <CategoryToggle
                    id="analytics"
                    icon={<BarChart3 className="w-5 h-5 text-sage" />}
                    title="Analytics"
                    description="Help us understand how visitors use our website."
                    enabled={customPrefs.analytics}
                    onChange={(enabled) => setCustomPrefs(prev => ({ ...prev, analytics: enabled }))}
                  />

                  {/* Marketing Cookies */}
                  <CategoryToggle
                    id="marketing"
                    icon={<Megaphone className="w-5 h-5 text-sage" />}
                    title="Marketing"
                    description="Used to deliver personalized advertisements."
                    enabled={customPrefs.marketing}
                    onChange={(enabled) => setCustomPrefs(prev => ({ ...prev, marketing: enabled }))}
                  />
                </div>

                {/* Save Custom Preferences Button */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleClose('custom')}
                    className="
                      px-5 py-2.5 rounded-xl text-sm font-medium
                      bg-charcoal text-white hover:bg-charcoal/90
                      transition-all duration-200
                    "
                  >
                    Save Preferences
                  </button>
                </div>

                {/* Privacy Policy Link */}
                <p className="mt-4 text-xs text-charcoal/50 text-center">
                  For more information, please read our{' '}
                  <a href="/privacy" className="text-sage hover:underline">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Also export a small button component for re-opening preferences
// This can be placed in the footer
export function CookiePreferencesButton({ className = '' }: { className?: string }) {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('reopenCookieConsent'));
  };

  return (
    <button
      onClick={handleClick}
      className={`
        inline-flex items-center gap-1.5 text-sm text-charcoal/60
        hover:text-sage transition-colors
        ${className}
      `}
    >
      <Cookie className="w-4 h-4" />
      Cookie Preferences
    </button>
  );
}

export default CookieConsent;
