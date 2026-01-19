'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

const defaultHours = [
  { day: 'Monday', dayOfWeek: 1, startTime: '09:00', endTime: '18:00', isOpen: true },
  { day: 'Tuesday', dayOfWeek: 2, startTime: '09:00', endTime: '18:00', isOpen: true },
  { day: 'Wednesday', dayOfWeek: 3, startTime: '09:00', endTime: '18:00', isOpen: true },
  { day: 'Thursday', dayOfWeek: 4, startTime: '09:00', endTime: '18:00', isOpen: true },
  { day: 'Friday', dayOfWeek: 5, startTime: '09:00', endTime: '18:00', isOpen: true },
  { day: 'Saturday', dayOfWeek: 6, startTime: '10:00', endTime: '16:00', isOpen: true },
  { day: 'Sunday', dayOfWeek: 0, startTime: '10:00', endTime: '16:00', isOpen: false },
];

interface HoursSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function HoursSetupModal({ isOpen, onClose, onComplete }: HoursSetupModalProps) {
  const [hours, setHours] = useState(defaultHours);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/salon/hours', { hours: hours.filter((h) => h.isOpen) });
      onComplete();
      onClose();
    } catch (error) {
      console.error('Failed to save hours:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateHours = (index: number, field: string, value: string | boolean) => {
    const updated = [...hours];
    updated[index] = { ...updated[index], [field]: value };
    setHours(updated);
  };

  return (
    <>
      <div className="fixed inset-0 bg-charcoal/50 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 overflow-auto">
        <div className="sticky top-0 bg-white border-b border-charcoal/10 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-charcoal">Set Business Hours</h2>
            <p className="text-sm text-charcoal/60">When are you open for business?</p>
          </div>
          <button onClick={onClose} className="p-2 text-charcoal/40 hover:text-charcoal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {hours.map((day, index) => (
            <div
              key={day.day}
              className={`p-4 rounded-xl border transition-all ${
                day.isOpen ? 'border-sage/30 bg-sage/5' : 'border-charcoal/10 bg-charcoal/5'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-24 flex-shrink-0">
                  <span className="font-medium text-charcoal">{day.day}</span>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={day.isOpen}
                    onChange={(e) => updateHours(index, 'isOpen', e.target.checked)}
                    className="w-5 h-5 rounded border-charcoal/20 text-sage focus:ring-sage"
                  />
                  <span className="text-sm text-charcoal/60">Open</span>
                </label>

                {day.isOpen && (
                  <div className="flex items-center gap-2 ml-auto">
                    <input
                      type="time"
                      value={day.startTime}
                      onChange={(e) => updateHours(index, 'startTime', e.target.value)}
                      className="px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                    />
                    <span className="text-charcoal/40">to</span>
                    <input
                      type="time"
                      value={day.endTime}
                      onChange={(e) => updateHours(index, 'endTime', e.target.value)}
                      className="px-3 py-2 rounded-lg border border-charcoal/20 focus:border-sage outline-none text-sm"
                    />
                  </div>
                )}

                {!day.isOpen && <span className="ml-auto text-sm text-charcoal/40">Closed</span>}
              </div>
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark disabled:opacity-50 mt-6"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Hours'
            )}
          </button>
        </div>
      </div>
    </>
  );
}
