'use client';

import { useState } from 'react';
import { Building2, ArrowRight } from 'lucide-react';
import type { BusinessInfo } from './OnboardingWizard';

interface BusinessBasicsStepProps {
  data: BusinessInfo;
  onChange: (data: BusinessInfo) => void;
  onNext: () => void;
}

const businessTypes = [
  { value: 'hair_salon', label: 'Hair Salon' },
  { value: 'nail_salon', label: 'Nail Salon' },
  { value: 'day_spa', label: 'Day Spa' },
  { value: 'barbershop', label: 'Barbershop' },
  { value: 'beauty_studio', label: 'Beauty Studio' },
  { value: 'massage', label: 'Massage' },
  { value: 'med_spa', label: 'Med Spa' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'tattoo', label: 'Tattoo' },
  { value: 'tanning', label: 'Tanning' },
];

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
];

export function BusinessBasicsStep({ data, onChange, onNext }: BusinessBasicsStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!data.name.trim()) {
      newErrors.name = 'Business name is required';
    }

    if (!data.type) {
      newErrors.type = 'Please select a business type';
    }

    if (!data.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onNext();
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-sage/10 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-sage" />
        </div>
        <h1 className="text-2xl font-bold text-charcoal mb-2">Tell us about your business</h1>
        <p className="text-charcoal/60">
          We'll use this to personalize your Peacase experience
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            Business Name <span className="text-rose-dark">*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => {
              onChange({ ...data, name: e.target.value });
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
            placeholder="e.g., Serenity Spa & Salon"
            className={`w-full px-4 py-3 rounded-xl border ${
              errors.name
                ? 'border-rose-dark focus:border-rose-dark focus:ring-rose-dark/20'
                : 'border-charcoal/20 focus:border-sage focus:ring-sage/20'
            } focus:ring-2 outline-none transition-all`}
          />
          {errors.name && <p className="text-sm text-rose-dark mt-1">{errors.name}</p>}
        </div>

        {/* Business Type */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            Business Type <span className="text-rose-dark">*</span>
          </label>
          <select
            value={data.type}
            onChange={(e) => {
              onChange({ ...data, type: e.target.value });
              if (errors.type) setErrors({ ...errors, type: '' });
            }}
            className={`w-full px-4 py-3 rounded-xl border ${
              errors.type
                ? 'border-rose-dark focus:border-rose-dark focus:ring-rose-dark/20'
                : 'border-charcoal/20 focus:border-sage focus:ring-sage/20'
            } focus:ring-2 outline-none transition-all bg-white`}
          >
            <option value="">Select your business type</option>
            {businessTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.type && <p className="text-sm text-rose-dark mt-1">{errors.type}</p>}
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            Timezone
          </label>
          <select
            value={data.timezone}
            onChange={(e) => onChange({ ...data, timezone: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all bg-white"
          >
            {timezones.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            Business Email <span className="text-rose-dark">*</span>
          </label>
          <input
            type="email"
            value={data.email}
            onChange={(e) => {
              onChange({ ...data, email: e.target.value });
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
            placeholder="hello@yourbusiness.com"
            className={`w-full px-4 py-3 rounded-xl border ${
              errors.email
                ? 'border-rose-dark focus:border-rose-dark focus:ring-rose-dark/20'
                : 'border-charcoal/20 focus:border-sage focus:ring-sage/20'
            } focus:ring-2 outline-none transition-all`}
          />
          {errors.email && <p className="text-sm text-rose-dark mt-1">{errors.email}</p>}
        </div>
      </div>

      {/* Continue Button */}
      <button
        onClick={handleSubmit}
        className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark transition-all shadow-lg hover:shadow-xl"
      >
        Continue
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}
