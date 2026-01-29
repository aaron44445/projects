import { Router, Request, Response } from 'express';
import { Prisma, prisma } from '@peacase/database';
import { authenticate } from '../middleware/auth.js';
import { requireAddon } from '../middleware/subscription.js';
import { randomBytes } from 'crypto';
import { createGiftCardCheckoutSession } from '../services/payments.js';
import { sendEmail, giftCardEmail } from '../services/email.js';
import { env } from '../lib/env.js';
import { asyncHandler } from '../lib/errorUtils.js';
import logger from '../lib/logger.js';
import { withSalonId } from '../lib/prismaUtils.js';

const router = Router();

// All gift card routes require the gift_cards add-on
router.use(authenticate, requireAddon('gift_cards'));

function generateGiftCardCode(): string {
  return randomBytes(8).toString('hex').toUpperCase().match(/.{1,4}/g)!.join('-');
}

// GET /api/v1/gift-cards
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.query;

  const where: Prisma.GiftCardWhereInput = {
    ...withSalonId(req.user!.salonId),
    ...(status && { status: status as string }),
  };

  const giftCards = await prisma.giftCard.findMany({
    where,
    orderBy: { purchasedAt: 'desc' },
  });

  res.json({ success: true, data: giftCards });
}));

// POST /api/v1/gift-cards - Create gift card (admin creates directly)
router.post('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { amount, purchaserEmail, recipientEmail, recipientName, message, expiresAt } = req.body;

  const salon = await prisma.salon.findUnique({ where: { id: req.user!.salonId } });
  const code = generateGiftCardCode();

  const giftCard = await prisma.giftCard.create({
    data: {
      ...withSalonId(req.user!.salonId),
      code,
      initialAmount: amount,
      balance: amount,
      purchaserEmail,
      recipientEmail,
      recipientName,
      message,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });

  // Send email to recipient
  if (recipientEmail && salon) {
    await sendEmail({
      to: recipientEmail,
      subject: `You've received a gift card from ${salon.name}!`,
      html: giftCardEmail({
        recipientName: recipientName || 'Friend',
        senderName: purchaserEmail || 'Someone special',
        amount,
        code,
        message,
        salonName: salon.name,
        expiresAt: expiresAt ? new Date(expiresAt).toLocaleDateString() : undefined,
      }),
    });
  }

  res.status(201).json({ success: true, data: giftCard });
}));

// POST /api/v1/gift-cards/checkout - Create Stripe checkout session
router.post('/checkout', asyncHandler(async (req: Request, res: Response) => {
  const { amount, recipientEmail, recipientName, senderEmail, message, salonId } = req.body;

  if (!amount || amount < 10 || amount > 500) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_AMOUNT', message: 'Amount must be between $10 and $500' },
    });
  }

  const salon = await prisma.salon.findUnique({ where: { id: salonId } });
  if (!salon) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Salon not found' } });
  }

  const session = await createGiftCardCheckoutSession({
    amount: Math.round(amount * 100),
    recipientEmail,
    recipientName,
    senderEmail,
    message,
    salonId,
    successUrl: `${env.CORS_ORIGIN}/gift-cards/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${env.CORS_ORIGIN}/gift-cards`,
  });

  res.json({ success: true, data: { checkoutUrl: session.url, sessionId: session.id } });
}));

// GET /api/v1/gift-cards/:code/balance
router.get('/:code/balance', asyncHandler(async (req: Request, res: Response) => {
  const giftCard = await prisma.giftCard.findUnique({
    where: { code: req.params.code },
  });

  if (!giftCard || giftCard.status !== 'active') {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Gift card not found or inactive' } });
  }

  res.json({ success: true, data: { balance: giftCard.balance, expiresAt: giftCard.expiresAt } });
}));

// POST /api/v1/gift-cards/:code/redeem
router.post('/:code/redeem', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { amount } = req.body;

  const giftCard = await prisma.giftCard.findUnique({
    where: { code: req.params.code },
  });

  if (!giftCard || giftCard.status !== 'active') {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Gift card not found' } });
  }

  if (giftCard.balance < amount) {
    return res.status(400).json({ success: false, error: { code: 'INSUFFICIENT_BALANCE', message: 'Insufficient balance' } });
  }

  const newBalance = giftCard.balance - amount;
  const updated = await prisma.giftCard.update({
    where: { code: req.params.code },
    data: {
      balance: newBalance,
      status: newBalance === 0 ? 'redeemed' : 'active',
      redeemedAt: newBalance === 0 ? new Date() : null,
    },
  });

  res.json({ success: true, data: updated });
}));

export { router as giftCardsRouter };
