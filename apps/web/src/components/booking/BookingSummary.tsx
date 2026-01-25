'use client';

import { Clock, User, MapPin, Calendar } from 'lucide-react';

interface BookingSummaryProps {
  serviceName: string;
  servicePrice: number;
  depositAmount: number;
  staffName?: string;
  locationName?: string;
  dateTime: string;
  durationMinutes?: number;
  primaryColor?: string;
}

/**
 * BookingSummary displays the appointment details and payment breakdown.
 * Shows service info, staff, location, date/time, and the deposit vs balance due.
 */
export function BookingSummary({
  serviceName,
  servicePrice,
  depositAmount,
  staffName,
  locationName,
  dateTime,
  durationMinutes,
  primaryColor = '#7C9A82',
}: BookingSummaryProps) {
  const balanceDue = servicePrice - depositAmount;

  return (
    <div className="bg-gray-50 rounded-xl p-4 space-y-4">
      <h3 className="font-semibold text-gray-900">Booking Summary</h3>

      <div className="space-y-3">
        {/* Service */}
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: primaryColor + '20' }}
          >
            <Clock className="w-4 h-4" style={{ color: primaryColor }} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Service</p>
            <p className="font-medium text-gray-900">{serviceName}</p>
            {durationMinutes && (
              <p className="text-xs text-gray-500">{durationMinutes} minutes</p>
            )}
          </div>
        </div>

        {/* Location */}
        {locationName && (
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: primaryColor + '20' }}
            >
              <MapPin className="w-4 h-4" style={{ color: primaryColor }} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium text-gray-900">{locationName}</p>
            </div>
          </div>
        )}

        {/* Staff */}
        {staffName && (
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: primaryColor + '20' }}
            >
              <User className="w-4 h-4" style={{ color: primaryColor }} />
            </div>
            <div>
              <p className="text-sm text-gray-500">With</p>
              <p className="font-medium text-gray-900">{staffName}</p>
            </div>
          </div>
        )}

        {/* Date/Time */}
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: primaryColor + '20' }}
          >
            <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
          </div>
          <div>
            <p className="text-sm text-gray-500">When</p>
            <p className="font-medium text-gray-900">{dateTime}</p>
          </div>
        </div>
      </div>

      {/* Payment Breakdown */}
      <div className="border-t border-gray-200 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Service total</span>
          <span className="text-gray-900">${servicePrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm font-medium">
          <span className="text-gray-700">Deposit due now</span>
          <span style={{ color: primaryColor }}>${depositAmount.toFixed(2)}</span>
        </div>
        {balanceDue > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Balance due at appointment</span>
            <span className="text-gray-900">${balanceDue.toFixed(2)}</span>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Your deposit will be charged to hold your appointment. The remaining balance is due at the time of service.
      </p>
    </div>
  );
}
