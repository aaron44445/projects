/**
 * Stripe Helper Utilities
 *
 * Utility functions for payment processing, including deposit calculation,
 * decline message translation, and currency formatting.
 */

/**
 * Calculate deposit amount based on service price and salon settings.
 * Always returns integer cents for Stripe API.
 *
 * @param servicePrice - Service price in dollars (e.g., 65.00)
 * @param depositPercentage - Percentage to charge as deposit (default 20)
 * @returns Amount in cents (e.g., 1300 for $13.00)
 *
 * @example
 * calculateDepositCents(100, 20) // Returns 2000 (20% of $100 = $20 = 2000 cents)
 * calculateDepositCents(10, 10)  // Returns 100 (10% of $10 = $1 = 100 cents)
 * calculateDepositCents(2, 20)   // Returns 50 (Stripe minimum of 50 cents)
 */
export function calculateDepositCents(
  servicePrice: number,
  depositPercentage: number = 20
): number {
  // Calculate deposit in dollars, then convert to cents
  const depositDollars = servicePrice * (depositPercentage / 100);
  // Round to avoid floating point issues, ensure minimum of 50 cents (Stripe minimum)
  return Math.max(50, Math.round(depositDollars * 100));
}

/**
 * Convert Stripe decline codes to user-friendly messages.
 * Based on Stripe's decline code documentation.
 *
 * @param declineCode - The decline code from Stripe (e.g., "insufficient_funds")
 * @returns A user-friendly error message
 *
 * @see https://stripe.com/docs/declines/codes
 */
export function getDeclineMessage(declineCode: string | null | undefined): string {
  const messages: Record<string, string> = {
    card_declined: 'Your card was declined. Please try a different payment method.',
    insufficient_funds: 'Insufficient funds. Please try a different card.',
    incorrect_cvc: "Your card's security code is incorrect. Please check and try again.",
    expired_card: 'Your card has expired. Please use a different card.',
    processing_error: 'A temporary error occurred. Please try again in a moment.',
    incorrect_number: 'Your card number is incorrect. Please check and try again.',
    incorrect_zip: 'Your ZIP/postal code is incorrect. Please check and try again.',
    card_not_supported: 'This card type is not supported. Please try a different card.',
    currency_not_supported: 'This currency is not supported by your card.',
    duplicate_transaction: 'A duplicate transaction was detected. Please wait a moment.',
    fraudulent: 'This transaction could not be processed. Please contact your bank.',
    generic_decline: 'Your card was declined. Please contact your bank for more information.',
    invalid_account: 'Your card account is invalid. Please contact your bank.',
    lost_card: 'This card has been reported lost. Please use a different card.',
    stolen_card: 'This card has been reported stolen. Please use a different card.',
    new_account_information_available: 'Please update your card information and try again.',
    try_again_later: 'Please try again in a few minutes.',
  };

  return (
    messages[declineCode || ''] ||
    'Payment could not be processed. Please try again or contact your bank.'
  );
}

/**
 * Format cents to dollars for display.
 *
 * @param cents - Amount in cents (e.g., 2500)
 * @returns Formatted string (e.g., "$25.00")
 */
export function formatCentsToDollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
