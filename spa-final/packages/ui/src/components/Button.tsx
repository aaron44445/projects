'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sage/50 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-sage text-white hover:bg-sage-dark hover:shadow-hover hover:-translate-y-0.5 active:scale-95',
        secondary:
          'bg-white border-2 border-sage/30 text-charcoal hover:border-sage/60 hover:shadow-card active:scale-95',
        outline:
          'border-2 border-charcoal/20 bg-transparent text-charcoal hover:bg-charcoal/5 active:scale-95',
        ghost: 'bg-transparent text-charcoal hover:bg-charcoal/5 active:scale-95',
        danger:
          'bg-error text-white hover:bg-error/90 hover:shadow-hover hover:-translate-y-0.5 active:scale-95',
        link: 'text-sage underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-base',
        lg: 'h-13 px-8 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, isLoading, leftIcon, rightIcon, children, disabled, ...props },
    ref
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
