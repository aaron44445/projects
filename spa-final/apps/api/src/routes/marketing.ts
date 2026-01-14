import { Router, Request, Response } from 'express';
import { prisma } from '@peacase/database';
import { authenticate, authorize } from '../middleware/auth.js';
import { sendBulkEmail, marketingCampaignEmail } from '../services/email.js';
import { env } from '../lib/env.js';
import {
  createMarketingCampaignSchema,
  updateMarketingCampaignSchema
} from '../validation/schemas.js';

const router = Router();

// GET /api/v1/marketing/campaigns
router.get('/campaigns', authenticate, async (req: Request, res: Response) => {
  const { status } = req.query;

  const campaigns = await prisma.marketingCampaign.findMany({
    where: {
      salonId: req.user!.salonId,
      ...(status && { status: status as string }),
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: campaigns });
});

// POST /api/v1/marketing/campaigns
router.post('/campaigns', authenticate, authorize('admin', 'manager'), async (req: Request, res: Response) => {
  // Validate request body
  const validationResult = createMarketingCampaignSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid campaign data',
        details: validationResult.error.errors,
      },
    });
  }

  const { name, type, subjectLine, message, audienceFilter, scheduledFor } = validationResult.data;

  const campaign = await prisma.marketingCampaign.create({
    data: {
      salonId: req.user!.salonId,
      name,
      type,
      subjectLine,
      message,
      audienceFilter,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
    },
  });

  res.status(201).json({ success: true, data: campaign });
});

// PATCH /api/v1/marketing/campaigns/:id
router.patch('/campaigns/:id', authenticate, authorize('admin', 'manager'), async (req: Request, res: Response) => {
  // Validate request body
  const validationResult = updateMarketingCampaignSchema.safeParse(req.body);

  if (!validationResult.success) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid campaign data',
        details: validationResult.error.errors,
      },
    });
  }

  const campaign = await prisma.marketingCampaign.findFirst({
    where: { id: req.params.id, salonId: req.user!.salonId },
  });

  if (!campaign) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
  }

  // Only update whitelisted fields from validated data
  const updated = await prisma.marketingCampaign.update({
    where: { id: req.params.id },
    data: validationResult.data,
  });

  res.json({ success: true, data: updated });
});

// POST /api/v1/marketing/campaigns/:id/send - Send campaign via SendGrid
router.post('/campaigns/:id/send', authenticate, authorize('admin', 'manager'), async (req: Request, res: Response) => {
  const campaign = await prisma.marketingCampaign.findFirst({
    where: { id: req.params.id, salonId: req.user!.salonId },
    include: { salon: true },
  });

  if (!campaign) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
  }

  if (campaign.status === 'sent') {
    return res.status(400).json({ success: false, error: { code: 'ALREADY_SENT', message: 'Campaign already sent' } });
  }

  // Get recipients based on audience filter
  let whereFilter: any = { salonId: req.user!.salonId, optedInMarketing: true, email: { not: null } };

  if (campaign.audienceFilter) {
    const filter = JSON.parse(campaign.audienceFilter);
    if (filter.hasAppointmentInLast) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - filter.hasAppointmentInLast);
      whereFilter.appointments = { some: { createdAt: { gte: daysAgo } } };
    }
    if (filter.noAppointmentInLast) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - filter.noAppointmentInLast);
      whereFilter.appointments = { none: { createdAt: { gte: daysAgo } } };
    }
  }

  const recipients = await prisma.client.findMany({
    where: whereFilter,
    select: { email: true },
  });

  const recipientEmails = recipients.map(r => r.email!).filter(Boolean);

  if (recipientEmails.length === 0) {
    return res.status(400).json({ success: false, error: { code: 'NO_RECIPIENTS', message: 'No eligible recipients' } });
  }

  // Send emails via SendGrid
  const html = marketingCampaignEmail({
    content: campaign.message,
    salonName: campaign.salon.name,
    unsubscribeUrl: `${env.CORS_ORIGIN}/unsubscribe`,
  });

  const results = await sendBulkEmail({
    recipients: recipientEmails,
    subject: campaign.subjectLine || campaign.name,
    html,
  });

  // Update campaign status
  const updated = await prisma.marketingCampaign.update({
    where: { id: req.params.id },
    data: {
      status: 'sent',
      sentAt: new Date(),
      recipientsCount: results.sent,
    },
  });

  res.json({ success: true, data: { ...updated, sent: results.sent, failed: results.failed } });
});

// DELETE /api/v1/marketing/campaigns/:id
router.delete('/campaigns/:id', authenticate, authorize('admin', 'manager'), async (req: Request, res: Response) => {
  const campaign = await prisma.marketingCampaign.findFirst({
    where: { id: req.params.id, salonId: req.user!.salonId },
  });

  if (!campaign) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
  }

  await prisma.marketingCampaign.delete({ where: { id: req.params.id } });

  res.json({ success: true, data: { deleted: true } });
});

export { router as marketingRouter };
