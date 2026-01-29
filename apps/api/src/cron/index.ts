import { schedule, ScheduledTask } from 'node-cron';
import { runAppointmentReminders } from './appointmentReminders.js';
import logger from '../lib/logger.js';

// Store cron job references for potential cleanup
const cronJobs: Map<string, ScheduledTask> = new Map();

/**
 * Initialize and start all cron jobs
 */
export function startCronJobs(): void {
  logger.info('Starting cron jobs');

  // Appointment Reminders - Run every 15 minutes
  // This ensures reminders are sent in a timely manner while not overloading the system
  const appointmentReminderJob = schedule(
    '*/15 * * * *',
    async () => {
      try {
        await runAppointmentReminders();
      } catch (error) {
        logger.error({ error }, 'Appointment reminder job failed');
      }
    },
    {
      name: 'appointmentReminders',
      timezone: 'America/Chicago', // Default timezone, adjust as needed
    }
  );

  cronJobs.set('appointmentReminders', appointmentReminderJob);
  logger.info({ job: 'appointmentReminders', schedule: 'Every 15 minutes' }, 'Cron job registered');
}

/**
 * Stop all cron jobs gracefully
 */
export function stopCronJobs(): void {
  logger.info('Stopping all cron jobs');

  for (const [name, job] of cronJobs) {
    job.stop();
    logger.info({ job: name }, 'Cron job stopped');
  }

  cronJobs.clear();
  logger.info('All cron jobs stopped');
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

  logger.warn({ jobName }, 'Unknown cron job');
  return false;
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, stopping cron jobs');
  stopCronJobs();
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, stopping cron jobs');
  stopCronJobs();
});

export { runAppointmentReminders, triggerReminders } from './appointmentReminders.js';
