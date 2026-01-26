import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@peacase/database';
import { sendEmail } from '../services/email.js';
import { asyncHandler } from '../lib/errorUtils.js';

const router = Router();

// Validation schema
const demoRequestSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  businessName: z.string().min(1),
  businessSize: z.string().min(1),
  preferredDate: z.string().min(1),
  preferredTime: z.string().min(1),
  message: z.string().optional(),
});

// ============================================
// POST /api/v1/demo
// Create a demo request (public endpoint)
// ============================================
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    const data = demoRequestSchema.parse(req.body);

    // Create demo request in database
    const demoRequest = await prisma.demoRequest.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        businessName: data.businessName,
        businessSize: data.businessSize,
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        message: data.message || null,
        status: 'pending',
      },
    });

    // Send confirmation email to the requester
    try {
      await sendEmail({
        to: data.email,
        subject: 'Demo Request Received - Peacase',
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #7C9A82;">Thanks for your interest in Peacase!</h1>
            <p>Hi ${data.firstName},</p>
            <p>We've received your demo request. Our team will review your preferred time and send you a calendar invite within 24 hours.</p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Preferred Date:</strong> ${data.preferredDate}</p>
              <p style="margin: 10px 0 0 0;"><strong>Preferred Time:</strong> ${data.preferredTime}</p>
            </div>
            <p>If you have any questions before your demo, feel free to reply to this email.</p>
            <p>Best,<br>The Peacase Team</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send demo confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    // Send notification email to sales team
    try {
      await sendEmail({
        to: 'sales@peacase.com',
        subject: `New Demo Request: ${data.businessName}`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif;">
            <h2>New Demo Request</h2>
            <table style="border-collapse: collapse; width: 100%;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Name:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.firstName} ${data.lastName}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.email}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Phone:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.phone}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Business:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.businessName}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Team Size:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.businessSize}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Preferred Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.preferredDate}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Preferred Time:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.preferredTime}</td></tr>
              ${data.message ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Message:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${data.message}</td></tr>` : ''}
            </table>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send sales notification email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      data: {
        id: demoRequest.id,
        message: 'Demo request submitted successfully',
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
    console.error('Demo request error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Failed to submit demo request. Please try again.',
      },
    });
  }
}));

export { router as demoRouter };
