'use client'

import { useState } from 'react'
import { Settings, Lock, CreditCard, Zap } from 'lucide-react'

const TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'features', label: 'Features', icon: Zap },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'security', label: 'Security', icon: Lock }
]

export default function SettingsPage() {
  const [currentTab, setCurrentTab] = useState('general')
  const [salonName, setSalonName] = useState('My Beautiful Salon')

  const renderTabContent = () => {
    switch (currentTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold" style={{ color: '#2C2C2C' }}>General Settings</h2>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
                Salon Name
              </label>
              <input
                type="text"
                value={salonName}
                onChange={(e) => setSalonName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                style={{ borderColor: '#E8E6E4' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
                Contact Email
              </label>
              <input
                type="email"
                defaultValue="contact@salon.com"
                className="w-full px-4 py-2 border rounded-lg"
                style={{ borderColor: '#E8E6E4' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
                Phone Number
              </label>
              <input
                type="tel"
                defaultValue="555-1234"
                className="w-full px-4 py-2 border rounded-lg"
                style={{ borderColor: '#E8E6E4' }}
              />
            </div>

            <button
              className="px-6 py-3 rounded-lg font-bold text-white"
              style={{ backgroundColor: '#C7DCC8' }}
            >
              Save Changes
            </button>
          </div>
        )

      case 'features':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold" style={{ color: '#2C2C2C' }}>Premium Features</h2>
            <p style={{ color: '#666' }}>
              Your current plan includes the following features:
            </p>

            <div className="space-y-3">
              {[
                { name: 'Service Packages', enabled: true },
                { name: 'Gift Cards', enabled: true },
                { name: 'Multi-Location', enabled: false },
                { name: 'Consultation Forms', enabled: true },
                { name: 'Reviews & Feedback', enabled: true },
                { name: 'Marketing Tools', enabled: false }
              ].map(feature => (
                <label key={feature.name} className="flex items-center gap-3 p-4 rounded-lg cursor-pointer" style={{ backgroundColor: '#F5F3F0' }}>
                  <input
                    type="checkbox"
                    defaultChecked={feature.enabled}
                    style={{ accentColor: '#C7DCC8' }}
                  />
                  <span style={{ color: '#2C2C2C' }}>{feature.name}</span>
                  {!feature.enabled && (
                    <span className="ml-auto text-sm" style={{ color: '#999' }}>Upgrade needed</span>
                  )}
                </label>
              ))}
            </div>
          </div>
        )

      case 'billing':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold" style={{ color: '#2C2C2C' }}>Billing & Subscription</h2>

            <div className="p-6 rounded-2xl" style={{ backgroundColor: '#F5F3F0' }}>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm" style={{ color: '#666' }}>Current Plan</p>
                  <h3 className="text-2xl font-bold" style={{ color: '#2C2C2C' }}>Professional</h3>
                </div>
                <div className="text-right">
                  <p className="text-sm" style={{ color: '#666' }}>Monthly Cost</p>
                  <h3 className="text-2xl font-bold" style={{ color: '#C7DCC8' }}>$79/mo</h3>
                </div>
              </div>
              <p style={{ color: '#666', fontSize: '12px' }}>Renews on January 15, 2026</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold" style={{ color: '#2C2C2C' }}>Payment Method</h4>
              <div className="p-4 rounded-lg border-2" style={{ borderColor: '#E8E6E4', backgroundColor: '#fff' }}>
                <p style={{ color: '#2C2C2C' }}>Visa ending in 4242</p>
                <button className="text-sm" style={{ color: '#C7DCC8' }}>Update payment method</button>
              </div>
            </div>

            <button
              className="px-6 py-3 rounded-lg font-bold border-2"
              style={{ borderColor: '#C7DCC8', color: '#C7DCC8' }}
            >
              Upgrade Plan
            </button>
          </div>
        )

      case 'security':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold" style={{ color: '#2C2C2C' }}>Security Settings</h2>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
                Change Password
              </label>
              <input
                type="password"
                placeholder="Current Password"
                className="w-full px-4 py-2 border rounded-lg mb-3"
                style={{ borderColor: '#E8E6E4' }}
              />
              <input
                type="password"
                placeholder="New Password"
                className="w-full px-4 py-2 border rounded-lg mb-3"
                style={{ borderColor: '#E8E6E4' }}
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                className="w-full px-4 py-2 border rounded-lg"
                style={{ borderColor: '#E8E6E4' }}
              />
              <button
                className="mt-4 px-6 py-3 rounded-lg font-bold text-white"
                style={{ backgroundColor: '#C7DCC8' }}
              >
                Update Password
              </button>
            </div>

            <div className="p-4 rounded-lg" style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5' }}>
              <h4 className="font-bold mb-2" style={{ color: '#dc2626' }}>Danger Zone</h4>
              <button className="text-sm font-bold" style={{ color: '#dc2626' }}>
                Delete This Account
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#F5F3F0' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8" style={{ color: '#2C2C2C' }}>Settings</h1>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b-2" style={{ borderColor: '#E8E6E4' }}>
          {TABS.map(tab => {
            const IconComponent = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className="px-6 py-3 font-medium flex items-center gap-2 border-b-2 -mb-2"
                style={{
                  borderColor: currentTab === tab.id ? '#C7DCC8' : 'transparent',
                  color: currentTab === tab.id ? '#C7DCC8' : '#666'
                }}
              >
                <IconComponent size={20} /> {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl p-8" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}
