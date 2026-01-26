import { schedule, ScheduledTask } from 'node-cron';
import { runAppointmentReminders } from './appointmentReminders.js';

// Store cron job references for potential cleanup
const cronJobs: Map<string, ScheduledTask> = new Map();

/**
 * Initialize and start all cron jobs
 */
export function startCronJobs(): void {
  console.log('\n============================================');
  console.log('Starting Cron Jobs');
  console.log('============================================');

  // Appointment Reminders - Run every 15 minutes
  // This ensures reminders are sent in a timely manner while not overloading the system
  const appointmentReminderJob = schedule(
    '*/15 * * * *',
    async () => {
      try {
        await runAppointmentReminders();
      } catch (error) {
        console.error('[Cron] Appointment reminder job failed:', error);
      }
    },
    {
      name: 'appointmentReminders',
      timezone: 'America/Chicago', // Default timezone, adjust as needed
    }
  );

  cronJobs.set('appointmentReminders', appointmentReminderJob);
  console.log('  - Appointment reminders: Every 15 minutes');

  // Add more cron jobs here as needed
  // Example: Daily cleanup job at 3 AM
  // const cleanupJob = schedule('0 3 * * *', async () => {
  //   // cleanup logic
  // }, { name: 'cleanup' });
  // cronJobs.set('cleanup', cleanupJob);

  console.log('============================================\n');
}

/**
 * Stop all cron jobs gracefully
 */
export function stopCronJobs(): void {
  console.log('[Cron] Stopping all cron jobs...');

  for (const [name, job] of cronJobs) {
    job.stop();
    console.log(`[Cron] Stopped: ${name}`);
  }

  cronJobs.clear();
  console.log('[Cron] All cron jobs stopped');
}

/**
 * Get status of all cron jobs
 */
export function getCronJobStatus(): Record<string, boolean> {
  const status: Record<string, boolean> = {};

  for (const [name] of cronJobs) {
    status[name] = true; // Job exists means it's scheduled
  }

  return status;
}

/**
 * Manually trigger a specific cron job
 */
export async function triggerCronJob(jobName: string): Promise<boolean> {
  if (jobName === 'appointmentReminders') {
    await runAppointmentReminders();
    return true;
  }

  console.warn(`[Cron] Unknown job: ${jobName}`);
  return false;
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Cron] Received SIGTERM, stopping cron jobs...');
  stopCronJobs();
});

process.on('SIGINT', () => {
  console.log('[Cron] Received SIGINT, stopping cron jobs...');
  stopCronJobs();
});

export { runAppointmentReminders, triggerReminders } from './appointmentReminders.js';
