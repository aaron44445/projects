'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Menu, Sparkles } from 'lucide-react';
import { useStaffAuth } from '@/contexts/StaffAuthContext';

interface StaffHeaderProps {
  onMenuClick?: () => void;
}

export function StaffHeader({ onMenuClick }: StaffHeaderProps) {
  const router = useRouter();
  const { staff, logout, isAuthenticated } = useStaffAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/staff/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect even if API call fails - local state is cleared
      router.push('/staff/login');
    }
  };

  // Don't render header for unauthenticated users
  if (!isAuthenticated || !staff) {
    return null;
  }

  return (
    <header className="bg-white border-b border-charcoal/10 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Menu button and Logo */}
          <div className="flex items-center gap-3">
            {onMenuClick && (
              <button
                onClick={onMenuClick}
                className="p-2 text-charcoal/60 hover:text-charcoal lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6" />
              </button>
            )}
            <Link href="/staff/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sage flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="font-display font-bold text-lg text-charcoal">Peacase</span>
                <span className="ml-2 text-xs bg-sage/10 text-sage px-2 py-0.5 rounded-full">
                  Staff
                </span>
              </div>
            </Link>
          </div>

          {/* Right side - User info and Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-charcoal">
                {staff.firstName} {staff.lastName}
              </p>
              <p className="text-xs text-charcoal/60">{staff.salonName}</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2 px-3 py-2 text-sm text-charcoal/70 hover:text-charcoal hover:bg-charcoal/5 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isLoggingOut ? 'Logging out...' : 'Log out'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
