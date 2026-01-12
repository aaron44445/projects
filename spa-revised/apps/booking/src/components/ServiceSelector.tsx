'use client'

import { useEffect, useState } from 'react'
import { useBookingStore } from '@/stores/bookingStore'

export function ServiceSelector({ salonId }: { salonId: string }) {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const store = useBookingStore()

  useEffect(() => {
    async function fetchServices() {
      try {
        const response = await fetch(`http://localhost:3001/api/v1/services?salon_id=${salonId}`)
        const data = await response.json()
        setServices(data || [])
      } catch (error) {
        console.error('Failed to fetch services:', error)
      } finally {
        setLoading(false)
      }
    }

    if (salonId) fetchServices()
  }, [salonId])

  if (loading) return <div style={{ color: '#666' }}>Loading services...</div>

  return (
    <div className="space-y-4">
      {services.length === 0 ? (
        <p style={{ color: '#666' }}>No services available</p>
      ) : (
        services.map((service) => (
          <label
            key={service.id}
            className="flex items-center gap-4 p-4 rounded-lg cursor-pointer border-2"
            style={{
              backgroundColor: store.serviceId === service.id ? '#F5F3F0' : '#fff',
              borderColor: store.serviceId === service.id ? '#C7DCC8' : '#E8E6E4'
            }}
          >
            <input
              type="radio"
              name="service"
              value={service.id}
              checked={store.serviceId === service.id}
              onChange={() => store.setServiceId(service.id)}
              style={{ accentColor: '#C7DCC8' }}
            />
            <div className="w-6 h-6" style={{ color: '#C7DCC8' }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 19a2 2 0 01-2-2V9a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold" style={{ color: '#2C2C2C' }}>
                {service.name}
              </h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                {service.duration_minutes} min • ${service.price}
              </p>
            </div>
          </label>
        ))
      )}
    </div>
  )
}
