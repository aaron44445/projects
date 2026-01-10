import React from 'react'
import { cn, colorVariants, sizeVariants, classNamePatterns } from '../lib/utils'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl'

/**
 * Button component with multiple variants and sizes
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="lg">Click me</Button>
 * <Button variant="danger" disabled>Delete</Button>
 * <Button variant="ghost" as="a" href="/page">Link</Button>
 * ```
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button style variant */
  variant?: ButtonVariant
  /** Button size */
  size?: ButtonSize
  /** Whether button is loading (disables and shows loading state) */
  isLoading?: boolean
  /** Custom className to merge with defaults */
  className?: string
  /** HTML element to render as (e.g., 'a' for links) */
  as?: React.ElementType
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      className,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    // Map variants to color classes
    const variantClasses = {
      primary: cn('bg-sage-300 text-white hover:bg-sage-400 shadow-sm hover:shadow-hover'),
      secondary: cn('bg-cream-100 text-charcoal-600 border-2 border-sage-300 hover:bg-cream-200'),
      danger: cn('bg-cancelled text-white hover:bg-red-600 shadow-sm hover:shadow-hover'),
      ghost: cn('text-sage-300 hover:bg-cream-100'),
    }

    // Map sizes to padding/text classes
    const sizeClasses = {
      sm: 'px-3 py-2 text-xs rounded-button',
      md: 'px-4 py-2 text-sm rounded-button h-10',
      lg: 'px-6 py-3 text-base rounded-button h-11',
      xl: 'px-8 py-4 text-lg rounded-button h-12',
    }

    const buttonClasses = cn(
      classNamePatterns.buttonBase,
      variantClasses[variant],
      sizeClasses[size],
      isLoading && 'opacity-70 cursor-wait',
      disabled && 'opacity-50 cursor-not-allowed',
      className
    )

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={buttonClasses}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
              <path
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Loading...
          </span>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
