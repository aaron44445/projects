/**
 * Internationalization utilities for Peacase
 * Handles currency, date, time, and number formatting for multi-region support
 */

// Supported currencies with their display info
export const SUPPORTED_CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  DKK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
  PLN: { code: 'PLN', symbol: 'zł', name: 'Polish Zloty' },
  CZK: { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna' },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
} as const;

export type CurrencyCode = keyof typeof SUPPORTED_CURRENCIES;

// Supported locales mapped to their language/region
export const SUPPORTED_LOCALES = {
  en: { code: 'en', name: 'English', region: 'US' },
  'en-GB': { code: 'en-GB', name: 'English (UK)', region: 'GB' },
  de: { code: 'de', name: 'Deutsch', region: 'DE' },
  fr: { code: 'fr', name: 'Français', region: 'FR' },
  es: { code: 'es', name: 'Español', region: 'ES' },
  it: { code: 'it', name: 'Italiano', region: 'IT' },
  nl: { code: 'nl', name: 'Nederlands', region: 'NL' },
  pl: { code: 'pl', name: 'Polski', region: 'PL' },
  pt: { code: 'pt', name: 'Português', region: 'PT' },
} as const;

export type LocaleCode = keyof typeof SUPPORTED_LOCALES;

// Date format options
export type DateFormatStyle = 'DMY' | 'MDY' | 'YMD';
export type TimeFormatStyle = '12h' | '24h';

// All world timezones grouped by region
export const TIMEZONE_OPTIONS = [
  // Europe
  { value: 'Europe/London', label: 'London (GMT/BST)', region: 'Europe' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Brussels', label: 'Brussels (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Madrid', label: 'Madrid (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Rome', label: 'Rome (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Zurich', label: 'Zurich (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Vienna', label: 'Vienna (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Stockholm', label: 'Stockholm (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Oslo', label: 'Oslo (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Copenhagen', label: 'Copenhagen (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Warsaw', label: 'Warsaw (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Prague', label: 'Prague (CET/CEST)', region: 'Europe' },
  { value: 'Europe/Dublin', label: 'Dublin (GMT/IST)', region: 'Europe' },
  { value: 'Europe/Lisbon', label: 'Lisbon (WET/WEST)', region: 'Europe' },
  { value: 'Europe/Athens', label: 'Athens (EET/EEST)', region: 'Europe' },
  { value: 'Europe/Helsinki', label: 'Helsinki (EET/EEST)', region: 'Europe' },
  // Americas
  { value: 'America/New_York', label: 'New York (EST/EDT)', region: 'Americas' },
  { value: 'America/Chicago', label: 'Chicago (CST/CDT)', region: 'Americas' },
  { value: 'America/Denver', label: 'Denver (MST/MDT)', region: 'Americas' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)', region: 'Americas' },
  { value: 'America/Toronto', label: 'Toronto (EST/EDT)', region: 'Americas' },
  { value: 'America/Vancouver', label: 'Vancouver (PST/PDT)', region: 'Americas' },
  { value: 'America/Mexico_City', label: 'Mexico City (CST)', region: 'Americas' },
  { value: 'America/Sao_Paulo', label: 'Sao Paulo (BRT)', region: 'Americas' },
  // Asia/Pacific
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)', region: 'Asia/Pacific' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)', region: 'Asia/Pacific' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)', region: 'Asia/Pacific' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)', region: 'Asia/Pacific' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)', region: 'Asia/Pacific' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)', region: 'Asia/Pacific' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST/NZDT)', region: 'Asia/Pacific' },
  // UTC
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)', region: 'Other' },
] as const;

// Country list for dropdowns
export const COUNTRIES = [
  { code: 'AT', name: 'Austria' },
  { code: 'AU', name: 'Australia' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CA', name: 'Canada' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DE', name: 'Germany' },
  { code: 'DK', name: 'Denmark' },
  { code: 'ES', name: 'Spain' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'GR', name: 'Greece' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NO', name: 'Norway' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'SE', name: 'Sweden' },
  { code: 'US', name: 'United States' },
] as const;

/**
 * Get the browser locale for the user
 */
function getBrowserLocale(): string {
  if (typeof navigator !== 'undefined') {
    return navigator.language || 'en';
  }
  return 'en';
}

/**
 * Map currency to appropriate locale for number formatting
 */
function getLocaleForCurrency(currency: CurrencyCode): string {
  const currencyLocaleMap: Record<CurrencyCode, string> = {
    USD: 'en-US',
    EUR: 'de-DE', // Germany uses comma for decimal
    GBP: 'en-GB',
    CHF: 'de-CH',
    SEK: 'sv-SE',
    NOK: 'nb-NO',
    DKK: 'da-DK',
    PLN: 'pl-PL',
    CZK: 'cs-CZ',
    CAD: 'en-CA',
    AUD: 'en-AU',
  };
  return currencyLocaleMap[currency] || 'en-US';
}

/**
 * Format a price/currency value
 * @param amount - The numeric amount
 * @param currency - Currency code (USD, EUR, GBP, etc.)
 * @param locale - Optional locale override
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'USD',
  locale?: string
): string {
  const displayLocale = locale || getLocaleForCurrency(currency);

  try {
    return new Intl.NumberFormat(displayLocale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback for unsupported locales
    const symbol = SUPPORTED_CURRENCIES[currency]?.symbol || '$';
    return `${symbol}${amount.toFixed(2)}`;
  }
}

/**
 * Format a number with locale-appropriate decimal/thousand separators
 */
export function formatNumber(
  value: number,
  locale: string = 'en',
  options?: Intl.NumberFormatOptions
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch {
    return value.toLocaleString();
  }
}

/**
 * Format a date according to the specified format style
 * @param date - Date object or ISO string
 * @param formatStyle - DMY (European), MDY (US), YMD (ISO)
 * @param locale - Locale for month/day names
 */
export function formatDate(
  date: Date | string,
  formatStyle: DateFormatStyle = 'DMY',
  locale: string = 'en'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return '';
  }

  // Use unambiguous format: "24 Jan 2026" - works everywhere
  const day = d.getDate();
  const year = d.getFullYear();

  try {
    const monthName = d.toLocaleDateString(locale, { month: 'short' });
    return `${day} ${monthName} ${year}`;
  } catch {
    // Fallback to numeric format based on style
    const month = d.getMonth() + 1;
    const dd = day.toString().padStart(2, '0');
    const mm = month.toString().padStart(2, '0');

    switch (formatStyle) {
      case 'MDY':
        return `${mm}/${dd}/${year}`;
      case 'YMD':
        return `${year}-${mm}-${dd}`;
      case 'DMY':
      default:
        return `${dd}/${mm}/${year}`;
    }
  }
}

/**
 * Format a date with full details (weekday, month, day, year)
 */
export function formatDateLong(
  date: Date | string,
  locale: string = 'en'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return '';
  }

  try {
    return d.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return formatDate(d, 'DMY', locale);
  }
}

/**
 * Format time according to 12h or 24h preference
 * @param time - Time string in HH:MM format or Date object
 * @param format - '12h' or '24h'
 */
export function formatTime(
  time: string | Date,
  format: TimeFormatStyle = '24h'
): string {
  let hours: number;
  let minutes: number;

  if (time instanceof Date) {
    hours = time.getHours();
    minutes = time.getMinutes();
  } else {
    const parts = time.split(':');
    hours = parseInt(parts[0], 10);
    minutes = parseInt(parts[1], 10);
  }

  if (isNaN(hours) || isNaN(minutes)) {
    return time.toString();
  }

  if (format === '24h') {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } else {
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  }
}

/**
 * Format a datetime for display
 */
export function formatDateTime(
  date: Date | string,
  options: {
    dateFormat?: DateFormatStyle;
    timeFormat?: TimeFormatStyle;
    locale?: string;
  } = {}
): string {
  const { dateFormat = 'DMY', timeFormat = '24h', locale = 'en' } = options;
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return '';
  }

  const dateStr = formatDate(d, dateFormat, locale);
  const timeStr = formatTime(d, timeFormat);

  return `${dateStr} ${timeStr}`;
}

/**
 * Get day names starting from the specified day
 * @param startDay - 0 = Sunday, 1 = Monday
 * @param locale - Locale for day names
 * @param format - 'short' | 'long' | 'narrow'
 */
export function getWeekDays(
  startDay: number = 1,
  locale: string = 'en',
  format: 'short' | 'long' | 'narrow' = 'short'
): string[] {
  const days: string[] = [];
  const baseDate = new Date(2024, 0, 7); // A known Sunday

  for (let i = 0; i < 7; i++) {
    const dayIndex = (startDay + i) % 7;
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + dayIndex);

    try {
      days.push(date.toLocaleDateString(locale, { weekday: format }));
    } catch {
      // Fallback to English short names
      const fallbackDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      days.push(fallbackDays[dayIndex]);
    }
  }

  return days;
}

/**
 * Calculate the start of the week for a given date
 * @param date - The reference date
 * @param weekStartsOn - 0 = Sunday, 1 = Monday
 */
export function getWeekStart(date: Date, weekStartsOn: number = 1): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Calculate the end of the week for a given date
 */
export function getWeekEnd(date: Date, weekStartsOn: number = 1): Date {
  const start = getWeekStart(date, weekStartsOn);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Format an address based on country
 * Different countries have different address formats
 */
export function formatAddress(
  address: {
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    country?: string | null;
  }
): string {
  const { address: street, city, state, zip, country } = address;

  // Filter out empty values
  const parts: string[] = [];

  if (street) parts.push(street);

  // Format based on country
  switch (country) {
    case 'GB':
    case 'IE':
      // UK/Ireland: Street, City, Postcode
      if (city) parts.push(city);
      if (zip) parts.push(zip);
      break;
    case 'DE':
    case 'AT':
    case 'CH':
      // German-style: Street, Postcode City
      if (zip && city) {
        parts.push(`${zip} ${city}`);
      } else {
        if (zip) parts.push(zip);
        if (city) parts.push(city);
      }
      break;
    case 'FR':
    case 'IT':
    case 'ES':
    case 'BE':
    case 'NL':
      // Continental European: Street, Postcode City
      if (zip && city) {
        parts.push(`${zip} ${city}`);
      } else {
        if (zip) parts.push(zip);
        if (city) parts.push(city);
      }
      break;
    case 'US':
    case 'CA':
    case 'AU':
    default:
      // US-style: Street, City, State ZIP
      if (city) parts.push(city);
      if (state && zip) {
        parts.push(`${state} ${zip}`);
      } else {
        if (state) parts.push(state);
        if (zip) parts.push(zip);
      }
      break;
  }

  return parts.join(', ') || 'No address';
}

/**
 * Get default settings based on country
 */
export function getCountryDefaults(countryCode: string): {
  currency: CurrencyCode;
  locale: LocaleCode;
  timezone: string;
  dateFormat: DateFormatStyle;
  timeFormat: TimeFormatStyle;
  weekStartsOn: number;
} {
  const defaults: Record<string, {
    currency: CurrencyCode;
    locale: LocaleCode;
    timezone: string;
    dateFormat: DateFormatStyle;
    timeFormat: TimeFormatStyle;
    weekStartsOn: number;
  }> = {
    US: { currency: 'USD', locale: 'en', timezone: 'America/New_York', dateFormat: 'MDY', timeFormat: '12h', weekStartsOn: 0 },
    CA: { currency: 'CAD', locale: 'en', timezone: 'America/Toronto', dateFormat: 'DMY', timeFormat: '12h', weekStartsOn: 0 },
    GB: { currency: 'GBP', locale: 'en-GB', timezone: 'Europe/London', dateFormat: 'DMY', timeFormat: '24h', weekStartsOn: 1 },
    IE: { currency: 'EUR', locale: 'en-GB', timezone: 'Europe/Dublin', dateFormat: 'DMY', timeFormat: '24h', weekStartsOn: 1 },
    DE: { currency: 'EUR', locale: 'de', timezone: 'Europe/Berlin', dateFormat: 'DMY', timeFormat: '24h', weekStartsOn: 1 },
    AT: { currency: 'EUR', locale: 'de', timezone: 'Europe/Vienna', dateFormat: 'DMY', timeFormat: '24h', weekStartsOn: 1 },
    CH: { currency: 'CHF', locale: 'de', timezone: 'Europe/Zurich', dateFormat: 'DMY', timeFormat: '24h', weekStartsOn: 1 },
    FR: { currency: 'EUR', locale: 'fr', timezone: 'Europe/Paris', dateFormat: 'DMY', timeFormat: '24h', weekStartsOn: 1 },
    BE: { currency: 'EUR', locale: 'fr', timezone: 'Europe/Brussels', dateFormat: 'DMY', timeFormat: '24h', weekStartsOn: 1 },
    NL: { currency: 'EUR', locale: 'nl', timezone: 'Europe/Amsterdam', dateFormat: 'DMY', timeFormat: '24h', weekStartsOn: 1 },
    ES: { currency: 'EUR', locale: 'es', timezone: 'Europe/Madrid', dateFormat: 'DMY', timeFormat: '24h', weekStartsOn: 1 },
    IT: { currency: 'EUR', locale: 'it', timezone: 'Europe/Rome', dateFormat: 'DMY', timeFormat: '24h', weekStartsOn: 1 },
    PT: { currency: 'EUR', locale: 'pt', timezone: 'Europe/Lisbon', dateFormat: 'DMY', timeFormat: '24h', weekStartsOn: 1 },
    SE: { currency: 'SEK', locale: 'en', timezone: 'Europe/Stockholm', dateFormat: 'YMD', timeFormat: '24h', weekStartsOn: 1 },
    NO: { currency: 'NOK', locale: 'en', timezone: 'Europe/Oslo', dateFormat: 'DMY', timeFormat: '24h', weekStartsOn: 1 },
    DK: { currency: 'DKK', locale: 'en', timezone: 'Europe/Copenhagen', dateFormat: 'DMY', timeFormat: '24h', weekStartsOn: 1 },
    PL: { currency: 'PLN', locale: 'pl', timezone: 'Europe/Warsaw', dateFormat: 'DMY', timeFormat: '24h', weekStartsOn: 1 },
    CZ: { currency: 'CZK', locale: 'en', timezone: 'Europe/Prague', dateFormat: 'DMY', timeFormat: '24h', weekStartsOn: 1 },
    AU: { currency: 'AUD', locale: 'en', timezone: 'Australia/Sydney', dateFormat: 'DMY', timeFormat: '12h', weekStartsOn: 1 },
    NZ: { currency: 'AUD', locale: 'en', timezone: 'Pacific/Auckland', dateFormat: 'DMY', timeFormat: '12h', weekStartsOn: 1 },
  };

  return defaults[countryCode] || defaults.US;
}

/**
 * Check if a country is in the EU (for GDPR purposes)
 */
export function isEUCountry(countryCode: string): boolean {
  const euCountries = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  ];
  return euCountries.includes(countryCode);
}

/**
 * Check if GDPR compliance is required for a country
 * Includes EU, EEA, and UK
 */
export function requiresGDPR(countryCode: string): boolean {
  const gdprCountries = [
    // EU
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
    // EEA
    'IS', 'LI', 'NO',
    // UK (post-Brexit still has GDPR-equivalent)
    'GB',
  ];
  return gdprCountries.includes(countryCode);
}
