import { prisma } from '@peacase/database';
import { sendEmail, appointmentConfirmationEmail, appointmentReminderEmail, appointmentReminder2hEmail, appointmentCancellationEmail } from './email.js';
import { sendSms, appointmentConfirmationSms, appointmentReminderSms, appointmentReminder2hSms, appointmentCancellationSms } from './sms.js';
import logger from '../lib/logger.js';

export interface NotificationPayload {
  salonId: string;
  clientId: string;
  appointmentId?: string;
  type: 'booking_confirmation' | 'reminder_24h' | 'reminder_2h' | 'cancellation';
  channels: ('email' | 'sms')[];
  data: {
    clientName: string;
    clientEmail?: string;
    clientPhone?: string;
    serviceName: string;
    staffName: string;
    dateTime: string;
    salonName: string;
    salonAddress: string;
    // For calendar integration (added in Plan 03)
    startTime?: Date;
    endTime?: Date;
    salonTimezone?: string;
    salonEmail?: string;
  };
}

interface SendResult {
  notificationId: string;
  emailSent: boolean;
  smsSent: boolean;
  status: 'sent' | 'failed';
}

/**
 * Unified notification service that logs all notification attempts and handles
 * SMS-to-email fallback.
 *
 * This service acts as a facade for email and SMS sending, providing:
 * - Consistent logging via NotificationLog table
 * - Automatic SMS-to-email fallback on SMS failure
 * - Per-channel status tracking
 * - Retry mechanism support
 */
export async function sendNotification(payload: NotificationPayload): Promise<SendResult> {
  // Create NotificationLog entry with pending status
  const notificationLog = await prisma.notificationLog.create({
    data: {
      salonId: payload.salonId,
      clientId: payload.clientId,
      appointmentId: payload.appointmentId,
      type: payload.type,
      channels: JSON.stringify(payload.channels),
      status: 'pending',
    },
  });

  let emailSent = false;
  let smsSent = false;

  // Process each channel
  for (const channel of payload.channels) {
    if (channel === 'email' && payload.data.clientEmail) {
      const emailResult = await sendEmailNotification(payload, notificationLog.id);
      emailSent = emailResult.success;
    } else if (channel === 'sms' && payload.data.clientPhone) {
      const smsResult = await sendSmsNotification(payload, notificationLog.id);
      smsSent = smsResult.success;

      // SMS-to-email fallback
      if (!smsResult.success && payload.data.clientEmail && !payload.channels.includes('email')) {
        logger.info({ notificationId: notificationLog.id }, 'SMS failed, attempting email fallback');
        const emailResult = await sendEmailNotification(payload, notificationLog.id);
        emailSent = emailResult.success;
      }
    }
  }

  // Determine overall status
  const status = (emailSent || smsSent) ? 'sent' : 'failed';

  // Update NotificationLog with final status
  await prisma.notificationLog.update({
    where: { id: notificationLog.id },
    data: { status },
  });

  return {
    notificationId: notificationLog.id,
    emailSent,
    smsSent,
    status,
  };
}

/**
 * Send email notification and update NotificationLog with email-specific status
 */
async function sendEmailNotification(
  payload: NotificationPayload,
  logId: string
): Promise<{ success: boolean; error?: string }> {
  const { clientEmail } = payload.data;

  if (!clientEmail) {
    return { success: false, error: 'No email address provided' };
  }

  // Generate email content based on notification type
  let htmlContent: string;
  let subject: string;

  logger.debug({
    hasStartTime: !!payload.data.startTime,
    hasEndTime: !!payload.data.endTime,
    salonTimezone: payload.data.salonTimezone,
  }, 'Email notification calendar fields');

  switch (payload.type) {
    case 'booking_confirmation':
      subject = `Appointment Confirmed - ${payload.data.salonName}`;
      htmlContent = appointmentConfirmationEmail(payload.data);
      break;
    case 'reminder_24h':
      subject = `Reminder: Appointment Tomorrow - ${payload.data.salonName}`;
      htmlContent = appointmentReminderEmail(payload.data);
      break;
    case 'reminder_2h':
      subject = `See You Soon! Appointment in 2 Hours - ${payload.data.salonName}`;
      htmlContent = appointmentReminder2hEmail(payload.data);
      break;
    case 'cancellation':
      subject = `Appointment Cancelled - ${payload.data.salonName}`;
      htmlContent = appointmentCancellationEmail({
        clientName: payload.data.clientName,
        serviceName: payload.data.serviceName,
        salonName: payload.data.salonName,
        appointmentDate: payload.data.dateTime.split(' at ')[0] || payload.data.dateTime,
        appointmentTime: payload.data.dateTime.split(' at ')[1] || '',
      });
      break;
    default:
      return { success: false, error: `Unknown notification type: ${payload.type}` };
  }

  try {
    // Update log to pending before send
    await prisma.notificationLog.update({
      where: { id: logId },
      data: {
        emailStatus: 'pending',
      },
    });

    const sent = await sendEmail({
      to: clientEmail,
      subject,
      html: htmlContent,
    });

    if (sent) {
      // Update log with success
      await prisma.notificationLog.update({
        where: { id: logId },
        data: {
          emailStatus: 'sent',
          emailSentAt: new Date(),
        },
      });
      return { success: true };
    } else {
      // Update log with failure
      await prisma.notificationLog.update({
        where: { id: logId },
        data: {
          emailStatus: 'failed',
          emailError: 'Email service returned false',
        },
      });
      return { success: false, error: 'Email service returned false' };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Update log with error
    await prisma.notificationLog.update({
      where: { id: logId },
      data: {
        emailStatus: 'failed',
        emailError: errorMessage,
      },
    });
    return { success: false, error: errorMessage };
  }
}

/**
 * Send SMS notification and update NotificationLog with SMS-specific status
 */
async function sendSmsNotification(
  payload: NotificationPayload,
  logId: string
): Promise<{ success: boolean; error?: string }> {
  const { clientPhone } = payload.data;

  if (!clientPhone) {
    return { success: false, error: 'No phone number provided' };
  }

  // Generate SMS content based on notification type
  let smsMessage: string;

  switch (payload.type) {
    case 'booking_confirmation':
      smsMessage = appointmentConfirmationSms(payload.data);
      break;
    case 'reminder_24h':
      smsMessage = appointmentReminderSms(payload.data);
      break;
    case 'reminder_2h':
      smsMessage = appointmentReminder2hSms(payload.data);
      break;
    case 'cancellation':
      smsMessage = appointmentCancellationSms(payload.data);
      break;
    default:
      return { success: false, error: `Unknown notification type: ${payload.type}` };
  }

  try {
    // Update log to pending before send
    await prisma.notificationLog.update({
      where: { id: logId },
      data: {
        smsStatus: 'pending',
      },
    });

    const smsResult = await sendSms({
      to: clientPhone,
      message: smsMessage,
    });

    if (smsResult.success && smsResult.messageSid) {
      // Store MessageSid for webhook matching
      await prisma.notificationLog.update({
        where: { id: logId },
        data: {
          smsStatus: 'sent',
          smsSentAt: new Date(),
          twilioMessageSid: smsResult.messageSid,
        },
      });
      return { success: true };
    } else {
      // SMS failed at API level
      await prisma.notificationLog.update({
        where: { id: logId },
        data: {
          smsStatus: 'failed',
          smsError: smsResult.error || 'Unknown error',
        },
      });
      return { success: false, error: smsResult.error || 'Unknown error' };
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Update log with error
    await prisma.notificationLog.update({
      where: { id: logId },
      data: {
        smsStatus: 'failed',
        smsError: errorMessage,
      },
    });
    return { success: false, error: errorMessage };
  }
}
