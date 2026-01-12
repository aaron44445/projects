'use client'

import { Check } from 'lucide-react'

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
    ]
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
    highlighted: true
  },
  {
    name: 'Enterprise',
    price: 199,
    description: 'Full-featured platform',
    features: [
      'Unlimited locations',
      'Unlimited staff',
      'Unlimited clients',
      'All Starter features',
      'API access',
      'Custom integrations',
      'Dedicated account manager',
      'White-label options'
    ]
  }
]

export function PricingShowcase() {
  return (
    <div className="py-24 px-4" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16" style={{ color: '#2C2C2C' }}>
          Simple, Transparent Pricing
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier, i) => (
            <div
              key={i}
              className="p-8 rounded-2xl transition-all hover:shadow-lg"
              style={{
                backgroundColor: tier.highlighted ? '#C7DCC8' : '#F5F3F0',
                border: tier.highlighted ? 'none' : '1px solid #E8E6E4'
              }}
            >
              <h3 className="text-2xl font-bold mb-2" style={{ color: tier.highlighted ? '#fff' : '#2C2C2C' }}>
                {tier.name}
              </h3>
              <p style={{ color: tier.highlighted ? 'rgba(255,255,255,0.8)' : '#666', marginBottom: '16px' }}>
                {tier.description}
              </p>
              <div className="mb-8">
                <span className="text-4xl font-bold" style={{ color: tier.highlighted ? '#fff' : '#2C2C2C' }}>
                  ${tier.price}
                </span>
                <span style={{ color: tier.highlighted ? 'rgba(255,255,255,0.8)' : '#666' }}>/month</span>
              </div>

              <ul className="space-y-4 mb-8">
                {tier.features.map((feature, j) => (
                  <li key={j} className="flex gap-3">
                    <Check size={20} style={{ color: tier.highlighted ? '#fff' : '#C7DCC8', flexShrink: 0 }} />
                    <span style={{ color: tier.highlighted ? '#fff' : '#2C2C2C' }}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                className="w-full py-3 rounded-lg font-bold transition-all hover:scale-105"
                style={{
                  backgroundColor: tier.highlighted ? '#fff' : '#C7DCC8',
                  color: tier.highlighted ? '#C7DCC8' : '#fff'
                }}
              >
                Choose {tier.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
