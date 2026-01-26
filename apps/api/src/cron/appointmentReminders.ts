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

// Reminder types - now dynamic based on salon configuration
export type ReminderType = string;  // e.g., 'REMINDER_24H', 'REMINDER_2H', 'REMINDER_48H'

// Notification settings structure (matches salon.ts)
interface NotificationSettings {
  reminders: {
    enabled: boolean;
    timings: { hours: number; label: string }[];
  };
  channels: {
    email: boolean;
    sms: boolean;
  };
}

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  reminders: {
    enabled: true,
    timings: [
      { hours: 24, label: '24 hours before' },
      { hours: 2, label: '2 hours before' },
    ],
  },
  channels: {
    email: true,
    sms: true,
  },
};

function parseNotificationSettings(json: string | null): NotificationSettings {
  if (!json) return DEFAULT_NOTIFICATION_SETTINGS;
  try {
    return JSON.parse(json) as NotificationSettings;
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
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
 * Send a reminder for a single appointment
 */
async function sendAppointmentReminder(
  appointment: AppointmentWithDetails,
  reminderType: ReminderType,
  channelConfig: { email: boolean; sms: boolean }
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
    // Send email only if channel is enabled AND client prefers email
    if (client.email && channelConfig.email && (preference === 'email' || preference === 'both')) {
      const emailSubject =
        reminderType === 'REMINDER_24H'
          ? `Reminder: Your appointment at ${salon.name} tomorrow`
          : `Reminder: Your appointment at ${salon.name} soon`;

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
        reminderType === 'REMINDER_24H'
          ? appointmentReminderEmail(emailData)
          : appointmentReminder2hEmail(emailData);

      result.emailSent = await sendEmail({
        to: client.email,
        subject: emailSubject,
        html: emailHtml,
      });
    }

    // Send SMS only if channel is enabled AND client prefers sms
    if (client.phone && channelConfig.sms && (preference === 'sms' || preference === 'both')) {
      const smsData = {
        clientName: client.firstName,
        serviceName: service.name,
        dateTime,
        salonName: salon.name,
      };

      // Use different templates for 24h vs 2h reminders
      const smsMessage =
        reminderType === 'REMINDER_24H'
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
 * Process reminders for a specific salon and timing configuration
 */
async function processRemindersForSalon(
  salonId: string,
  hoursAhead: number,
  reminderType: ReminderType,
  channels: { email: boolean; sms: boolean }
): Promise<{ processed: number; emailsSent: number; smsSent: number }> {
  const now = new Date();
  const targetTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
  const windowStart = new Date(targetTime.getTime() - 30 * 60 * 1000);  // 30 min window
  const windowEnd = new Date(targetTime.getTime() + 30 * 60 * 1000);

  const appointments = await prisma.appointment.findMany({
    where: {
      salonId,
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

  const results = { processed: 0, emailsSent: 0, smsSent: 0 };

  for (const appointment of appointments) {
    // Check if this specific reminder was already sent
    const alreadySent = await hasReminderBeenSent(appointment.id, reminderType);
    if (alreadySent) continue;

    const result = await sendAppointmentReminder(
      appointment as any,  // Type assertion for existing interface
      reminderType,
      channels
    );

    results.processed++;
    if (result.emailSent) results.emailsSent++;
    if (result.smsSent) results.smsSent++;
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
    // Get all active salons with their notification settings
    const salons = await prisma.salon.findMany({
      where: { isActive: true },
      select: {
        id: true,
        notification_settings: true,
        timezone: true,
        name: true,
      },
    });

    let totalProcessed = 0;
    let totalEmailsSent = 0;
    let totalSmsSent = 0;

    for (const salon of salons) {
      const settings = parseNotificationSettings(salon.notification_settings);

      if (!settings.reminders.enabled) {
        continue;  // Skip salons with reminders disabled
      }

      // Process each configured timing
      for (const timing of settings.reminders.timings) {
        const reminderType = `REMINDER_${timing.hours}H` as ReminderType;
        const results = await processRemindersForSalon(
          salon.id,
          timing.hours,
          reminderType,
          settings.channels
        );

        totalProcessed += results.processed;
        totalEmailsSent += results.emailsSent;
        totalSmsSent += results.smsSent;
      }
    }

    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();

    console.log(`[AppointmentReminders] Completed in ${duration}ms`);
    console.log(`[AppointmentReminders] Summary:`);
    console.log(`  - Salons checked: ${salons.length}`);
    console.log(`  - Total appointments processed: ${totalProcessed}`);
    console.log(`  - Emails sent: ${totalEmailsSent}`);
    console.log(`  - SMS sent: ${totalSmsSent}`);
  } catch (error) {
    console.error('[AppointmentReminders] Fatal error:', error);
  }
}

/**
 * Manually trigger reminders (useful for testing or admin endpoints)
 */
export async function triggerReminders(type?: '24h' | '2h'): Promise<{
  success: boolean;
  message: string;
}> {
  // Manually triggering now uses the same logic as cron - respects salon settings
  await runAppointmentReminders();

  return {
    success: true,
    message: 'Reminder processing triggered. Check logs for details.',
  };
}
