'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import FocusTrap from 'focus-trap-react';
import { cn } from '../lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  // Generate unique IDs for ARIA labeling
  const titleId = React.useId();
  const descriptionId = React.useId();

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  return (
    <div
      className={cn("fixed inset-0 z-50 flex items-center justify-center", !isOpen && "hidden")}
      aria-hidden={!isOpen}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <FocusTrap
        active={isOpen}
        focusTrapOptions={{
          escapeDeactivates: false,
          returnFocusOnDeactivate: true,
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
          className={cn(
            'relative w-full mx-4 bg-white rounded-2xl shadow-card-xl animate-slide-up',
            sizeClasses[size],
            className
          )}
        >
          {/* Header */}
          {(title || description) && (
            <div className="px-6 pt-6 pb-4 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div>
                  {title && (
                    <h2 id={titleId} className="text-xl font-semibold text-charcoal">{title}</h2>
                  )}
                  {description && (
                    <p id={descriptionId} className="mt-1 text-sm text-text-muted">{description}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="p-2 -mr-2 text-text-muted hover:text-charcoal hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">{children}</div>
        </div>
      </FocusTrap>
    </div>
  );
};

export { Modal };
