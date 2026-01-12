/**
 * Payment Page
 * Stripe payment form page for booking confirmation
 */

import { PaymentForm } from '@/components/booking/PaymentForm'

interface PaymentPageProps {
  params: {
    salonSlug: string
  }
  searchParams: {
    amount?: string
  }
}

export default function PaymentPage({
  params,
  searchParams,
}: PaymentPageProps) {
  const amount = parseFloat(searchParams.amount || '0')

  return (
    <main className="min-h-screen bg-cream">
      <div className="container mx-auto py-12">
        <PaymentForm salonSlug={params.salonSlug} amount={amount} />
      </div>
    </main>
  )
}
