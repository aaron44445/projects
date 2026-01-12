/**
 * SMS Service
 * Generates SMS messages for appointment reminders and confirmations
 */

export interface ReminderSMSData {
  customerName: string
  salonName: string
  serviceName: string
  appointmentTime: string
}

/**
 * Generate a reminder SMS message
 */
export function generateReminderSMS(data: ReminderSMSData, hoursUntil: number): string {
  if (hoursUntil === 0) {
    return `Hi ${data.customerName}, your appointment at ${data.salonName} is confirmed for ${data.appointmentTime}. See you soon!`
  }

  return `Hi ${data.customerName}, reminder: Your ${data.serviceName} at ${data.salonName} is in ${hoursUntil} hours at ${data.appointmentTime}. Reply STOP to unsubscribe.`
}

/**
 * Generate a confirmation SMS message
 */
export function generateConfirmationSMS(data: ReminderSMSData): string {
  return `Hi ${data.customerName}, your appointment at ${data.salonName} is confirmed for ${data.appointmentTime}. See you soon!`
}
