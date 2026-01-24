import { env } from '../lib/env.js';

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

// Use SMTP2GO REST API (no npm packages needed)
async function sendViaSMTP2GO(options: EmailOptions): Promise<boolean> {
  const apiKey = env.SMTP_PASS; // SMTP2GO uses the API key as SMTP_PASS
  const fromEmail = options.from || env.SMTP_FROM_EMAIL || 'noreply@peacase.com';
  const fromName = env.SMTP_FROM_NAME || 'Peacase';

  try {
    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        to: [`${options.to}`],
        sender: `${fromName} <${fromEmail}>`,
        subject: options.subject,
        html_body: options.html,
        text_body: options.text || options.html.replace(/<[^>]*>/g, ''),
      }),
    });

    const result = await response.json();

    if (result.data?.succeeded > 0) {
      console.log(`Email sent successfully to ${options.to} via SMTP2GO`);
      return true;
    } else {
      console.error('SMTP2GO error:', result);
      return false;
    }
  } catch (error) {
    console.error('SMTP2GO request failed:', error);
    return false;
  }
}

// Fallback to SendGrid if configured
async function sendViaSendGrid(options: EmailOptions): Promise<boolean> {
  if (!env.SENDGRID_API_KEY) {
    return false;
  }

  try {
    const sendgridModule = await import('@sendgrid/mail');
    const sgMail = sendgridModule.default;
    sgMail.setApiKey(env.SENDGRID_API_KEY);

    await sgMail.send({
      to: options.to,
      from: options.from || env.SENDGRID_FROM_EMAIL,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
      replyTo: options.replyTo,
    });
    console.log(`Email sent successfully to ${options.to} via SendGrid`);
    return true;
  } catch (error: any) {
    console.error('SendGrid error:', error?.message || error);
    return false;
  }
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Try SMTP2GO first (if configured)
  if (env.SMTP_PASS) {
    console.log(`Attempting to send email to ${options.to} via SMTP2GO...`);
    const sent = await sendViaSMTP2GO(options);
    if (sent) return true;
  }

  // Fall back to SendGrid
  if (env.SENDGRID_API_KEY) {
    console.log(`Attempting to send email to ${options.to} via SendGrid...`);
    const sent = await sendViaSendGrid(options);
    if (sent) return true;
  }

  console.warn('No email provider configured - email not sent to:', options.to);
  return false;
}

export async function sendBulkEmail(options: BulkEmailOptions): Promise<{ sent: number; failed: number }> {
  const results = { sent: 0, failed: 0 };

  // Send individually for now (SMTP2GO bulk API is different)
  for (const recipient of options.recipients) {
    const success = await sendEmail({
      to: recipient,
      subject: options.subject,
      html: options.html,
      text: options.text,
      from: options.from,
    });

    if (success) {
      results.sent++;
    } else {
      results.failed++;
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

export function clientWelcomeEmail(data: {
  clientName: string;
  salonName: string;
  verificationToken: string;
  portalUrl: string;
}): string {
  const verifyUrl = `${data.portalUrl}/verify?token=${data.verificationToken}`;
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #2C2C2C;">Welcome!</h1>
          <p style="margin: 10px 0 0 0; color: #4A4A4A;">${data.salonName}</p>
        </div>
        <div class="content">
          <p>Hi ${data.clientName},</p>
          <p>Welcome to ${data.salonName}! Your account has been created successfully.</p>
          <p>Please verify your email to start booking appointments:</p>
          <p style="text-align: center;">
            <a href="${verifyUrl}" class="button">Verify Email & Get Started</a>
          </p>
        </div>
        <div class="footer">
          <p>${data.salonName}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export function clientPasswordResetEmail(data: {
  clientName: string;
  salonName: string;
  resetToken: string;
  portalUrl: string;
  expiresInMinutes?: number;
}): string {
  const resetUrl = `${data.portalUrl}/reset-password?token=${data.resetToken}`;
  return passwordResetEmail({
    recipientName: data.clientName,
    resetUrl,
    expiresInMinutes: data.expiresInMinutes || 60,
  });
}

export function clientVerificationEmail(data: {
  clientName: string;
  salonName: string;
  verificationToken: string;
  portalUrl: string;
}): string {
  const verificationUrl = `${data.portalUrl}/verify?token=${data.verificationToken}`;
  return emailVerificationEmail({
    salonName: data.salonName,
    verificationUrl,
  });
}

export function appointmentCancellationEmail(data: {
  clientName: string;
  serviceName: string;
  salonName: string;
  appointmentDate: string;
  appointmentTime: string;
  reason?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2C2C2C; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: #FFFFFF; padding: 30px; border: 1px solid #E5E5E5; }
        .footer { background: #FAF8F3; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 12px 12px; }
        .details { background: #FEF2F2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #991B1B;">Appointment Cancelled</h1>
          <p style="margin: 10px 0 0 0; color: #7F1D1D;">${data.salonName}</p>
        </div>
        <div class="content">
          <p>Hi ${data.clientName},</p>
          <p>Your appointment has been cancelled:</p>
          <div class="details">
            <p><strong>Service:</strong> ${data.serviceName}</p>
            <p><strong>Date:</strong> ${data.appointmentDate}</p>
            <p><strong>Time:</strong> ${data.appointmentTime}</p>
            ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
          </div>
          <p>If you'd like to rebook, please visit our booking page or contact us.</p>
        </div>
        <div class="footer">
          <p>${data.salonName}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
