'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, isAuthenticated } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  // Auto-login on page load if not authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/dashboard');
    } else {
      // Auto-login with demo credentials
      const autoLogin = async () => {
        try {
          await login('demo@salon.com', 'demo123');
          router.push('/dashboard');
        } catch (err) {
          console.log('Auto-login will use manual form');
        }
      };
      autoLogin();
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');

    if (!email || !password) {
      setFormError('Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setFormError('Login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-soft-peach/20 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-soft-lavender/15 rounded-full blur-3xl opacity-30" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-card-lg p-8 lg:p-10 space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-sage/10">
              <LogIn size={24} className="text-sage" />
            </div>
            <h1 className="text-section-xl font-display font-bold text-charcoal">
              Welcome back
            </h1>
            <p className="text-body text-charcoal/60">
              Sign in to your account to continue
            </p>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="p-4 rounded-lg bg-sage/10 border border-sage/30 flex items-center gap-3">
              <Loader2 size={18} className="text-sage animate-spin" />
              <p className="text-small font-medium text-sage">Signing in...</p>
            </div>
          )}

          {/* Error state */}
          {(formError || error) && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-small text-red-700">{formError || error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-small font-medium text-charcoal"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="your@salon.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-lg border border-charcoal/10 bg-white/50 backdrop-blur-sm text-charcoal placeholder:text-charcoal/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-small font-medium text-charcoal"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-lg border border-charcoal/10 bg-white/50 backdrop-blur-sm text-charcoal placeholder:text-charcoal/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg bg-sage text-white font-semibold transition-all duration-300 hover:shadow-hover hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Sign in</span>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-charcoal/0 via-charcoal/10 to-charcoal/0" />

          {/* Sign up link */}
          <p className="text-center text-body text-charcoal/60">
            Don't have an account?{' '}
            <Link
              href="/signup"
              className="font-semibold text-sage hover:text-sage/80 transition-colors"
            >
              Sign up
            </Link>
          </p>

          {/* Demo info */}
          {!isLoading && !formError && !error && (
            <div className="text-center text-xs text-charcoal/40 space-y-2 pt-4 border-t border-charcoal/10">
              <p>Auto-login will attempt to sign in with demo credentials</p>
              <p>Email: demo@salon.com | Password: demo123</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
