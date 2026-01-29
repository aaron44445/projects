import * as React from 'react';

/**
 * Props for the EmptyState component.
 */
export interface EmptyStateProps {
  /**
   * Lucide icon component to display.
   * Should accept size and className props.
   * Uses string | number for size to be compatible with Lucide icons.
   */
  icon: React.ComponentType<{ size?: string | number; className?: string }>;
  /**
   * Title text displayed below the icon.
   * Should describe what's empty (e.g., "No appointments yet").
   */
  title: string;
  /**
   * Description text providing context or guidance.
   * Should explain what the user can do (e.g., "Schedule your first appointment").
   */
  description: string;
  /**
   * Optional call-to-action button.
   */
  action?: {
    /** Button label text */
    label: string;
    /** Click handler */
    onClick: () => void;
    /** Optional icon component for the button. Uses string | number for size to be compatible with Lucide icons. */
    icon?: React.ComponentType<{ size?: string | number }>;
  };
}

/**
 * EmptyState component for displaying empty list/table/search states.
 *
 * Provides consistent styling for empty states across the application:
 * - Centered layout with generous padding
 * - Icon in a circular container
 * - Title and description with muted colors
 * - Optional action button with design system styling
 *
 * @example
 * ```tsx
 * import { EmptyState } from '@peacase/ui';
 * import { Calendar, Plus } from 'lucide-react';
 *
 * // Basic empty state
 * <EmptyState
 *   icon={Calendar}
 *   title="No appointments yet"
 *   description="Schedule your first appointment to get started."
 * />
 *
 * // With action button
 * <EmptyState
 *   icon={Calendar}
 *   title="No appointments yet"
 *   description="Schedule your first appointment to get started."
 *   action={{
 *     label: "Book Appointment",
 *     onClick: () => setShowBookingModal(true),
 *     icon: Plus
 *   }}
 * />
 * ```
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-charcoal/5 flex items-center justify-center mb-4">
        <Icon size={32} className="text-text-muted" />
      </div>
      <h3 className="text-lg font-semibold text-charcoal mb-2">{title}</h3>
      <p className="text-text-muted max-w-sm mb-6">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-sage text-white rounded-lg hover:bg-sage-dark transition-colors"
        >
          {action.icon && <action.icon size={16} />}
          {action.label}
        </button>
      )}
    </div>
  );
}
