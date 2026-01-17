# Phase 2: API Key Management Endpoints - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build API endpoints for salon owners to configure and test their SendGrid/Twilio API keys.

**Architecture:** RESTful API endpoints with role-based access (owner/admin only), key validation, and test functionality.

**Tech Stack:** Express.js, Prisma ORM, Zod validation, Vitest for testing

---

## Task 1: Create Integrations Routes File

**Files:**
- Create: `apps/api/src/routes/integrations.ts`

**Implementation:**

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@peacase/database';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { encrypt, decrypt, safeDecrypt } from '../lib/encryption.js';
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import { env } from '../lib/env.js';

const router = Router();

// All routes require authentication and owner/admin role
router.use(requireAuth);
router.use(requireRole(['owner', 'admin']));

// GET /api/integrations/status - Get current integration status
router.get('/status', async (req, res) => {
  try {
    const salon = await prisma.salon.findUnique({
      where: { id: req.user!.salonId },
      select: {
        marketingAddonEnabled: true,
        marketingAddonSuspended: true,
        marketingAddonEnabledAt: true,
        sendgridValidated: true,
        sendgridFromEmail: true,
        sendgridLastValidatedAt: true,
        twilioValidated: true,
        twilioPhoneNumber: true,
        twilioLastValidatedAt: true,
      },
    });

    if (!salon) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    // Calculate grace period (7 days from enabledAt)
    let gracePeriodEnd = null;
    let inGracePeriod = false;
    if (salon.marketingAddonEnabledAt) {
      gracePeriodEnd = new Date(salon.marketingAddonEnabledAt);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);
      inGracePeriod = new Date() < gracePeriodEnd;
    }

    res.json({
      addonEnabled: salon.marketingAddonEnabled,
      addonSuspended: salon.marketingAddonSuspended,
      gracePeriodEnd: gracePeriodEnd?.toISOString() || null,
      inGracePeriod,
      sendgrid: {
        configured: salon.sendgridValidated,
        fromEmail: salon.sendgridFromEmail,
        lastValidated: salon.sendgridLastValidatedAt?.toISOString() || null,
      },
      twilio: {
        configured: salon.twilioValidated,
        phoneNumber: salon.twilioPhoneNumber,
        lastValidated: salon.twilioLastValidatedAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error('Error fetching integration status:', error);
    res.status(500).json({ error: 'Failed to fetch integration status' });
  }
});

export default router;
```

---

## Task 2: Add SendGrid Endpoints

**Add to:** `apps/api/src/routes/integrations.ts`

**Validation schemas:**

```typescript
const sendgridSchema = z.object({
  apiKey: z.string().min(1, 'API key is required').startsWith('SG.', 'Invalid SendGrid API key format'),
  fromEmail: z.string().email('Invalid email format'),
});

const sendgridTestSchema = z.object({
  apiKey: z.string().min(1, 'API key is required').startsWith('SG.', 'Invalid SendGrid API key format'),
});
```

**Endpoints:**

```typescript
// PUT /api/integrations/sendgrid - Save SendGrid configuration
router.put('/sendgrid', async (req, res) => {
  try {
    const { apiKey, fromEmail } = sendgridSchema.parse(req.body);

    // Test the key first
    const testClient = require('@sendgrid/mail');
    testClient.setApiKey(apiKey);

    try {
      // Send a test email to verify the key works
      await testClient.send({
        to: req.user!.email,
        from: fromEmail,
        subject: 'Peacase: SendGrid Integration Verified',
        text: 'This is a test email from Peacase. Your SendGrid integration is working!',
        html: '<p>This is a test email from Peacase. Your SendGrid integration is working!</p>',
      });
    } catch (sendError: any) {
      return res.status(400).json({
        error: 'SendGrid API key validation failed',
        details: sendError.message || 'Unable to send test email'
      });
    }

    // Encrypt and save
    const encryptedKey = encrypt(apiKey);

    await prisma.salon.update({
      where: { id: req.user!.salonId },
      data: {
        sendgridApiKeyEncrypted: encryptedKey,
        sendgridFromEmail: fromEmail,
        sendgridValidated: true,
        sendgridLastValidatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'SendGrid configuration saved and verified',
      fromEmail,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error saving SendGrid config:', error);
    res.status(500).json({ error: 'Failed to save SendGrid configuration' });
  }
});

// POST /api/integrations/sendgrid/test - Test SendGrid key without saving
router.post('/sendgrid/test', async (req, res) => {
  try {
    const { apiKey } = sendgridTestSchema.parse(req.body);

    const testClient = require('@sendgrid/mail');
    testClient.setApiKey(apiKey);

    try {
      await testClient.send({
        to: req.user!.email,
        from: req.body.fromEmail || 'test@peacase.com',
        subject: 'Peacase: SendGrid Test',
        text: 'This is a test email from Peacase. Your SendGrid integration is working!',
      });

      res.json({ success: true, message: 'Test email sent successfully' });
    } catch (sendError: any) {
      res.status(400).json({
        success: false,
        error: sendError.message || 'Failed to send test email'
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Test failed' });
  }
});

// DELETE /api/integrations/sendgrid - Remove SendGrid configuration
router.delete('/sendgrid', async (req, res) => {
  try {
    await prisma.salon.update({
      where: { id: req.user!.salonId },
      data: {
        sendgridApiKeyEncrypted: null,
        sendgridFromEmail: null,
        sendgridValidated: false,
        sendgridLastValidatedAt: null,
      },
    });

    res.json({ success: true, message: 'SendGrid configuration removed' });
  } catch (error) {
    console.error('Error removing SendGrid config:', error);
    res.status(500).json({ error: 'Failed to remove SendGrid configuration' });
  }
});
```

---

## Task 3: Add Twilio Endpoints

**Add validation schemas:**

```typescript
const twilioSchema = z.object({
  accountSid: z.string().min(1).startsWith('AC', 'Invalid Twilio Account SID format'),
  authToken: z.string().min(1, 'Auth token is required'),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format (E.164)'),
});

const twilioTestSchema = z.object({
  accountSid: z.string().min(1).startsWith('AC', 'Invalid Twilio Account SID format'),
  authToken: z.string().min(1, 'Auth token is required'),
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format'),
  testPhoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid test phone number'),
});
```

**Endpoints:**

```typescript
// PUT /api/integrations/twilio - Save Twilio configuration
router.put('/twilio', async (req, res) => {
  try {
    const { accountSid, authToken, phoneNumber } = twilioSchema.parse(req.body);

    // Test the credentials
    const client = twilio(accountSid, authToken);

    try {
      // Verify account by fetching account info
      await client.api.accounts(accountSid).fetch();
    } catch (twilioError: any) {
      return res.status(400).json({
        error: 'Twilio credentials validation failed',
        details: twilioError.message || 'Invalid credentials'
      });
    }

    // Encrypt and save
    const encryptedSid = encrypt(accountSid);
    const encryptedToken = encrypt(authToken);

    await prisma.salon.update({
      where: { id: req.user!.salonId },
      data: {
        twilioAccountSidEncrypted: encryptedSid,
        twilioAuthTokenEncrypted: encryptedToken,
        twilioPhoneNumber: phoneNumber,
        twilioValidated: true,
        twilioLastValidatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Twilio configuration saved and verified',
      phoneNumber,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Error saving Twilio config:', error);
    res.status(500).json({ error: 'Failed to save Twilio configuration' });
  }
});

// POST /api/integrations/twilio/test - Test Twilio credentials
router.post('/twilio/test', async (req, res) => {
  try {
    const { accountSid, authToken, phoneNumber, testPhoneNumber } = twilioTestSchema.parse(req.body);

    const client = twilio(accountSid, authToken);

    try {
      await client.messages.create({
        body: 'Peacase: Your Twilio SMS integration is working!',
        from: phoneNumber,
        to: testPhoneNumber,
      });

      res.json({ success: true, message: 'Test SMS sent successfully' });
    } catch (twilioError: any) {
      res.status(400).json({
        success: false,
        error: twilioError.message || 'Failed to send test SMS'
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    res.status(500).json({ error: 'Test failed' });
  }
});

// DELETE /api/integrations/twilio - Remove Twilio configuration
router.delete('/twilio', async (req, res) => {
  try {
    await prisma.salon.update({
      where: { id: req.user!.salonId },
      data: {
        twilioAccountSidEncrypted: null,
        twilioAuthTokenEncrypted: null,
        twilioPhoneNumber: null,
        twilioValidated: false,
        twilioLastValidatedAt: null,
      },
    });

    res.json({ success: true, message: 'Twilio configuration removed' });
  } catch (error) {
    console.error('Error removing Twilio config:', error);
    res.status(500).json({ error: 'Failed to remove Twilio configuration' });
  }
});
```

---

## Task 4: Register Routes in App

**File:** `apps/api/src/app.ts`

**Add import and route registration:**

```typescript
import integrationsRouter from './routes/integrations.js';

// Add after other route registrations:
app.use('/api/integrations', integrationsRouter);
```

---

## Task 5: Install Twilio Package

**Run:**
```bash
pnpm add twilio --filter @peacase/api
```

---

## Task 6: Write Integration Tests

**Create:** `apps/api/src/__tests__/integrations.test.ts`

Test cases:
- GET /status returns correct data
- PUT /sendgrid validates and saves
- PUT /sendgrid rejects invalid keys
- DELETE /sendgrid removes config
- PUT /twilio validates and saves
- PUT /twilio rejects invalid credentials
- DELETE /twilio removes config
- All endpoints require auth
- All endpoints require owner/admin role

---

## Summary

After completing Phase 2:
- ✅ GET /api/integrations/status
- ✅ PUT /api/integrations/sendgrid
- ✅ POST /api/integrations/sendgrid/test
- ✅ DELETE /api/integrations/sendgrid
- ✅ PUT /api/integrations/twilio
- ✅ POST /api/integrations/twilio/test
- ✅ DELETE /api/integrations/twilio

**Next Phase:** Phase 3 - Settings UI (Frontend)
