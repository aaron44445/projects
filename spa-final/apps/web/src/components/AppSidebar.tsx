'use client';

import Link from 'next/link';
import {
  Home,
  Calendar,
  Users,
  Scissors,
  Settings,
  BarChart3,
  LogOut,
  Sparkles,
  Star,
  Gift,
  CreditCard,
} from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';

const baseNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Services', href: '/services', icon: Scissors },
  { name: 'Staff', href: '/staff', icon: Users },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface AppSidebarProps {
  currentPage?: string;
  sidebarOpen: boolean;
  onClose: () => void;
}

export function AppSidebar({ currentPage, sidebarOpen, onClose }: AppSidebarProps) {
  const { hasAddOn } = useSubscription();

  // Build navigation with add-ons integrated
  const navigation = [...baseNavigation];

  // Add add-on items after Reports (index 5) but before Settings
  const addOnItems = [];
  if (hasAddOn('marketing')) addOnItems.push({ name: 'Marketing', href: '/marketing', icon: Sparkles });
  if (hasAddOn('reviews')) addOnItems.push({ name: 'Reviews', href: '/reviews', icon: Star });
  if (hasAddOn('gift_cards')) addOnItems.push({ name: 'Gift Cards', href: '/gift-cards', icon: Gift });
  if (hasAddOn('memberships')) addOnItems.push({ name: 'Packages', href: '/packages', icon: CreditCard });

  // Insert add-on items before Settings
  if (addOnItems.length > 0) {
    navigation.splice(6, 0, ...addOnItems);
  }

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-charcoal/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-charcoal/10 transform transition-transform duration-300 lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-charcoal/10">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sage to-sage-dark flex items-center justify-center">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <span className="font-display font-bold text-xl text-charcoal">peacase</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isCurrent = currentPage === item.name.toLowerCase() || currentPage === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isCurrent
                      ? 'bg-sage text-white'
                      : 'text-charcoal/70 hover:bg-sage/10 hover:text-sage'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-charcoal/10">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-sage/20 flex items-center justify-center">
                <span className="text-sage font-semibold">JD</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-charcoal truncate">Jane Doe</p>
                <p className="text-sm text-charcoal/60 truncate">Owner</p>
              </div>
              <button className="p-2 text-charcoal/40 hover:text-charcoal transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
