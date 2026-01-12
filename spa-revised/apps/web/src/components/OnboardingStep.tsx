'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

interface OnboardingStepProps {
  stepId: string
}

export function OnboardingStep({ stepId }: OnboardingStepProps) {
  const [items, setItems] = useState<any[]>([])
  const [newItem, setNewItem] = useState('')

  const renderContent = () => {
    switch (stepId) {
      case 'services':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
                Service Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., Haircut, Facial, Massage"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                  style={{ borderColor: '#E8E6E4' }}
                />
                <button
                  onClick={() => {
                    if (newItem.trim()) {
                      setItems([...items, { name: newItem, duration: 60, price: 0 }])
                      setNewItem('')
                    }
                  }}
                  className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 text-white"
                  style={{ backgroundColor: '#C7DCC8' }}
                >
                  <Plus size={20} /> Add
                </button>
              </div>
            </div>

            {items.map((item, i) => (
              <div key={i} className="p-4 rounded-lg" style={{ backgroundColor: '#F5F3F0' }}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold" style={{ color: '#2C2C2C' }}>{item.name}</h4>
                  <button onClick={() => setItems(items.filter((_, j) => j !== i))}>
                    <Trash2 size={20} style={{ color: '#dc2626' }} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs" style={{ color: '#666' }}>Duration (minutes)</label>
                    <select
                      value={item.duration}
                      onChange={(e) => {
                        const newItems = [...items]
                        newItems[i].duration = parseInt(e.target.value)
                        setItems(newItems)
                      }}
                      className="w-full px-2 py-1 border rounded text-sm"
                      style={{ borderColor: '#E8E6E4' }}
                    >
                      <option>30</option>
                      <option>60</option>
                      <option>90</option>
                      <option>120</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs" style={{ color: '#666' }}>Price ($)</label>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => {
                        const newItems = [...items]
                        newItems[i].price = parseFloat(e.target.value)
                        setItems(newItems)
                      }}
                      className="w-full px-2 py-1 border rounded text-sm"
                      style={{ borderColor: '#E8E6E4' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )

      case 'staff':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
                Staff Member Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., Sarah Miller"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  className="flex-1 px-4 py-2 border rounded-lg"
                  style={{ borderColor: '#E8E6E4' }}
                />
                <button
                  onClick={() => {
                    if (newItem.trim()) {
                      setItems([...items, { name: newItem, role: 'staff' }])
                      setNewItem('')
                    }
                  }}
                  className="px-4 py-2 rounded-lg font-semibold flex items-center gap-2 text-white"
                  style={{ backgroundColor: '#C7DCC8' }}
                >
                  <Plus size={20} /> Add
                </button>
              </div>
            </div>

            {items.map((item, i) => (
              <div key={i} className="p-4 rounded-lg flex justify-between items-center" style={{ backgroundColor: '#F5F3F0' }}>
                <div>
                  <h4 className="font-bold" style={{ color: '#2C2C2C' }}>{item.name}</h4>
                  <p style={{ color: '#666', fontSize: '12px' }}>Stylist</p>
                </div>
                <button onClick={() => setItems(items.filter((_, j) => j !== i))}>
                  <Trash2 size={20} style={{ color: '#dc2626' }} />
                </button>
              </div>
            ))}
          </div>
        )

      case 'addons':
        return (
          <div className="space-y-4">
            <p style={{ color: '#666', marginBottom: '16px' }}>
              Select features to enhance your salon management experience
            </p>

            {[
              { id: 'packages', name: 'Service Packages', desc: 'Bundled services for clients' },
              { id: 'giftcards', name: 'Gift Cards', desc: 'Digital gift card system' },
              { id: 'locations', name: 'Multi-Location', desc: 'Manage multiple salon locations' },
              { id: 'forms', name: 'Consultation Forms', desc: 'Custom intake forms' },
              { id: 'reviews', name: 'Reviews & Feedback', desc: 'Client ratings and reviews' },
              { id: 'marketing', name: 'Marketing Tools', desc: 'Email campaigns and promotions' }
            ].map(addon => (
              <label key={addon.id} className="flex items-center gap-4 p-4 rounded-lg cursor-pointer" style={{ backgroundColor: '#F5F3F0' }}>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded"
                  style={{ accentColor: '#C7DCC8' }}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setItems([...items, addon.id])
                    } else {
                      setItems(items.filter(i => i !== addon.id))
                    }
                  }}
                />
                <div>
                  <h4 className="font-bold" style={{ color: '#2C2C2C' }}>{addon.name}</h4>
                  <p style={{ color: '#666', fontSize: '14px' }}>{addon.desc}</p>
                </div>
              </label>
            ))}
          </div>
        )

      case 'payment':
        return (
          <div className="space-y-4">
            <p style={{ color: '#666', marginBottom: '16px' }}>
              Connect your Stripe account to process client payments
            </p>
            <button
              className="w-full py-3 rounded-lg font-bold text-white"
              style={{ backgroundColor: '#C7DCC8' }}
            >
              Connect Stripe Account
            </button>
            <p style={{ color: '#999', fontSize: '12px' }}>
              You can skip this for now and set it up later in settings
            </p>
          </div>
        )

      case 'complete':
        return (
          <div className="text-center py-8">
            <div className="mb-4 text-6xl">✓</div>
            <h3 className="text-2xl font-bold mb-2" style={{ color: '#2C2C2C' }}>
              All Set!
            </h3>
            <p style={{ color: '#666' }}>
              Your salon account is ready. Start managing appointments, clients, and your business like never before.
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return <div>{renderContent()}</div>
}
