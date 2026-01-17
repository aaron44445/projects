import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@peacase/database';
import { authenticate, authorize } from '../middleware/auth.js';
import { encrypt } from '../lib/encryption.js';
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';

const router = Router();

// ============================================
// VALIDATION SCHEMAS
// ============================================

const sendgridSchema = z.object({
  apiKey: z
    .string()
    .min(1, 'API key is required')
    .refine((key) => key.startsWith('SG.'), {
      message: 'SendGrid API key must start with "SG."',
    }),
  fromEmail: z.string().email('Invalid email address'),
});

const sendgridTestSchema = z.object({
  apiKey: z
    .string()
    .min(1, 'API key is required')
    .refine((key) => key.startsWith('SG.'), {
      message: 'SendGrid API key must start with "SG."',
    }),
});

const twilioSchema = z.object({
  accountSid: z
    .string()
    .min(1, 'Account SID is required')
    .refine((sid) => sid.startsWith('AC'), {
      message: 'Twilio Account SID must start with "AC"',
    }),
  authToken: z.string().min(1, 'Auth token is required'),
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .refine((phone) => /^\+[1-9]\d{1,14}$/.test(phone), {
      message: 'Phone number must be in E.164 format (e.g., +1234567890)',
    }),
});

const twilioTestSchema = z.object({
  accountSid: z
    .string()
    .min(1, 'Account SID is required')
    .refine((sid) => sid.startsWith('AC'), {
      message: 'Twilio Account SID must start with "AC"',
    }),
  authToken: z.string().min(1, 'Auth token is required'),
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .refine((phone) => /^\+[1-9]\d{1,14}$/.test(phone), {
      message: 'Phone number must be in E.164 format (e.g., +1234567890)',
    }),
  testPhoneNumber: z
    .string()
    .min(1, 'Test phone number is required')
    .refine((phone) => /^\+[1-9]\d{1,14}$/.test(phone), {
      message: 'Test phone number must be in E.164 format (e.g., +1234567890)',
    }),
});

// Grace period duration (14 days in milliseconds)
const GRACE_PERIOD_DAYS = 14;
const GRACE_PERIOD_MS = GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000;

// ============================================
// GET /api/v1/integrations/status
// Get integration status (grace period, configured services)
// ============================================
router.get(
  '/status',
  authenticate,
  authorize('owner', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const salon = await prisma.salon.findUnique({
        where: { id: req.user!.salonId },
        select: {
          marketingAddonEnabled: true,
          marketingAddonSuspended: true,
          marketingAddonEnabledAt: true,
          sendgridApiKeyEncrypted: true,
          sendgridFromEmail: true,
          sendgridValidated: true,
          sendgridLastValidatedAt: true,
          twilioAccountSidEncrypted: true,
          twilioPhoneNumber: true,
          twilioValidated: true,
          twilioLastValidatedAt: true,
        },
      });

      if (!salon) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Salon not found',
          },
        });
      }

      // Calculate grace period status
      let gracePeriod: { active: boolean; startedAt: Date; endsAt: Date; daysRemaining: number } | null = null;
      if (salon.marketingAddonEnabled && salon.marketingAddonEnabledAt) {
        const enabledAt = new Date(salon.marketingAddonEnabledAt).getTime();
        const gracePeriodEndsAt = enabledAt + GRACE_PERIOD_MS;
        const now = Date.now();

        if (now < gracePeriodEndsAt) {
          gracePeriod = {
            active: true,
            startedAt: salon.marketingAddonEnabledAt,
            endsAt: new Date(gracePeriodEndsAt),
            daysRemaining: Math.ceil((gracePeriodEndsAt - now) / (24 * 60 * 60 * 1000)),
          };
        } else {
          gracePeriod = {
            active: false,
            startedAt: salon.marketingAddonEnabledAt,
            endsAt: new Date(gracePeriodEndsAt),
            daysRemaining: 0,
          };
        }
      }

      res.json({
        success: true,
        data: {
          marketingAddon: {
            enabled: salon.marketingAddonEnabled,
            suspended: salon.marketingAddonSuspended,
            enabledAt: salon.marketingAddonEnabledAt,
          },
          gracePeriod,
          sendgrid: {
            configured: !!salon.sendgridApiKeyEncrypted,
            fromEmail: salon.sendgridFromEmail,
            validated: salon.sendgridValidated,
            lastValidatedAt: salon.sendgridLastValidatedAt,
          },
          twilio: {
            configured: !!salon.twilioAccountSidEncrypted,
            phoneNumber: salon.twilioPhoneNumber,
            validated: salon.twilioValidated,
            lastValidatedAt: salon.twilioLastValidatedAt,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching integration status:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to fetch integration status',
        },
      });
    }
  }
);

// ============================================
// PUT /api/v1/integrations/sendgrid
// Save and validate SendGrid API key
// ============================================
router.put(
  '/sendgrid',
  authenticate,
  authorize('owner', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const data = sendgridSchema.parse(req.body);

      // Validate the API key by attempting to send a test email
      sgMail.setApiKey(data.apiKey);

      // Get the user's email for test recipient
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { email: true, firstName: true },
      });

      if (!user?.email) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'USER_EMAIL_MISSING',
            message: 'User email not found for validation',
          },
        });
      }

      // Try sending a test email to validate the API key
      try {
        await sgMail.send({
          to: user.email,
          from: data.fromEmail,
          subject: 'Peacase - SendGrid Integration Verified',
          text: `Hello ${user.firstName || 'there'},\n\nYour SendGrid integration has been successfully configured for your Peacase salon management account.\n\nYou can now send appointment reminders and marketing emails to your clients.\n\nBest regards,\nThe Peacase Team`,
          html: `<p>Hello ${user.firstName || 'there'},</p><p>Your SendGrid integration has been successfully configured for your Peacase salon management account.</p><p>You can now send appointment reminders and marketing emails to your clients.</p><p>Best regards,<br>The Peacase Team</p>`,
        });
      } catch (sendError: any) {
        console.error('SendGrid validation failed:', sendError);
        return res.status(400).json({
          success: false,
          error: {
            code: 'SENDGRID_VALIDATION_FAILED',
            message: sendError.message || 'Failed to validate SendGrid API key',
            details: sendError.response?.body?.errors || null,
          },
        });
      }

      // Encrypt and save the API key
      const encryptedApiKey = encrypt(data.apiKey);

      await prisma.salon.update({
        where: { id: req.user!.salonId },
        data: {
          sendgridApiKeyEncrypted: encryptedApiKey,
          sendgridFromEmail: data.fromEmail,
          sendgridValidated: true,
          sendgridLastValidatedAt: new Date(),
        },
      });

      res.json({
        success: true,
        data: {
          message: 'SendGrid integration configured successfully',
          fromEmail: data.fromEmail,
          validated: true,
          validatedAt: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.flatten().fieldErrors,
          },
        });
      }
      console.error('Error saving SendGrid configuration:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to save SendGrid configuration',
        },
      });
    }
  }
);

// ============================================
// POST /api/v1/integrations/sendgrid/test
// Test SendGrid key without saving
// ============================================
router.post(
  '/sendgrid/test',
  authenticate,
  authorize('owner', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const data = sendgridTestSchema.parse(req.body);
      const fromEmail = req.body.fromEmail;

      if (!fromEmail || !z.string().email().safeParse(fromEmail).success) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid from email address',
          },
        });
      }

      // Get the user's email for test recipient
      const user = await prisma.user.findUnique({
        where: { id: req.user!.userId },
        select: { email: true, firstName: true },
      });

      if (!user?.email) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'USER_EMAIL_MISSING',
            message: 'User email not found for test',
          },
        });
      }

      // Test the API key by sending a test email
      sgMail.setApiKey(data.apiKey);

      try {
        await sgMail.send({
          to: user.email,
          from: fromEmail,
          subject: 'Peacase - SendGrid Test Email',
          text: `Hello ${user.firstName || 'there'},\n\nThis is a test email to verify your SendGrid API key configuration.\n\nIf you received this email, your SendGrid integration is working correctly.\n\nBest regards,\nThe Peacase Team`,
          html: `<p>Hello ${user.firstName || 'there'},</p><p>This is a test email to verify your SendGrid API key configuration.</p><p>If you received this email, your SendGrid integration is working correctly.</p><p>Best regards,<br>The Peacase Team</p>`,
        });

        res.json({
          success: true,
          data: {
            message: 'Test email sent successfully',
            sentTo: user.email,
          },
        });
      } catch (sendError: any) {
        console.error('SendGrid test failed:', sendError);
        res.status(400).json({
          success: false,
          error: {
            code: 'SENDGRID_TEST_FAILED',
            message: sendError.message || 'Failed to send test email',
            details: sendError.response?.body?.errors || null,
          },
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.flatten().fieldErrors,
          },
        });
      }
      console.error('Error testing SendGrid:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to test SendGrid configuration',
        },
      });
    }
  }
);

// ============================================
// DELETE /api/v1/integrations/sendgrid
// Remove SendGrid configuration
// ============================================
router.delete(
  '/sendgrid',
  authenticate,
  authorize('owner', 'admin'),
  async (req: Request, res: Response) => {
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

      res.json({
        success: true,
        data: {
          message: 'SendGrid configuration removed successfully',
        },
      });
    } catch (error) {
      console.error('Error removing SendGrid configuration:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to remove SendGrid configuration',
        },
      });
    }
  }
);

// ============================================
// PUT /api/v1/integrations/twilio
// Save and validate Twilio credentials
// ============================================
router.put(
  '/twilio',
  authenticate,
  authorize('owner', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const data = twilioSchema.parse(req.body);

      // Validate credentials by creating a client and checking account
      const twilioClient = twilio(data.accountSid, data.authToken);

      try {
        // Verify credentials by fetching account info
        await twilioClient.api.accounts(data.accountSid).fetch();

        // Verify the phone number belongs to this account
        const incomingPhoneNumbers = await twilioClient.incomingPhoneNumbers.list({
          phoneNumber: data.phoneNumber,
          limit: 1,
        });

        if (incomingPhoneNumbers.length === 0) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'TWILIO_PHONE_NOT_FOUND',
              message: 'The specified phone number was not found in your Twilio account',
            },
          });
        }
      } catch (twilioError: any) {
        console.error('Twilio validation failed:', twilioError);
        return res.status(400).json({
          success: false,
          error: {
            code: 'TWILIO_VALIDATION_FAILED',
            message: twilioError.message || 'Failed to validate Twilio credentials',
          },
        });
      }

      // Encrypt and save credentials
      const encryptedAccountSid = encrypt(data.accountSid);
      const encryptedAuthToken = encrypt(data.authToken);

      await prisma.salon.update({
        where: { id: req.user!.salonId },
        data: {
          twilioAccountSidEncrypted: encryptedAccountSid,
          twilioAuthTokenEncrypted: encryptedAuthToken,
          twilioPhoneNumber: data.phoneNumber,
          twilioValidated: true,
          twilioLastValidatedAt: new Date(),
        },
      });

      res.json({
        success: true,
        data: {
          message: 'Twilio integration configured successfully',
          phoneNumber: data.phoneNumber,
          validated: true,
          validatedAt: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.flatten().fieldErrors,
          },
        });
      }
      console.error('Error saving Twilio configuration:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to save Twilio configuration',
        },
      });
    }
  }
);

// ============================================
// POST /api/v1/integrations/twilio/test
// Test Twilio credentials with an SMS
// ============================================
router.post(
  '/twilio/test',
  authenticate,
  authorize('owner', 'admin'),
  async (req: Request, res: Response) => {
    try {
      const data = twilioTestSchema.parse(req.body);

      // Create Twilio client with provided credentials
      const twilioClient = twilio(data.accountSid, data.authToken);

      try {
        // Send a test SMS
        const message = await twilioClient.messages.create({
          body: 'Peacase Test: Your Twilio integration is working correctly!',
          from: data.phoneNumber,
          to: data.testPhoneNumber,
        });

        res.json({
          success: true,
          data: {
            message: 'Test SMS sent successfully',
            messageSid: message.sid,
            sentTo: data.testPhoneNumber,
          },
        });
      } catch (twilioError: any) {
        console.error('Twilio test failed:', twilioError);
        res.status(400).json({
          success: false,
          error: {
            code: 'TWILIO_TEST_FAILED',
            message: twilioError.message || 'Failed to send test SMS',
          },
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.flatten().fieldErrors,
          },
        });
      }
      console.error('Error testing Twilio:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to test Twilio configuration',
        },
      });
    }
  }
);

// ============================================
// DELETE /api/v1/integrations/twilio
// Remove Twilio configuration
// ============================================
router.delete(
  '/twilio',
  authenticate,
  authorize('owner', 'admin'),
  async (req: Request, res: Response) => {
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

      res.json({
        success: true,
        data: {
          message: 'Twilio configuration removed successfully',
        },
      });
    } catch (error) {
      console.error('Error removing Twilio configuration:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to remove Twilio configuration',
        },
      });
    }
  }
);

export { router as integrationsRouter };
