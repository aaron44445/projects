import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '@peacase/database';
import { authenticate, authorize } from '../middleware/auth.js';
import { requireAddon } from '../middleware/subscription.js';
import { sendBulkEmail, marketingCampaignEmail } from '../services/email.js';
import { env } from '../lib/env.js';
import { asyncHandler } from '../lib/errorUtils.js';
import logger from '../lib/logger.js';
import { withSalonId } from '../lib/prismaUtils.js';

const router = Router();

// All marketing routes require the marketing add-on
router.use(authenticate, requireAddon('marketing'));

// GET /api/v1/marketing/campaigns
router.get('/campaigns', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;

  const where: Prisma.MarketingCampaignWhereInput = {
    ...withSalonId(req.user!.salonId),
    ...(status && { status: status as string }),
  };

  const campaigns = await prisma.marketingCampaign.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, data: campaigns });
}));

// POST /api/v1/marketing/campaigns
router.post('/campaigns', authenticate, authorize('admin', 'manager'), asyncHandler(async (req: Request, res: Response) => {
  const { name, type, subjectLine, message, audienceFilter, scheduledFor } = req.body;

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
}));

// PATCH /api/v1/marketing/campaigns/:id
router.patch('/campaigns/:id', authenticate, authorize('admin', 'manager'), asyncHandler(async (req: Request, res: Response) => {
  const where: Prisma.MarketingCampaignWhereInput = {
    id: req.params.id,
    ...withSalonId(req.user!.salonId),
  };

  const campaign = await prisma.marketingCampaign.findFirst({ where });

  if (!campaign) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
  }

  const updated = await prisma.marketingCampaign.update({
    where: { id: req.params.id },
    data: req.body,
  });

  res.json({ success: true, data: updated });
}));

// POST /api/v1/marketing/campaigns/:id/send - Send campaign via SendGrid
router.post('/campaigns/:id/send', authenticate, authorize('admin', 'manager'), asyncHandler(async (req: Request, res: Response) => {
  const campaignWhere: Prisma.MarketingCampaignWhereInput = {
    id: req.params.id,
    ...withSalonId(req.user!.salonId),
  };

  const campaign = await prisma.marketingCampaign.findFirst({
    where: campaignWhere,
    include: { salon: true },
  });

  if (!campaign) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
  }

  if (campaign.status === 'sent') {
    return res.status(400).json({ success: false, error: { code: 'ALREADY_SENT', message: 'Campaign already sent' } });
  }

  // Get recipients based on audience filter
  const clientWhere: Prisma.ClientWhereInput = {
    ...withSalonId(req.user!.salonId),
    optedInMarketing: true,
    email: { not: null },
  };

  if (campaign.audienceFilter) {
    const filter = JSON.parse(campaign.audienceFilter);
    if (filter.hasAppointmentInLast) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - filter.hasAppointmentInLast);
      clientWhere.appointments = { some: { startTime: { gte: daysAgo } } };
    }
    if (filter.noAppointmentInLast) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - filter.noAppointmentInLast);
      clientWhere.appointments = { none: { startTime: { gte: daysAgo } } };
    }
  }

  const recipients = await prisma.client.findMany({
    where: clientWhere,
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
}));

// DELETE /api/v1/marketing/campaigns/:id
router.delete('/campaigns/:id', authenticate, authorize('admin', 'manager'), asyncHandler(async (req: Request, res: Response) => {
  const deleteWhere: Prisma.MarketingCampaignWhereInput = {
    id: req.params.id,
    ...withSalonId(req.user!.salonId),
  };

  const campaign = await prisma.marketingCampaign.findFirst({ where: deleteWhere });

  if (!campaign) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } });
  }

  await prisma.marketingCampaign.delete({ where: { id: req.params.id } });

  res.json({ success: true, data: { deleted: true } });
}));

export { router as marketingRouter };
