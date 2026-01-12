'use client'

import { Calendar, Users, DollarSign, Bell, BarChart3, Lock } from 'lucide-react'

const features = [
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description: '30-minute appointment grid with intelligent conflict detection and staff availability'
  },
  {
    icon: Users,
    title: 'Client Management',
    description: 'Complete client profiles with history, preferences, and communication tracking'
  },
  {
    icon: DollarSign,
    title: 'Payment Processing',
    description: 'Built-in Stripe integration for secure, seamless payment handling'
  },
  {
    icon: Bell,
    title: 'Automated Reminders',
    description: 'Email and SMS reminders at 24h and 2h before appointments'
  },
  {
    icon: BarChart3,
    title: 'Business Analytics',
    description: 'Revenue reports, performance metrics, and business insights'
  },
  {
    icon: Lock,
    title: 'Enterprise Security',
    description: 'Role-based access control, JWT authentication, and data encryption'
  }
]

export function Features() {
  return (
    <div className="py-24 px-4" style={{ backgroundColor: '#F5F3F0' }}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16" style={{ color: '#2C2C2C' }}>
          Everything You Need to Run Your Salon
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <div
                key={i}
                className="p-8 rounded-2xl transition-all hover:shadow-lg"
                style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
              >
                <div className="mb-4" style={{ color: '#C7DCC8' }}>
                  <Icon size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#2C2C2C' }}>
                  {feature.title}
                </h3>
                <p style={{ color: '#666' }}>
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
