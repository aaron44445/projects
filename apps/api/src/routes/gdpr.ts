import { Router, Request, Response } from 'express';
import { prisma } from '@peacase/database';
import { authenticateClient, AuthenticatedClientRequest } from '../middleware/clientAuth.js';
import { asyncHandler } from '../lib/errorUtils.js';
import { sendEmail } from '../services/email.js';
import { env } from '../lib/env.js';

export const gdprRouter = Router();

const GRACE_PERIOD_DAYS = 30;
const PORTAL_URL = env.CORS_ORIGIN || 'http://localhost:3000';

// ============================================
// Email Templates
// ============================================

function gdprDeletionRequestEmail(data: {
  clientName: string;
  salonName: string;
  requestId: string;
  scheduledDeletionDate: string;
  cancelUrl: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2C2C2C; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #C7DCC8 0%, #E8F0E8 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: #FFFFFF; padding: 30px; border: 1px solid #E5E5E5; }
        .footer { background: #FAF8F3; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 12px 12px; }
        .info { background: #FEF3E7; border-left: 4px solid #F5A623; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; background: #6B9B76; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
        .details { background: #FAF8F3; padding: 20px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #2C2C2C;">Data Deletion Request Received</h1>
          <p style="margin: 10px 0 0 0; color: #4A4A4A;">${data.salonName}</p>
        </div>
        <div class="content">
          <p>Hi ${data.clientName},</p>
          <p>We have received your request to delete your personal data from ${data.salonName}. We take your privacy seriously and will process this request in accordance with GDPR requirements.</p>

          <div class="details">
            <p><strong>Request ID:</strong> ${data.requestId}</p>
            <p><strong>Scheduled Deletion:</strong> ${data.scheduledDeletionDate}</p>
          </div>

          <div class="info">
            <p style="margin: 0;"><strong>30-Day Grace Period</strong></p>
            <p style="margin: 5px 0 0 0;">Your data will be permanently deleted on ${data.scheduledDeletionDate}. If you change your mind, you can cancel this request before that date.</p>
          </div>

          <p><strong>What will be deleted:</strong></p>
          <ul>
            <li>Your personal profile information (name, email, phone, address)</li>
            <li>Notes added by staff about your preferences</li>
            <li>Payment records (will be anonymized for business reporting)</li>
            <li>Appointment history (will be anonymized for business reporting)</li>
            <li>Reviews you have submitted</li>
          </ul>

          <p style="text-align: center;">
            <a href="${data.cancelUrl}" class="button">Cancel Deletion Request</a>
          </p>

          <p style="font-size: 14px; color: #666;">If you did not request this deletion, please contact us immediately.</p>
        </div>
        <div class="footer">
          <p>${data.salonName}</p>
          <p>This email was sent regarding your data deletion request.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function gdprDeletionCancelledEmail(data: {
  clientName: string;
  salonName: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2C2C2C; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #C7DCC8 0%, #E8F0E8 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: #FFFFFF; padding: 30px; border: 1px solid #E5E5E5; }
        .footer { background: #FAF8F3; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 12px 12px; }
        .success { background: #E8F4EA; border-left: 4px solid #6B9B76; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #2C2C2C;">Deletion Request Cancelled</h1>
          <p style="margin: 10px 0 0 0; color: #4A4A4A;">${data.salonName}</p>
        </div>
        <div class="content">
          <p>Hi ${data.clientName},</p>

          <div class="success">
            <p style="margin: 0;">Your data deletion request has been successfully cancelled. Your account and all associated data will remain intact.</p>
          </div>

          <p>If you have any questions or concerns about your data, please don't hesitate to contact us.</p>

          <p>Thank you for being a valued client!</p>
        </div>
        <div class="footer">
          <p>${data.salonName}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function gdprDeletionCompleteEmail(data: {
  clientName: string;
  salonName: string;
  deletionSummary: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #2C2C2C; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #C7DCC8 0%, #E8F0E8 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
        .content { background: #FFFFFF; padding: 30px; border: 1px solid #E5E5E5; }
        .footer { background: #FAF8F3; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 12px 12px; }
        .details { background: #FAF8F3; padding: 20px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #2C2C2C;">Data Deletion Complete</h1>
          <p style="margin: 10px 0 0 0; color: #4A4A4A;">${data.salonName}</p>
        </div>
        <div class="content">
          <p>Hi ${data.clientName},</p>
          <p>Your data deletion request has been processed. Your personal data has been permanently removed from our systems in accordance with GDPR requirements.</p>

          <div class="details">
            <p><strong>Summary of deleted data:</strong></p>
            <p>${data.deletionSummary}</p>
          </div>

          <p>Some data may have been anonymized rather than deleted to maintain our business records. This anonymized data cannot be linked back to you.</p>

          <p>If you have any questions, please contact us. Note that you will need to create a new account if you wish to book appointments in the future.</p>
        </div>
        <div class="footer">
          <p>${data.salonName}</p>
          <p>This is your final communication regarding this data deletion request.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ============================================
// POST /api/v1/gdpr/delete-request
// Request data deletion (right to be forgotten)
// ============================================
gdprRouter.post('/delete-request', authenticateClient, asyncHandler(async (req: Request, res: Response) => {
  const { client } = req as AuthenticatedClientRequest;
  const { reason } = req.body;

  // Get full client data
  const fullClient = await prisma.client.findUnique({
    where: { id: client.id },
    include: {
      salon: {
        select: { id: true, name: true, slug: true, email: true }
      }
    }
  });

  if (!fullClient) {
    return res.status(404).json({
      success: false,
      error: { code: 'CLIENT_NOT_FOUND', message: 'Client not found' }
    });
  }

  // Check if there's already a pending deletion request
  const existingRequest = await prisma.gdprDeletionRequest.findFirst({
    where: {
      clientId: client.id,
      status: 'pending'
    }
  });

  if (existingRequest) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'REQUEST_EXISTS',
        message: 'You already have a pending deletion request. You can cancel it if you changed your mind.'
      },
      data: {
        requestId: existingRequest.id,
        scheduledDeletion: existingRequest.scheduledDeletion
      }
    });
  }

  // Calculate scheduled deletion date (30 days from now)
  const scheduledDeletion = new Date();
  scheduledDeletion.setDate(scheduledDeletion.getDate() + GRACE_PERIOD_DAYS);

  // Create deletion request
  const deletionRequest = await prisma.gdprDeletionRequest.create({
    data: {
      clientId: client.id,
      salonId: fullClient.salonId,
      reason: reason || null,
      scheduledDeletion
    }
  });

  // Send confirmation email
  const cancelUrl = `${PORTAL_URL}/portal/${fullClient.salon.slug}/gdpr/cancel?requestId=${deletionRequest.id}`;

  try {
    if (fullClient.email) {
      await sendEmail({
        to: fullClient.email,
        subject: `Data Deletion Request Confirmation - ${fullClient.salon.name}`,
        html: gdprDeletionRequestEmail({
          clientName: fullClient.firstName,
          salonName: fullClient.salon.name,
          requestId: deletionRequest.id,
          scheduledDeletionDate: scheduledDeletion.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          cancelUrl
        })
      });
    }
  } catch (emailError) {
    console.error('Failed to send GDPR deletion confirmation email:', emailError);
    // Don't fail the request if email fails
  }

  return res.status(201).json({
    success: true,
    data: {
      message: 'Data deletion request received. Your data will be deleted after the 30-day grace period.',
      requestId: deletionRequest.id,
      scheduledDeletion: deletionRequest.scheduledDeletion,
      gracePeriodDays: GRACE_PERIOD_DAYS,
      canCancelUntil: deletionRequest.scheduledDeletion
    }
  });
}));

// ============================================
// GET /api/v1/gdpr/delete-request
// Get current deletion request status
// ============================================
gdprRouter.get('/delete-request', authenticateClient, asyncHandler(async (req: Request, res: Response) => {
  const { client } = req as AuthenticatedClientRequest;

  const request = await prisma.gdprDeletionRequest.findFirst({
    where: {
      clientId: client.id,
      status: { in: ['pending', 'processing'] }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!request) {
    return res.status(200).json({
      success: true,
      data: {
        hasActiveRequest: false,
        request: null
      }
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      hasActiveRequest: true,
      request: {
        id: request.id,
        status: request.status,
        reason: request.reason,
        requestedAt: request.requestedAt,
        scheduledDeletion: request.scheduledDeletion,
        canCancel: request.status === 'pending' && new Date() < request.scheduledDeletion
      }
    }
  });
}));

// ============================================
// POST /api/v1/gdpr/cancel-request
// Cancel a pending deletion request
// ============================================
gdprRouter.post('/cancel-request', authenticateClient, asyncHandler(async (req: Request, res: Response) => {
  const { client } = req as AuthenticatedClientRequest;
  const { requestId } = req.body;

  // Get the client with salon info
  const fullClient = await prisma.client.findUnique({
    where: { id: client.id },
    include: {
      salon: {
        select: { name: true }
      }
    }
  });

  if (!fullClient) {
    return res.status(404).json({
      success: false,
      error: { code: 'CLIENT_NOT_FOUND', message: 'Client not found' }
    });
  }

  // Find the pending request
  const whereClause: any = {
    clientId: client.id,
    status: 'pending'
  };

  if (requestId) {
    whereClause.id = requestId;
  }

  const request = await prisma.gdprDeletionRequest.findFirst({
    where: whereClause
  });

  if (!request) {
    return res.status(404).json({
      success: false,
      error: { code: 'REQUEST_NOT_FOUND', message: 'No pending deletion request found' }
    });
  }

  // Check if still within grace period
  if (new Date() >= request.scheduledDeletion) {
    return res.status(400).json({
      success: false,
      error: { code: 'GRACE_PERIOD_EXPIRED', message: 'The grace period has expired. Deletion is already in progress.' }
    });
  }

  // Cancel the request
  await prisma.gdprDeletionRequest.update({
    where: { id: request.id },
    data: {
      status: 'cancelled',
      cancelledAt: new Date()
    }
  });

  // Send cancellation confirmation email
  try {
    if (fullClient.email) {
      await sendEmail({
        to: fullClient.email,
        subject: `Data Deletion Request Cancelled - ${fullClient.salon.name}`,
        html: gdprDeletionCancelledEmail({
          clientName: fullClient.firstName,
          salonName: fullClient.salon.name
        })
      });
    }
  } catch (emailError) {
    console.error('Failed to send GDPR cancellation confirmation email:', emailError);
  }

  return res.status(200).json({
    success: true,
    data: {
      message: 'Deletion request cancelled successfully. Your data will remain intact.',
      requestId: request.id
    }
  });
}));

// ============================================
// POST /api/v1/gdpr/execute-deletion/:requestId
// Execute the deletion (called by scheduled job or admin)
// This is typically called by a cron job, not directly by clients
// ============================================
gdprRouter.post('/execute-deletion/:requestId', asyncHandler(async (req: Request, res: Response) => {
  // This endpoint should be protected by an API key or admin auth
  const apiKey = req.headers['x-gdpr-api-key'];
  if (apiKey !== env.GDPR_API_KEY && env.NODE_ENV !== 'test') {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Invalid API key' }
    });
  }

  const { requestId } = req.params;

  const request = await prisma.gdprDeletionRequest.findUnique({
    where: { id: requestId }
  });

  if (!request) {
    return res.status(404).json({
      success: false,
      error: { code: 'REQUEST_NOT_FOUND', message: 'Deletion request not found' }
    });
  }

  if (request.status !== 'pending') {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_STATUS', message: `Cannot execute deletion for request with status: ${request.status}` }
    });
  }

  // Check if scheduled deletion time has passed
  if (new Date() < request.scheduledDeletion) {
    return res.status(400).json({
      success: false,
      error: { code: 'TOO_EARLY', message: 'Grace period has not expired yet' }
    });
  }

  // Get client data before deletion for email and logging
  const clientToDelete = await prisma.client.findUnique({
    where: { id: request.clientId },
    include: {
      salon: { select: { name: true } },
      appointments: { select: { id: true } },
      clientNotes: { select: { id: true } },
      payments: { select: { id: true } },
      reviews: { select: { id: true } },
      formResponses: { select: { id: true } },
      clientPackages: { select: { id: true } }
    }
  });

  if (!clientToDelete) {
    // Client may have been deleted by other means
    await prisma.gdprDeletionRequest.update({
      where: { id: requestId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        deletionLog: JSON.stringify({ error: 'Client already deleted' })
      }
    });

    return res.status(200).json({
      success: true,
      data: { message: 'Client data was already deleted' }
    });
  }

  const clientEmail = clientToDelete.email;
  const clientName = clientToDelete.firstName;
  const salonName = clientToDelete.salon.name;

  // Execute deletion in a transaction
  const deletionSummary = await prisma.$transaction(async (tx) => {
    const summary: Record<string, number> = {};

    // 1. Delete client notes
    const deletedNotes = await tx.clientNote.deleteMany({
      where: { clientId: request.clientId }
    });
    summary.notes = deletedNotes.count;

    // 2. Delete form responses
    const deletedForms = await tx.formResponse.deleteMany({
      where: { clientId: request.clientId }
    });
    summary.formResponses = deletedForms.count;

    // 3. Delete client packages
    const deletedPackages = await tx.clientPackage.deleteMany({
      where: { clientId: request.clientId }
    });
    summary.packages = deletedPackages.count;

    // 4. Count reviews that will be orphaned (kept for business reporting)
    const reviewCount = await tx.review.count({
      where: { clientId: request.clientId }
    });
    summary.reviewsAnonymized = reviewCount;

    // 5. Count payments that will be orphaned (kept for financial records)
    const paymentCount = await tx.payment.count({
      where: { clientId: request.clientId }
    });
    summary.paymentsAnonymized = paymentCount;

    // 6. Anonymize appointments (keep for business reporting but clear notes)
    const updatedAppointments = await tx.appointment.updateMany({
      where: { clientId: request.clientId },
      data: {
        notes: null,
        cancellationReason: 'Client data deleted per GDPR request'
      }
    });
    summary.appointmentsAnonymized = updatedAppointments.count;

    // 7. Delete client tokens
    await tx.clientRefreshToken.deleteMany({
      where: { clientId: request.clientId }
    });

    await tx.clientPasswordResetToken.deleteMany({
      where: { clientId: request.clientId }
    });

    await tx.clientEmailVerificationToken.deleteMany({
      where: { clientId: request.clientId }
    });

    // 8. Delete the client record
    await tx.client.delete({
      where: { id: request.clientId }
    });
    summary.clientDeleted = 1;

    // 9. Update the deletion request status
    await tx.gdprDeletionRequest.update({
      where: { id: requestId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        deletionLog: JSON.stringify(summary)
      }
    });

    // 10. Create audit log
    await tx.gdprDeletionLog.create({
      data: {
        salonId: request.salonId,
        clientEmail: clientEmail || 'unknown',
        requestId: requestId,
        deletionType: 'full',
        itemsDeleted: JSON.stringify(summary),
        performedBy: 'system'
      }
    });

    return summary;
  });

  // Send completion email (to stored email, not looking up client)
  try {
    if (clientEmail) {
      const summaryText = Object.entries(deletionSummary)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${value}`)
        .join('<br/>');

      await sendEmail({
        to: clientEmail,
        subject: `Data Deletion Complete - ${salonName}`,
        html: gdprDeletionCompleteEmail({
          clientName: clientName,
          salonName: salonName,
          deletionSummary: summaryText
        })
      });
    }
  } catch (emailError) {
    console.error('Failed to send GDPR deletion complete email:', emailError);
  }

  return res.status(200).json({
    success: true,
    data: {
      message: 'Client data has been permanently deleted',
      summary: deletionSummary
    }
  });
}));

// ============================================
// GET /api/v1/gdpr/export
// Export all client data as JSON (GDPR data portability)
// Returns all data associated with the authenticated client
// ============================================
gdprRouter.get('/export', authenticateClient, asyncHandler(async (req: Request, res: Response) => {
  const { client } = req as AuthenticatedClientRequest;

  // Fetch client with all related data
  const fullClient = await prisma.client.findUnique({
    where: { id: client.id },
  });

  if (!fullClient) {
    return res.status(404).json({
      success: false,
      error: { code: 'CLIENT_NOT_FOUND', message: 'Client not found' },
    });
  }

  // Verify client belongs to the salon in their token
  if (fullClient.salonId !== client.salonId) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Access denied' },
    });
  }

  // Fetch all related data in parallel
  const [
    appointments,
    payments,
    notes,
    packages,
    reviews,
    formResponses,
    salon,
  ] = await Promise.all([
    // Appointment history
    prisma.appointment.findMany({
      where: { clientId: client.id },
      include: {
        service: {
          select: {
            name: true,
            description: true,
            durationMinutes: true,
            price: true,
          },
        },
        staff: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        location: {
          select: {
            name: true,
            address: true,
            city: true,
            state: true,
            zip: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
    }),

    // Payment history
    prisma.payment.findMany({
      where: { clientId: client.id },
      select: {
        id: true,
        amount: true,
        tipAmount: true,
        totalAmount: true,
        method: true,
        status: true,
        createdAt: true,
        refundAmount: true,
        refundReason: true,
        refundedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),

    // Notes about the client
    prisma.clientNote.findMany({
      where: { clientId: client.id },
      select: {
        id: true,
        content: true,
        createdAt: true,
        staff: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),

    // Purchased packages
    prisma.clientPackage.findMany({
      where: { clientId: client.id },
      include: {
        package: {
          select: {
            name: true,
            description: true,
            price: true,
            type: true,
          },
        },
      },
      orderBy: { purchaseDate: 'desc' },
    }),

    // Reviews submitted by client
    prisma.review.findMany({
      where: { clientId: client.id },
      select: {
        id: true,
        rating: true,
        comment: true,
        submittedAt: true,
        isApproved: true,
        responses: {
          select: {
            responseText: true,
            respondedAt: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    }),

    // Form responses (consultation forms)
    prisma.formResponse.findMany({
      where: { clientId: client.id },
      include: {
        form: {
          select: {
            name: true,
            description: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    }),

    // Salon info
    prisma.salon.findUnique({
      where: { id: client.salonId },
      select: {
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zip: true,
      },
    }),
  ]);

  // Format the export data
  const exportData = {
    exportedAt: new Date().toISOString(),
    exportType: 'GDPR_DATA_EXPORT',
    version: '1.0',

    salon: salon,

    personalInformation: {
      firstName: fullClient.firstName,
      lastName: fullClient.lastName,
      email: fullClient.email,
      phone: fullClient.phone,
      address: fullClient.address,
      city: fullClient.city,
      state: fullClient.state,
      zip: fullClient.zip,
      country: fullClient.country,
      birthday: fullClient.birthday,
      createdAt: fullClient.createdAt,
      updatedAt: fullClient.updatedAt,
    },

    preferences: {
      communicationPreference: fullClient.communicationPreference,
      optedInReminders: fullClient.optedInReminders,
      optedInMarketing: fullClient.optedInMarketing,
      preferredStaffId: fullClient.preferredStaffId,
      preferredLocationId: fullClient.preferredLocationId,
    },

    consentRecords: {
      dataConsentGiven: fullClient.dataConsentGiven,
      dataConsentAt: fullClient.dataConsentAt,
    },

    loyaltyProgram: {
      loyaltyPoints: fullClient.loyaltyPoints,
    },

    appointmentHistory: appointments.map(apt => ({
      id: apt.id,
      date: apt.startTime,
      endTime: apt.endTime,
      duration: apt.durationMinutes,
      service: apt.service.name,
      serviceDescription: apt.service.description,
      price: apt.price,
      priceOverride: apt.priceOverride,
      status: apt.status,
      staffMember: apt.staff ? `${apt.staff.firstName} ${apt.staff.lastName}` : null,
      location: apt.location ? {
        name: apt.location.name,
        address: apt.location.address,
        city: apt.location.city,
        state: apt.location.state,
        zip: apt.location.zip,
      } : null,
      notes: apt.notes,
      cancellationReason: apt.cancellationReason,
      source: apt.source,
      createdAt: apt.createdAt,
    })),

    paymentHistory: payments.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      tipAmount: payment.tipAmount,
      totalAmount: payment.totalAmount,
      paymentMethod: payment.method,
      status: payment.status,
      date: payment.createdAt,
      refund: payment.refundAmount ? {
        amount: payment.refundAmount,
        reason: payment.refundReason,
        date: payment.refundedAt,
      } : null,
    })),

    notes: notes.map(note => ({
      id: note.id,
      content: note.content,
      createdAt: note.createdAt,
      createdBy: note.staff ? `${note.staff.firstName} ${note.staff.lastName}` : 'Unknown',
    })),

    packages: packages.map(pkg => ({
      id: pkg.id,
      packageName: pkg.package.name,
      packageDescription: pkg.package.description,
      packageType: pkg.package.type,
      purchasePrice: pkg.package.price,
      purchaseDate: pkg.purchaseDate,
      expirationDate: pkg.expirationDate,
      servicesRemaining: pkg.servicesRemaining,
      totalServices: pkg.totalServices,
      autoRenew: pkg.autoRenew,
      isActive: pkg.isActive,
    })),

    reviews: reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      submittedAt: review.submittedAt,
      isPublished: review.isApproved,
      businessResponses: review.responses.map(r => ({
        response: r.responseText,
        respondedAt: r.respondedAt,
      })),
    })),

    formResponses: formResponses.map(response => ({
      id: response.id,
      formName: response.form.name,
      formDescription: response.form.description,
      submittedAt: response.submittedAt,
      responses: (() => {
        try {
          return JSON.parse(response.responseData);
        } catch {
          return response.responseData;
        }
      })(),
      hasSignature: !!response.signatureUrl,
    })),

    summary: {
      totalAppointments: appointments.length,
      totalPayments: payments.length,
      totalSpent: payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.totalAmount, 0),
      totalNotes: notes.length,
      totalPackages: packages.length,
      totalReviews: reviews.length,
      totalFormResponses: formResponses.length,
    },
  };

  // Set headers for JSON download
  const filename = `gdpr-export-${fullClient.firstName}-${fullClient.lastName}-${new Date().toISOString().split('T')[0]}.json`;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  res.json({
    success: true,
    data: exportData,
  });
}));

// ============================================
// GET /api/v1/gdpr/consent-status
// Get client's consent settings
// ============================================
gdprRouter.get('/consent-status', authenticateClient, asyncHandler(async (req: Request, res: Response) => {
  const { client } = req as AuthenticatedClientRequest;

  const clientData = await prisma.client.findUnique({
    where: { id: client.id },
    select: {
      dataConsentGiven: true,
      dataConsentAt: true,
      optedInReminders: true,
      optedInMarketing: true,
      communicationPreference: true
    }
  });

  if (!clientData) {
    return res.status(404).json({
      success: false,
      error: { code: 'CLIENT_NOT_FOUND', message: 'Client not found' }
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      dataConsent: {
        given: clientData.dataConsentGiven,
        date: clientData.dataConsentAt
      },
      communicationPreferences: {
        method: clientData.communicationPreference,
        reminders: clientData.optedInReminders,
        marketing: clientData.optedInMarketing
      }
    }
  });
}));

// ============================================
// PATCH /api/v1/gdpr/consent
// Update consent settings
// ============================================
gdprRouter.patch('/consent', authenticateClient, asyncHandler(async (req: Request, res: Response) => {
  const { client } = req as AuthenticatedClientRequest;
  const { dataConsent, optedInReminders, optedInMarketing, communicationPreference } = req.body;

  const updateData: any = {};

  if (dataConsent !== undefined) {
    updateData.dataConsentGiven = dataConsent;
    updateData.dataConsentAt = dataConsent ? new Date() : null;
  }

  if (optedInReminders !== undefined) {
    updateData.optedInReminders = optedInReminders;
  }

  if (optedInMarketing !== undefined) {
    updateData.optedInMarketing = optedInMarketing;
  }

  if (communicationPreference !== undefined) {
    if (!['email', 'sms', 'both', 'none'].includes(communicationPreference)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PREFERENCE', message: 'Communication preference must be: email, sms, both, or none' }
      });
    }
    updateData.communicationPreference = communicationPreference;
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({
      success: false,
      error: { code: 'NO_CHANGES', message: 'No valid fields to update' }
    });
  }

  const updatedClient = await prisma.client.update({
    where: { id: client.id },
    data: updateData,
    select: {
      dataConsentGiven: true,
      dataConsentAt: true,
      optedInReminders: true,
      optedInMarketing: true,
      communicationPreference: true
    }
  });

  return res.status(200).json({
    success: true,
    data: {
      message: 'Consent preferences updated successfully',
      dataConsent: {
        given: updatedClient.dataConsentGiven,
        date: updatedClient.dataConsentAt
      },
      communicationPreferences: {
        method: updatedClient.communicationPreference,
        reminders: updatedClient.optedInReminders,
        marketing: updatedClient.optedInMarketing
      }
    }
  });
}));
