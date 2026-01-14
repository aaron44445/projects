'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Building2,
  Phone,
  Globe,
  Check,
  Shield,
  Zap,
  Clock,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona (no DST)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

export default function SignupPage() {
  const router = useRouter();
  const { register, resendVerificationEmail } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [formData, setFormData] = useState({
    salonName: '',
    email: '',
    phone: '',
    timezone: 'America/Chicago',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.salonName.trim()) {
      newErrors.salonName = 'Salon name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await register(
        formData.salonName,
        formData.email,
        formData.password,
        formData.phone,
        formData.timezone
      );

      if (result.requiresVerification) {
        setShowVerificationMessage(true);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      if (err instanceof Error) {
        setErrors({ submit: err.message });
      } else {
        setErrors({ submit: 'Something went wrong. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendSuccess(false);

    try {
      await resendVerificationEmail(formData.email);
      setResendSuccess(true);
    } catch {
      // Still show success to prevent email enumeration
      setResendSuccess(true);
    } finally {
      setIsResending(false);
    }
  };

  const handleContinueToDashboard = () => {
    router.push('/dashboard');
  };

  const isFieldValid = (field: string) => {
    const value = formData[field as keyof typeof formData];
    if (!value) return false;

    switch (field) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'password':
        return value.length >= 8;
      case 'confirmPassword':
        return value === formData.password && value.length > 0;
      default:
        return value.trim().length > 0;
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Decorative Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-soft-peach/30 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-soft-lavender/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-sage/10 rounded-full blur-3xl opacity-40" />
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

      {/* Signup Card */}
      <div className="w-full max-w-lg relative z-10 animate-slide-up">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-card-xl p-8">
          {/* Verification Message */}
          {showVerificationMessage ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h1 className="text-2xl font-display font-bold text-charcoal mb-2">
                Check your email
              </h1>
              <p className="text-charcoal/60 mb-6">
                We've sent a verification link to <strong>{formData.email}</strong>.
                Please click the link to verify your account.
              </p>

              <div className="p-4 rounded-lg bg-sage/5 border border-sage/20 mb-6">
                <p className="text-sm text-charcoal/70">
                  Didn't receive the email? Check your spam folder or click below to resend.
                </p>
              </div>

              <div className="space-y-3">
                {!resendSuccess ? (
                  <button
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="w-full py-3 rounded-lg border border-sage text-sage font-semibold hover:bg-sage/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5" />
                        Resend verification email
                      </>
                    )}
                  </button>
                ) : (
                  <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-success text-sm">
                    Verification email sent! Check your inbox.
                  </div>
                )}

                <button
                  onClick={handleContinueToDashboard}
                  className="w-full py-3 rounded-lg bg-sage text-white font-semibold hover:bg-sage-dark transition-all flex items-center justify-center gap-2"
                >
                  Continue to Dashboard
                  <ArrowRight className="w-5 h-5" />
                </button>

                <p className="text-xs text-charcoal/50 mt-4">
                  You can continue using Peacase, but some features may be limited until you verify your email.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex p-3 rounded-xl bg-sage/10 text-sage mb-4">
                  <Building2 className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-display font-bold text-charcoal mb-2">
                  Create your salon account
                </h1>
                <p className="text-charcoal/60">
                  Get started with your 14-day free trial
                </p>
              </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
              {errors.submit}
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Salon Name */}
            <div>
              <label htmlFor="salonName" className="block text-sm font-medium text-charcoal mb-2">
                Salon / Business Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                <input
                  type="text"
                  id="salonName"
                  value={formData.salonName}
                  onChange={(e) => setFormData({ ...formData, salonName: e.target.value })}
                  placeholder="Your Salon Name"
                  className={`w-full pl-12 pr-10 py-3 rounded-lg border bg-white/50 text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage transition-all ${
                    errors.salonName ? 'border-error' : 'border-charcoal/10'
                  }`}
                />
                {isFieldValid('salonName') && (
                  <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-success" />
                )}
              </div>
              {errors.salonName && (
                <p className="mt-1.5 text-sm text-error">{errors.salonName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className={`w-full pl-12 pr-10 py-3 rounded-lg border bg-white/50 text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage transition-all ${
                    errors.email ? 'border-error' : 'border-charcoal/10'
                  }`}
                />
                {isFieldValid('email') && (
                  <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-success" />
                )}
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-error">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-charcoal mb-2">
                Phone number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                <input
                  type="tel"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className={`w-full pl-12 pr-10 py-3 rounded-lg border bg-white/50 text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage transition-all ${
                    errors.phone ? 'border-error' : 'border-charcoal/10'
                  }`}
                />
                {isFieldValid('phone') && (
                  <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-success" />
                )}
              </div>
              {errors.phone && (
                <p className="mt-1.5 text-sm text-error">{errors.phone}</p>
              )}
            </div>

            {/* Timezone */}
            <div>
              <label htmlFor="timezone" className="block text-sm font-medium text-charcoal mb-2">
                Timezone
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                <select
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-charcoal/10 bg-white/50 text-charcoal focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage transition-all appearance-none"
                >
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="At least 8 characters"
                  className={`w-full pl-12 pr-12 py-3 rounded-lg border bg-white/50 text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage transition-all ${
                    errors.password ? 'border-error' : 'border-charcoal/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-error">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-charcoal mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm your password"
                  className={`w-full pl-12 pr-12 py-3 rounded-lg border bg-white/50 text-charcoal placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage transition-all ${
                    errors.confirmPassword ? 'border-error' : 'border-charcoal/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/40 hover:text-charcoal transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-sm text-error">{errors.confirmPassword}</p>
              )}
              {isFieldValid('confirmPassword') && (
                <p className="mt-1.5 text-sm text-success flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Passwords match
                </p>
              )}
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
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Trust Indicators */}
          <div className="mt-8 pt-6 border-t border-charcoal/10">
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-charcoal/50">
              <div className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                <span>Secure & encrypted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          {/* Sign In Link */}
          <p className="mt-6 text-center text-sm text-charcoal/60">
            Already have an account?{' '}
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
