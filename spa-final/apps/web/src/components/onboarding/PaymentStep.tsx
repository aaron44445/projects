'use client';

import { useState } from 'react';
import { ArrowLeft, Lock, Shield, Loader2 } from 'lucide-react';
import type { BusinessInfo } from './OnboardingWizard';

interface PaymentStepProps {
  businessInfo: BusinessInfo;
  selectedAddOns: string[];
  onComplete: () => Promise<void>;
  onBack: () => void;
  isSubmitting: boolean;
}

const BASE_PLAN_PRICE = 50;
const ADD_ON_PRICE = 25;

const addOnNames: Record<string, string> = {
  online_booking: 'Online Booking',
  payment_processing: 'Payment Processing',
  reminders: 'SMS/Email Reminders',
  reports: 'Reports & Analytics',
  reviews: 'Reviews & Ratings',
  memberships: 'Packages & Memberships',
  gift_cards: 'Gift Cards',
  marketing: 'Marketing Automation',
};

export function PaymentStep({
  businessInfo,
  selectedAddOns,
  onComplete,
  onBack,
  isSubmitting,
}: PaymentStepProps) {
  const [cardInfo, setCardInfo] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const monthlyTotal = BASE_PLAN_PRICE + selectedAddOns.length * ADD_ON_PRICE;

  // Calculate trial end date (14 days from now)
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 14);
  const formattedTrialEndDate = trialEndDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Card number validation (16 digits)
    const cardDigits = cardInfo.number.replace(/\s/g, '');
    if (!cardDigits) {
      newErrors.number = 'Card number is required';
    } else if (cardDigits.length !== 16 || !/^\d+$/.test(cardDigits)) {
      newErrors.number = 'Enter a valid 16-digit card number';
    }

    // Expiry validation (MM/YY format)
    if (!cardInfo.expiry) {
      newErrors.expiry = 'Expiry date is required';
    } else if (!/^\d{2}\/\d{2}$/.test(cardInfo.expiry)) {
      newErrors.expiry = 'Use MM/YY format';
    } else {
      const [month, year] = cardInfo.expiry.split('/').map(Number);
      const now = new Date();
      const expDate = new Date(2000 + year, month - 1);
      if (month < 1 || month > 12) {
        newErrors.expiry = 'Invalid month';
      } else if (expDate < now) {
        newErrors.expiry = 'Card has expired';
      }
    }

    // CVC validation (3-4 digits)
    if (!cardInfo.cvc) {
      newErrors.cvc = 'CVC is required';
    } else if (!/^\d{3,4}$/.test(cardInfo.cvc)) {
      newErrors.cvc = 'Enter a valid CVC';
    }

    // Name validation
    if (!cardInfo.name.trim()) {
      newErrors.name = 'Name on card is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validate()) {
      await onComplete();
    }
  };

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    const formatted = digits.replace(/(\d{4})/g, '$1 ').trim();
    return formatted.slice(0, 19);
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 2) {
      return digits.slice(0, 2) + '/' + digits.slice(2, 4);
    }
    return digits;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-charcoal mb-2">Start your free trial</h1>
        <p className="text-charcoal/60">
          Add a payment method to begin. You won't be charged until your trial ends.
        </p>
      </div>

      {/* Plan Summary */}
      <div className="bg-gradient-to-br from-sage/10 to-lavender/10 rounded-2xl p-6 border border-sage/20">
        <h3 className="font-semibold text-charcoal mb-4">Your Plan Summary</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-charcoal/10">
            <span className="text-charcoal">Essentials (base plan)</span>
            <span className="font-semibold text-charcoal">${BASE_PLAN_PRICE}/mo</span>
          </div>
          {selectedAddOns.length > 0 && (
            <>
              {selectedAddOns.map((addOnId) => (
                <div key={addOnId} className="flex items-center justify-between text-sm">
                  <span className="text-charcoal/70">{addOnNames[addOnId] || addOnId}</span>
                  <span className="text-charcoal">${ADD_ON_PRICE}/mo</span>
                </div>
              ))}
            </>
          )}
          <div className="flex items-center justify-between pt-3 border-t border-charcoal/10">
            <span className="font-semibold text-charcoal">Monthly Total</span>
            <span className="text-xl font-bold text-charcoal">${monthlyTotal}/mo</span>
          </div>
        </div>
      </div>

      {/* Trial Notice */}
      <div className="bg-sage/10 rounded-xl p-4 border border-sage/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-sage-dark" />
          </div>
          <div>
            <p className="font-medium text-charcoal">14-day free trial</p>
            <p className="text-sm text-charcoal/60">
              Your first charge of ${monthlyTotal} will be on {formattedTrialEndDate}
            </p>
          </div>
        </div>
      </div>

      {/* Card Form */}
      <div className="space-y-4">
        <h3 className="font-semibold text-charcoal">Payment Method</h3>

        <div className="bg-white rounded-xl border border-charcoal/10 p-6 space-y-4">
          {/* Card Number */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Card Number <span className="text-rose-dark">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={cardInfo.number}
                onChange={(e) => {
                  setCardInfo({ ...cardInfo, number: formatCardNumber(e.target.value) });
                  if (errors.number) setErrors({ ...errors, number: '' });
                }}
                placeholder="1234 5678 9012 3456"
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.number
                    ? 'border-rose-dark focus:border-rose-dark focus:ring-rose-dark/20'
                    : 'border-charcoal/20 focus:border-sage focus:ring-sage/20'
                } focus:ring-2 outline-none transition-all`}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <div className="w-8 h-5 bg-[#1A1F71] rounded text-white text-xs flex items-center justify-center font-bold">
                  VISA
                </div>
                <div className="w-8 h-5 bg-gradient-to-r from-[#EB001B] to-[#F79E1B] rounded" />
              </div>
            </div>
            {errors.number && <p className="text-sm text-rose-dark mt-1">{errors.number}</p>}
          </div>

          {/* Expiry and CVC */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Expiry Date <span className="text-rose-dark">*</span>
              </label>
              <input
                type="text"
                value={cardInfo.expiry}
                onChange={(e) => {
                  setCardInfo({ ...cardInfo, expiry: formatExpiry(e.target.value) });
                  if (errors.expiry) setErrors({ ...errors, expiry: '' });
                }}
                placeholder="MM/YY"
                maxLength={5}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.expiry
                    ? 'border-rose-dark focus:border-rose-dark focus:ring-rose-dark/20'
                    : 'border-charcoal/20 focus:border-sage focus:ring-sage/20'
                } focus:ring-2 outline-none transition-all`}
              />
              {errors.expiry && <p className="text-sm text-rose-dark mt-1">{errors.expiry}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                CVC <span className="text-rose-dark">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cardInfo.cvc}
                  onChange={(e) => {
                    setCardInfo({
                      ...cardInfo,
                      cvc: e.target.value.replace(/\D/g, '').slice(0, 4),
                    });
                    if (errors.cvc) setErrors({ ...errors, cvc: '' });
                  }}
                  placeholder="123"
                  maxLength={4}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.cvc
                      ? 'border-rose-dark focus:border-rose-dark focus:ring-rose-dark/20'
                      : 'border-charcoal/20 focus:border-sage focus:ring-sage/20'
                  } focus:ring-2 outline-none transition-all`}
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/30" />
              </div>
              {errors.cvc && <p className="text-sm text-rose-dark mt-1">{errors.cvc}</p>}
            </div>
          </div>

          {/* Name on Card */}
          <div>
            <label className="block text-sm font-medium text-charcoal mb-2">
              Name on Card <span className="text-rose-dark">*</span>
            </label>
            <input
              type="text"
              value={cardInfo.name}
              onChange={(e) => {
                setCardInfo({ ...cardInfo, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              placeholder="John Smith"
              className={`w-full px-4 py-3 rounded-lg border ${
                errors.name
                  ? 'border-rose-dark focus:border-rose-dark focus:ring-rose-dark/20'
                  : 'border-charcoal/20 focus:border-sage focus:ring-sage/20'
              } focus:ring-2 outline-none transition-all`}
            />
            {errors.name && <p className="text-sm text-rose-dark mt-1">{errors.name}</p>}
          </div>
        </div>

        {/* Security Notice */}
        <div className="flex items-start gap-3 p-4 bg-charcoal/5 rounded-xl">
          <Lock className="w-5 h-5 text-sage mt-0.5" />
          <div className="text-sm text-charcoal/70">
            <p className="font-medium text-charcoal mb-1">Secure Payment</p>
            <p>
              Your payment information is encrypted and processed securely by Stripe. We never
              store your full card details.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-6 py-3 text-charcoal hover:bg-charcoal/5 rounded-xl font-medium transition-all disabled:opacity-50"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            'Start Free Trial'
          )}
        </button>
      </div>
    </div>
  );
}
