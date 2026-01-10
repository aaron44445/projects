import React from 'react'
import { cn, getDecorativeColor } from '../lib/utils'

/**
 * StatCard component - Dashboard metric display card (200×140px)
 *
 * @example
 * ```tsx
 * <StatCard
 *   label="Total Revenue"
 *   value="$12,450"
 *   colorIndex={0}
 *   showPeaMotif
 * />
 * <StatCard
 *   label="Appointments"
 *   value="24"
 *   colorIndex={1}
 *   trend={{ value: 12, direction: 'up' }}
 * />
 * ```
 */

export interface StatCardProps {
  /** Label text for the metric */
  label: string
  /** Main value to display (number or formatted string) */
  value: string | number
  /** Supporting text below value */
  subtitle?: string
  /** Color palette index (0-3, cycles through soft colors) */
  colorIndex: number
  /** Whether to show pea motif decoration */
  showPeaMotif?: boolean
  /** Trend information (percentage change and direction) */
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  /** Icon or decoration */
  icon?: React.ReactNode
  /** Click handler */
  onClick?: () => void
  /** Custom className */
  className?: string
}

/**
 * Pea motif SVG - smaller version for stat cards
 */
function SmallPeaMotif() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Pea pod outline */}
      <path
        d="M8 20C8 14.477 12.477 10 18 10C23.523 10 28 14.477 28 20C28 25.523 23.523 30 18 30C12.477 30 8 25.523 8 20Z"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.2"
      />
      {/* Individual peas */}
      <circle cx="14" cy="16" r="2" fill="currentColor" opacity="0.2" />
      <circle cx="18" cy="14" r="2" fill="currentColor" opacity="0.2" />
      <circle cx="22" cy="16" r="2" fill="currentColor" opacity="0.2" />
      <circle cx="18" cy="20" r="2" fill="currentColor" opacity="0.2" />
      <circle cx="22" cy="24" r="2" fill="currentColor" opacity="0.2" />
    </svg>
  )
}

/**
 * Trend indicator - shows up/down arrow with percentage
 */
function TrendIndicator({
  value,
  direction,
}: {
  value: number
  direction: 'up' | 'down'
}) {
  const isUp = direction === 'up'
  const color = isUp ? 'text-success' : 'text-cancelled'

  return (
    <div className={cn('flex items-center gap-1 text-xs font-medium', color)}>
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={isUp ? '' : 'rotate-180'}
      >
        <path
          d="M6 1L11 6H1L6 1Z"
          fill="currentColor"
        />
      </svg>
      {value}%
    </div>
  )
}

/**
 * StatCard component - Dashboard metric display
 */
export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      label,
      value,
      subtitle,
      colorIndex,
      showPeaMotif = false,
      trend,
      icon,
      onClick,
      className,
    },
    ref
  ) => {
    const bgColor = getDecorativeColor(colorIndex)

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          'relative w-full rounded-card border border-gray-100 shadow-card overflow-hidden',
          'h-32 lg:h-36 p-4 lg:p-5',
          'transition-all duration-300',
          onClick && 'cursor-pointer hover:shadow-hover',
          bgColor,
          className
        )}
      >
        {/* Decorative pea motif in corner */}
        {showPeaMotif && (
          <div className="absolute top-2 right-2 text-charcoal-600 opacity-10">
            <SmallPeaMotif />
          </div>
        )}

        {/* Icon if provided */}
        {icon && (
          <div className="absolute top-3 right-3 text-charcoal-400 opacity-40">
            {icon}
          </div>
        )}

        {/* Main content */}
        <div className="relative z-10 flex flex-col h-full justify-between">
          {/* Label */}
          <div>
            <p className="text-xs lg:text-xs font-medium text-charcoal-400 uppercase tracking-wide mb-2">
              {label}
            </p>

            {/* Value */}
            <p className="text-2xl lg:text-3xl font-semibold text-charcoal-600 leading-tight">
              {value}
            </p>

            {/* Subtitle if provided */}
            {subtitle && (
              <p className="text-xs text-charcoal-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>

          {/* Trend indicator at bottom */}
          {trend && (
            <TrendIndicator
              value={trend.value}
              direction={trend.direction}
            />
          )}
        </div>
      </div>
    )
  }
)

StatCard.displayName = 'StatCard'

/**
 * StatCardGrid - Container for displaying multiple stat cards in a grid
 */
export interface StatCardGridProps {
  /** Stat cards to display */
  cards: StatCardProps[]
  /** Number of columns on desktop (default: 4) */
  columns?: 1 | 2 | 3 | 4
  /** Custom className for grid */
  className?: string
}

export const StatCardGrid: React.FC<StatCardGridProps> = ({
  cards,
  columns = 4,
  className,
}) => {
  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div
      className={cn(
        'grid gap-4 lg:gap-5',
        gridColsClass[columns],
        className
      )}
    >
      {cards.map((card, index) => (
        <StatCard
          key={`stat-card-${index}`}
          {...card}
        />
      ))}
    </div>
  )
}

StatCardGrid.displayName = 'StatCardGrid'

export default StatCard
