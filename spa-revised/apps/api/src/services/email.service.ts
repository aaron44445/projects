/**
 * Email Service
 * Generates email templates for appointment reminders and confirmations
 */

export interface ReminderEmailData {
  customerName: string
  customerEmail: string
  serviceName: string
  staffName: string
  appointmentTime: string
  appointmentDate: string
  salonName: string
  salonPhone: string
  cancelUrl?: string
}

/**
 * Generate a reminder email with HTML content
 */
export function generateReminderEmail(data: ReminderEmailData, hoursUntil: number) {
  const subject =
    hoursUntil === 0
      ? `Booking Confirmed: Your ${data.serviceName} appointment at ${data.salonName}`
      : `Reminder: Your ${data.serviceName} appointment with ${data.staffName} in ${hoursUntil} hours`

  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff; }
          .header { background: #C7DCC8; padding: 20px; border-radius: 8px; color: #333; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 8px 0 0 0; font-size: 14px; }
          .content { padding: 20px 0; }
          .content p { margin: 12px 0; font-size: 14px; line-height: 1.6; }
          .appointment-details { background: #f9f9f9; padding: 15px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #C7DCC8; }
          .detail-row { margin: 8px 0; font-size: 14px; }
          .detail-label { font-weight: bold; color: #666; display: inline-block; width: 100px; }
          .detail-value { color: #333; }
          .important { background: #fff3cd; padding: 12px; border-radius: 4px; margin: 15px 0; border-left: 4px solid #ffc107; font-size: 14px; }
          .contact-info { margin: 15px 0; font-size: 14px; }
          .contact-info strong { display: block; margin-bottom: 8px; }
          .footer { text-align: center; font-size: 12px; color: #999; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
          .button { display: inline-block; background: #C7DCC8; color: #333; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-weight: bold; margin: 15px 0; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${hoursUntil === 0 ? 'Booking Confirmed!' : 'Appointment Reminder'}</h1>
            <p>${
              hoursUntil === 0
                ? 'Your appointment has been confirmed'
                : `Your appointment is coming up in ${hoursUntil} hours`
            }</p>
          </div>

          <div class="content">
            <p>Hi ${data.customerName},</p>
            <p>${
              hoursUntil === 0
                ? `Thank you for booking with us! Your appointment at ${data.salonName} has been confirmed.`
                : `This is a friendly reminder about your upcoming appointment at ${data.salonName}.`
            }</p>

            <div class="appointment-details">
              <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span class="detail-value">${data.serviceName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Therapist:</span>
                <span class="detail-value">${data.staffName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${data.appointmentDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${data.appointmentTime}</span>
              </div>
            </div>

            <div class="important">
              <strong>Important:</strong> Please arrive 5-10 minutes early. If you need to reschedule or cancel, please contact us as soon as possible.
            </div>

            <div class="contact-info">
              <strong>Contact us:</strong>
              Phone: ${data.salonPhone}<br>
              Email: ${data.salonName.toLowerCase().replace(/ /g, '')}@example.com
            </div>

            <p>We look forward to seeing you!</p>
          </div>

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${data.salonName}. All rights reserved.</p>
            <p>You received this email because you have an appointment with us.</p>
          </div>
        </div>
      </body>
    </html>
  `

  return { subject, htmlContent }
}
