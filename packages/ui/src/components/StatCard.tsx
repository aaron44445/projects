'use client';

import * as React from 'react';
import { cn } from '../lib/utils';

type ColorVariant = 'peach' | 'lavender' | 'mint' | 'rose' | 'sage';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  icon?: React.ReactNode;
  color?: ColorVariant;
  className?: string;
}

const colorClasses: Record<ColorVariant, string> = {
  peach: 'from-soft-peach/20 to-soft-peach/5',
  lavender: 'from-soft-lavender/20 to-soft-lavender/5',
  mint: 'from-soft-mint/20 to-soft-mint/5',
  rose: 'from-soft-rose/20 to-soft-rose/5',
  sage: 'from-sage/20 to-sage/5',
};

const iconColorClasses: Record<ColorVariant, string> = {
  peach: 'text-soft-peach bg-soft-peach/20',
  lavender: 'text-soft-lavender bg-soft-lavender/20',
  mint: 'text-soft-mint bg-soft-mint/20',
  rose: 'text-soft-rose bg-soft-rose/20',
  sage: 'text-sage bg-sage/20',
};

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  trend,
  icon,
  color = 'sage',
  className,
}) => {
  return (
    <div
      className={cn(
        'p-6 lg:p-8 rounded-xl lg:rounded-2xl bg-gradient-to-br border border-white/60 shadow-card backdrop-blur-sm',
        'hover:shadow-card-lg hover:-translate-y-1 transition-all duration-300',
        colorClasses[color],
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            'inline-flex p-3 rounded-lg mb-4',
            iconColorClasses[color]
          )}
        >
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-charcoal/70 mb-2">{label}</p>
      <p className="text-3xl lg:text-4xl font-bold text-charcoal">{value}</p>
      {trend && (
        <p className="text-sm text-charcoal/50 mt-3">{trend}</p>
      )}
    </div>
  );
};

export { StatCard };
