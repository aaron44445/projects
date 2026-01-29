'use client';

import Link from 'next/link';
import { Check, Sparkles, Calendar, CreditCard, Bell, BarChart3, Package, Gift, Megaphone, Building2, ArrowRight } from 'lucide-react';

const plans = [
  {
    id: 'professional',
    name: 'Professional',
    description: 'Everything you need to run your business',
    price: 49,
    features: [
      'Unlimited staff members',
      'Unlimited clients',
      'Full scheduling system',
      'Calendar management',
      'Client management',
      'Priority email support',
    ],
    limits: { staff: 'Unlimited', clients: 'Unlimited' },
    cta: 'Start 14-Day Free Trial',
    ctaHref: '/signup?plan=professional',
    popular: true,
  },
];

const addons = [
  { id: 'online_booking', name: 'Online Booking', description: 'Let clients book 24/7 from your website', icon: Calendar },
  { id: 'payment_processing', name: 'Payment Processing', description: 'Accept cards, Apple Pay, Google Pay', icon: CreditCard },
  { id: 'reminders', name: 'SMS/Email Reminders', description: 'Reduce no-shows with automated reminders', icon: Bell },
  { id: 'reports', name: 'Reports & Analytics', description: 'Revenue dashboards, staff performance', icon: BarChart3 },
  { id: 'memberships', name: 'Packages & Memberships', description: 'Sell packages and recurring memberships', icon: Package },
  { id: 'gift_cards', name: 'Gift Cards', description: 'Sell and redeem digital gift cards', icon: Gift },
  { id: 'marketing', name: 'Marketing Automation', description: 'Automated campaigns and promotions', icon: Megaphone },
];

const faqs = [
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express) as well as debit cards. All payments are processed securely through Stripe.',
  },
  {
    question: 'What happens after my free trial ends?',
    answer: 'After your 14-day trial, you\'ll need to subscribe to continue using Peacase. During the trial, you have full access to all features including add-ons.',
  },
  {
    question: 'Can I add features after subscribing?',
    answer: 'Yes! You can add optional features like Online Booking, Payment Processing, SMS Reminders, and more at $25/month each. Add or remove them anytime from your settings.',
  },
  {
    question: 'Can I cancel my subscription?',
    answer: 'Absolutely. You can cancel your subscription at any time from your account settings. Your access will continue until the end of your current billing period.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'We offer a 14-day free trial so you can try before you buy. After that, we don\'t offer refunds, but you can cancel anytime to stop future charges.',
  },
  {
    question: 'What happens to my data if I cancel?',
    answer: 'Your data remains available for 30 days after cancellation. After that, it\'s permanently deleted. You can export your data anytime from your account settings.',
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-white border-b border-charcoal/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-charcoal">
            Peacase
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-charcoal/70 hover:text-charcoal transition-colors">
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-sage text-white rounded-lg font-medium hover:bg-sage-dark transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-charcoal mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-charcoal/60 mb-8">
            One plan, all core features included. Add what you need, cancel anytime.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-lavender/20 rounded-full text-lavender-dark">
            <Sparkles className="w-5 h-5" />
            <span className="font-medium">14-day free trial with full feature access</span>
          </div>
        </div>
      </section>

      {/* Plan */}
      <section className="pb-16 md:pb-24">
        <div className="max-w-lg mx-auto px-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="relative bg-white rounded-2xl p-8 ring-2 ring-sage shadow-xl"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-sage text-white text-sm font-medium rounded-full">
                One Simple Plan
              </div>

              <div className="mb-6 text-center">
                <h3 className="text-2xl font-bold text-charcoal mb-2">{plan.name}</h3>
                <p className="text-charcoal/60">{plan.description}</p>
              </div>

              <div className="mb-6 text-center">
                <span className="text-5xl font-bold text-charcoal">${plan.price}</span>
                <span className="text-charcoal/60">/month</span>
              </div>

              <Link
                href={plan.ctaHref}
                className="block w-full py-4 px-4 rounded-lg font-medium text-center transition-colors mb-8 bg-sage text-white hover:bg-sage-dark text-lg"
              >
                {plan.cta}
              </Link>

              <div className="space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-sage flex-shrink-0 mt-0.5" />
                    <span className="text-charcoal/80">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Add-ons */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-charcoal mb-4">Powerful Add-ons</h2>
            <p className="text-xl text-charcoal/60">
              Enhance your plan with additional features at <span className="font-semibold">$25/month</span> each
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {addons.map((addon) => {
              const Icon = addon.icon;
              return (
                <div
                  key={addon.id}
                  className="p-6 rounded-xl border border-charcoal/10 hover:border-sage/30 hover:shadow-md transition-all"
                >
                  <div className="w-12 h-12 rounded-lg bg-sage/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-sage" />
                  </div>
                  <h3 className="font-semibold text-charcoal mb-2">{addon.name}</h3>
                  <p className="text-sm text-charcoal/60">{addon.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Extra Locations */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-sage/5 to-lavender/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-sage/10 mb-6">
            <Building2 className="w-8 h-8 text-sage" />
          </div>
          <h2 className="text-3xl font-bold text-charcoal mb-4">Multiple Locations?</h2>
          <p className="text-xl text-charcoal/60 mb-8">
            Add extra locations to manage all your business locations from one account.
          </p>
          <div className="inline-block bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-4xl font-bold text-charcoal mb-2">$100</div>
            <div className="text-charcoal/60 mb-4">per additional location / month</div>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 text-sage font-medium hover:text-sage-dark transition-colors"
            >
              Get started with multiple locations
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-charcoal text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-charcoal/10 pb-6">
                <h3 className="font-semibold text-charcoal mb-2">{faq.question}</h3>
                <p className="text-charcoal/60">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-charcoal text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to grow your business?
          </h2>
          <p className="text-xl text-white/70 mb-8">
            Join thousands of spa and salon owners who trust Peacase.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 bg-sage text-white rounded-lg font-medium hover:bg-sage-dark transition-colors text-lg"
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-sm text-white/50">
            No credit card required. 14-day free trial.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-charcoal text-white/60 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span>Billed monthly. Cancel anytime.</span>
              <span>|</span>
              <span>Prices in USD</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
