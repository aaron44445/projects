'use client';

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface PaymentFormProps {
  onSuccess: (paymentIntentId: string) => void;  // CRITICAL: Pass payment intent ID, NOT client secret
  onError?: (error: string) => void;
  primaryColor?: string;
}

/**
 * Map Stripe decline codes to user-friendly messages.
 * These messages are designed to be helpful without revealing technical details.
 */
function getDeclineMessage(error: any): string {
  const declineCode = error?.decline_code || error?.code;
  const messages: Record<string, string> = {
    card_declined: "Your card was declined. Please try a different payment method.",
    insufficient_funds: "Insufficient funds. Please try a different card.",
    incorrect_cvc: "Your card's security code is incorrect. Please check and try again.",
    expired_card: "Your card has expired. Please use a different card.",
    processing_error: "A temporary error occurred. Please try again in a moment.",
    incorrect_number: "Your card number is incorrect. Please check and try again.",
    incorrect_zip: "Your ZIP/postal code is incorrect. Please check and try again.",
    authentication_required: "Additional authentication is required. Please complete the verification.",
    card_not_supported: "This card is not supported. Please try a different card.",
    currency_not_supported: "This card doesn't support the requested currency.",
    duplicate_transaction: "This looks like a duplicate transaction. Please check your email for confirmation.",
    fraudulent: "This transaction cannot be processed. Please contact your bank.",
    generic_decline: "Your card was declined. Please contact your bank or try a different card.",
    invalid_account: "This card is not valid. Please try a different card.",
    invalid_amount: "The payment amount is invalid. Please try again.",
    lost_card: "This card has been reported lost. Please use a different card.",
    merchant_blacklist: "This transaction cannot be processed at this time.",
    new_account_information_available: "Your card information has changed. Please try again.",
    no_action_taken: "Your bank could not process this transaction. Please try again.",
    not_permitted: "Your card does not support this type of purchase.",
    offline_pin_required: "This card requires a PIN. Please try a different payment method.",
    online_or_offline_pin_required: "This card requires a PIN. Please try a different payment method.",
    pickup_card: "This card cannot be used. Please contact your bank.",
    pin_try_exceeded: "Too many PIN attempts. Please try a different card.",
    restricted_card: "This card is restricted. Please use a different card.",
    revocation_of_all_authorizations: "All authorizations have been revoked. Please contact your bank.",
    revocation_of_authorization: "This authorization has been revoked. Please try again.",
    security_violation: "Your card was flagged for security. Please contact your bank.",
    service_not_allowed: "Your card doesn't support this service.",
    stolen_card: "This card has been reported stolen. Please use a different card.",
    stop_payment_order: "Your bank has declined this payment.",
    testmode_decline: "Test mode decline. Use a test card number.",
    transaction_not_allowed: "This transaction type is not allowed on this card.",
    try_again_later: "Unable to process right now. Please try again later.",
    withdrawal_count_limit_exceeded: "You've exceeded your withdrawal limit. Please try again later.",
  };
  return messages[declineCode] || error?.message || "Payment could not be processed. Please try again.";
}

/**
 * PaymentForm component with Stripe Payment Element integration.
 *
 * This component must be wrapped in an Elements provider with a valid client secret.
 * On successful payment, it calls onSuccess with the paymentIntent.id (NOT the clientSecret).
 *
 * The payment intent ID is needed to link the appointment to the payment in the backend.
 */
export function PaymentForm({ onSuccess, onError, primaryColor = '#7C9A82' }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canRetry, setCanRetry] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setCanRetry(false);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking/confirm`,
      },
      redirect: 'if_required',
    });

    if (error) {
      const friendlyMessage = getDeclineMessage(error);
      setErrorMessage(friendlyMessage);
      setCanRetry(true);
      onError?.(friendlyMessage);
      setIsProcessing(false);
    } else if (paymentIntent) {
      // CRITICAL: Extract paymentIntent.id from the confirmPayment result
      // The result object structure is: { error?: StripeError, paymentIntent?: PaymentIntent }
      // paymentIntent.id has format 'pi_xxx' (NOT the clientSecret which is 'pi_xxx_secret_yyy')
      //
      // The booking endpoint needs this ID to link the appointment to the payment.
      // Webhooks will later find the appointment by stripePaymentIntentId field.
      //
      // Handle both manual capture (requires_capture) and auto-capture (succeeded) flows:
      if (paymentIntent.status === 'requires_capture' || paymentIntent.status === 'succeeded') {
        // Pass the payment intent ID to the parent component
        onSuccess(paymentIntent.id);
      } else {
        // Payment requires additional action (e.g., 3D Secure)
        // The redirect: 'if_required' should handle this, but just in case
        setErrorMessage('Additional verification is required. Please follow the prompts.');
        setCanRetry(true);
      }
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setErrorMessage(null);
    setCanRetry(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <PaymentElement
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {errorMessage && (
        <div className="flex items-start gap-3 p-4 bg-rose/10 border border-rose/20 rounded-xl">
          <AlertCircle className="w-5 h-5 text-rose-dark flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-rose-dark">{errorMessage}</p>
            {canRetry && (
              <button
                type="button"
                onClick={handleRetry}
                className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-rose-dark hover:text-rose"
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </button>
            )}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 text-white font-semibold rounded-xl transition-all disabled:opacity-50 hover:opacity-90"
        style={{ backgroundColor: primaryColor }}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          'Pay Deposit'
        )}
      </button>

      <p className="text-xs text-center text-gray-500">
        Your payment is secured by Stripe
      </p>
    </form>
  );
}
