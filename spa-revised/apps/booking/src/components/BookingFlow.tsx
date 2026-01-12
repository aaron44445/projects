'use client'

import { useState } from 'react'
import { ServiceSelector } from './ServiceSelector'
import { StaffSelector } from './StaffSelector'
import { TimeSlotSelector } from './TimeSlotSelector'
import { ClientForm } from './ClientForm'
import { PaymentForm } from './PaymentForm'
import { useBookingStore } from '@/stores/bookingStore'

const STEPS = [
  { id: 'service', title: 'Choose Service', icon: 'Scissors' },
  { id: 'staff', title: 'Select Staff', icon: 'Users' },
  { id: 'time', title: 'Pick Time', icon: 'Clock' },
  { id: 'info', title: 'Your Info', icon: 'User' },
  { id: 'payment', title: 'Payment', icon: 'DollarSign' },
  { id: 'confirm', title: 'Confirmed!', icon: 'CheckCircle' }
]

export function BookingFlow({ salonId }: { salonId: string }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const store = useBookingStore()

  const handleNext = async () => {
    setLoading(true)

    // Validation
    if (currentStep === 0 && !store.serviceId) {
      setLoading(false)
      alert('Please select a service')
      return
    }
    if (currentStep === 1 && !store.staffId) {
      setLoading(false)
      alert('Please select a staff member')
      return
    }
    if (currentStep === 2 && !store.appointmentDate) {
      setLoading(false)
      alert('Please select a time')
      return
    }
    if (currentStep === 3 && (!store.clientName || !store.clientEmail)) {
      setLoading(false)
      alert('Please fill in your information')
      return
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
    setLoading(false)
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const step = STEPS[currentStep]

  return (
    <div className="min-h-screen px-4 py-8" style={{ backgroundColor: '#F5F3F0' }}>
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-12">
          <div className="flex justify-between mb-4">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className="flex flex-col items-center cursor-pointer"
                onClick={() => i < currentStep && setCurrentStep(i)}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold mb-1 text-sm"
                  style={{
                    backgroundColor: i < currentStep ? '#C7DCC8' : i === currentStep ? '#C7DCC8' : '#E8E6E4',
                    color: i <= currentStep ? '#fff' : '#999'
                  }}
                >
                  {i < currentStep ? (
                    <div className="w-5 h-5">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className="text-xs text-center" style={{ color: '#666' }}>
                  {s.title}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1 bg-gray-200 rounded-full">
            <div
              className="h-1 rounded-full transition-all"
              style={{
                width: `${((currentStep + 1) / STEPS.length) * 100}%`,
                backgroundColor: '#C7DCC8'
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl p-8 mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#2C2C2C' }}>
            {step.title}
          </h1>

          {currentStep === 0 && <ServiceSelector salonId={salonId} />}
          {currentStep === 1 && <StaffSelector salonId={salonId} />}
          {currentStep === 2 && <TimeSlotSelector salonId={salonId} />}
          {currentStep === 3 && <ClientForm />}
          {currentStep === 4 && <PaymentForm salonId={salonId} />}
          {currentStep === 5 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#2C2C2C' }}>
                Booking Confirmed!
              </h2>
              <p style={{ color: '#666', marginBottom: '24px' }}>
                A confirmation email has been sent to {store.clientEmail}
              </p>
              <button
                onClick={() => {
                  store.reset()
                  setCurrentStep(0)
                }}
                className="px-6 py-3 rounded-lg font-bold text-white"
                style={{ backgroundColor: '#C7DCC8' }}
              >
                Make Another Booking
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        {currentStep < STEPS.length - 1 && (
          <div className="flex justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="px-6 py-3 rounded-lg font-semibold flex items-center gap-2 disabled:opacity-50"
              style={{ backgroundColor: '#E8E6E4', color: '#2C2C2C' }}
            >
              <div className="w-5 h-5">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={loading}
              className="px-6 py-3 rounded-lg font-semibold text-white flex items-center gap-2"
              style={{ backgroundColor: '#C7DCC8' }}
            >
              {loading ? 'Loading...' : 'Continue'}
              <div className="w-5 h-5">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
