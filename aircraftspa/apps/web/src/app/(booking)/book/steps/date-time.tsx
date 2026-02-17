"use client";

import { useEffect } from "react";
import { useBookingStore } from "@/stores/booking-store";
import { useAvailability } from "@/hooks/use-availability";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export function DateTime() {
  const {
    aircraftClassId,
    serviceId,
    addOnIds,
    selectedDate,
    selectedTime,
    setDate,
    setTime,
  } = useBookingStore();

  const availabilityInput =
    selectedDate && serviceId && aircraftClassId
      ? {
          date: selectedDate.toISOString(),
          serviceId,
          aircraftClassId,
          addOnIds,
        }
      : null;

  const { data: timeSlots, isLoading } = useAvailability(availabilityInput);

  // Check if the selected date is within 48 hours (rush service)
  const isRushService = selectedDate
    ? new Date(selectedDate).getTime() - new Date().getTime() < 48 * 60 * 60 * 1000
    : false;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          Select Date & Time
        </h2>
        <p className="text-sm text-gray-600">
          Choose when you&apos;d like your service performed
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendar */}
        <div>
          <div className="mb-4">
            <div className="font-medium text-gray-900">Select Date</div>
            <p className="text-sm text-gray-600 mt-1">
              Choose an available date for your service
            </p>
          </div>

          <Card className="w-fit">
            <CardContent className="p-4">
              <Calendar
                mode="single"
                selected={selectedDate || undefined}
                onSelect={(date) => date && setDate(date)}
                disabled={(date) => {
                  // Disable past dates
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today;
                }}
                className="rounded-md border-0"
              />
            </CardContent>
          </Card>

          {isRushService && selectedDate && (
            <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium text-amber-900">
                    Rush Service Fee Applies
                  </div>
                  <p className="text-sm text-amber-700 mt-1">
                    Bookings within 48 hours may incur a rush service surcharge.
                    This has been included in your pricing.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Time Slots */}
        <div>
          <div className="mb-4">
            <div className="font-medium text-gray-900">Select Time</div>
            <p className="text-sm text-gray-600 mt-1">
              {selectedDate
                ? `Available slots for ${format(selectedDate, "MMMM d, yyyy")}`
                : "Select a date to see available times"}
            </p>
          </div>

          {!selectedDate ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  Please select a date first
                </p>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <Card>
              <CardContent className="py-8">
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="h-12 rounded-lg bg-gray-100 animate-pulse"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : timeSlots && timeSlots.length > 0 ? (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {timeSlots.map((slot: any) => (
                <button
                  key={slot.time}
                  onClick={() => setTime(slot.time)}
                  disabled={!slot.available}
                  className={`w-full rounded-lg border-2 p-4 text-left transition-all ${
                    !slot.available
                      ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                      : selectedTime === slot.time
                        ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100 hover:shadow-md"
                        : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`rounded-full p-2 ${
                          selectedTime === slot.time
                            ? "bg-blue-600 text-white"
                            : slot.available
                              ? "bg-gray-100 text-gray-600"
                              : "bg-gray-50 text-gray-400"
                        }`}
                      >
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <div
                          className={`font-medium ${
                            slot.available ? "text-gray-900" : "text-gray-500"
                          }`}
                        >
                          {slot.time}
                        </div>
                        {slot.estimatedEnd && (
                          <div className="text-xs text-gray-600 mt-0.5">
                            Estimated completion: {slot.estimatedEnd}
                          </div>
                        )}
                      </div>
                    </div>
                    {!slot.available && (
                      <Badge variant="outline" className="text-xs">
                        Booked
                      </Badge>
                    )}
                    {selectedTime === slot.time && (
                      <div className="rounded-full bg-blue-600 p-1 text-white">
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
                <p className="font-medium text-gray-900 mb-1">
                  No availability
                </p>
                <p className="text-sm text-gray-500">
                  Please select a different date
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Selected Summary */}
      {selectedDate && selectedTime && (
        <Card className="max-w-2xl border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-600 p-2 text-white">
                <Clock className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  Service Scheduled
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  {format(selectedDate, "EEEE, MMMM d, yyyy")} at {selectedTime}
                </div>
                {isRushService && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    Rush Service
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Note */}
      <div className="max-w-2xl rounded-lg bg-gray-50 border border-gray-200 p-4">
        <p className="text-sm text-gray-600">
          <strong>Please note:</strong> Service times are estimates. Our team will
          contact you to confirm the exact arrival time and any last-minute details
          before your scheduled date.
        </p>
      </div>
    </div>
  );
}
