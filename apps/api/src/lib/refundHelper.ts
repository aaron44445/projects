import { prisma } from '@peacase/database';
import { refundPayment, cancelPaymentIntent } from '../services/payments.js';
import logger from './logger.js';

export interface RefundOptions {
  appointmentId: string;
  cancelledBy: 'client' | 'salon';
  reason?: string;
  requestedByUserId?: string;
}

export interface RefundResult {
  refunded: boolean;
  refundAmount: number;
  reason: string;
  requiresManualReview?: boolean;
}

/**
 * Default cancellation policy:
 * - Salon cancels: Full refund
 * - Client cancels >24h before: Full refund
 * - Client cancels <24h before: No automatic refund (can request manual review)
 */
const DEFAULT_POLICY = {
  fullRefundHours: 24,
};

/**
 * Calculate hours until appointment start time.
 */
function getHoursUntilAppointment(appointmentTime: Date): number {
  const now = new Date();
  const diffMs = appointmentTime.getTime() - now.getTime();
  return diffMs / (1000 * 60 * 60);
}

/**
 * Process refund for a canceled appointment based on cancellation policy.
 *
 * Policy:
 * 1. Salon cancels -> Always full refund (it's their fault)
 * 2. Client cancels >24h before -> Full refund
 * 3. Client cancels <24h before -> No automatic refund
 *
 * For payments not yet captured (manual capture mode), we cancel the payment intent
 * instead of issuing a refund.
 */
export async function processAppointmentRefund(options: RefundOptions): Promise<RefundResult> {
  // Fetch appointment with payment info
  const appointment = await prisma.appointment.findUnique({
    where: { id: options.appointmentId },
    include: {
      payments: {
        where: { status: 'completed' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      salon: true,
    },
  });

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  // Check if there's a deposit to refund
  if (!appointment.stripePaymentIntentId && appointment.payments.length === 0) {
    return {
      refunded: false,
      refundAmount: 0,
      reason: 'No payment to refund',
    };
  }

  const paymentIntentId = appointment.stripePaymentIntentId;
  const payment = appointment.payments[0];
  const depositAmount = appointment.depositAmount || payment?.amount || 0;

  if (depositAmount <= 0) {
    return {
      refunded: false,
      refundAmount: 0,
      reason: 'No deposit amount recorded',
    };
  }

  // Determine if refund should be issued based on policy
  const hoursUntilAppointment = getHoursUntilAppointment(new Date(appointment.startTime));
  const policy = DEFAULT_POLICY;

  let shouldRefund = false;
  let refundReason = '';

  if (options.cancelledBy === 'salon') {
    // Salon canceled - always refund
    shouldRefund = true;
    refundReason = 'Cancelled by salon';
  } else if (hoursUntilAppointment >= policy.fullRefundHours) {
    // Client canceled with sufficient notice
    shouldRefund = true;
    refundReason = `Cancelled ${Math.floor(hoursUntilAppointment)}h before appointment`;
  } else {
    // Late cancellation - no automatic refund
    shouldRefund = false;
    refundReason = `Late cancellation (${Math.floor(hoursUntilAppointment)}h notice, policy requires ${policy.fullRefundHours}h)`;
  }

  if (shouldRefund && paymentIntentId) {
    try {
      // Check deposit status - if 'authorized' (not captured), cancel instead of refund
      if (appointment.depositStatus === 'authorized') {
        // Payment was authorized but not captured - cancel the payment intent
        await cancelPaymentIntent(paymentIntentId);

        // Update appointment
        await prisma.appointment.update({
          where: { id: options.appointmentId },
          data: {
            depositStatus: 'cancelled',
          },
        });

        // Update payment record if exists
        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'cancelled',
              refundReason: options.reason || refundReason,
            },
          });
        }

        return {
          refunded: true,
          refundAmount: depositAmount,
          reason: 'Authorization cancelled (not charged)',
        };
      } else {
        // Payment was captured - issue refund
        const refund = await refundPayment(
          paymentIntentId,
          Math.round(depositAmount * 100), // Convert to cents
          options.cancelledBy === 'salon' ? 'requested_by_customer' : undefined
        );

        // Update appointment
        await prisma.appointment.update({
          where: { id: options.appointmentId },
          data: {
            depositStatus: 'refunded',
          },
        });

        // Update payment record
        if (payment) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'refunded',
              stripeRefundId: refund.id,
              refundAmount: depositAmount,
              refundReason: options.reason || refundReason,
              refundedAt: new Date(),
            },
          });
        }

        return {
          refunded: true,
          refundAmount: depositAmount,
          reason: refundReason,
        };
      }
    } catch (error: any) {
      logger.error({ error, appointmentId: options.appointmentId }, 'Error processing refund');
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }

  // No refund - mark appointment appropriately
  await prisma.appointment.update({
    where: { id: options.appointmentId },
    data: {
      depositStatus: 'no_refund',
    },
  });

  return {
    refunded: false,
    refundAmount: 0,
    reason: refundReason,
    requiresManualReview: true,
  };
}
