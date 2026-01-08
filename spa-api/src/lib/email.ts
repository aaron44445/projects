import { config } from '../config/index.js';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email (stub - implement with real provider later)
 * For development, just logs the email
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  if (config.env === 'development') {
    console.log('='.repeat(50));
    console.log('EMAIL (dev mode - not actually sent)');
    console.log('='.repeat(50));
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log('Body:', options.html);
    console.log('='.repeat(50));
    return;
  }

  // TODO: Implement real email sending with SMTP/SendGrid/etc.
  // For now, throw an error in production if email is not configured
  if (!config.email.host) {
    console.warn('Email not configured - skipping send');
    return;
  }

  // Implementation would go here
  throw new Error('Email sending not implemented for production');
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  orgSlug: string
): Promise<void> {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Verify your email address',
    html: `
      <h1>Welcome to Spa Management!</h1>
      <p>Please click the link below to verify your email address:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
    `,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Reset your password',
    html: `
      <h1>Password Reset Request</h1>
      <p>Click the link below to reset your password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request a password reset, you can safely ignore this email.</p>
    `,
  });
}

/**
 * Send team invitation email
 */
export async function sendInvitationEmail(
  email: string,
  token: string,
  orgName: string,
  inviterName: string
): Promise<void> {
  const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/accept-invite?token=${token}`;

  await sendEmail({
    to: email,
    subject: `You've been invited to join ${orgName}`,
    html: `
      <h1>Team Invitation</h1>
      <p>${inviterName} has invited you to join <strong>${orgName}</strong> on Spa Management.</p>
      <p>Click the link below to accept the invitation and create your account:</p>
      <p><a href="${inviteUrl}">${inviteUrl}</a></p>
      <p>This invitation will expire in 7 days.</p>
    `,
  });
}
