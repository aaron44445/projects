'use client';

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-border animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-charcoal/10 rounded-xl" />
        <div className="w-12 h-4 bg-charcoal/10 rounded" />
      </div>
      <div className="w-20 h-8 bg-charcoal/10 rounded mb-2" />
      <div className="w-24 h-4 bg-charcoal/10 rounded" />
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="p-4 flex items-center gap-4 animate-pulse">
      <div className="w-10 h-10 bg-charcoal/10 rounded-full" />
      <div className="flex-1">
        <div className="w-32 h-4 bg-charcoal/10 rounded mb-2" />
        <div className="w-48 h-3 bg-charcoal/10 rounded" />
      </div>
      <div className="w-20 h-6 bg-charcoal/10 rounded-full" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-border animate-pulse">
      <div className="w-24 h-6 bg-charcoal/10 rounded mb-4" />
      <div className="space-y-3">
        <div className="w-full h-4 bg-charcoal/10 rounded" />
        <div className="w-3/4 h-4 bg-charcoal/10 rounded" />
        <div className="w-1/2 h-4 bg-charcoal/10 rounded" />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="w-48 h-8 bg-charcoal/10 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
      </div>
      <div className="bg-white rounded-2xl border border-border">
        <div className="p-4 border-b border-border">
          <div className="w-32 h-6 bg-charcoal/10 rounded" />
        </div>
        {[1, 2, 3, 4, 5].map(i => <TableRowSkeleton key={i} />)}
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="w-32 h-8 bg-charcoal/10 rounded" />
        <div className="flex gap-2">
          <div className="w-10 h-10 bg-charcoal/10 rounded" />
          <div className="w-10 h-10 bg-charcoal/10 rounded" />
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-border p-4">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((_, i) => (
            <div key={i} className="h-6 bg-charcoal/10 rounded" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-12 bg-charcoal/5 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3, 4].map(i => (
        <div key={i}>
          <div className="w-24 h-4 bg-charcoal/10 rounded mb-2" />
          <div className="w-full h-10 bg-charcoal/10 rounded" />
        </div>
      ))}
      <div className="w-32 h-10 bg-charcoal/10 rounded" />
    </div>
  );
}
