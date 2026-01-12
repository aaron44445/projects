'use client'

import { useSearchParams } from 'next/navigation'
import { BookingFlow } from '@/components/BookingFlow'

export default function BookingPage() {
  const searchParams = useSearchParams()
  const salonId = searchParams.get('salon') || ''

  if (!salonId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F5F3F0' }}>
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4" style={{ color: '#2C2C2C' }}>
            No Salon Selected
          </h1>
          <p style={{ color: '#666' }}>
            Please follow the booking link from a salon's website or your email confirmation.
          </p>
        </div>
      </div>
    )
  }

  return <BookingFlow salonId={salonId} />
}
