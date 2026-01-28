'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Check,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Password requirements
  const passwordRequirements = [
    { label: 'At least 8 characters', met: formData.password.length >= 8 },
    { label: 'Contains a number', met: /\d/.test(formData.password) },
    { label: 'Contains a letter', met: /[a-zA-Z]/.test(formData.password) },
  ];

  const allRequirementsMet = passwordRequirements.every((req) => req.met);
  const passwordsMatch =
    formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

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
    if (!token) {
      setErrors({ submit: 'Invalid or missing reset token' });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Something went wrong');
      }

      setIsSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      if (err instanceof Error) {
        setErrors({ submit: err.message });
      } else {
        setErrors({ submit: 'An error occurred. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Check for token on mount
  if (!token) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-error" />
        </div>
        <h1 className="text-2xl font-display font-bold text-charcoal dark:text-white mb-3">
          Invalid Reset Link
        </h1>
        <p className="text-charcoal/60 dark:text-gray-400 mb-8">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-sage text-white font-semibold hover:bg-sage-dark transition-colors"
        >
          Request New Link
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h1 className="text-2xl font-display font-bold text-charcoal dark:text-white mb-3">
          Password Reset Complete
        </h1>
        <p className="text-charcoal/60 dark:text-gray-400 mb-6">
          Your password has been successfully reset. You can now sign in with your new password.
        </p>
        <p className="text-sm text-charcoal/50 dark:text-gray-500 mb-8">
          Redirecting you to sign in...
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-sage text-white font-semibold hover:bg-sage-dark transition-colors"
        >
          Sign in now
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-display font-bold text-charcoal dark:text-white mb-2">
          Create new password
        </h1>
        <p className="text-charcoal/60 dark:text-gray-400">
          Enter a new password for your account
        </p>
      </div>

      {/* Error Message */}
      {errors.submit && (
        <div className="mb-6 p-4 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
          {errors.submit}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-charcoal dark:text-white mb-2">
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40 dark:text-gray-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter new password"
              required
              className={`w-full pl-12 pr-12 py-3 rounded-lg border bg-white/50 dark:bg-zinc-700/50 text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage transition-all ${
                errors.password ? 'border-error' : 'border-charcoal/10 dark:border-white/10'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/40 dark:text-gray-500 hover:text-charcoal dark:hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1.5 text-sm text-error">{errors.password}</p>
          )}

          {/* Password Requirements */}
          <div className="mt-3 space-y-1.5">
            {passwordRequirements.map((req) => (
              <div
                key={req.label}
                className={`flex items-center gap-2 text-sm ${
                  req.met ? 'text-success' : 'text-charcoal/50 dark:text-gray-500'
                }`}
              >
                <Check className={`w-4 h-4 ${req.met ? 'opacity-100' : 'opacity-40'}`} />
                {req.label}
              </div>
            ))}
          </div>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-charcoal dark:text-white mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal/40 dark:text-gray-500" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
              required
              className={`w-full pl-12 pr-12 py-3 rounded-lg border bg-white/50 dark:bg-zinc-700/50 text-charcoal dark:text-white placeholder:text-charcoal/40 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage transition-all ${
                errors.confirmPassword ? 'border-error' : 'border-charcoal/10 dark:border-white/10'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/40 dark:text-gray-500 hover:text-charcoal dark:hover:text-white transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1.5 text-sm text-error">{errors.confirmPassword}</p>
          )}
          {passwordsMatch && (
            <p className="mt-1.5 text-sm text-success flex items-center gap-1">
              <Check className="w-4 h-4" />
              Passwords match
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !allRequirementsMet}
          className="w-full py-3 rounded-lg bg-sage text-white font-semibold hover:bg-sage-dark hover:shadow-hover hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Resetting password...
            </>
          ) : (
            <>
              Reset Password
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {/* Back to Login */}
      <p className="mt-8 text-center text-sm text-charcoal/60 dark:text-gray-400">
        Remember your password?{' '}
        <Link href="/login" className="text-sage font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}

function LoadingFallback() {
  return (
    <div className="text-center py-8">
      <Loader2 className="w-8 h-8 animate-spin text-sage mx-auto" />
      <p className="mt-4 text-charcoal/60 dark:text-gray-400">Loading...</p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-cream dark:bg-zinc-900 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors">
      {/* Decorative Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-soft-peach/30 dark:bg-sage/20 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-soft-lavender/20 dark:bg-lavender/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-sage/10 dark:bg-sage/5 rounded-full blur-3xl opacity-40" />
      </div>

      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 mb-8 relative z-10 animate-fade-in"
      >
        <div className="w-10 h-10 rounded-xl bg-sage flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-display font-bold text-charcoal dark:text-white">Peacase</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm rounded-2xl border border-white/60 dark:border-white/10 shadow-card-xl p-8">
          <Suspense fallback={<LoadingFallback />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>

      {/* Back to Home */}
      <Link
        href="/"
        className="mt-8 text-sm text-charcoal/50 dark:text-gray-500 hover:text-charcoal dark:hover:text-white transition-colors relative z-10"
      >
        Back to home
      </Link>
    </div>
  );
}
