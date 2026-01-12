'use client'

import { useBookingStore } from '@/stores/bookingStore'

export function ClientForm() {
  const store = useBookingStore()

  return (
    <form className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
          Full Name
        </label>
        <input
          type="text"
          value={store.clientName}
          onChange={(e) => store.setClientInfo(e.target.value, store.clientEmail, store.clientPhone)}
          className="w-full px-4 py-2 border rounded-lg"
          style={{ borderColor: '#E8E6E4' }}
          placeholder="John Doe"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
          Email
        </label>
        <input
          type="email"
          value={store.clientEmail}
          onChange={(e) => store.setClientInfo(store.clientName, e.target.value, store.clientPhone)}
          className="w-full px-4 py-2 border rounded-lg"
          style={{ borderColor: '#E8E6E4' }}
          placeholder="john@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
          Phone
        </label>
        <input
          type="tel"
          value={store.clientPhone}
          onChange={(e) => store.setClientInfo(store.clientName, store.clientEmail, e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
          style={{ borderColor: '#E8E6E4' }}
          placeholder="555-1234"
        />
      </div>
    </form>
  )
}
