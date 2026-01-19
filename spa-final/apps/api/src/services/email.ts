import { env } from '../lib/env.js';

// Lazy load SendGrid to avoid module initialization issues
let sgMail: any = null;

async function getSendGrid() {
  if (!sgMail && env.SENDGRID_API_KEY) {
    const sendgridModule = await import('@sendgrid/mail');
    sgMail = sendgridModule.default;
    sgMail.setApiKey(env.SENDGRID_API_KEY);
  }
  return sgMail;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

interface BulkEmailOptions {
  recipients: string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!env.SENDGRID_API_KEY) {
    console.warn('SendGrid not configured - email not sent to:', options.to);
    return false;
  }

  try {
    const sendgrid = await getSendGrid();
    if (!sendgrid) {
      console.warn('SendGrid initialization failed - email not sent to:', options.to);
      return false;
    }

    const fromEmail = options.from || env.SENDGRID_FROM_EMAIL;
    console.log(`Sending email to ${options.to} from ${fromEmail} - Subject: ${options.subject}`);

    await sendgrid.send({
      to: options.to,
      from: fromEmail,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
      replyTo: options.replyTo,
    });
    console.log(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error: any) {
    console.error('SendGrid error:', error?.message || error);
    if (error?.response?.body) {
      console.error('SendGrid response body:', JSON.stringify(error.response.body, null, 2));
    }
    return false;
  }
}

export async function sendBulkEmail(options: BulkEmailOptions): Promise<{ sent: number; failed: number }> {
  const results = { sent: 0, failed: 0 };

  if (!env.SENDGRID_API_KEY) {
    console.warn('SendGrid not configured - bulk emails not sent');
    results.failed = options.recipients.length;
    return results;
  }

  const sendgrid = await getSendGrid();
  if (!sendgrid) {
    console.warn('SendGrid initialization failed - bulk emails not sent');
    results.failed = options.recipients.length;
    return results;
  }

  const batches: string[][] = [];
  for (let i = 0; i < options.recipients.length; i += 1000) {
    batches.push(options.recipients.slice(i, i + 1000));
  }

  for (const batch of batches) {
    const messages = batch.map(email => ({
      to: email,
      from: options.from || env.SENDGRID_FROM_EMAIL,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    }));

    try {
      await sendgrid.send(messages);
      results.sent += batch.length;
    } catch (error) {
      console.error('Bulk email error:', error);
      results.failed += batch.length;
    }
  }

  return results;
}

export function appointmentConfirmationEmail(data: {
  clientName: string;
  serviceName: string;
  staffName: string;
  dateTime: string;
  salonName: string;
  salonAddress: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2C2C2C; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #C7DCC8 0%, #E8F0E8 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: #FFFFFF; padding: 30px; border: 1px solid #E5E5E5; }
        .footer { background: #FAF8F3; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 12px 12px; }
        .details { background: #FAF8F3; padding: 20px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #2C2C2C;">${data.salonName}</h1>
          <p style="margin: 10px 0 0 0; color: #4A4A4A;">Appointment Confirmed</p>
        </div>
        <div class="content">
          <p>Hi ${data.clientName},</p>
          <p>Your appointment has been confirmed! Here are the details:</p>
          <div class="details">
            <p><strong>Service:</strong> ${data.serviceName}</p>
            <p><strong>With:</strong> ${data.staffName}</p>
            <p><strong>When:</strong> ${data.dateTime}</p>
            <p><strong>Where:</strong> ${data.salonAddress}</p>
          </div>
          <p>Need to reschedule? Please contact us at least 24 hours before your appointment.</p>
        </div>
        <div class="footer">
          <p>${data.salonName}</p>
          <p>This email was sent because you have an upcoming appointment.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function appointmentReminderEmail(data: {
  clientName: string;
  serviceName: string;
  staffName: string;
  dateTime: string;
  salonName: string;
  salonAddress: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2C2C2C; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #C7DCC8 0%, #E8F0E8 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: #FFFFFF; padding: 30px; border: 1px solid #E5E5E5; }
        .footer { background: #FAF8F3; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 12px 12px; }
        .highlight { background: #FEF3E7; border-left: 4px solid #F5A623; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #2C2C2C;">Reminder</h1>
          <p style="margin: 10px 0 0 0; color: #4A4A4A;">Your appointment is coming up!</p>
        </div>
        <div class="content">
          <p>Hi ${data.clientName},</p>
          <div class="highlight">
            <p style="margin: 0;"><strong>Tomorrow:</strong> ${data.serviceName} with ${data.staffName}</p>
            <p style="margin: 5px 0 0 0;">${data.dateTime}</p>
          </div>
          <p><strong>Location:</strong> ${data.salonAddress}</p>
          <p>We look forward to seeing you!</p>
        </div>
        <div class="footer">
          <p>${data.salonName}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function appointmentReminder2hEmail(data: {
  clientName: string;
  serviceName: string;
  staffName: string;
  dateTime: string;
  salonName: string;
  salonAddress: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2C2C2C; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #F5A623 0%, #FFD93D 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: #FFFFFF; padding: 30px; border: 1px solid #E5E5E5; }
        .footer { background: #FAF8F3; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 12px 12px; }
        .highlight { background: #FEF3E7; border-left: 4px solid #F5A623; padding: 15px; margin: 20px 0; }
        .urgent { color: #D35400; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #2C2C2C;">See You Soon!</h1>
          <p style="margin: 10px 0 0 0; color: #4A4A4A;" class="urgent">Your appointment is in 2 hours</p>
        </div>
        <div class="content">
          <p>Hi ${data.clientName},</p>
          <p>Just a quick reminder that your appointment is coming up very soon!</p>
          <div class="highlight">
            <p style="margin: 0;"><strong>${data.serviceName}</strong> with ${data.staffName}</p>
            <p style="margin: 5px 0 0 0;"><strong>${data.dateTime}</strong></p>
          </div>
          <p><strong>Location:</strong> ${data.salonAddress}</p>
          <p style="margin-top: 20px;">Please arrive 5-10 minutes early to ensure a relaxed experience. We can't wait to see you!</p>
        </div>
        <div class="footer">
          <p>${data.salonName}</p>
          <p style="font-size: 11px; color: #888;">Need to make changes? Please call us as soon as possible.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function giftCardEmail(data: {
  recipientName: string;
  senderName: string;
  amount: number;
  code: string;
  message?: string;
  salonName: string;
  expiresAt?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2C2C2C; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .gift-card { background: linear-gradient(135deg, #C7DCC8 0%, #B8D4B8 100%); padding: 40px; text-align: center; border-radius: 16px; margin: 20px 0; }
        .code { background: white; display: inline-block; padding: 15px 30px; font-size: 24px; font-weight: bold; letter-spacing: 3px; border-radius: 8px; margin: 20px 0; }
        .amount { font-size: 48px; font-weight: bold; color: #2C2C2C; }
        .message { background: #FAF8F3; padding: 20px; border-radius: 8px; margin: 20px 0; font-style: italic; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="gift-card">
          <p style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Gift Card</p>
          <p class="amount">$${data.amount.toFixed(2)}</p>
          <p style="margin: 10px 0 0 0;">${data.salonName}</p>
        </div>
        <p>Hi ${data.recipientName},</p>
        <p>${data.senderName} has sent you a gift card!</p>
        ${data.message ? `<div class="message">"${data.message}"</div>` : ''}
        <p>Your gift card code is:</p>
        <p class="code">${data.code}</p>
        <p>Present this code when booking your appointment or checking out.</p>
        ${data.expiresAt ? `<p style="color: #666; font-size: 12px;">Expires: ${data.expiresAt}</p>` : ''}
      </div>
    </body>
    </html>
  `;
}

export function emailVerificationEmail(data: {
  salonName: string;
  verificationUrl: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2C2C2C; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #C7DCC8 0%, #E8F0E8 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: #FFFFFF; padding: 30px; border: 1px solid #E5E5E5; }
        .footer { background: #FAF8F3; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 12px 12px; }
        .button { display: inline-block; background: #6B9B76; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .button:hover { background: #5A8A65; }
        .info { background: #E8F4EA; border-left: 4px solid #6B9B76; padding: 15px; margin: 20px 0; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #2C2C2C;">Verify Your Email</h1>
          <p style="margin: 10px 0 0 0; color: #4A4A4A;">Peacase</p>
        </div>
        <div class="content">
          <p>Welcome to Peacase!</p>
          <p>Thank you for creating an account for <strong>${data.salonName}</strong>. Please verify your email address by clicking the button below:</p>
          <p style="text-align: center;">
            <a href="${data.verificationUrl}" class="button">Verify Email Address</a>
          </p>
          <div class="info">
            <p style="margin: 0;"><strong>This link will expire in 24 hours.</strong></p>
            <p style="margin: 5px 0 0 0;">If you didn't create an account with Peacase, you can safely ignore this email.</p>
          </div>
          <p>If the button above doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; font-size: 14px; color: #666; background: #f5f5f5; padding: 10px; border-radius: 4px;">${data.verificationUrl}</p>
        </div>
        <div class="footer">
          <p>Peacase - Spa & Salon Management</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function passwordResetEmail(data: {
  recipientName: string;
  resetUrl: string;
  expiresInMinutes: number;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2C2C2C; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #C7DCC8 0%, #E8F0E8 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: #FFFFFF; padding: 30px; border: 1px solid #E5E5E5; }
        .footer { background: #FAF8F3; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 12px 12px; }
        .button { display: inline-block; background: #6B9B76; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .button:hover { background: #5A8A65; }
        .warning { background: #FEF3E7; border-left: 4px solid #F5A623; padding: 15px; margin: 20px 0; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #2C2C2C;">Password Reset</h1>
          <p style="margin: 10px 0 0 0; color: #4A4A4A;">Peacase</p>
        </div>
        <div class="content">
          <p>Hi ${data.recipientName},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <p style="text-align: center;">
            <a href="${data.resetUrl}" class="button">Reset Password</a>
          </p>
          <div class="warning">
            <p style="margin: 0;"><strong>This link will expire in ${data.expiresInMinutes} minutes.</strong></p>
            <p style="margin: 5px 0 0 0;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>
          <p>If the button above doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; font-size: 14px; color: #666; background: #f5f5f5; padding: 10px; border-radius: 4px;">${data.resetUrl}</p>
        </div>
        <div class="footer">
          <p>Peacase - Spa & Salon Management</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function marketingCampaignEmail(data: {
  content: string;
  salonName: string;
  unsubscribeUrl: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2C2C2C; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #C7DCC8 0%, #E8F0E8 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: #FFFFFF; padding: 30px; border: 1px solid #E5E5E5; }
        .footer { background: #FAF8F3; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 12px 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #2C2C2C;">${data.salonName}</h1>
        </div>
        <div class="content">
          ${data.content}
        </div>
        <div class="footer">
          <p>${data.salonName}</p>
          <p><a href="${data.unsubscribeUrl}" style="color: #666;">Unsubscribe</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}
