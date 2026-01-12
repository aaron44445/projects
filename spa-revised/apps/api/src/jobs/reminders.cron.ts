/**
 * Reminder Cron Jobs
 * Scheduled jobs for sending appointment reminders
 */

import cron from 'node-cron'
import { sendReminderEmails, sendReminderSMS } from '../services/reminder.service'

/**
 * Initialize all reminder cron jobs
 */
export function initializeReminderJobs() {
  console.log('[Cron] Initializing reminder jobs...')

  // 24-hour email reminders - runs daily at 8:00 AM
  const job24hEmail = cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] Starting 24-hour email reminders at', new Date().toISOString())
    await sendReminderEmails(24)
  })

  // 24-hour SMS reminders - runs daily at 8:05 AM (5 min after email)
  const job24hSMS = cron.schedule('5 8 * * *', async () => {
    console.log('[Cron] Starting 24-hour SMS reminders at', new Date().toISOString())
    await sendReminderSMS(24)
  })

  // 2-hour email reminders - runs every hour at minute 0
  const job2hEmail = cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Starting 2-hour email reminders at', new Date().toISOString())
    await sendReminderEmails(2)
  })

  // 2-hour SMS reminders - runs every hour at minute 5
  const job2hSMS = cron.schedule('5 * * * *', async () => {
    console.log('[Cron] Starting 2-hour SMS reminders at', new Date().toISOString())
    await sendReminderSMS(2)
  })

  console.log('[Cron] Reminder jobs initialized:')
  console.log('[Cron]   - 24-hour email: Daily at 8:00 AM')
  console.log('[Cron]   - 24-hour SMS: Daily at 8:05 AM')
  console.log('[Cron]   - 2-hour email: Every hour at :00')
  console.log('[Cron]   - 2-hour SMS: Every hour at :05')

  // Return job instances for testing/management
  return {
    job24hEmail,
    job24hSMS,
    job2hEmail,
    job2hSMS,
  }
}
