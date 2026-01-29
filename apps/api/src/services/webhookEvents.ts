import { prisma } from '@peacase/database';
import logger from '../lib/logger.js';

/**
 * Webhook Event Idempotency Service
 *
 * Stripe webhooks can be delivered multiple times (retries, network issues),
 * so we must ensure each event is only processed once. This service uses
 * the database's unique constraint on stripeEventId for race-condition safety.
 *
 * Pattern: "insert-or-conflict"
 * - Try to insert the event record
 * - If it succeeds, this is the first processing
 * - If it fails with unique constraint violation (P2002), already processed
 *
 * This pattern is race-safe: even if two webhook deliveries arrive simultaneously,
 * only one will successfully insert, and the other will get the constraint error.
 */

/**
 * Check if a webhook event has already been processed, and if not, mark it as processed.
 * Uses database unique constraint for race-condition safety.
 *
 * @param stripeEventId - The Stripe event ID (e.g., "evt_xxx")
 * @param eventType - The event type (e.g., "payment_intent.succeeded")
 * @returns Object with alreadyProcessed boolean indicating if event was previously handled
 *
 * @example
 * const { alreadyProcessed } = await checkAndMarkEventProcessed(event.id, event.type);
 * if (alreadyProcessed) {
 *   return res.status(200).json({ received: true, status: 'duplicate' });
 * }
 * // Process the event...
 */
export async function checkAndMarkEventProcessed(
  stripeEventId: string,
  eventType: string
): Promise<{ alreadyProcessed: boolean }> {
  try {
    await prisma.webhookEvent.create({
      data: {
        stripeEventId,
        eventType,
      },
    });
    return { alreadyProcessed: false };
  } catch (error: unknown) {
    // Unique constraint violation = already processed
    // Prisma error code P2002 indicates unique constraint failure
    const prismaError = error as { code?: string };
    if (prismaError.code === 'P2002') {
      logger.info({ stripeEventId, eventType }, 'Webhook event already processed, skipping');
      return { alreadyProcessed: true };
    }
    // Re-throw other errors (connection issues, etc.)
    throw error;
  }
}

/**
 * Check if an event was processed (without marking it).
 * Useful for debugging, testing, and manual queries.
 *
 * @param stripeEventId - The Stripe event ID to check
 * @returns true if the event has been processed, false otherwise
 *
 * @example
 * const wasProcessed = await wasEventProcessed('evt_xxx');
 * console.log(`Event was ${wasProcessed ? 'already' : 'not yet'} processed`);
 */
export async function wasEventProcessed(stripeEventId: string): Promise<boolean> {
  const event = await prisma.webhookEvent.findUnique({
    where: { stripeEventId },
  });
  return event !== null;
}

/**
 * Get details about a processed event.
 * Useful for debugging and audit trails.
 *
 * @param stripeEventId - The Stripe event ID to look up
 * @returns The event record if found, null otherwise
 */
export async function getProcessedEvent(stripeEventId: string) {
  return prisma.webhookEvent.findUnique({
    where: { stripeEventId },
  });
}
