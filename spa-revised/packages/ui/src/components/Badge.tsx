import React from 'react'
import { cn, classNamePatterns, statusColorVariants } from '../lib/utils'

/**
 * Badge component - status and label indicators
 *
 * @example
 * ```tsx
 * <Badge status="confirmed">Confirmed</Badge>
 * <Badge status="pending" variant="soft">Pending</Badge>
 * <Badge color="sage">Active</Badge>
 * ```
 */

export type BadgeStatus = 'confirmed' | 'pending' | 'cancelled' | 'noshow' | 'completed'
export type BadgeColor = 'sage' | 'cream' | 'taupe' | 'peach' | 'lavender' | 'mint' | 'rose'
export type BadgeVariant = 'solid' | 'soft' | 'outline'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Status type - determines color */
  status?: BadgeStatus
  /** Color variant (if not using status) */
  color?: BadgeColor
  /** Visual variant */
  variant?: BadgeVariant
  /** Icon to display before text */
  icon?: React.ReactNode
  /** Custom className */
  className?: string
}

const statusColorMap: Record<BadgeStatus, string> = {
  confirmed: 'bg-success bg-opacity-10 text-success',
  pending: 'bg-pending bg-opacity-10 text-pending',
  cancelled: 'bg-cancelled bg-opacity-10 text-cancelled',
  noshow: 'bg-noshow bg-opacity-10 text-noshow',
  completed: 'bg-success bg-opacity-10 text-success',
}

const colorVariantMap: Record<BadgeColor, Record<BadgeVariant, string>> = {
  sage: {
    solid: 'bg-sage-300 text-white',
    soft: 'bg-sage-300 bg-opacity-10 text-sage-500',
    outline: 'border border-sage-300 text-sage-500',
  },
  cream: {
    solid: 'bg-cream-100 text-charcoal-600',
    soft: 'bg-cream-100 bg-opacity-50 text-charcoal-600',
    outline: 'border border-cream-100 text-charcoal-600',
  },
  taupe: {
    solid: 'bg-taupe text-white',
    soft: 'bg-taupe bg-opacity-10 text-taupe',
    outline: 'border border-taupe text-taupe',
  },
  peach: {
    solid: 'bg-peach text-white',
    soft: 'bg-peach bg-opacity-10 text-peach',
    outline: 'border border-peach text-peach',
  },
  lavender: {
    solid: 'bg-lavender text-white',
    soft: 'bg-lavender bg-opacity-10 text-lavender',
    outline: 'border border-lavender text-lavender',
  },
  mint: {
    solid: 'bg-mint text-white',
    soft: 'bg-mint bg-opacity-10 text-mint',
    outline: 'border border-mint text-mint',
  },
  rose: {
    solid: 'bg-rose text-white',
    soft: 'bg-rose bg-opacity-10 text-rose',
    outline: 'border border-rose text-rose',
  },
}

/**
 * Badge component - status and label indicator
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      status,
      color = 'sage',
      variant = 'soft',
      icon,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // Determine color classes
    let colorClasses: string

    if (status) {
      colorClasses = statusColorMap[status]
    } else {
      colorClasses = colorVariantMap[color][variant]
    }

    return (
      <span
        ref={ref}
        className={cn(classNamePatterns.badgeBase, colorClasses, className)}
        {...props}
      >
        {icon && <span className="mr-1.5 flex items-center">{icon}</span>}
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

/**
 * Status badge component - predefined status indicators
 */
export const StatusBadge = React.forwardRef<HTMLSpanElement, Omit<BadgeProps, 'color'> & { status: BadgeStatus }>(
  ({ status, className, ...props }, ref) => (
    <Badge
      ref={ref}
      status={status}
      className={className}
      {...props}
    />
  )
)

StatusBadge.displayName = 'StatusBadge'

/**
 * Appointment status badge with icon
 */
export function AppointmentStatusBadge({
  status,
  className,
}: {
  status: BadgeStatus
  className?: string
}) {
  const statusIcons: Record<BadgeStatus, React.ReactNode> = {
    confirmed: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M11.5 3.5L5.5 10L2.5 7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    pending: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M7 3.5V7L10.5 9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    cancelled: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    noshow: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M4.5 4.5L9.5 9.5M9.5 4.5L4.5 9.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    completed: (
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M11.5 3.5L5.5 10L2.5 7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  }

  const statusLabels: Record<BadgeStatus, string> = {
    confirmed: 'Confirmed',
    pending: 'Pending',
    cancelled: 'Cancelled',
    noshow: 'No-show',
    completed: 'Completed',
  }

  return (
    <Badge
      status={status}
      icon={statusIcons[status]}
      className={className}
    >
      {statusLabels[status]}
    </Badge>
  )
}

export default Badge
