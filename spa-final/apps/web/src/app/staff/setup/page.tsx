'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useStaffAuth } from '@/contexts/StaffAuthContext';

function SetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setTokens, setStaff } = useStaffAuth();

  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Password validation
  const passwordRequirements = [
    { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
    { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
    { test: (p: string) => /[a-z]/.test(p), label: 'One lowercase letter' },
    { test: (p: string) => /[0-9]/.test(p), label: 'One number' },
  ];

  const allRequirementsMet = passwordRequirements.every(r => r.test(password));
  const passwordsMatch = password === confirmPassword && password.length > 0;

  // If no token, show error
  if (!token) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-soft border border-charcoal/5 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-rose-500" />
            </div>
            <h1 className="text-2xl font-bold text-charcoal mb-2">Invalid Link</h1>
            <p className="text-charcoal/60 mb-6">
              This invitation link is invalid or has expired. Please contact your manager for a new invite.
            </p>
            <Link
              href="/staff/login"
              className="inline-block px-6 py-3 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!allRequirementsMet) {
      setError('Please meet all password requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/v1/staff-portal/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to set up account');
      }

      // Store tokens and user data
      if (data.data.tokens) {
        setTokens(data.data.tokens.accessToken, data.data.tokens.refreshToken);
      }
      if (data.data.user) {
        setStaff({
          id: data.data.user.id,
          email: data.data.user.email,
          firstName: data.data.user.firstName,
          lastName: data.data.user.lastName,
          role: data.data.user.role,
          salonId: data.data.salon?.id || '',
          salonName: data.data.salon?.name || '',
        });
      }

      setSuccess(true);

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/staff/dashboard');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-soft border border-charcoal/5 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-sage/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-sage" />
            </div>
            <h1 className="text-2xl font-bold text-charcoal mb-2">Account Set Up!</h1>
            <p className="text-charcoal/60 mb-4">
              Your password has been set. Redirecting you to your dashboard...
            </p>
            <Loader2 className="w-6 h-6 text-sage animate-spin mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-sage flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <span className="text-2xl font-display font-bold text-charcoal">Peacase</span>
                <span className="block text-sm text-charcoal/60">Staff Portal</span>
              </div>
            </Link>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-soft border border-charcoal/5 p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-charcoal mb-2">Set Up Your Account</h1>
              <p className="text-charcoal/60">Create a password to access your staff portal</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-2">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    required
                    className="w-full pl-12 pr-12 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Requirements */}
                {password.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {passwordRequirements.map((req, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${req.test(password) ? 'bg-sage/20' : 'bg-charcoal/10'}`}>
                          {req.test(password) && <CheckCircle className="w-3 h-3 text-sage" />}
                        </div>
                        <span className={req.test(password) ? 'text-sage' : 'text-charcoal/50'}>{req.label}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-charcoal mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    className={`w-full pl-12 pr-12 py-3 rounded-xl border outline-none transition-all ${
                      confirmPassword.length > 0
                        ? passwordsMatch
                          ? 'border-sage focus:ring-2 focus:ring-sage/20'
                          : 'border-rose-300 focus:ring-2 focus:ring-rose-100'
                        : 'border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20'
                    }`}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <p className="mt-2 text-sm text-rose-500">Passwords do not match</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !allRequirementsMet || !passwordsMatch}
                className="w-full py-3 px-4 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Setting up account...
                  </>
                ) : (
                  'Set Up Account'
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-charcoal/40">
            Already have an account?{' '}
            <Link href="/staff/login" className="text-sage hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-sage/20 via-lavender/20 to-sage/10 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-24 h-24 rounded-3xl bg-white/80 backdrop-blur flex items-center justify-center mx-auto mb-8 shadow-lg">
            <Sparkles className="w-12 h-12 text-sage" />
          </div>
          <h2 className="text-3xl font-display font-bold text-charcoal mb-4">
            Welcome to the team!
          </h2>
          <p className="text-charcoal/60 text-lg">
            Set up your account to access your schedule, track earnings, and manage your availability.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function StaffSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-sage flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-8 h-8 text-sage animate-spin mx-auto" />
        </div>
      </div>
    }>
      <SetupForm />
    </Suspense>
  );
}
