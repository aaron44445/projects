'use client';

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe,
  CreditCard,
  MessageSquare,
  BarChart3,
  Star,
  Layers,
  Gift,
  Sparkles,
} from 'lucide-react';

interface AddOnsStepProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const BASE_PLAN_PRICE = 50;
const ADD_ON_PRICE = 25;

const addOns = [
  {
    id: 'online_booking',
    name: 'Online Booking',
    description: 'Let clients book 24/7 from your website',
    icon: Globe,
  },
  {
    id: 'payment_processing',
    name: 'Payment Processing',
    description: 'Accept cards, Apple Pay, Google Pay',
    icon: CreditCard,
  },
  {
    id: 'reminders',
    name: 'SMS/Email Reminders',
    description: 'Reduce no-shows with automated reminders',
    icon: MessageSquare,
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    description: 'Revenue dashboards, staff performance',
    icon: BarChart3,
  },
  {
    id: 'reviews',
    name: 'Reviews & Ratings',
    description: 'Collect and display client reviews',
    icon: Star,
  },
  {
    id: 'memberships',
    name: 'Packages & Memberships',
    description: 'Sell packages and recurring memberships',
    icon: Layers,
  },
  {
    id: 'gift_cards',
    name: 'Gift Cards',
    description: 'Sell and redeem digital gift cards',
    icon: Gift,
  },
  {
    id: 'marketing',
    name: 'Marketing Automation',
    description: 'Automated campaigns and promotions',
    icon: Sparkles,
  },
];

export function AddOnsStep({ selected, onChange, onNext, onBack }: AddOnsStepProps) {
  const toggleAddOn = (addOnId: string) => {
    if (selected.includes(addOnId)) {
      onChange(selected.filter((id) => id !== addOnId));
    } else {
      onChange([...selected, addOnId]);
    }
  };

  const monthlyTotal = BASE_PLAN_PRICE + selected.length * ADD_ON_PRICE;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-charcoal mb-2">Choose your add-ons</h1>
        <p className="text-charcoal/60">
          Start with the Essentials, then add only the features you need
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
            <p className="text-3xl font-bold text-charcoal">${BASE_PLAN_PRICE}</p>
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

      {/* Add-ons Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-charcoal">Add-on Features</h3>
            <p className="text-sm text-charcoal/60">${ADD_ON_PRICE}/month each - only pay for what you use</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-charcoal/60">Selected: {selected.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addOns.map((addOn) => {
            const Icon = addOn.icon;
            const isSelected = selected.includes(addOn.id);
            return (
              <button
                key={addOn.id}
                onClick={() => toggleAddOn(addOn.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-sage bg-sage/5'
                    : 'border-charcoal/10 hover:border-sage/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-sage text-white' : 'bg-charcoal/5 text-charcoal/60'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-charcoal">{addOn.name}</h4>
                      <span className="text-sm font-semibold text-charcoal">+${ADD_ON_PRICE}</span>
                    </div>
                    <p className="text-sm text-charcoal/60">{addOn.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Monthly Total */}
      <div className="bg-charcoal rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/80">Your monthly total</span>
          <div className="text-right">
            <p className="text-3xl font-bold">${monthlyTotal}</p>
            <p className="text-sm text-white/60">/month after trial</p>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-4 border-t border-white/20">
          <Sparkles className="w-5 h-5 text-sage-light" />
          <span className="text-sm">Start with a 14-day free trial - no charge today</span>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 text-charcoal hover:bg-charcoal/5 rounded-xl font-medium transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <button
          onClick={onNext}
          className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark transition-all shadow-lg hover:shadow-xl"
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
