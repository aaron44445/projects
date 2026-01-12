'use client'

import { useState } from 'react'
import { useBookingStore } from '@/stores/bookingStore'

export function PaymentForm({ salonId }: { salonId: string }) {
  const store = useBookingStore()
  const [cardNumber, setCardNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [cvc, setCvc] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // In real implementation, use Stripe.js
      // For now, simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Create appointment
      const response = await fetch('http://localhost:3001/api/v1/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salon_id: salonId,
          service_id: store.serviceId,
          staff_id: store.staffId,
          start_time: store.appointmentDate,
          client_name: store.clientName,
          client_email: store.clientEmail,
          client_phone: store.clientPhone
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create appointment')
      }

      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 mx-auto mb-4" style={{ color: '#16a34a' }}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#2C2C2C' }}>
          Payment Successful
        </h2>
        <p style={{ color: '#666' }}>
          Your appointment has been confirmed
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg flex gap-2" style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5' }}>
          <div className="w-5 h-5" style={{ color: '#dc2626', flexShrink: 0 }}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span style={{ color: '#991b1b' }}>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
          Card Number
        </label>
        <input
          type="text"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, '').slice(0, 16))}
          className="w-full px-4 py-2 border rounded-lg font-mono"
          style={{ borderColor: '#E8E6E4' }}
          placeholder="4242 4242 4242 4242"
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
            Expiry Date
          </label>
          <input
            type="text"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value.slice(0, 5))}
            className="w-full px-4 py-2 border rounded-lg"
            style={{ borderColor: '#E8E6E4' }}
            placeholder="MM/YY"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
            CVC
          </label>
          <input
            type="text"
            value={cvc}
            onChange={(e) => setCvc(e.target.value.slice(0, 3))}
            className="w-full px-4 py-2 border rounded-lg"
            style={{ borderColor: '#E8E6E4' }}
            placeholder="123"
            disabled={loading}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !cardNumber || !expiryDate || !cvc}
        className="w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2"
        style={{ backgroundColor: loading ? '#999' : '#C7DCC8' }}
      >
        <div className="w-5 h-5">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        {loading ? 'Processing...' : 'Pay & Confirm Booking'}
      </button>

      <p style={{ color: '#999', fontSize: '12px', textAlign: 'center' }}>
        Test card: 4242 4242 4242 4242 (any future date, any 3-digit CVC)
      </p>
    </form>
  )
}
