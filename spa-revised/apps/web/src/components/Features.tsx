'use client'

import { Calendar, Users, DollarSign, Bell, BarChart3, Lock } from 'lucide-react'

const features = [
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: '30-minute grid, conflict detection, staff availability at a glance',
    color: 'from-soft-peach/10 to-soft-peach/5',
    accentColor: 'text-soft-peach'
  },
  {
    icon: Users,
    title: 'Client Management',
    description: 'Complete profiles with history, preferences, and communication log',
    color: 'from-soft-lavender/10 to-soft-lavender/5',
    accentColor: 'text-soft-lavender'
  },
  {
    icon: DollarSign,
    title: 'Payment Processing',
    description: 'Stripe integration for secure, seamless checkout and invoicing',
    color: 'from-soft-mint/10 to-soft-mint/5',
    accentColor: 'text-soft-mint'
  },
  {
    icon: Bell,
    title: 'Automated Reminders',
    description: 'Smart email & SMS at 24h and 2h before every appointment',
    color: 'from-soft-rose/10 to-soft-rose/5',
    accentColor: 'text-soft-rose'
  },
  {
    icon: BarChart3,
    title: 'Business Analytics',
    description: 'Revenue trends, performance metrics, and actionable insights',
    color: 'from-soft-peach/10 to-soft-peach/5',
    accentColor: 'text-soft-peach'
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    description: 'Role-based access, JWT auth, encryption, and compliance ready',
    color: 'from-soft-lavender/10 to-soft-lavender/5',
    accentColor: 'text-soft-lavender'
  }
]

export function Features() {
  return (
    <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 bg-cream relative">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-soft-mint/5 rounded-full blur-3xl opacity-20" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16 lg:mb-20">
          <h2 className="text-section-xl lg:text-display-sm font-display font-bold text-charcoal mb-4">
            Everything your salon needs
          </h2>
          <p className="text-body-lg text-charcoal/60 max-w-2xl mx-auto">
            Powerful features designed to help you run your salon smoothly and delight every client
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <div
                key={i}
                className={`group relative p-8 lg:p-10 rounded-xl lg:rounded-2xl bg-gradient-to-br ${feature.color} border border-white/40 backdrop-blur-sm transition-all duration-300 hover:shadow-card hover:border-white/60 hover:-translate-y-1 hover:bg-gradient-to-br hover:from-white/40 hover:to-white/20`}
                style={{
                  animation: `slideUp 0.6s ease-out ${i * 0.1}s both`
                }}
              >
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-lg bg-white/60 backdrop-blur-sm mb-5 transition-all duration-300 group-hover:shadow-lg ${feature.accentColor}`}>
                  <Icon size={28} strokeWidth={1.5} />
                </div>

                {/* Content */}
                <h3 className="text-section-sm font-semibold text-charcoal mb-3 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-body text-charcoal/70 leading-relaxed transition-colors">
                  {feature.description}
                </p>

                {/* Accent line */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sage/0 via-sage/30 to-sage/0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
