import { env } from '../lib/env.js';
import { generateCalendarLinks, createAppointmentCalendarEvent, CalendarLinks } from '../lib/calendar.js';
import logger from '../lib/logger.js';

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

  logger.info({ to: options.to, from: `${fromName} <${fromEmail}>`, subject: options.subject, apiKeyPresent: !!apiKey }, 'Preparing SMTP2GO email');

  try {
    const payload = {
      api_key: apiKey,
      to: [options.to],
      sender: `${fromName} <${fromEmail}>`,
      subject: options.subject,
      html_body: options.html,
      text_body: options.text || options.html.replace(/<[^>]*>/g, ''),
    };

    logger.debug({ to: options.to }, 'Sending to SMTP2GO API');

    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    logger.debug({ response: result }, 'SMTP2GO response received');

    if (result.data?.succeeded > 0) {
      logger.info({ to: options.to, provider: 'SMTP2GO' }, 'Email sent successfully');
      return true;
    } else {
      logger.error({ to: options.to, response: result, provider: 'SMTP2GO' }, 'SMTP2GO email failed');
      return false;
    }
  } catch (error) {
    logger.error({ err: error, to: options.to, provider: 'SMTP2GO' }, 'SMTP2GO request failed');
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
    logger.info({ to: options.to, provider: 'SendGrid' }, 'Email sent successfully');
    return true;
  } catch (error: any) {
    logger.error({ err: error, to: options.to, provider: 'SendGrid' }, 'SendGrid email failed');
    return false;
  }
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // Try SMTP2GO first (if configured)
  if (env.SMTP_PASS) {
    logger.debug({ to: options.to, provider: 'SMTP2GO' }, 'Attempting email send');
    const sent = await sendViaSMTP2GO(options);
    if (sent) return true;
  }

  // Fall back to SendGrid
  if (env.SENDGRID_API_KEY) {
    logger.debug({ to: options.to, provider: 'SendGrid' }, 'Attempting email send');
    const sent = await sendViaSendGrid(options);
    if (sent) return true;
  }

  logger.warn({ to: options.to }, 'No email provider configured - email not sent');
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
  // New optional fields for calendar
  startTime?: Date;
  endTime?: Date;
  salonTimezone?: string;
  salonEmail?: string;
}): string {
  logger.debug({
    hasStartTime: !!data.startTime,
    hasEndTime: !!data.endTime,
    salonTimezone: data.salonTimezone,
  }, 'Building appointment confirmation email with calendar fields');

  // Generate calendar links if appointment times provided
  let calendarSection = '';
  if (data.startTime && data.endTime) {
    const calendarEvent = createAppointmentCalendarEvent({
      serviceName: data.serviceName,
      staffName: data.staffName,
      salonName: data.salonName,
      salonAddress: data.salonAddress,
      salonEmail: data.salonEmail,
      startTime: data.startTime,
      endTime: data.endTime,
      salonTimezone: data.salonTimezone,
    });
    const links = generateCalendarLinks(calendarEvent);

    calendarSection = `
      <!-- Calendar Section -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0;">
        <tr>
          <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); border-radius: 12px; padding: 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-bottom: 16px;">
                  <span style="font-family: Georgia, 'Times New Roman', serif; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #9CA3AF;">Add to Calendar</span>
                </td>
              </tr>
              <tr>
                <td>
                  <table cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <!-- Google Calendar -->
                      <td style="padding-right: 8px; padding-bottom: 8px;">
                        <a href="${links.google}" target="_blank" style="display: inline-block; background: #ffffff; color: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 600; text-decoration: none; padding: 10px 16px; border-radius: 6px; border: none;">
                          Google
                        </a>
                      </td>
                      <!-- Outlook -->
                      <td style="padding-right: 8px; padding-bottom: 8px;">
                        <a href="${links.outlook}" target="_blank" style="display: inline-block; background: #ffffff; color: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 600; text-decoration: none; padding: 10px 16px; border-radius: 6px; border: none;">
                          Outlook
                        </a>
                      </td>
                      <!-- Yahoo -->
                      <td style="padding-right: 8px; padding-bottom: 8px;">
                        <a href="${links.yahoo}" target="_blank" style="display: inline-block; background: #ffffff; color: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 600; text-decoration: none; padding: 10px 16px; border-radius: 6px; border: none;">
                          Yahoo
                        </a>
                      </td>
                      <!-- Apple/ICS -->
                      <td style="padding-bottom: 8px;">
                        <a href="${links.icsDownload}" download="appointment.ics" style="display: inline-block; background: #ffffff; color: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; font-weight: 600; text-decoration: none; padding: 10px 16px; border-radius: 6px; border: none;">
                          Apple
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Appointment Confirmed - ${data.salonName}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <!-- Outer wrapper for background -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f0; padding: 40px 20px;">
        <tr>
          <td align="center">
            <!-- Main container -->
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">

              <!-- Header with Business branding -->
              <tr>
                <td style="background: #1a1a1a; padding: 32px 40px; border-radius: 16px 16px 0 0;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <!-- Business Name -->
                        <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 28px; font-weight: 400; color: #ffffff; letter-spacing: 0.5px;">${data.salonName}</h1>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Accent line -->
              <tr>
                <td style="background: linear-gradient(90deg, #6B9B76 0%, #8BB496 50%, #6B9B76 100%); height: 4px; font-size: 0; line-height: 0;">&nbsp;</td>
              </tr>

              <!-- Confirmation badge -->
              <tr>
                <td style="background: #ffffff; padding: 32px 40px 0 40px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <span style="display: inline-block; background: #E8F5E9; color: #2E7D32; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; padding: 10px 20px; border-radius: 20px;">✓ Appointment Confirmed</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Main content area -->
              <tr>
                <td style="background: #ffffff; padding: 32px 40px 40px 40px;">

                  <!-- Greeting -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
                    <tr>
                      <td align="center">
                        <h2 style="margin: 0 0 8px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: 400; color: #1a1a1a;">
                          You're all set, ${data.clientName}!
                        </h2>
                        <p style="margin: 0; font-size: 15px; color: #6B7280; line-height: 1.5;">
                          We look forward to seeing you.
                        </p>
                      </td>
                    </tr>
                  </table>

                  <!-- Appointment Details Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #FAFAF8; border: 1px solid #E5E5E0; border-radius: 12px; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 24px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <!-- Service -->
                          <tr>
                            <td style="padding-bottom: 16px; border-bottom: 1px solid #E5E5E0;">
                              <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9CA3AF; margin-bottom: 4px;">Service</span>
                              <span style="font-size: 17px; font-weight: 600; color: #1a1a1a;">${data.serviceName}</span>
                            </td>
                          </tr>
                          <!-- Stylist -->
                          <tr>
                            <td style="padding: 16px 0; border-bottom: 1px solid #E5E5E0;">
                              <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9CA3AF; margin-bottom: 4px;">With</span>
                              <span style="font-size: 15px; color: #1a1a1a;">${data.staffName}</span>
                            </td>
                          </tr>
                          <!-- Date & Time -->
                          <tr>
                            <td style="padding: 16px 0; border-bottom: 1px solid #E5E5E0;">
                              <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9CA3AF; margin-bottom: 4px;">When</span>
                              <span style="font-size: 15px; color: #1a1a1a; font-weight: 500;">${data.dateTime}</span>
                            </td>
                          </tr>
                          <!-- Location -->
                          <tr>
                            <td style="padding-top: 16px;">
                              <span style="display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9CA3AF; margin-bottom: 4px;">Location</span>
                              <span style="font-size: 15px; color: #1a1a1a;">${data.salonAddress}</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  ${calendarSection}

                  <!-- Note -->
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="padding-top: 8px;">
                        <p style="margin: 0; font-size: 14px; color: #6B7280; line-height: 1.6; text-align: center;">
                          Need to reschedule? Please contact us at least 24 hours before your appointment.
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: #FAFAF8; padding: 24px 40px; border-radius: 0 0 16px 16px; border-top: 1px solid #E5E5E0;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center">
                        <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 500; color: #1a1a1a;">${data.salonName}</p>
                        <p style="margin: 0; font-size: 12px; color: #9CA3AF;">${data.salonAddress}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

            </table>

            <!-- Powered by (very subtle, outside main card) -->
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; margin-top: 16px;">
              <tr>
                <td align="center">
                  <p style="margin: 0; font-size: 11px; color: #9CA3AF;">Powered by Peacase</p>
                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>
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
          <p style="margin: 10px 0 0 0; color: #2C2C2C;">Your appointment is coming up!</p>
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
          <p style="margin: 10px 0 0 0; color: #2C2C2C;" class="urgent">Your appointment is in 2 hours</p>
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
          <p style="margin: 10px 0 0 0; color: #2C2C2C; font-weight: 600;">Peacase</p>
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
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Reset Your Password - Peacase</title>
      <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
      <![endif]-->
    </head>
    <body style="margin: 0; padding: 0; background-color: #F5F3EE; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <!-- Outer wrapper for email clients -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F5F3EE;">
        <tr>
          <td align="center" style="padding: 40px 20px;">

            <!-- Main container -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">

              <!-- Header with brand -->
              <tr>
                <td style="background: linear-gradient(135deg, #5A8A5B 0%, #7BA37C 100%); padding: 36px 40px; text-align: center;">
                  <!-- Logo mark -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                    <tr>
                      <td style="width: 48px; height: 48px; background-color: rgba(255, 255, 255, 0.2); border-radius: 12px; text-align: center; vertical-align: middle;">
                        <span style="font-size: 24px; line-height: 48px;">&#10024;</span>
                      </td>
                    </tr>
                  </table>
                  <h1 style="margin: 16px 0 0 0; font-size: 26px; font-weight: 700; color: #FFFFFF; letter-spacing: -0.5px;">Peacase</h1>
                  <p style="margin: 6px 0 0 0; font-size: 13px; color: rgba(255, 255, 255, 0.85); text-transform: uppercase; letter-spacing: 1.5px; font-weight: 500;">Spa & Salon Management</p>
                </td>
              </tr>

              <!-- Decorative line -->
              <tr>
                <td style="height: 4px; background: linear-gradient(90deg, #E8A87C 0%, #D4956A 50%, #E8A87C 100%);"></td>
              </tr>

              <!-- Main content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 600; color: #2C2C2C; letter-spacing: -0.3px;">Reset Your Password</h2>
                  <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #666666;">Hi ${data.recipientName},</p>
                  <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 1.6; color: #666666;">We received a request to reset your password. Click the button below to create a new one.</p>

                  <!-- CTA Button -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto;">
                    <tr>
                      <td style="border-radius: 10px; background: linear-gradient(135deg, #5A8A5B 0%, #7BA37C 100%); box-shadow: 0 4px 14px rgba(90, 138, 91, 0.35);">
                        <a href="${data.resetUrl}" target="_blank" style="display: inline-block; padding: 16px 40px; font-size: 15px; font-weight: 600; color: #FFFFFF; text-decoration: none; letter-spacing: 0.3px;">
                          Reset Password &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>

                  <!-- Time warning -->
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px;">
                    <tr>
                      <td style="background-color: #FEF8F3; border-radius: 10px; padding: 18px 20px; border-left: 4px solid #E8A87C;">
                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                          <tr>
                            <td style="vertical-align: top; padding-right: 12px;">
                              <span style="font-size: 18px;">&#9200;</span>
                            </td>
                            <td>
                              <p style="margin: 0; font-size: 14px; font-weight: 600; color: #2C2C2C;">This link expires in ${data.expiresInMinutes} minutes</p>
                              <p style="margin: 4px 0 0 0; font-size: 13px; color: #888888; line-height: 1.5;">If you didn't request this, you can safely ignore this email.</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Fallback link -->
                  <p style="margin: 28px 0 0 0; font-size: 13px; color: #999999; line-height: 1.5;">If the button doesn't work, copy and paste this link:</p>
                  <p style="margin: 8px 0 0 0; padding: 12px 14px; background-color: #F8F7F5; border-radius: 8px; font-size: 12px; color: #7BA37C; word-break: break-all; font-family: 'Monaco', 'Menlo', monospace;">${data.resetUrl}</p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #FAFAF8; padding: 24px 40px; border-top: 1px solid #EEEEE9;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td style="text-align: center;">
                        <p style="margin: 0; font-size: 13px; color: #999999;">Sent with care by <strong style="color: #7BA37C;">Peacase</strong></p>
                        <p style="margin: 8px 0 0 0; font-size: 11px; color: #BBBBBB;">This is an automated message. Please do not reply directly.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

            </table>

            <!-- Bottom branding -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top: 24px;">
              <tr>
                <td style="text-align: center;">
                  <p style="margin: 0; font-size: 11px; color: #AAAAAA;">&copy; ${new Date().getFullYear()} Peacase. All rights reserved.</p>
                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>
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
          <p style="margin: 10px 0 0 0; color: #2C2C2C;">${data.salonName}</p>
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

// GDPR-related email templates

export async function sendDataExportEmail(to: string, data: {
  clientName: string;
  downloadLink?: string;
}): Promise<boolean> {
  const html = dataExportEmail(data);
  return sendEmail({
    to,
    subject: 'Your Data Export is Ready',
    html,
  });
}

export function dataExportEmail(data: {
  clientName: string;
  downloadLink?: string;
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
        .info { background: #E8F4EA; border-left: 4px solid #6B9B76; padding: 15px; margin: 20px 0; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #2C2C2C;">Your Data Export is Ready</h1>
          <p style="margin: 10px 0 0 0; color: #2C2C2C; font-weight: 600;">Peacase</p>
        </div>
        <div class="content">
          <p>Hi ${data.clientName},</p>
          <p>Your personal data export has been prepared and is now ready for download.</p>
          ${data.downloadLink ? `
          <p style="text-align: center;">
            <a href="${data.downloadLink}" class="button">Download Your Data</a>
          </p>
          ` : `
          <div class="info">
            <p style="margin: 0;">Your data export is being processed. You will receive another email with the download link once it's ready.</p>
          </div>
          `}
          <div class="info">
            <p style="margin: 0;"><strong>Important:</strong> This download link will expire in 7 days for your security.</p>
            <p style="margin: 5px 0 0 0;">The export includes all personal information we have stored about you, including your profile, appointment history, and preferences.</p>
          </div>
          <p>If you did not request this data export, please contact us immediately.</p>
        </div>
        <div class="footer">
          <p>Peacase - Spa & Salon Management</p>
          <p>This email was sent in response to your data export request.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendDeletionRequestEmail(to: string, data: {
  clientName: string;
  requestDate: string;
  completionDate: string;
}): Promise<boolean> {
  const html = deletionRequestEmail(data);
  return sendEmail({
    to,
    subject: 'Data Deletion Request Received',
    html,
  });
}

export function deletionRequestEmail(data: {
  clientName: string;
  requestDate: string;
  completionDate: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2C2C2C; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #FEF3E7 0%, #FED7AA 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: #FFFFFF; padding: 30px; border: 1px solid #E5E5E5; }
        .footer { background: #FAF8F3; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 12px 12px; }
        .warning { background: #FEF3E7; border-left: 4px solid #F5A623; padding: 15px; margin: 20px 0; }
        .details { background: #FAF8F3; padding: 20px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #92400E;">Data Deletion Request Received</h1>
          <p style="margin: 10px 0 0 0; color: #B45309;">Peacase</p>
        </div>
        <div class="content">
          <p>Hi ${data.clientName},</p>
          <p>We have received your request to delete your personal data from our systems.</p>
          <div class="details">
            <p><strong>Request Date:</strong> ${data.requestDate}</p>
            <p><strong>Scheduled Completion:</strong> ${data.completionDate}</p>
          </div>
          <div class="warning">
            <p style="margin: 0;"><strong>30-Day Grace Period</strong></p>
            <p style="margin: 10px 0 0 0;">Your data will be permanently deleted after a 30-day grace period. During this time, you can cancel your deletion request if you change your mind.</p>
            <p style="margin: 10px 0 0 0;">Once deleted, your data cannot be recovered. This includes:</p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
              <li>Your profile and account information</li>
              <li>Appointment history</li>
              <li>Saved preferences</li>
              <li>Any associated records</li>
            </ul>
          </div>
          <p><strong>To cancel this request:</strong> Simply reply to this email or contact us before ${data.completionDate}.</p>
          <p>If you did not request this deletion, please contact us immediately.</p>
        </div>
        <div class="footer">
          <p>Peacase - Spa & Salon Management</p>
          <p>This email was sent in response to your data deletion request.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendDeletionCompleteEmail(to: string, data: {
  clientName: string;
}): Promise<boolean> {
  const html = deletionCompleteEmail(data);
  return sendEmail({
    to,
    subject: 'Your Data Has Been Deleted',
    html,
  });
}

export function deletionCompleteEmail(data: {
  clientName: string;
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
        .success { background: #E8F4EA; border-left: 4px solid #6B9B76; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #2C2C2C;">Data Deletion Complete</h1>
          <p style="margin: 10px 0 0 0; color: #2C2C2C; font-weight: 600;">Peacase</p>
        </div>
        <div class="content">
          <p>Hi ${data.clientName},</p>
          <p>We're writing to confirm that your personal data has been permanently deleted from our systems.</p>
          <div class="success">
            <p style="margin: 0;"><strong>Deletion Confirmed</strong></p>
            <p style="margin: 10px 0 0 0;">All of your personal information, including your profile, appointment history, and preferences, has been removed from our database.</p>
          </div>
          <p>Please note:</p>
          <ul>
            <li>This action cannot be undone</li>
            <li>You may need to create a new account if you wish to use our services in the future</li>
            <li>Some anonymized data may be retained for legal or statistical purposes</li>
          </ul>
          <p>Thank you for being a valued customer. We hope to serve you again in the future.</p>
        </div>
        <div class="footer">
          <p>Peacase - Spa & Salon Management</p>
          <p>This is the final communication regarding your data deletion request.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function sendConsentUpdateEmail(to: string, data: {
  clientName: string;
  consentType: string;
  newStatus: boolean;
}): Promise<boolean> {
  const html = consentUpdateEmail(data);
  return sendEmail({
    to,
    subject: 'Consent Preferences Updated',
    html,
  });
}

export function consentUpdateEmail(data: {
  clientName: string;
  consentType: string;
  newStatus: boolean;
}): string {
  const statusText = data.newStatus ? 'opted in to' : 'opted out of';
  const statusColor = data.newStatus ? '#6B9B76' : '#EF4444';
  const statusBg = data.newStatus ? '#E8F4EA' : '#FEF2F2';

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
        .status-box { background: ${statusBg}; border-left: 4px solid ${statusColor}; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #2C2C2C;">Consent Preferences Updated</h1>
          <p style="margin: 10px 0 0 0; color: #2C2C2C; font-weight: 600;">Peacase</p>
        </div>
        <div class="content">
          <p>Hi ${data.clientName},</p>
          <p>We're confirming that your consent preferences have been updated.</p>
          <div class="status-box">
            <p style="margin: 0;"><strong>Change Summary</strong></p>
            <p style="margin: 10px 0 0 0;">You have <strong>${statusText}</strong> <strong>${data.consentType}</strong>.</p>
          </div>
          <p>This change has been recorded and will take effect immediately.</p>
          <p>You can update your preferences at any time through your account settings or by contacting us directly.</p>
          <p>If you did not make this change, please contact us immediately.</p>
        </div>
        <div class="footer">
          <p>Peacase - Spa & Salon Management</p>
          <p>This email was sent to confirm your consent preference update.</p>
        </div>
      </div>
    </body>
    </html>
  `;
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
