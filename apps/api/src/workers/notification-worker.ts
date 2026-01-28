import { prisma } from '@peacase/database';
import { sendNotification, NotificationPayload } from '../services/notifications.js';

const POLL_INTERVAL_MS = 5000; // 5 seconds
const BATCH_SIZE = 10;
const STALE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Process pending notification jobs from the database queue.
 * Uses raw SQL with FOR UPDATE SKIP LOCKED for safe concurrent processing.
 */
async function processJobs(): Promise<void> {
  try {
    // First, recover any stale "processing" jobs (crashed worker scenario)
    await recoverStaleJobs();

    // Fetch pending jobs using raw SQL for SKIP LOCKED support
    // Note: Prisma doesn't support FOR UPDATE SKIP LOCKED natively
    const jobs = await prisma.$queryRaw<Array<{
      id: string;
      salon_id: string;
      client_id: string;
      appointment_id: string | null;
      type: string;
      payload: string;
      status: string;
      attempts: number;
      max_attempts: number;
    }>>`
      SELECT id, salon_id, client_id, appointment_id, type, payload, status, attempts, max_attempts
      FROM notification_jobs
      WHERE status = 'pending'
      AND attempts < max_attempts
      ORDER BY created_at ASC
      LIMIT ${BATCH_SIZE}
      FOR UPDATE SKIP LOCKED
    `;

    if (jobs.length === 0) {
      return; // No work to do
    }

    console.log(`[WORKER] Processing ${jobs.length} notification job(s)`);

    for (const job of jobs) {
      await processJob(job);
    }
  } catch (error) {
    console.error('[WORKER] Error in processJobs:', error);
  }
}

/**
 * Process a single notification job
 */
async function processJob(job: {
  id: string;
  salon_id: string;
  client_id: string;
  appointment_id: string | null;
  type: string;
  payload: string;
  attempts: number;
  max_attempts: number;
}): Promise<void> {
  try {
    // Mark as processing
    await prisma.notificationJob.update({
      where: { id: job.id },
      data: {
        status: 'processing',
        attempts: job.attempts + 1,
      },
    });

    // Parse payload and send notification
    const payload: NotificationPayload = JSON.parse(job.payload);

    // Ensure payload has required fields
    const notificationPayload: NotificationPayload = {
      salonId: job.salon_id,
      clientId: job.client_id,
      appointmentId: job.appointment_id || undefined,
      type: payload.type || job.type as NotificationPayload['type'],
      channels: payload.channels || ['email', 'sms'],
      data: payload.data,
    };

    const result = await sendNotification(notificationPayload);

    if (result.status === 'sent') {
      // Mark complete
      await prisma.notificationJob.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          processedAt: new Date(),
        },
      });
      console.log(`[WORKER] Job ${job.id} completed successfully`);
    } else {
      // Notification service returned failure
      const isFinalAttempt = job.attempts + 1 >= job.max_attempts;
      await prisma.notificationJob.update({
        where: { id: job.id },
        data: {
          status: isFinalAttempt ? 'failed' : 'pending',
          error: 'Notification service returned failed status',
        },
      });
      console.log(`[WORKER] Job ${job.id} failed (attempt ${job.attempts + 1}/${job.max_attempts})`);
    }
  } catch (error: unknown) {
    console.error(`[WORKER] Error processing job ${job.id}:`, error);

    const isFinalAttempt = job.attempts + 1 >= job.max_attempts;
    const errorMessage = error instanceof Error ? error.message : String(error);

    await prisma.notificationJob.update({
      where: { id: job.id },
      data: {
        status: isFinalAttempt ? 'failed' : 'pending',
        error: errorMessage,
      },
    });
  }
}

/**
 * Recover jobs that are stuck in "processing" status (crashed worker)
 */
async function recoverStaleJobs(): Promise<void> {
  const staleThreshold = new Date(Date.now() - STALE_TIMEOUT_MS);

  const result = await prisma.notificationJob.updateMany({
    where: {
      status: 'processing',
      updatedAt: { lt: staleThreshold },
    },
    data: {
      status: 'pending',
    },
  });

  if (result.count > 0) {
    console.log(`[WORKER] Recovered ${result.count} stale job(s)`);
  }
}

/**
 * Start the notification worker polling loop.
 * Should be called once when the server starts.
 */
export function startNotificationWorker(): void {
  console.log('[WORKER] Notification worker started (poll interval: 5s)');

  // Initial poll
  processJobs();

  // Continuous polling
  setInterval(() => {
    processJobs();
  }, POLL_INTERVAL_MS);
}

/**
 * Clean up old completed jobs (call this from a daily cron)
 */
export async function cleanupOldJobs(daysToKeep = 7): Promise<number> {
  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

  const result = await prisma.notificationJob.deleteMany({
    where: {
      status: 'completed',
      processedAt: { lt: cutoffDate },
    },
  });

  console.log(`[WORKER] Cleaned up ${result.count} old completed job(s)`);
  return result.count;
}
