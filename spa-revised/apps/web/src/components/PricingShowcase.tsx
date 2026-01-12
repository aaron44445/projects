'use client'

import { Check, Zap } from 'lucide-react'

const tiers = [
  {
    name: 'Starter',
    price: 29,
    description: 'Perfect for solo practitioners',
    features: [
      'Up to 1 location',
      'Up to 5 staff members',
      'Unlimited clients',
      'Basic scheduling',
      'Email reminders',
      'Email support'
    ],
    cta: 'Get started',
    featured: false
  },
  {
    name: 'Professional',
    price: 79,
    description: 'For growing salons',
    features: [
      'Up to 5 locations',
      'Unlimited staff',
      'Unlimited clients',
      'Advanced scheduling',
      'Email & SMS reminders',
      'Client portal',
      'Payment processing',
      'Priority support',
      'Marketing tools'
    ],
    cta: 'Start free trial',
    featured: true
  },
  {
    name: 'Enterprise',
    price: 199,
    description: 'Full-featured platform',
    features: [
      'Unlimited locations',
      'Unlimited staff',
      'Unlimited clients',
      'All features included',
      'API access',
      'Custom integrations',
      'Dedicated account manager',
      'White-label options'
    ],
    cta: 'Contact sales',
    featured: false
  }
]

export function PricingShowcase() {
  return (
    <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-cream relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-96 h-96 bg-soft-lavender/10 rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-soft-peach/10 rounded-full blur-3xl opacity-20" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16 lg:mb-20">
          <h2 className="text-section-xl lg:text-display-sm font-display font-bold text-charcoal mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-body-lg text-charcoal/60 max-w-2xl mx-auto">
            Choose the plan that fits your salon. Always flexible—upgrade or downgrade anytime.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative">
          {tiers.map((tier, i) => (
            <div
              key={i}
              className={`relative group transition-all duration-300 ${tier.featured ? 'md:scale-105 md:z-10' : ''}`}
            >
              {/* Card */}
              <div
                className={`relative h-full p-8 lg:p-10 rounded-2xl border transition-all duration-300 flex flex-col ${
                  tier.featured
                    ? 'bg-gradient-to-br from-sage/20 to-sage/10 border-sage/50 shadow-card-lg hover:shadow-card-xl'
                    : 'bg-white border-white/60 shadow-card hover:shadow-card-lg'
                }`}
              >
                {/* Featured badge */}
                {tier.featured && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sage text-white text-small font-medium shadow-lg">
                      <Zap size={16} />
                      Most popular
                    </div>
                  </div>
                )}

                {/* Header */}
                <div className="mb-8">
                  <h3 className={`text-section font-semibold mb-2 ${tier.featured ? 'text-sage' : 'text-charcoal'}`}>
                    {tier.name}
                  </h3>
                  <p className="text-body text-charcoal/60">
                    {tier.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-5xl font-bold ${tier.featured ? 'text-sage' : 'text-charcoal'}`}>
                      ${tier.price}
                    </span>
                    <span className="text-body text-charcoal/60">/month</span>
                  </div>
                  <p className="text-small text-charcoal/50 mt-2">Billed monthly, cancel anytime</p>
                </div>

                {/* CTA Button */}
                <button
                  className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 mb-8 ${
                    tier.featured
                      ? 'bg-sage text-white hover:shadow-hover hover:-translate-y-1 active:scale-95'
                      : 'bg-charcoal/5 text-charcoal border-2 border-charcoal/10 hover:border-charcoal/30 hover:shadow-card active:scale-95'
                  }`}
                >
                  {tier.cta}
                </button>

                {/* Features list */}
                <div className="flex-1">
                  <div className="text-small font-medium text-charcoal/60 mb-6">
                    Everything included:
                  </div>
                  <ul className="space-y-4">
                    {tier.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <Check
                          size={20}
                          className={`mt-0.5 flex-shrink-0 ${tier.featured ? 'text-sage' : 'text-charcoal/40'}`}
                          strokeWidth={2.5}
                        />
                        <span className="text-body text-charcoal/70">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-body text-charcoal/60 mb-4">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>
      </div>
    </section>
  )
}
