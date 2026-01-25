import { useState, useCallback } from 'react';

interface PaymentIntentResponse {
  clientSecret: string;
  depositAmountCents: number;
}

interface UsePaymentOptions {
  slug: string;
  serviceId: string;
  servicePrice: number;
  clientEmail: string;
  staffId?: string;
  locationId?: string;
  appointmentDate: string;
}

interface UsePaymentReturn {
  clientSecret: string | null;
  depositAmount: number;
  isLoading: boolean;
  error: string | null;
  createPaymentIntent: () => Promise<boolean>;
  clearError: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1$/, '')
  : 'http://localhost:3001';

/**
 * Hook for managing payment intent creation and state.
 * Creates a payment intent on the server and returns the client secret for Stripe.js.
 */
export function usePayment(options: UsePaymentOptions): UsePaymentReturn {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPaymentIntent = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/api/v1/public/${options.slug}/create-payment-intent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId: options.serviceId,
            servicePrice: options.servicePrice,
            clientEmail: options.clientEmail,
            staffId: options.staffId,
            locationId: options.locationId,
            appointmentDate: options.appointmentDate,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error?.message || 'Failed to initialize payment');
        return false;
      }

      setClientSecret(data.data.clientSecret);
      setDepositAmount(data.data.depositAmountCents / 100);
      return true;
    } catch (err) {
      setError('Unable to connect to payment service. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [options]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    clientSecret,
    depositAmount,
    isLoading,
    error,
    createPaymentIntent,
    clearError,
  };
}
