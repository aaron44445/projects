'use client';

import Link from 'next/link';
import {
  CheckCircle2,
  ArrowRight,
  Calendar,
  Users,
  Settings,
  Sparkles,
} from 'lucide-react';

export function SuccessStep() {
  // Calculate trial end date (14 days from now)
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 14);
  const formattedTrialEndDate = trialEndDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const quickStartSteps = [
    {
      number: 1,
      title: 'Add your services',
      description: 'Set up the services you offer with pricing and duration',
      icon: Sparkles,
    },
    {
      number: 2,
      title: 'Invite your team',
      description: 'Add staff members and assign them to services',
      icon: Users,
    },
    {
      number: 3,
      title: 'Set your hours',
      description: 'Configure your business hours and availability',
      icon: Calendar,
    },
    {
      number: 4,
      title: 'Customize settings',
      description: 'Fine-tune notifications, payments, and more',
      icon: Settings,
    },
  ];

  return (
    <div className="text-center space-y-8">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sage to-sage-dark flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-white" />
        </div>
      </div>

      {/* Success Message */}
      <div>
        <h1 className="text-3xl font-bold text-charcoal mb-3">You're all set!</h1>
        <p className="text-lg text-charcoal/60 max-w-md mx-auto">
          Your Peacase account is ready. Let's get your business up and running.
        </p>
      </div>

      {/* Trial Info */}
      <div className="bg-gradient-to-br from-sage/10 to-lavender/10 rounded-2xl p-6 border border-sage/20 max-w-md mx-auto">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Calendar className="w-5 h-5 text-sage" />
          <span className="font-semibold text-charcoal">14-Day Free Trial Active</span>
        </div>
        <p className="text-sm text-charcoal/60">
          Your trial ends on {formattedTrialEndDate}. You can cancel anytime before then.
        </p>
      </div>

      {/* Quick Start Guide */}
      <div className="text-left max-w-lg mx-auto">
        <h2 className="text-lg font-semibold text-charcoal mb-4 text-center">
          Quick Start Guide
        </h2>
        <div className="space-y-4">
          {quickStartSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="flex items-start gap-4 p-4 bg-white rounded-xl border border-charcoal/10"
              >
                <div className="w-8 h-8 rounded-full bg-sage/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-sage">{step.number}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-sage" />
                    <h3 className="font-medium text-charcoal">{step.title}</h3>
                  </div>
                  <p className="text-sm text-charcoal/60">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Go to Dashboard Button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark transition-all shadow-lg hover:shadow-xl"
      >
        Go to Dashboard
        <ArrowRight className="w-5 h-5" />
      </Link>
    </div>
  );
}
