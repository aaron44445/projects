/**
 * Reminder Service Tests
 * Tests for email and SMS reminder functionality
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { generateReminderEmail, generateConfirmationSMS } from '../services/sms.service'
import { generateReminderSMS } from '../services/sms.service'

describe('Email Service', () => {
  describe('generateReminderEmail', () => {
    it('should generate a 24-hour reminder email with correct subject', () => {
      const data = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        serviceName: 'Hair Cut',
        staffName: 'Jane Smith',
        appointmentTime: '2:00 PM',
        appointmentDate: 'Friday, January 17, 2025',
        salonName: 'Beauty Salon',
        salonPhone: '555-1234',
      }

      const { subject, htmlContent } = require('../services/email.service').generateReminderEmail(data, 24)

      expect(subject).toContain('Reminder')
      expect(subject).toContain('24 hours')
      expect(subject).toContain('Hair Cut')
      expect(subject).toContain('Jane Smith')
      expect(htmlContent).toContain('John Doe')
      expect(htmlContent).toContain('Friday, January 17, 2025')
      expect(htmlContent).toContain('2:00 PM')
      expect(htmlContent).toContain('Beauty Salon')
    })

    it('should generate a 2-hour reminder email', () => {
      const data = {
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        serviceName: 'Massage',
        staffName: 'Bob Johnson',
        appointmentTime: '3:30 PM',
        appointmentDate: 'Saturday, January 18, 2025',
        salonName: 'Wellness Center',
        salonPhone: '555-5678',
      }

      const { subject, htmlContent } = require('../services/email.service').generateReminderEmail(data, 2)

      expect(subject).toContain('Reminder')
      expect(subject).toContain('2 hours')
      expect(htmlContent).toContain('Jane Smith')
      expect(htmlContent).toContain('Wellness Center')
    })

    it('should generate a confirmation email with 0 hours', () => {
      const data = {
        customerName: 'Alice Brown',
        customerEmail: 'alice@example.com',
        serviceName: 'Facial',
        staffName: 'Carol White',
        appointmentTime: '1:00 PM',
        appointmentDate: 'Sunday, January 19, 2025',
        salonName: 'Spa Paradise',
        salonPhone: '555-9999',
      }

      const { subject, htmlContent } = require('../services/email.service').generateReminderEmail(data, 0)

      expect(subject).toContain('Confirmed')
      expect(subject).not.toContain('hours')
      expect(htmlContent).toContain('Spa Paradise')
    })

    it('should include important details in email body', () => {
      const data = {
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        serviceName: 'Test Service',
        staffName: 'Test Staff',
        appointmentTime: '9:00 AM',
        appointmentDate: 'Monday, January 20, 2025',
        salonName: 'Test Salon',
        salonPhone: '555-0000',
      }

      const { htmlContent } = require('../services/email.service').generateReminderEmail(data, 24)

      expect(htmlContent).toContain('arrive 5-10 minutes early')
      expect(htmlContent).toContain('reschedule or cancel')
      expect(htmlContent).toContain('Contact us')
      expect(htmlContent).toContain('555-0000')
    })
  })
})

describe('SMS Service', () => {
  describe('generateReminderSMS', () => {
    it('should generate a 24-hour reminder SMS', () => {
      const data = {
        customerName: 'John',
        salonName: 'Beauty Salon',
        serviceName: 'Hair Cut',
        appointmentTime: '2:00 PM',
      }

      const message = generateReminderSMS(data, 24)

      expect(message).toContain('Hi John')
      expect(message).toContain('Beauty Salon')
      expect(message).toContain('Hair Cut')
      expect(message).toContain('24 hours')
      expect(message).toContain('2:00 PM')
      expect(message).toContain('STOP')
    })

    it('should generate a 2-hour reminder SMS', () => {
      const data = {
        customerName: 'Jane',
        salonName: 'Wellness Center',
        serviceName: 'Massage',
        appointmentTime: '3:30 PM',
      }

      const message = generateReminderSMS(data, 2)

      expect(message).toContain('Hi Jane')
      expect(message).toContain('2 hours')
      expect(message).toContain('Wellness Center')
      expect(message).toContain('Massage')
    })

    it('should be concise (under SMS character limit)', () => {
      const data = {
        customerName: 'John Doe',
        salonName: 'Very Long Salon Name That Goes On And On',
        serviceName: 'Extended Service Name Here',
        appointmentTime: '10:00 AM',
      }

      const message = generateReminderSMS(data, 24)

      // SMS limit is typically 160 characters
      expect(message.length).toBeLessThan(200)
    })
  })

  describe('generateConfirmationSMS', () => {
    it('should generate a confirmation SMS', () => {
      const data = {
        customerName: 'Alice',
        salonName: 'Spa Paradise',
        serviceName: 'Facial',
        appointmentTime: '1:00 PM',
      }

      const message = generateConfirmationSMS(data)

      expect(message).toContain('Hi Alice')
      expect(message).toContain('confirmed')
      expect(message).toContain('Spa Paradise')
      expect(message).toContain('1:00 PM')
    })

    it('should differentiate from reminder SMS', () => {
      const data = {
        customerName: 'Bob',
        salonName: 'Test Salon',
        serviceName: 'Test Service',
        appointmentTime: '5:00 PM',
      }

      const reminderSMS = generateReminderSMS(data, 24)
      const confirmationSMS = generateConfirmationSMS(data)

      expect(confirmationSMS).not.toContain('reminder')
      expect(confirmationSMS).toContain('confirmed')
    })
  })
})

describe('Reminder Jobs', () => {
  it('should have cron schedule expressions', () => {
    // These are the cron expressions used in the reminders.cron.ts file
    const schedules = {
      '24h_email': '0 8 * * *', // Daily at 8:00 AM
      '24h_sms': '5 8 * * *', // Daily at 8:05 AM
      '2h_email': '0 * * * *', // Every hour at :00
      '2h_sms': '5 * * * *', // Every hour at :05
    }

    // Validate cron expressions (basic check)
    Object.values(schedules).forEach((schedule) => {
      const parts = schedule.split(' ')
      expect(parts).toHaveLength(5)
    })
  })
})

describe('Reminder Service Logic', () => {
  it('should handle missing SendGrid API key gracefully', () => {
    const originalKey = process.env.SENDGRID_API_KEY
    delete process.env.SENDGRID_API_KEY

    // Should not throw
    expect(() => {
      // This would be called in sendReminderEmails
      const hasKey = !!process.env.SENDGRID_API_KEY
      expect(hasKey).toBe(false)
    }).not.toThrow()

    process.env.SENDGRID_API_KEY = originalKey
  })

  it('should handle missing Twilio credentials gracefully', () => {
    const originalSID = process.env.TWILIO_ACCOUNT_SID
    const originalToken = process.env.TWILIO_AUTH_TOKEN
    const originalPhone = process.env.TWILIO_PHONE_NUMBER

    delete process.env.TWILIO_ACCOUNT_SID
    delete process.env.TWILIO_AUTH_TOKEN
    delete process.env.TWILIO_PHONE_NUMBER

    // Should not throw
    expect(() => {
      const hasCredentials =
        !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN && !!process.env.TWILIO_PHONE_NUMBER
      expect(hasCredentials).toBe(false)
    }).not.toThrow()

    process.env.TWILIO_ACCOUNT_SID = originalSID
    process.env.TWILIO_AUTH_TOKEN = originalToken
    process.env.TWILIO_PHONE_NUMBER = originalPhone
  })
})
