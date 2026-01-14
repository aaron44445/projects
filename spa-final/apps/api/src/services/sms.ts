import twilio from 'twilio';
import { env } from '../lib/env.js';

// Initialize Twilio client only if credentials are configured
const client = env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN
  ? twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
  : null;

const FROM_NUMBER = env.TWILIO_PHONE_NUMBER || '';

interface SendSmsOptions {
  to: string;
  message: string;
}

interface BulkSmsOptions {
  recipients: string[];
  message: string;
}

function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 10) {
    return `+1${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  return digits.startsWith('+') ? digits : `+${digits}`;
}

export async function sendSms(options: SendSmsOptions): Promise<boolean> {
  if (!client || !FROM_NUMBER) {
    console.warn('Twilio not configured - SMS not sent to:', options.to);
    return false;
  }

  try {
    await client.messages.create({
      body: options.message,
      from: FROM_NUMBER,
      to: formatPhoneNumber(options.to),
    });
    return true;
  } catch (error) {
    console.error('Twilio SMS error:', error);
    return false;
  }
}

export async function sendBulkSms(options: BulkSmsOptions): Promise<{ sent: number; failed: number }> {
  const results = { sent: 0, failed: 0 };

  for (const phone of options.recipients) {
    const success = await sendSms({ to: phone, message: options.message });
    if (success) {
      results.sent++;
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
