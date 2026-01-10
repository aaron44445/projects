import React from 'react'
import { cn, classNamePatterns } from '../lib/utils'

export type InputType = 'text' | 'email' | 'password' | 'tel' | 'number' | 'date' | 'time'

/**
 * Input component with validation states and styling
 *
 * @example
 * ```tsx
 * <Input type="email" placeholder="Enter email" />
 * <Input type="password" label="Password" error="Password is required" />
 * <Input disabled value="Disabled input" />
 * ```
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Input type */
  type?: InputType
  /** Label text displayed above input */
  label?: string
  /** Error message - displays in red if provided */
  error?: string
  /** Helper text displayed below input */
  helperText?: string
  /** Whether the input is in error state */
  isError?: boolean
  /** Custom className for input element */
  className?: string
  /** Custom className for wrapper */
  containerClassName?: string
}

/**
 * Input component - text input with validation and states
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = 'text',
      label,
      error,
      helperText,
      isError,
      className,
      containerClassName,
      disabled,
      required,
      placeholder,
      ...props
    },
    ref
  ) => {
    const hasError = isError || !!error

    const inputClasses = cn(
      classNamePatterns.inputBase,
      hasError && 'border-cancelled focus:border-cancelled focus:ring-cancelled focus:ring-opacity-20',
      disabled && 'bg-gray-50 cursor-not-allowed opacity-60',
      className
    )

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label className={classNamePatterns.labelBase}>
            {label}
            {required && <span className="text-cancelled ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className={inputClasses}
          {...props}
        />
        {error && <p className="mt-2 text-xs font-medium text-cancelled">{error}</p>}
        {helperText && !error && <p className="mt-2 text-xs text-charcoal-400">{helperText}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

/**
 * Textarea component - multi-line text input
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Label text displayed above textarea */
  label?: string
  /** Error message - displays in red if provided */
  error?: string
  /** Helper text displayed below textarea */
  helperText?: string
  /** Custom className for textarea element */
  className?: string
  /** Custom className for wrapper */
  containerClassName?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, containerClassName, disabled, required, ...props }, ref) => {
    const hasError = !!error

    const textareaClasses = cn(
      classNamePatterns.inputBase,
      'resize-none',
      hasError && 'border-cancelled focus:border-cancelled focus:ring-cancelled focus:ring-opacity-20',
      disabled && 'bg-gray-50 cursor-not-allowed opacity-60',
      className
    )

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label className={classNamePatterns.labelBase}>
            {label}
            {required && <span className="text-cancelled ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          disabled={disabled}
          required={required}
          className={textareaClasses}
          {...props}
        />
        {error && <p className="mt-2 text-xs font-medium text-cancelled">{error}</p>}
        {helperText && !error && <p className="mt-2 text-xs text-charcoal-400">{helperText}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

/**
 * Select component - dropdown input
 */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Label text displayed above select */
  label?: string
  /** Error message - displays in red if provided */
  error?: string
  /** Helper text displayed below select */
  helperText?: string
  /** Options to display */
  options?: Array<{ value: string; label: string; disabled?: boolean }>
  /** Custom className for select element */
  className?: string
  /** Custom className for wrapper */
  containerClassName?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      className,
      containerClassName,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const hasError = !!error

    const selectClasses = cn(
      classNamePatterns.inputBase,
      hasError && 'border-cancelled focus:border-cancelled focus:ring-cancelled focus:ring-opacity-20',
      disabled && 'bg-gray-50 cursor-not-allowed opacity-60',
      className
    )

    return (
      <div className={cn('w-full', containerClassName)}>
        {label && (
          <label className={classNamePatterns.labelBase}>
            {label}
            {required && <span className="text-cancelled ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          disabled={disabled}
          required={required}
          className={selectClasses}
          {...props}
        >
          {options?.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-2 text-xs font-medium text-cancelled">{error}</p>}
        {helperText && !error && <p className="mt-2 text-xs text-charcoal-400">{helperText}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Input
