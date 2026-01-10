import React from 'react'
import { cn, classNamePatterns } from '../lib/utils'

/**
 * Card component for displaying content in a contained, elevated surface
 *
 * @example
 * ```tsx
 * <Card>
 *   <Card.Header>
 *     <Card.Title>Card Title</Card.Title>
 *   </Card.Header>
 *   <Card.Body>
 *     Card content goes here
 *   </Card.Body>
 *   <Card.Footer>
 *     Footer content
 *   </Card.Footer>
 * </Card>
 * ```
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Variant of the card - default is white, can be soft colors */
  variant?: 'default' | 'peach' | 'lavender' | 'mint' | 'rose'
  /** Whether to show the pea decoration motif in corner */
  showPeaMotif?: boolean
  /** Custom className */
  className?: string
}

interface CardComponent extends React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>> {
  Header: typeof CardHeader
  Title: typeof CardTitle
  Body: typeof CardBody
  Footer: typeof CardFooter
}

const variantClasses = {
  default: 'bg-white',
  peach: 'bg-peach-light',
  lavender: 'bg-lavender-light',
  mint: 'bg-mint-light',
  rose: 'bg-rose-light',
}

/**
 * Card component - main container
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', showPeaMotif = false, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white rounded-card border border-gray-100 shadow-card p-5',
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {showPeaMotif && (
          <div className="absolute top-4 right-4 opacity-10">
            <PeaMotif size={40} />
          </div>
        )}
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

/**
 * Card.Header - Header section with optional border
 */
export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('pb-4 border-b border-gray-100', className)}
      {...props}
    />
  )
)

CardHeader.displayName = 'Card.Header'

/**
 * Card.Title - Title text in header
 */
export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-xl font-semibold text-charcoal-600', className)}
      {...props}
    />
  )
)

CardTitle.displayName = 'Card.Title'

/**
 * Card.Body - Main content area
 */
export const CardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('py-4', className)}
      {...props}
    />
  )
)

CardBody.displayName = 'Card.Body'

/**
 * Card.Footer - Footer section with optional border
 */
export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('pt-4 border-t border-gray-100', className)}
      {...props}
    />
  )
)

CardFooter.displayName = 'Card.Footer'

/**
 * Pea motif SVG decoration - Pecase brand motif
 */
function PeaMotif({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Pea pod outline */}
      <path
        d="M8 20C8 14.477 12.477 10 18 10C23.523 10 28 14.477 28 20C28 25.523 23.523 30 18 30C12.477 30 8 25.523 8 20Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      {/* Individual peas */}
      <circle cx="14" cy="16" r="2.5" fill="currentColor" />
      <circle cx="18" cy="14" r="2.5" fill="currentColor" />
      <circle cx="22" cy="16" r="2.5" fill="currentColor" />
      <circle cx="18" cy="20" r="2.5" fill="currentColor" />
      <circle cx="22" cy="24" r="2.5" fill="currentColor" />
      <circle cx="18" cy="26" r="2.5" fill="currentColor" />
    </svg>
  )
}

// Attach sub-components to Card
const CardWithSubcomponents = Card as CardComponent
CardWithSubcomponents.Header = CardHeader
CardWithSubcomponents.Title = CardTitle
CardWithSubcomponents.Body = CardBody
CardWithSubcomponents.Footer = CardFooter

export default CardWithSubcomponents as typeof Card
