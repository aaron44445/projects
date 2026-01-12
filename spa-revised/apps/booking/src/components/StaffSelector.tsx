'use client'

import { useEffect, useState } from 'react'
import { useBookingStore } from '@/stores/bookingStore'

export function StaffSelector({ salonId }: { salonId: string }) {
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const store = useBookingStore()

  useEffect(() => {
    async function fetchStaff() {
      try {
        const response = await fetch(`http://localhost:3001/api/v1/staff?salon_id=${salonId}`)
        const data = await response.json()
        setStaff(data || [])
      } catch (error) {
        console.error('Failed to fetch staff:', error)
      } finally {
        setLoading(false)
      }
    }

    if (salonId) fetchStaff()
  }, [salonId])

  if (loading) return <div style={{ color: '#666' }}>Loading staff...</div>

  return (
    <div className="space-y-4">
      {staff.length === 0 ? (
        <p style={{ color: '#666' }}>No staff available</p>
      ) : (
        staff.map((person) => (
          <label
            key={person.id}
            className="flex items-center gap-4 p-4 rounded-lg cursor-pointer border-2"
            style={{
              backgroundColor: store.staffId === person.id ? '#F5F3F0' : '#fff',
              borderColor: store.staffId === person.id ? '#C7DCC8' : '#E8E6E4'
            }}
          >
            <input
              type="radio"
              name="staff"
              value={person.id}
              checked={store.staffId === person.id}
              onChange={() => store.setStaffId(person.id)}
              style={{ accentColor: '#C7DCC8' }}
            />
            <div className="w-6 h-6" style={{ color: '#C7DCC8' }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M7 20H2v-2a3 3 0 015.856-1.487M13 16a3 3 0 11-6 0 3 3 0 016 0zM13 8a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold" style={{ color: '#2C2C2C' }}>
                {person.first_name} {person.last_name}
              </h3>
              <p style={{ color: '#666', fontSize: '14px' }}>
                {person.certifications || 'Professional'}
              </p>
            </div>
          </label>
        ))
      )}
    </div>
  )
}
