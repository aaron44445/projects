/**
 * Reminder Service
 * Sends email and SMS reminders for upcoming appointments
 */

import axios from 'axios'
import { prisma } from '@pecase/database'
import { generateReminderEmail } from './email.service'
import { generateReminderSMS } from './sms.service'

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

/**
 * Send reminder emails for appointments coming up in specified hours
 */
export async function sendReminderEmails(hoursUntil: 24 | 2) {
  try {
    console.log(`[Reminder] Starting email reminders for appointments in ${hoursUntil} hours`)

    // Find appointments that need reminders
    const now = new Date()
    const reminderTime = new Date(now.getTime() + hoursUntil * 60 * 60 * 1000)
    const reminderWindowStart = new Date(reminderTime.getTime() - 15 * 60 * 1000) // 15 min window before
    const reminderWindowEnd = new Date(reminderTime.getTime() + 15 * 60 * 1000) // 15 min window after

    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: reminderWindowStart,
          lte: reminderWindowEnd,
        },
        status: 'confirmed',
      },
      include: {
        service: true,
        staff: true,
        client: true,
        salon: true,
      },
    })

    if (appointments.length === 0) {
      console.log(`[Reminder] No appointments found for ${hoursUntil}h email reminder`)
      return
    }

    console.log(`[Reminder] Found ${appointments.length} appointments for ${hoursUntil}h reminder`)

    for (const apt of appointments) {
      try {
        // Check if reminder already sent (avoid duplicates within 30 min)
        const existingReminder = await prisma.reminderLog.findFirst({
          where: {
            appointmentId: apt.id,
            reminderType: 'email',
            hoursBefore: hoursUntil,
            sentAt: {
              gte: new Date(now.getTime() - 30 * 60 * 1000),
            },
          },
        })

        if (existingReminder) {
          console.log(`[Reminder] Email already sent for appointment ${apt.id}`)
          continue
        }

        // Format appointment details
        const appointmentDate = apt.startTime.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })

        const appointmentTime = apt.startTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })

        // Prepare email data
        const emailData = {
          customerName: apt.client.firstName,
          customerEmail: apt.client.email || '',
          serviceName: apt.service.name,
          staffName: `${apt.staff.firstName} ${apt.staff.lastName}`,
          appointmentTime,
          appointmentDate,
          salonName: apt.salon.name,
          salonPhone: apt.salon.phone,
        }

        // Generate email
        const { subject, htmlContent } = generateReminderEmail(emailData, hoursUntil)

        // Skip if no email
        if (!apt.client.email) {
          console.log(`[Reminder] No email address for client ${apt.client.id}`)
          continue
        }

        // Send via SendGrid
        if (!SENDGRID_API_KEY) {
          console.warn('[Reminder] SENDGRID_API_KEY not configured, skipping email send')
          continue
        }

        await axios.post(
          'https://api.sendgrid.com/v3/mail/send',
          {
            personalizations: [
              {
                to: [{ email: apt.client.email, name: apt.client.firstName }],
                subject,
              },
            ],
            from: { email: 'reminders@pecase.com', name: 'Pecase Reminders' },
            content: [
              {
                type: 'text/html',
                value: htmlContent,
              },
            ],
            reply_to: { email: apt.salon.email },
          },
          {
            headers: {
              Authorization: `Bearer ${SENDGRID_API_KEY}`,
              'Content-Type': 'application/json',
            },
          }
        )

        // Log successful send
        await prisma.reminderLog.create({
          data: {
            appointmentId: apt.id,
            reminderType: 'email',
            hoursBefore: hoursUntil,
            sentAt: new Date(),
            status: 'sent',
          },
        })

        console.log(`[Reminder] Email sent for appointment ${apt.id} to ${apt.client.email}`)
      } catch (appointmentError: any) {
        console.error(`[Reminder] Failed to send email for appointment ${apt.id}:`, appointmentError.message)

        // Log failure
        try {
          await prisma.reminderLog.create({
            data: {
              appointmentId: apt.id,
              reminderType: 'email',
              hoursBefore: hoursUntil,
              sentAt: new Date(),
              status: 'failed',
              errorMessage: appointmentError.message || 'Unknown error',
            },
          })
        } catch (logError) {
          console.error('[Reminder] Failed to log email error:', logError)
        }
      }
    }
  } catch (error: any) {
    console.error(`[Reminder] Error in sendReminderEmails(${hoursUntil}):`, error.message || error)
  }
}

/**
 * Send reminder SMS for appointments coming up in specified hours
 */
export async function sendReminderSMS(hoursUntil: 24 | 2) {
  try {
    console.log(`[SMS Reminder] Starting SMS reminders for appointments in ${hoursUntil} hours`)

    const now = new Date()
    const reminderTime = new Date(now.getTime() + hoursUntil * 60 * 60 * 1000)
    const reminderWindowStart = new Date(reminderTime.getTime() - 15 * 60 * 1000)
    const reminderWindowEnd = new Date(reminderTime.getTime() + 15 * 60 * 1000)

    const appointments = await prisma.appointment.findMany({
      where: {
        startTime: {
          gte: reminderWindowStart,
          lte: reminderWindowEnd,
        },
        status: 'confirmed',
      },
      include: {
        service: true,
        staff: true,
        client: true,
        salon: true,
      },
    })

    if (appointments.length === 0) {
      console.log(`[SMS Reminder] No appointments found for ${hoursUntil}h SMS reminder`)
      return
    }

    console.log(`[SMS Reminder] Found ${appointments.length} appointments for ${hoursUntil}h reminder`)

    for (const apt of appointments) {
      try {
        // Check SMS opt-out
        if (apt.client.communicationPreference === 'none' || apt.client.communicationPreference === 'email') {
          console.log(`[SMS Reminder] Client ${apt.client.id} opted out of SMS`)
          continue
        }

        // Check if SMS already sent (avoid duplicates within 30 min)
        const existingReminder = await prisma.reminderLog.findFirst({
          where: {
            appointmentId: apt.id,
            reminderType: 'sms',
            hoursBefore: hoursUntil,
            sentAt: {
              gte: new Date(now.getTime() - 30 * 60 * 1000),
            },
          },
        })

        if (existingReminder) {
          console.log(`[SMS Reminder] SMS already sent for appointment ${apt.id}`)
          continue
        }

        // Format appointment time
        const appointmentTime = apt.startTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })

        // Prepare SMS data
        const smsData = {
          customerName: apt.client.firstName,
          salonName: apt.salon.name,
          serviceName: apt.service.name,
          appointmentTime,
        }

        // Generate SMS message
        const messageBody = generateReminderSMS(smsData, hoursUntil)

        // Skip if no phone number
        if (!apt.client.phone) {
          console.log(`[SMS Reminder] No phone number for client ${apt.client.id}`)
          continue
        }

        // Skip if Twilio not configured
        if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
          console.warn('[SMS Reminder] Twilio credentials not configured, skipping SMS send')
          continue
        }

        // Send via Twilio
        const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')

        await axios.post(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
          `From=${TWILIO_PHONE_NUMBER}&To=${apt.client.phone}&Body=${encodeURIComponent(messageBody)}`,
          {
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        )

        // Log successful send
        await prisma.reminderLog.create({
          data: {
            appointmentId: apt.id,
            reminderType: 'sms',
            hoursBefore: hoursUntil,
            sentAt: new Date(),
            status: 'sent',
          },
        })

        console.log(`[SMS Reminder] SMS sent for appointment ${apt.id} to ${apt.client.phone}`)
      } catch (appointmentError: any) {
        console.error(`[SMS Reminder] Failed to send SMS for appointment ${apt.id}:`, appointmentError.message)

        // Log failure
        try {
          await prisma.reminderLog.create({
            data: {
              appointmentId: apt.id,
              reminderType: 'sms',
              hoursBefore: hoursUntil,
              sentAt: new Date(),
              status: 'failed',
              errorMessage: appointmentError.message || 'Unknown error',
            },
          })
        } catch (logError) {
          console.error('[SMS Reminder] Failed to log SMS error:', logError)
        }
      }
    }
  } catch (error: any) {
    console.error(`[SMS Reminder] Error in sendReminderSMS(${hoursUntil}):`, error.message || error)
  }
}

/**
 * Send confirmation email after successful booking
 */
export async function sendConfirmationEmail(
  customerEmail: string,
  customerName: string,
  serviceName: string,
  staffName: string,
  appointmentTime: string,
  appointmentDate: string,
  salonName: string,
  salonPhone: string,
  salonEmail: string
) {
  try {
    const emailData = {
      customerName,
      customerEmail,
      serviceName,
      staffName,
      appointmentTime,
      appointmentDate,
      salonName,
      salonPhone,
    }

    const { subject, htmlContent } = generateReminderEmail(emailData, 0) // 0 hours = confirmation

    if (!SENDGRID_API_KEY) {
      console.warn('[Confirmation] SENDGRID_API_KEY not configured, skipping confirmation email')
      return
    }

    await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
        personalizations: [
          {
            to: [{ email: customerEmail, name: customerName }],
            subject,
          },
        ],
        from: { email: 'bookings@pecase.com', name: salonName },
        content: [
          {
            type: 'text/html',
            value: htmlContent,
          },
        ],
        reply_to: { email: salonEmail },
      },
      {
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    console.log(`[Confirmation] Email sent to ${customerEmail}`)
  } catch (error: any) {
    console.error('[Confirmation] Failed to send confirmation email:', error.message || error)
  }
}
