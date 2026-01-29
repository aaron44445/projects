import twilio from 'twilio';
import { env } from '../lib/env.js';
import logger from '../lib/logger.js';

// Initialize Twilio client only if credentials are configured
const client = env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN
  ? twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
  : null;

const FROM_NUMBER = env.TWILIO_PHONE_NUMBER || '';

interface SendSmsOptions {
  to: string;
  message: string;
}

interface SendSmsResult {
  success: boolean;
  messageSid?: string;  // Return the Twilio MessageSid for tracking
  error?: string;
}

interface BulkSmsOptions {
  recipients: string[];
  message: string;
}

/**
 * Format phone number to E.164 format for international SMS delivery
 * Handles various input formats:
 * - Already E.164: +441onal... -> +441234567890
 * - US/Canada 10 digit: 5551234567 -> +15551234567
 * - US/Canada 11 digit: 15551234567 -> +15551234567
 * - International with country code: 441234567890 -> +441234567890
 * - With spaces/dashes: +44 123 456 7890 -> +441234567890
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except leading +
  const hasPlus = phone.startsWith('+');
  const digits = phone.replace(/\D/g, '');

  // Already has + prefix - just clean up the number
  if (hasPlus) {
    return `+${digits}`;
  }

  // US/Canada: 10 digits -> assume +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // US/Canada: 11 digits starting with 1 -> add +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // UK: 10-11 digits starting with 44 -> add +
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('44')) {
    return `+${digits}`;
  }

  // Other international: if it looks like a country code (11+ digits), add +
  // Most international numbers are 11-15 digits with country code
  if (digits.length >= 11 && digits.length <= 15) {
    return `+${digits}`;
  }

  // Fallback: just add + prefix
  return `+${digits}`;
}

export async function sendSms(options: SendSmsOptions): Promise<SendSmsResult> {
  if (!client || !FROM_NUMBER) {
    logger.warn({ to: options.to }, 'Twilio not configured - SMS not sent');
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    // Build the status callback URL
    // Use API_URL env var, fallback to production URL
    const apiUrl = env.API_URL || 'https://peacase-api.onrender.com';
    const statusCallback = `${apiUrl}/api/webhooks/sms-status`;

    const message = await client.messages.create({
      body: options.message,
      from: FROM_NUMBER,
      to: formatPhoneNumber(options.to),
      statusCallback,  // Twilio will POST updates to this URL
    });

    logger.info({ to: options.to, messageSid: message.sid }, 'SMS sent successfully');
    return { success: true, messageSid: message.sid };
  } catch (error: unknown) {
    logger.error({ err: error, to: options.to }, 'Twilio SMS error');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function sendBulkSms(options: BulkSmsOptions): Promise<{ sent: number; failed: number; sids: string[] }> {
  const results = { sent: 0, failed: 0, sids: [] as string[] };

  for (const phone of options.recipients) {
    const result = await sendSms({ to: phone, message: options.message });
    if (result.success) {
      results.sent++;
      if (result.messageSid) results.sids.push(result.messageSid);
    } else {
      results.failed++;
    }
  }

  return results;
}

export function appointmentConfirmationSms(data: {
  clientName: string;
  serviceName: string;
  dateTime: string;
  salonName: string;
}): string {
  return `Hi ${data.clientName}! Your ${data.serviceName} at ${data.salonName} is confirmed for ${data.dateTime}. Reply HELP for assistance or STOP to opt out.`;
}

export function appointmentReminderSms(data: {
  clientName: string;
  serviceName: string;
  dateTime: string;
  salonName: string;
}): string {
  return `Reminder: ${data.clientName}, your ${data.serviceName} at ${data.salonName} is tomorrow at ${data.dateTime}. See you soon!`;
}

export function appointmentReminder2hSms(data: {
  clientName: string;
  serviceName: string;
  dateTime: string;
  salonName: string;
}): string {
  return `Reminder: ${data.clientName}, your ${data.serviceName} at ${data.salonName} is in 2 hours! See you at ${data.dateTime}.`;
}

export function appointmentCancellationSms(data: {
  clientName: string;
  serviceName: string;
  dateTime: string;
  salonName: string;
}): string {
  return `Hi ${data.clientName}, your ${data.serviceName} appointment at ${data.salonName} for ${data.dateTime} has been cancelled. Contact us to reschedule.`;
}

export function giftCardReceivedSms(data: {
  recipientName: string;
  amount: number;
  code: string;
  salonName: string;
}): string {
  return `${data.recipientName}, you've received a $${data.amount} gift card for ${data.salonName}! Code: ${data.code}. Book your appointment today!`;
}
