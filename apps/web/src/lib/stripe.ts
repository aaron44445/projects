import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get or initialize the Stripe.js instance.
 * Uses lazy initialization to avoid loading Stripe.js until needed.
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. Payment features will be unavailable.');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

// Export the promise for use with Elements provider
export { stripePromise };
