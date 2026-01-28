'use client';

import { CheckCircle, Circle } from 'lucide-react';

interface PasswordChecklistProps {
  password: string;
  className?: string;
}

const requirements = [
  {
    test: (p: string) => p.length >= 8,
    label: 'At least 8 characters',
    id: 'length',
  },
  {
    test: (p: string) => /[A-Z]/.test(p),
    label: 'One uppercase letter (A-Z)',
    id: 'uppercase',
  },
  {
    test: (p: string) => /[a-z]/.test(p),
    label: 'One lowercase letter (a-z)',
    id: 'lowercase',
  },
  {
    test: (p: string) => /[0-9]/.test(p),
    label: 'One number (0-9)',
    id: 'number',
  },
  {
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
    label: 'One special character (!@#$%^&*)',
    id: 'special',
  },
];

export function PasswordChecklist({ password, className = '' }: PasswordChecklistProps) {
  const allMet = password.length > 0 && requirements.every(req => req.test(password));

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-sm text-charcoal/60 font-medium">
        Password requirements:
      </p>
      <div className="space-y-1">
        {requirements.map((req) => {
          const met = password.length > 0 && req.test(password);
          const pending = password.length === 0;

          return (
            <div
              key={req.id}
              className="flex items-center gap-2 text-sm"
              role="listitem"
              aria-label={`${req.label}: ${met ? 'requirement met' : 'requirement not met'}`}
            >
              {met ? (
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" aria-hidden="true" />
              ) : (
                <Circle className="w-4 h-4 text-charcoal/30 flex-shrink-0" aria-hidden="true" />
              )}
              <span className={
                met
                  ? 'text-emerald-700 font-medium'
                  : pending
                    ? 'text-charcoal/50'
                    : 'text-charcoal/70'
              }>
                {req.label}
              </span>
            </div>
          );
        })}
      </div>
      {allMet && (
        <p className="text-sm text-emerald-600 font-medium flex items-center gap-2 mt-3">
          <CheckCircle className="w-4 h-4" aria-hidden="true" />
          Password meets all requirements
        </p>
      )}
    </div>
  );
}
