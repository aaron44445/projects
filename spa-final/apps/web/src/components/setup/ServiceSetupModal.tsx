'use client';

import { useState } from 'react';
import { X, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface ServiceSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function ServiceSetupModal({ isOpen, onClose, onComplete }: ServiceSetupModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [service, setService] = useState({
    name: '',
    duration: 30,
    price: 0,
    description: '',
  });

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.post('/services', service);
      onComplete();
      onClose();
    } catch (error) {
      console.error('Failed to create service:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-charcoal/50 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-2xl z-50 overflow-auto">
        <div className="sticky top-0 bg-white border-b border-charcoal/10 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-charcoal">Add Your First Service</h2>
            <p className="text-sm text-charcoal/60">Step {step} of 2</p>
          </div>
          <button onClick={onClose} className="p-2 text-charcoal/40 hover:text-charcoal">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Service Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={service.name}
                  onChange={(e) => setService({ ...service, name: e.target.value })}
                  placeholder="e.g., Haircut, Massage, Manicure"
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={service.description}
                  onChange={(e) => setService({ ...service, description: e.target.value })}
                  placeholder="Brief description of this service"
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none resize-none"
                />
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!service.name.trim()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark disabled:opacity-50"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Duration <span className="text-rose-500">*</span>
                </label>
                <select
                  value={service.duration}
                  onChange={(e) => setService({ ...service, duration: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none"
                >
                  {[15, 30, 45, 60, 75, 90, 120, 150, 180].map((min) => (
                    <option key={min} value={min}>
                      {min} minutes
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">
                  Price <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/40">$</span>
                  <input
                    type="number"
                    value={service.price}
                    onChange={(e) => setService({ ...service, price: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-charcoal/20 focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 text-charcoal hover:bg-charcoal/5 rounded-xl"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || service.price <= 0}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-sage text-white rounded-xl font-semibold hover:bg-sage-dark disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Service'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
