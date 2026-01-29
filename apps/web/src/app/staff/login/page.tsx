'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useStaffAuth } from '@/contexts/StaffAuthContext';

export default function StaffLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useStaffAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/staff/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password, rememberMe);
      router.push('/staff/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-sage flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <Loader2 className="w-8 h-8 text-sage animate-spin mx-auto" />
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
              <h1 className="text-2xl font-bold text-charcoal mb-2">Welcome back</h1>
              <p className="text-charcoal/60">Sign in to access your schedule and more</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@salon.com"
                    required
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
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
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-charcoal/30 text-sage focus:ring-sage/20"
                  disabled={isSubmitting}
                />
                <label htmlFor="rememberMe" className="ml-2 text-sm text-charcoal/70">
                  Stay logged in on this device
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !email || !password}
                className="w-full py-3 px-4 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            {/* Help Text */}
            <p className="mt-6 text-center text-sm text-charcoal/60">
              Having trouble signing in?{' '}
              <span className="text-sage font-medium">Contact your manager</span>
            </p>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-charcoal/40">
            Staff portal for authorized employees only.
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
            Your workspace awaits
          </h2>
          <p className="text-charcoal/60 text-lg">
            View your schedule, track earnings, request time off, and manage your profile - all in one place.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="bg-white/60 backdrop-blur rounded-xl p-4 text-left">
              <div className="w-10 h-10 rounded-lg bg-sage/20 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-medium text-charcoal">My Schedule</p>
              <p className="text-sm text-charcoal/60">View appointments</p>
            </div>
            <div className="bg-white/60 backdrop-blur rounded-xl p-4 text-left">
              <div className="w-10 h-10 rounded-lg bg-lavender/30 flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-lavender-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-medium text-charcoal">Earnings</p>
              <p className="text-sm text-charcoal/60">Track your income</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
