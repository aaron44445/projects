/**
 * Utility functions for UI components
 */

/**
 * Merge multiple class names together, removing duplicates
 * Uses clsx-like behavior for conditional classes
 * @param classes - Classes to merge
 * @returns Merged class string
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes
    .filter(Boolean)
    .join(' ')
    .split(/\s+/)
    .filter((cls) => cls.length > 0)
    .join(' ')
}

/**
 * Get color variant classes for buttons and components
 */
export const colorVariants = {
  sage: 'bg-sage-300 text-white hover:bg-sage-400',
  cream: 'bg-cream-100 text-charcoal-600 border border-sage-300 hover:bg-sage-50',
  danger: 'bg-cancelled text-white hover:bg-red-600',
  ghost: 'text-sage-300 hover:bg-sage-50',
  success: 'bg-success text-white hover:bg-sage-400',
  pending: 'bg-pending text-white hover:bg-orange-600',
  noshow: 'bg-noshow text-white hover:bg-gray-600',
} as const

/**
 * Get size variant classes for buttons and components
 */
export const sizeVariants = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base h-11',
  xl: 'px-8 py-4 text-lg h-12',
} as const

/**
 * Get status badge color variants
 */
export const statusColorVariants = {
  confirmed: 'bg-success bg-opacity-10 text-success',
  pending: 'bg-pending bg-opacity-10 text-pending',
  cancelled: 'bg-cancelled bg-opacity-10 text-cancelled',
  noshow: 'bg-noshow bg-opacity-10 text-noshow',
  completed: 'bg-success bg-opacity-10 text-success',
} as const

/**
 * Get decorative color for stat cards (soft palette)
 */
export const decorativeColors = [
  'bg-peach-light',
  'bg-lavender-light',
  'bg-mint-light',
  'bg-rose-light',
] as const

/**
 * Get decorative color by index (cycles through palette)
 */
export function getDecorativeColor(index: number): string {
  return decorativeColors[index % decorativeColors.length]
}

/**
 * Get text color based on background color
 */
export function getContrastColor(backgroundColor: string): string {
  // Simple logic - could be enhanced with color parsing
  const lightBgPatterns = ['cream', 'peach', 'lavender', 'mint', 'rose', 'light']
  const isDark = !lightBgPatterns.some((pattern) =>
    backgroundColor.toLowerCase().includes(pattern)
  )
  return isDark ? 'text-white' : 'text-charcoal-600'
}

/**
 * Format class names for common patterns
 */
export const classNamePatterns = {
  // Button base classes
  buttonBase: 'inline-flex items-center justify-center font-medium rounded-button transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',

  // Card base classes
  cardBase: 'bg-white rounded-card border border-gray-100 shadow-card p-5',

  // Input base classes
  inputBase:
    'w-full px-3 py-2 rounded-button border border-gray-300 bg-white text-charcoal-600 placeholder-gray-400 transition-all duration-150 focus:border-sage-300 focus:ring-3 focus:ring-sage-300 focus:ring-opacity-10',

  // Label classes
  labelBase: 'block text-xs font-medium text-charcoal-400 mb-2',

  // Divider classes
  dividerBase: 'h-px bg-gray-100',

  // Badge base classes
  badgeBase: 'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',

  // Modal overlay
  modalOverlay: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center',

  // Modal content
  modalContent:
    'bg-white rounded-card shadow-modal p-8 w-full mx-4 max-w-xl max-h-[90vh] overflow-y-auto',

  // Table header
  tableHeader:
    'bg-cream-100 px-5 py-3 text-left text-xs font-semibold text-charcoal-600 uppercase tracking-wide',

  // Table cell
  tableCell: 'px-5 py-3 text-sm text-charcoal-600',

  // Table row
  tableRow: 'border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150',
} as const

/**
 * Get Tailwind class for a specific design token
 */
export const designTokens = {
  spacing: {
    xs: 'space-y-2',
    sm: 'space-y-3',
    md: 'space-y-5',
    lg: 'space-y-7',
    xl: 'space-y-8',
  },
  shadows: {
    card: 'shadow-card',
    hover: 'shadow-hover',
    modal: 'shadow-modal',
  },
  radiuses: {
    button: 'rounded-button',
    card: 'rounded-card',
    input: 'rounded-button',
  },
} as const

export type ColorVariant = keyof typeof colorVariants
export type SizeVariant = keyof typeof sizeVariants
export type StatusColor = keyof typeof statusColorVariants
