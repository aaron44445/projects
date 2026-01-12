'use client'

import { useEffect, useState } from 'react'
import { useBookingStore } from '@/stores/bookingStore'

export function TimeSlotSelector({ salonId }: { salonId: string }) {
  const [slots, setSlots] = useState<Date[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState('')
  const store = useBookingStore()

  useEffect(() => {
    async function fetchAvailableSlots() {
      if (!selectedDate || !store.serviceId || !store.staffId) return

      try {
        setLoading(true)
        const response = await fetch(
          `http://localhost:3001/api/v1/availability?salon_id=${salonId}&staff_id=${store.staffId}&service_id=${store.serviceId}&date=${selectedDate}`
        )
        const data = await response.json()
        setSlots(data || [])
      } catch (error) {
        console.error('Failed to fetch slots:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAvailableSlots()
  }, [selectedDate, store.serviceId, store.staffId, salonId])

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#2C2C2C' }}>
          Select Date
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg"
          style={{ borderColor: '#E8E6E4' }}
        />
      </div>

      {selectedDate && (
        <div>
          <label className="block text-sm font-medium mb-4" style={{ color: '#2C2C2C' }}>
            Select Time
          </label>
          {loading ? (
            <div style={{ color: '#666' }}>Loading available times...</div>
          ) : slots.length === 0 ? (
            <p style={{ color: '#666' }}>No available slots for this date</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {slots.map((slot) => {
                const slotDate = new Date(slot)
                const timeStr = slotDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })

                return (
                  <button
                    key={timeStr}
                    onClick={() => store.setAppointmentDate(slotDate)}
                    className="p-3 rounded-lg font-medium border-2 transition-all flex items-center justify-center gap-2"
                    style={{
                      backgroundColor:
                        store.appointmentDate?.getTime() === slotDate.getTime()
                          ? '#C7DCC8'
                          : '#fff',
                      color:
                        store.appointmentDate?.getTime() === slotDate.getTime()
                          ? '#fff'
                          : '#2C2C2C',
                      borderColor:
                        store.appointmentDate?.getTime() === slotDate.getTime()
                          ? '#C7DCC8'
                          : '#E8E6E4'
                    }}
                  >
                    <div className="w-4 h-4" style={{ color: 'currentColor' }}>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    {timeStr}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
