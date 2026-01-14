'use client';

import * as React from 'react';
import { cn } from '../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-charcoal mb-2"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/40">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            id={inputId}
            className={cn(
              'flex w-full rounded-lg border bg-white px-4 py-3 text-base text-charcoal transition-all duration-200',
              'placeholder:text-charcoal/40',
              'focus:outline-none focus:ring-2 focus:ring-sage/50 focus:border-sage',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50',
              error
                ? 'border-error focus:ring-error/50 focus:border-error'
                : 'border-charcoal/10 hover:border-charcoal/20',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/40">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-sm text-charcoal/50">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
