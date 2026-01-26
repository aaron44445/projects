'use client';

import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Calendar,
  DollarSign,
  CalendarOff,
  User,
  LogOut,
  X,
  Sparkles,
} from 'lucide-react';
import { useStaffAuth } from '@/contexts/StaffAuthContext';

interface StaffPortalSidebarProps {
  sidebarOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { href: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/staff/schedule', label: 'My Schedule', icon: Calendar },
  { href: '/staff/earnings', label: 'Earnings', icon: DollarSign },
  { href: '/staff/time-off', label: 'Time Off', icon: CalendarOff },
  { href: '/staff/profile', label: 'Profile', icon: User },
];

export function StaffPortalSidebar({ sidebarOpen, onClose }: StaffPortalSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { staff, logout } = useStaffAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/staff/login');
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-charcoal/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-sidebar transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-6 border-b border-white/10">
            <Link href="/staff/dashboard" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-sage flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-display font-bold text-white">Peacase</span>
                <span className="block text-xs text-white/50">Staff Portal</span>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="p-2 text-white/60 hover:text-white lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Staff Info */}
          {staff && (
            <div className="px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sage/30 flex items-center justify-center flex-shrink-0">
                  {staff.avatarUrl ? (
                    <img
                      src={staff.avatarUrl}
                      alt={`${staff.firstName} ${staff.lastName}`}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sage font-semibold text-sm">
                      {staff.firstName[0]}{staff.lastName[0]}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {staff.firstName} {staff.lastName}
                  </p>
                  <p className="text-xs text-white/50 truncate">{staff.salonName}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                    ${active
                      ? 'bg-sage text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-3 py-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
