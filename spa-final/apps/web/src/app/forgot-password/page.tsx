'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Mail, ArrowRight, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Something went wrong');
      }

      setIsSubmitted(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

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

      {/* Card */}
      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-card-xl p-8">
          {isSubmitted ? (
            // Success State
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h1 className="text-2xl font-display font-bold text-charcoal mb-3">
                Check your email
              </h1>
              <p className="text-charcoal/60 mb-6">
                If an account exists with <span className="font-medium text-charcoal">{email}</span>,
                you will receive a password reset link shortly.
              </p>
              <p className="text-sm text-charcoal/50 mb-8">
                The link will expire in 1 hour. If you do not see the email, check your spam folder.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sage hover:text-sage-dark font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </div>
          ) : (
            // Form State
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-display font-bold text-charcoal mb-2">
                  Forgot your password?
                </h1>
                <p className="text-charcoal/60">
                  Enter your email and we will send you a reset link
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-12 pr-4 py-3 rounded-lg border border-charcoal/10 bg-white/50 text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage transition-all"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-lg bg-sage text-white font-semibold hover:bg-sage-dark hover:shadow-hover hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send reset link
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              {/* Back to Login */}
              <p className="mt-8 text-center text-sm text-charcoal/60">
                Remember your password?{' '}
                <Link href="/login" className="text-sage font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Back to Home */}
      <Link
        href="/"
        className="mt-8 text-sm text-charcoal/50 hover:text-charcoal transition-colors relative z-10"
      >
        Back to home
      </Link>
    </div>
  );
}
