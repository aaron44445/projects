import { prisma } from '@peacase/database';
import {
  sendEmail,
  appointmentReminderEmail,
  appointmentReminder2hEmail,
} from '../services/email.js';
import {
  sendSms,
  appointmentReminderSms,
  appointmentReminder2hSms,
} from '../services/sms.js';

// Reminder types
export enum ReminderType {
  REMINDER_24H = 'REMINDER_24H',
  REMINDER_2H = 'REMINDER_2H',
}

interface AppointmentWithDetails {
  id: string;
  startTime: Date;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    communicationPreference: string;
    optedInReminders: boolean;
  };
  staff: {
    firstName: string;
    lastName: string;
  };
  service: {
    name: string;
  };
  salon: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    timezone: string;
  };
}

interface ReminderResult {
  appointmentId: string;
  clientName: string;
  reminderType: ReminderType;
  emailSent: boolean;
  smsSent: boolean;
  error?: string;
}

/**
 * Format a date/time for display in the client's timezone
 */
function formatDateTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: timezone,
  }).format(date);
}

/**
 * Format address for display
 */
function formatAddress(salon: AppointmentWithDetails['salon']): string {
  const parts = [salon.address, salon.city, salon.state, salon.zip].filter(Boolean);
  return parts.join(', ') || 'Address not available';
}

/**
 * Check if a reminder has already been sent for this appointment and type
 */
async function hasReminderBeenSent(
  appointmentId: string,
  reminderType: ReminderType
): Promise<boolean> {
  const existing = await prisma.reminderLog.findFirst({
    where: {
      appointmentId,
      reminderType,
    },
  });
  return !!existing;
}

/**
 * Log a sent reminder to prevent duplicates
 */
async function logReminder(
  appointmentId: string,
  reminderType: ReminderType,
  channel: 'email' | 'sms' | 'both',
  success: boolean,
  error?: string
): Promise<void> {
  await prisma.reminderLog.create({
    data: {
      appointmentId,
      reminderType,
      channel,
      success,
      error,
      sentAt: new Date(),
    },
  });
}

/**
 * Get appointments that need reminders
 * @param hoursAhead - How many hours ahead to look for appointments
 * @param windowMinutes - Time window in minutes (e.g., 30 minutes before/after the target time)
 */
async function getAppointmentsForReminders(
  hoursAhead: number,
  windowMinutes: number = 30
): Promise<AppointmentWithDetails[]> {
  const now = new Date();
  const targetTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
  const windowStart = new Date(targetTime.getTime() - windowMinutes * 60 * 1000);
  const windowEnd = new Date(targetTime.getTime() + windowMinutes * 60 * 1000);

  const appointments = await prisma.appointment.findMany({
    where: {
      startTime: {
        gte: windowStart,
        lte: windowEnd,
      },
      status: {
        in: ['confirmed', 'pending'],
      },
      client: {
        optedInReminders: true,
        isActive: true,
      },
    },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          communicationPreference: true,
          optedInReminders: true,
        },
      },
      staff: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      service: {
        select: {
          name: true,
        },
      },
      salon: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          state: true,
          zip: true,
          timezone: true,
        },
      },
    },
  });

  return appointments as AppointmentWithDetails[];
}

/**
 * Send a reminder for a single appointment
 */
async function sendAppointmentReminder(
  appointment: AppointmentWithDetails,
  reminderType: ReminderType
): Promise<ReminderResult> {
  const { client, staff, service, salon } = appointment;
  const clientName = `${client.firstName} ${client.lastName}`;
  const staffName = `${staff.firstName} ${staff.lastName}`;
  const dateTime = formatDateTime(appointment.startTime, salon.timezone);
  const address = formatAddress(salon);

  const result: ReminderResult = {
    appointmentId: appointment.id,
    clientName,
    reminderType,
    emailSent: false,
    smsSent: false,
  };

  // Check if reminder already sent
  const alreadySent = await hasReminderBeenSent(appointment.id, reminderType);
  if (alreadySent) {
    result.error = 'Reminder already sent';
    return result;
  }

  const preference = client.communicationPreference;
  let channelUsed: 'email' | 'sms' | 'both' = 'email';

  try {
    // Send email if client has email and prefers email or both
    if (client.email && (preference === 'email' || preference === 'both')) {
      const emailSubject =
        reminderType === ReminderType.REMINDER_24H
          ? `Reminder: Your appointment at ${salon.name} tomorrow`
          : `Reminder: Your appointment at ${salon.name} in 2 hours`;

      const emailData = {
        clientName: client.firstName,
        serviceName: service.name,
        staffName,
        dateTime,
        salonName: salon.name,
        salonAddress: address,
      };

      // Use different templates for 24h vs 2h reminders
      const emailHtml =
        reminderType === ReminderType.REMINDER_24H
          ? appointmentReminderEmail(emailData)
          : appointmentReminder2hEmail(emailData);

      result.emailSent = await sendEmail({
        to: client.email,
        subject: emailSubject,
        html: emailHtml,
      });
    }

    // Send SMS if client has phone and prefers sms or both
    if (client.phone && (preference === 'sms' || preference === 'both')) {
      const smsData = {
        clientName: client.firstName,
        serviceName: service.name,
        dateTime,
        salonName: salon.name,
      };

      // Use different templates for 24h vs 2h reminders
      const smsMessage =
        reminderType === ReminderType.REMINDER_24H
          ? appointmentReminderSms(smsData)
          : appointmentReminder2hSms(smsData);

      const smsResult = await sendSms({
        to: client.phone,
        message: smsMessage,
      });
      result.smsSent = smsResult.success;
    }

    // Determine channel used for logging
    if (result.emailSent && result.smsSent) {
      channelUsed = 'both';
    } else if (result.smsSent) {
      channelUsed = 'sms';
    } else {
      channelUsed = 'email';
    }

    // Log the reminder
    const success = result.emailSent || result.smsSent;
    await logReminder(appointment.id, reminderType, channelUsed, success);
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Error sending reminder for appointment ${appointment.id}:`, error);

    // Log the failed attempt
    await logReminder(appointment.id, reminderType, channelUsed, false, result.error);
  }

  return result;
}

/**
 * Process all reminders for a specific time window (24h or 2h)
 */
async function processReminders(
  hoursAhead: number,
  reminderType: ReminderType
): Promise<ReminderResult[]> {
  const results: ReminderResult[] = [];

  try {
    const appointments = await getAppointmentsForReminders(hoursAhead);

    console.log(
      `[${reminderType}] Found ${appointments.length} appointments to send reminders for`
    );

    for (const appointment of appointments) {
      try {
        const result = await sendAppointmentReminder(appointment, reminderType);
        results.push(result);

        if (result.emailSent || result.smsSent) {
          console.log(
            `[${reminderType}] Sent reminder to ${result.clientName} (email: ${result.emailSent}, sms: ${result.smsSent})`
          );
        } else if (result.error === 'Reminder already sent') {
          console.log(`[${reminderType}] Skipped ${result.clientName} - already sent`);
        } else {
          console.warn(
            `[${reminderType}] Failed to send reminder to ${result.clientName}: ${result.error}`
          );
        }
      } catch (error) {
        // Don't stop processing other appointments if one fails
        console.error(
          `[${reminderType}] Error processing appointment ${appointment.id}:`,
          error
        );
        results.push({
          appointmentId: appointment.id,
          clientName: `${appointment.client.firstName} ${appointment.client.lastName}`,
          reminderType,
          emailSent: false,
          smsSent: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  } catch (error) {
    console.error(`[${reminderType}] Error fetching appointments:`, error);
  }

  return results;
}

/**
 * Main function to run all appointment reminders
 * This is called by the cron job
 */
export async function runAppointmentReminders(): Promise<void> {
  const startTime = new Date();
  console.log(`\n[AppointmentReminders] Starting at ${startTime.toISOString()}`);

  try {
    // Process 24-hour reminders
    const results24h = await processReminders(24, ReminderType.REMINDER_24H);

    // Process 2-hour reminders
    const results2h = await processReminders(2, ReminderType.REMINDER_2H);

    // Summary
    const totalProcessed = results24h.length + results2h.length;
    const totalEmailsSent =
      results24h.filter((r) => r.emailSent).length +
      results2h.filter((r) => r.emailSent).length;
    const totalSmsSent =
      results24h.filter((r) => r.smsSent).length + results2h.filter((r) => r.smsSent).length;
    const totalErrors =
      results24h.filter((r) => r.error && r.error !== 'Reminder already sent').length +
      results2h.filter((r) => r.error && r.error !== 'Reminder already sent').length;

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    console.log(`[AppointmentReminders] Completed in ${duration}ms`);
    console.log(`[AppointmentReminders] Summary:`);
    console.log(`  - Total appointments processed: ${totalProcessed}`);
    console.log(`  - Emails sent: ${totalEmailsSent}`);
    console.log(`  - SMS sent: ${totalSmsSent}`);
    console.log(`  - Errors: ${totalErrors}`);
  } catch (error) {
    console.error('[AppointmentReminders] Fatal error:', error);
  }
}

/**
 * Manually trigger reminders (useful for testing or admin endpoints)
 */
export async function triggerReminders(type?: '24h' | '2h'): Promise<{
  results24h?: ReminderResult[];
  results2h?: ReminderResult[];
}> {
  const response: { results24h?: ReminderResult[]; results2h?: ReminderResult[] } = {};

  if (!type || type === '24h') {
    response.results24h = await processReminders(24, ReminderType.REMINDER_24H);
  }

  if (!type || type === '2h') {
    response.results2h = await processReminders(2, ReminderType.REMINDER_2H);
  }

  return response;
}
