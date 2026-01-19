import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-6">
      <div className="w-16 h-16 rounded-full bg-sage/10 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-sage" />
      </div>
      <h3 className="text-lg font-semibold text-charcoal mb-2">{title}</h3>
      <p className="text-charcoal/60 mb-6 max-w-sm mx-auto">{description}</p>
      <button
        onClick={onAction}
        className="inline-flex items-center gap-2 px-6 py-3 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark transition-all"
      >
        {actionLabel}
      </button>
    </div>
  );
}
