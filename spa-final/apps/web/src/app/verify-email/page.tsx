'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired' | 'no-token';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await api.post<{
        message: string;
        user: { email: string };
      }>('/auth/verify-email', { token: verificationToken });

      if (response.success) {
        setStatus('success');
      }
    } catch (error: unknown) {
      const apiError = error as { code?: string; message?: string };
      if (apiError.code === 'TOKEN_EXPIRED') {
        setStatus('expired');
        setErrorMessage('Your verification link has expired. Please request a new one.');
      } else {
        setStatus('error');
        setErrorMessage(apiError.message || 'Failed to verify your email. The link may be invalid.');
      }
    }
  };

  const handleResendVerification = async () => {
    if (!userEmail) return;

    setIsResending(true);
    setResendSuccess(false);

    try {
      await api.post('/auth/resend-verification', { email: userEmail });
      setResendSuccess(true);
    } catch {
      // Still show success to prevent email enumeration
      setResendSuccess(true);
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-sage/10 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-sage animate-spin" />
            </div>
            <h1 className="text-2xl font-display font-bold text-charcoal mb-2">
              Verifying your email...
            </h1>
            <p className="text-charcoal/60">
              Please wait while we verify your email address.
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-success" />
            </div>
            <h1 className="text-2xl font-display font-bold text-charcoal mb-2">
              Email verified!
            </h1>
            <p className="text-charcoal/60 mb-8">
              Your email has been successfully verified. You can now access all features of your Peacase account.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-sage text-white rounded-lg font-semibold hover:bg-sage-dark transition-all"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        );

      case 'expired':
        return (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-6">
              <RefreshCw className="w-8 h-8 text-warning" />
            </div>
            <h1 className="text-2xl font-display font-bold text-charcoal mb-2">
              Link expired
            </h1>
            <p className="text-charcoal/60 mb-6">
              {errorMessage}
            </p>

            {!resendSuccess ? (
              <div className="space-y-4">
                <p className="text-sm text-charcoal/60">
                  Enter your email to receive a new verification link:
                </p>
                <div className="flex gap-3 max-w-md mx-auto">
                  <div className="relative flex-1">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-12 pr-4 py-3 rounded-lg border border-charcoal/10 bg-white/50 text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage transition-all"
                    />
                  </div>
                  <button
                    onClick={handleResendVerification}
                    disabled={isResending || !userEmail}
                    className="px-6 py-3 bg-sage text-white rounded-lg font-semibold hover:bg-sage-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isResending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Send'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-success text-sm">
                If an account exists with this email, a new verification link has been sent.
              </div>
            )}
          </div>
        );

      case 'error':
        return (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-8 h-8 text-error" />
            </div>
            <h1 className="text-2xl font-display font-bold text-charcoal mb-2">
              Verification failed
            </h1>
            <p className="text-charcoal/60 mb-6">
              {errorMessage}
            </p>

            {!resendSuccess ? (
              <div className="space-y-4">
                <p className="text-sm text-charcoal/60">
                  Need a new verification link? Enter your email:
                </p>
                <div className="flex gap-3 max-w-md mx-auto">
                  <div className="relative flex-1">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-12 pr-4 py-3 rounded-lg border border-charcoal/10 bg-white/50 text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage transition-all"
                    />
                  </div>
                  <button
                    onClick={handleResendVerification}
                    disabled={isResending || !userEmail}
                    className="px-6 py-3 bg-sage text-white rounded-lg font-semibold hover:bg-sage-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isResending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Send'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-success text-sm">
                If an account exists with this email, a new verification link has been sent.
              </div>
            )}
          </div>
        );

      case 'no-token':
        return (
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-charcoal/10 flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-charcoal/60" />
            </div>
            <h1 className="text-2xl font-display font-bold text-charcoal mb-2">
              No verification token
            </h1>
            <p className="text-charcoal/60 mb-6">
              Please use the verification link sent to your email, or request a new one below.
            </p>

            {!resendSuccess ? (
              <div className="space-y-4">
                <div className="flex gap-3 max-w-md mx-auto">
                  <div className="relative flex-1">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-12 pr-4 py-3 rounded-lg border border-charcoal/10 bg-white/50 text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage transition-all"
                    />
                  </div>
                  <button
                    onClick={handleResendVerification}
                    disabled={isResending || !userEmail}
                    className="px-6 py-3 bg-sage text-white rounded-lg font-semibold hover:bg-sage-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isResending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Send Link'
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-success text-sm">
                If an account exists with this email, a verification link has been sent.
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return renderContent();
}

function LoadingState() {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-sage/10 flex items-center justify-center mx-auto mb-6">
        <Loader2 className="w-8 h-8 text-sage animate-spin" />
      </div>
      <h1 className="text-2xl font-display font-bold text-charcoal mb-2">
        Loading...
      </h1>
      <p className="text-charcoal/60">
        Please wait while we load the verification page.
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-soft-peach/30 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-soft-lavender/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-sage/10 rounded-full blur-3xl opacity-40" />
      </div>

      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 mb-8 relative z-10 animate-fade-in"
      >
        <div className="w-10 h-10 rounded-xl bg-sage flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-display font-bold text-charcoal">Peacase</span>
      </Link>

      {/* Content Card */}
      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-card-xl p-8">
          <Suspense fallback={<LoadingState />}>
            <VerifyEmailContent />
          </Suspense>
        </div>
      </div>

      {/* Footer Links */}
      <div className="mt-8 flex gap-4 text-sm text-charcoal/50 relative z-10">
        <Link href="/login" className="hover:text-charcoal transition-colors">
          Sign in
        </Link>
        <span>|</span>
        <Link href="/signup" className="hover:text-charcoal transition-colors">
          Create account
        </Link>
        <span>|</span>
        <Link href="/" className="hover:text-charcoal transition-colors">
          Back to home
        </Link>
      </div>
    </div>
  );
}
