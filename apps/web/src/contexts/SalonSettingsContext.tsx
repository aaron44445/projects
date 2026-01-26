'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useSalon, Salon } from '@/hooks/useSalon';
import {
  formatCurrency as formatCurrencyUtil,
  formatDate as formatDateUtil,
  formatTime as formatTimeUtil,
  formatDateTime as formatDateTimeUtil,
  formatAddress as formatAddressUtil,
  getWeekDays as getWeekDaysUtil,
  getWeekStart as getWeekStartUtil,
  getWeekEnd as getWeekEndUtil,
  CurrencyCode,
  DateFormatStyle,
  TimeFormatStyle,
} from '@/lib/i18n';

interface SalonSettingsContextType {
  salon: Salon | null;
  loading: boolean;
  error: string | null;
  // Formatting functions that use salon settings
  formatPrice: (amount: number) => string;
  formatDate: (date: Date | string) => string;
  formatDateLong: (date: Date | string) => string;
  formatTime: (time: string | Date) => string;
  formatDateTime: (date: Date | string) => string;
  formatAddress: (address: {
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    country?: string | null;
  }) => string;
  getWeekDays: (format?: 'short' | 'long' | 'narrow') => string[];
  getWeekStart: (date: Date) => Date;
  getWeekEnd: (date: Date) => Date;
  // Settings
  currency: CurrencyCode;
  locale: string;
  timeFormat: TimeFormatStyle;
  dateFormat: DateFormatStyle;
  weekStartsOn: number;
  taxEnabled: boolean;
  taxRate: number | null;
  taxName: string;
  taxIncluded: boolean;
  vatNumber: string | null;
  // Update function
  updateSalon: (data: Partial<Salon>) => Promise<Salon>;
  refetch: () => Promise<void>;
}

const SalonSettingsContext = createContext<SalonSettingsContextType | undefined>(undefined);

export function SalonSettingsProvider({ children }: { children: ReactNode }) {
  const { salon, loading, error, updateSalon, fetchSalon } = useSalon();

  // Default settings when salon is not loaded yet
  const currency = (salon?.currency || 'USD') as CurrencyCode;
  const locale = salon?.locale || 'en';
  const timeFormat = (salon?.timeFormat || '24h') as TimeFormatStyle;
  const dateFormat = (salon?.dateFormat || 'DMY') as DateFormatStyle;
  const weekStartsOn = salon?.weekStartsOn ?? 1;
  const taxEnabled = salon?.taxEnabled ?? false;
  const taxRate = salon?.taxRate ?? null;
  const taxName = salon?.taxName || 'VAT';
  const taxIncluded = salon?.taxIncluded ?? true;
  const vatNumber = salon?.vatNumber ?? null;

  // Formatting functions with salon context
  const formatPrice = (amount: number): string => {
    return formatCurrencyUtil(amount, currency, locale);
  };

  const formatDate = (date: Date | string): string => {
    return formatDateUtil(date, dateFormat, locale);
  };

  const formatDateLong = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';

    try {
      return d.toLocaleDateString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return formatDateUtil(d, dateFormat, locale);
    }
  };

  const formatTime = (time: string | Date): string => {
    return formatTimeUtil(time, timeFormat);
  };

  const formatDateTime = (date: Date | string): string => {
    return formatDateTimeUtil(date, { dateFormat, timeFormat, locale });
  };

  const formatAddress = formatAddressUtil;

  const getWeekDays = (format: 'short' | 'long' | 'narrow' = 'short'): string[] => {
    return getWeekDaysUtil(weekStartsOn, locale, format);
  };

  const getWeekStart = (date: Date): Date => {
    return getWeekStartUtil(date, weekStartsOn);
  };

  const getWeekEnd = (date: Date): Date => {
    return getWeekEndUtil(date, weekStartsOn);
  };

  const value: SalonSettingsContextType = {
    salon,
    loading,
    error,
    formatPrice,
    formatDate,
    formatDateLong,
    formatTime,
    formatDateTime,
    formatAddress,
    getWeekDays,
    getWeekStart,
    getWeekEnd,
    currency,
    locale,
    timeFormat,
    dateFormat,
    weekStartsOn,
    taxEnabled,
    taxRate,
    taxName,
    taxIncluded,
    vatNumber,
    updateSalon,
    refetch: fetchSalon,
  };

  return (
    <SalonSettingsContext.Provider value={value}>
      {children}
    </SalonSettingsContext.Provider>
  );
}

export function useSalonSettings() {
  const context = useContext(SalonSettingsContext);
  if (context === undefined) {
    throw new Error('useSalonSettings must be used within a SalonSettingsProvider');
  }
  return context;
}

/**
 * Hook for components that only need price formatting
 * (Lighter weight alternative when you don't need all salon settings)
 */
export function usePriceFormatter() {
  const { formatPrice, currency } = useSalonSettings();
  return { formatPrice, currency };
}
