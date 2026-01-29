/**
 * Status Color Utility
 *
 * Single source of truth for status color mappings using design system tokens.
 * Use these colors consistently across the application for status indicators,
 * badges, pills, appointment states, and booking statuses.
 *
 * @module statusColors
 */

/**
 * Centralized status color definitions using design system tokens.
 *
 * Categories:
 * - confirmed/completed: sage (success states)
 * - scheduled/pending: lavender (neutral/waiting states)
 * - in-progress: lavender-dark (active states)
 * - cancelled/no-show/expired: rose (negative states)
 * - draft: charcoal muted (inactive states)
 */
export const STATUS_COLORS = {
  // Confirmed/Success states - sage (design system success color)
  confirmed: {
    bg: 'bg-sage/10',
    text: 'text-sage-dark',
    border: 'border-sage/20',
  },
  completed: {
    bg: 'bg-sage/10',
    text: 'text-sage-dark',
    border: 'border-sage/20',
  },

  // Pending/Waiting states - lavender (neutral)
  scheduled: {
    bg: 'bg-soft-lavender',
    text: 'text-charcoal',
    border: 'border-lavender/20',
  },
  pending: {
    bg: 'bg-soft-lavender',
    text: 'text-charcoal',
    border: 'border-lavender/20',
  },

  // In-progress states - lavender-dark
  'in-progress': {
    bg: 'bg-lavender/20',
    text: 'text-lavender-dark',
    border: 'border-lavender/30',
  },

  // Negative states - rose (design system error color)
  cancelled: {
    bg: 'bg-rose/10',
    text: 'text-rose-dark',
    border: 'border-rose/20',
  },
  'no-show': {
    bg: 'bg-rose/10',
    text: 'text-rose-dark',
    border: 'border-rose/20',
  },
  expired: {
    bg: 'bg-rose/10',
    text: 'text-rose-dark',
    border: 'border-rose/20',
  },

  // Inactive/Draft states - charcoal muted
  draft: {
    bg: 'bg-charcoal/5',
    text: 'text-text-muted',
    border: 'border-charcoal/10',
  },
} as const;

/**
 * Type-safe status key extracted from STATUS_COLORS object.
 * Provides IntelliSense for valid status names.
 */
export type StatusKey = keyof typeof STATUS_COLORS;

/**
 * Get combined Tailwind class string for a given status.
 *
 * @param status - A valid status key
 * @returns Combined class string with bg, text, and border classes
 *
 * @example
 * ```tsx
 * <span className={getStatusClasses('confirmed')}>
 *   Confirmed
 * </span>
 * // Returns: "bg-sage/10 text-sage-dark border-sage/20"
 * ```
 */
export function getStatusClasses(status: StatusKey): string {
  const colors = STATUS_COLORS[status];
  return `${colors.bg} ${colors.text} ${colors.border}`;
}
