'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, Calendar, DollarSign, UserPlus, Star, Settings } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'booking' | 'payment' | 'client' | 'review' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

// Mock notifications - in a real app, these would come from an API
const mockNotifications: Notification[] = [
  // For now, empty to show "no notifications" state
  // Uncomment below to test with notifications:
  // {
  //   id: '1',
  //   type: 'booking',
  //   title: 'New Booking',
  //   message: 'Sarah Johnson booked a Haircut for tomorrow at 2 PM',
  //   time: '5 min ago',
  //   read: false,
  // },
  // {
  //   id: '2',
  //   type: 'payment',
  //   title: 'Payment Received',
  //   message: '$85 received from Michael Chen',
  //   time: '1 hour ago',
  //   read: false,
  // },
];

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'booking':
      return Calendar;
    case 'payment':
      return DollarSign;
    case 'client':
      return UserPlus;
    case 'review':
      return Star;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'booking':
      return 'bg-sage/20 text-sage';
    case 'payment':
      return 'bg-mint/20 text-mint-dark';
    case 'client':
      return 'bg-lavender/20 text-lavender-dark';
    case 'review':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-charcoal/10 text-charcoal';
  }
};

interface NotificationDropdownProps {
  className?: string;
}

export function NotificationDropdown({ className = '' }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-text-muted dark:text-white/60 hover:text-charcoal dark:hover:text-white relative"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full border-2 border-white dark:border-sidebar" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-sidebar rounded-xl shadow-lg border border-charcoal/10 dark:border-white/10 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-charcoal/10 dark:border-white/10 flex items-center justify-between">
            <h3 className="font-semibold text-charcoal dark:text-white">Notifications</h3>
            {notifications.length > 0 && unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-sage hover:text-sage-dark font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-10 h-10 text-charcoal/20 dark:text-white/20 mx-auto mb-3" />
                <p className="text-text-muted dark:text-white/60 font-medium">No notifications</p>
                <p className="text-sm text-text-muted dark:text-white/40 mt-1">
                  You&apos;re all caught up!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-charcoal/5 dark:divide-white/5">
                {notifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors ${
                        !notification.read ? 'bg-sage/5' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getNotificationColor(
                            notification.type
                          )}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-charcoal dark:text-white text-sm">
                              {notification.title}
                            </p>
                            <button
                              onClick={() => clearNotification(notification.id)}
                              className="text-charcoal/30 dark:text-white/30 hover:text-charcoal/60 dark:hover:text-white/60 flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-sm text-text-muted dark:text-white/60 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs text-text-muted dark:text-white/40">
                              {notification.time}
                            </span>
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-sage hover:text-sage-dark font-medium flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                Mark as read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-charcoal/10 dark:border-white/10 bg-charcoal/5 dark:bg-white/5">
            <Link
              href="/settings?tab=notifications"
              className="text-sm text-text-muted dark:text-white/60 hover:text-charcoal dark:hover:text-white flex items-center justify-center gap-2"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4" />
              Notification Settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
