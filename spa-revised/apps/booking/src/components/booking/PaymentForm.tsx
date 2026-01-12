'use client'

/**
 * Payment Form Component
 * Handles Stripe card payment input and submission
 */

import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { useRouter } from 'next/navigation'
import { useBookingStore } from '@/stores/booking.store'
import { bookingAPI } from '@/lib/api/booking'
import Link from 'next/link'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
)

interface PaymentFormProps {
  salonSlug: string
  amount: number
}

function PaymentFormContent({ salonSlug, amount }: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const {
    salonId,
    serviceId,
    staffId,
    selectedTime,
    customerName,
    customerEmail,
    customerPhone,
    setPaymentIntent,
  } = useBookingStore()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  // Create payment intent on mount
  useEffect(() => {
    async function createIntent() {
      try {
        if (!selectedTime) {
          setError('No appointment time selected')
          return
        }

        const response = await bookingAPI.createPaymentIntent({
          salonId,
          serviceId,
          staffId,
          startTime: selectedTime.toISOString(),
          customerName,
          customerEmail,
          customerPhone,
          amount,
        })

        setClientSecret(response.data.clientSecret)
        setPaymentIntent(response.data.paymentIntentId)
      } catch (err: any) {
        setError(
          err.response?.data?.error || 'Failed to create payment intent'
        )
      }
    }

    if (
      salonId &&
      serviceId &&
      staffId &&
      selectedTime &&
      customerName &&
      customerEmail &&
      customerPhone
    ) {
      createIntent()
    }
  }, [
    salonId,
    serviceId,
    staffId,
    selectedTime,
    customerName,
    customerEmail,
    customerPhone,
    amount,
    setPaymentIntent,
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      setError('Payment system not ready')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      // Confirm payment with card
      const { error: stripeError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: customerName,
              email: customerEmail,
            },
          },
        })

      if (stripeError) {
        setError(stripeError.message || 'Payment failed')
        setLoading(false)
        return
      }

      if (paymentIntent?.status === 'succeeded') {
        // Confirm booking on backend
        try {
          const confirmResponse = await bookingAPI.confirmBooking({
            paymentIntentId: paymentIntent.id,
            salonId,
            serviceId,
            staffId,
            startTime: selectedTime?.toISOString() || '',
            customerName,
            customerEmail,
            customerPhone,
            price: amount,
          })

          if (confirmResponse.data.success) {
            router.push(`/${salonSlug}/booking/confirmation`)
          }
        } catch (confirmError: any) {
          setError(
            confirmError.response?.data?.error ||
              'Failed to confirm booking'
          )
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-md mx-auto p-6">
      <div>
        <h2 className="text-2xl font-semibold text-charcoal mb-2">Payment</h2>
        <p className="text-sm text-gray-600 mb-4">
          Securely enter your payment information below. Your payment is
          processed by Stripe.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Card Element */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '14px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
                invalid: {
                  color: '#c97c7c',
                },
              },
            }}
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Amount Display */}
        <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-charcoal">
              Total Amount
            </span>
            <span className="text-2xl font-bold text-cyan-600">
              ${amount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-4">
          <Link href={`/${salonSlug}/booking/review`} className="flex-1">
            <button
              type="button"
              className="w-full h-11 px-4 rounded-lg font-medium text-charcoal bg-cream border-2 border-cyan-600 hover:bg-gray-100 transition-all disabled:opacity-50"
              disabled={loading}
            >
              Back
            </button>
          </Link>
          <button
            type="submit"
            disabled={loading || !stripe || !clientSecret}
            className="flex-1 h-11 px-4 rounded-lg font-medium text-white bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
          </button>
        </div>
      </form>

      {/* Security Notice */}
      <p className="text-xs text-gray-500 text-center">
        🔒 Your payment information is secure and encrypted by Stripe
      </p>
    </div>
  )
}

export function PaymentForm({ salonSlug, amount }: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormContent salonSlug={salonSlug} amount={amount} />
    </Elements>
  )
}
