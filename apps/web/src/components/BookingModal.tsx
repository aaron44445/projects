'use client';

import { useState, useEffect } from 'react';
import { X, Search, Calendar, Clock, User, Scissors, Loader2 } from 'lucide-react';
import { useAppointments, useStaff, useClients, useServices, useLocationContext } from '@/hooks';
import { useSalonSettings } from '@/contexts/SalonSettingsContext';

export interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  // Pre-filled data
  prefilledClientId?: string;
  prefilledClientName?: string;
  prefilledStaffId?: string;
  prefilledDate?: string;
  prefilledTime?: string;
}

export function BookingModal({
  isOpen,
  onClose,
  onSuccess,
  prefilledClientId,
  prefilledClientName,
  prefilledStaffId,
  prefilledDate,
  prefilledTime,
}: BookingModalProps) {
  const [appointmentForm, setAppointmentForm] = useState({
    clientId: '',
    serviceId: '',
    staffId: '',
    date: '',
    time: '',
    notes: '',
  });
  const [clientSearch, setClientSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { createAppointment } = useAppointments();
  const { staff } = useStaff();
  const { clients } = useClients();
  const { services } = useServices();
  const { selectedLocationId } = useLocationContext();
  const { formatPrice } = useSalonSettings();

  // Initialize form with prefilled data when modal opens
  useEffect(() => {
    if (isOpen) {
      setAppointmentForm({
        clientId: prefilledClientId || '',
        serviceId: '',
        staffId: prefilledStaffId || '',
        date: prefilledDate || new Date().toISOString().split('T')[0],
        time: prefilledTime || '10:00',
        notes: '',
      });
      setClientSearch(prefilledClientName || '');
      setSubmitError(null);
      setSubmitSuccess(false);
    }
  }, [isOpen, prefilledClientId, prefilledClientName, prefilledStaffId, prefilledDate, prefilledTime]);

  const handleSubmit = async () => {
    if (!appointmentForm.clientId || !appointmentForm.serviceId || !appointmentForm.staffId || !appointmentForm.date || !appointmentForm.time) {
      setSubmitError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const selectedService = services?.find((s) => s.id === appointmentForm.serviceId);
      const durationMinutes = selectedService?.durationMinutes || 60;

      const startDateTime = new Date(`${appointmentForm.date}T${appointmentForm.time}`);
      const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60000);

      await createAppointment({
        clientId: appointmentForm.clientId,
        staffId: appointmentForm.staffId,
        serviceId: appointmentForm.serviceId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        notes: appointmentForm.notes || undefined,
        locationId: selectedLocationId || undefined,
      });

      setSubmitSuccess(true);

      // Call success callback and close after brief delay
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Failed to create appointment:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to create appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter clients based on search
  const filteredClients = clientSearch && !prefilledClientId
    ? (clients || []).filter((client) =>
        `${client.firstName} ${client.lastName}`.toLowerCase().includes(clientSearch.toLowerCase()) ||
        client.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
        client.phone?.includes(clientSearch)
      ).slice(0, 5)
    : [];

  if (!isOpen) return null;

  const isClientLocked = !!prefilledClientId;

  return (
    <div className="fixed inset-0 bg-charcoal/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-sidebar rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="p-6 border-b border-charcoal/10 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sage/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-sage" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-charcoal dark:text-white">Book Appointment</h2>
              {prefilledClientName && (
                <p className="text-sm text-charcoal/60 dark:text-white/60">for {prefilledClientName}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-charcoal/40 dark:text-white/40 hover:text-charcoal dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {submitError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
              {submitError}
            </div>
          )}

          {submitSuccess && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 text-sm flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              Appointment booked successfully!
            </div>
          )}

          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Client
            </label>
            {isClientLocked ? (
              <div className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-charcoal/5 dark:bg-white/5 text-charcoal dark:text-white">
                <p className="font-medium">{prefilledClientName}</p>
                <p className="text-xs text-charcoal/60 dark:text-white/60">Client pre-selected</p>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal/40 dark:text-white/40" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
                />
                {filteredClients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 border border-charcoal/10 dark:border-white/10 rounded-xl max-h-40 overflow-auto bg-white dark:bg-charcoal z-10 shadow-lg">
                    {filteredClients.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => {
                          setAppointmentForm((prev) => ({ ...prev, clientId: client.id }));
                          setClientSearch(`${client.firstName} ${client.lastName}`);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-charcoal/5 dark:hover:bg-white/5 ${
                          appointmentForm.clientId === client.id ? 'bg-sage/10' : ''
                        }`}
                      >
                        <p className="font-medium text-charcoal dark:text-white">
                          {client.firstName} {client.lastName}
                        </p>
                        <p className="text-xs text-charcoal/60 dark:text-white/60">{client.email || client.phone}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Service Selection */}
          <div>
            <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
              <Scissors className="w-4 h-4 inline mr-1" />
              Service
            </label>
            <select
              value={appointmentForm.serviceId}
              onChange={(e) => setAppointmentForm((prev) => ({ ...prev, serviceId: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
            >
              <option value="">Select a service...</option>
              {(services || []).map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} - {service.durationMinutes} min - {formatPrice(service.price)}
                </option>
              ))}
            </select>
          </div>

          {/* Staff Selection */}
          <div>
            <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Staff Member
            </label>
            <select
              value={appointmentForm.staffId}
              onChange={(e) => setAppointmentForm((prev) => ({ ...prev, staffId: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
            >
              <option value="">Select staff...</option>
              {(staff || []).map((staffMember) => (
                <option key={staffMember.id} value={staffMember.id}>
                  {staffMember.firstName} {staffMember.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date
              </label>
              <input
                type="date"
                value={appointmentForm.date}
                onChange={(e) => setAppointmentForm((prev) => ({ ...prev, date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Time
              </label>
              <input
                type="time"
                value={appointmentForm.time}
                onChange={(e) => setAppointmentForm((prev) => ({ ...prev, time: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
              Notes (optional)
            </label>
            <textarea
              value={appointmentForm.notes}
              onChange={(e) => setAppointmentForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Any special requests or notes..."
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-charcoal/20 dark:border-white/20 bg-white dark:bg-charcoal text-charcoal dark:text-white focus:border-sage focus:ring-2 focus:ring-sage/20 outline-none transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-charcoal/10 dark:border-white/10 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 border border-charcoal/20 dark:border-white/20 text-charcoal dark:text-white rounded-xl font-medium hover:bg-charcoal/5 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || submitSuccess}
            className="flex-1 px-4 py-3 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitSuccess ? 'Booked!' : 'Book Appointment'}
          </button>
        </div>
      </div>
    </div>
  );
}
