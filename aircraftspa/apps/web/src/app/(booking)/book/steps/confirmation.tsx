"use client";

import { useBookingStore } from "@/stores/booking-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Calendar,
  MapPin,
  Plane,
  Mail,
  Phone,
  Download,
  CalendarPlus,
} from "lucide-react";
import { format } from "date-fns";

export function Confirmation() {
  const {
    customerName,
    customerEmail,
    customerPhone,
    airportName,
    locationType,
    selectedDate,
    selectedTime,
    pricing,
    reset,
  } = useBookingStore();

  const handleBookAnother = () => {
    reset();
  };

  const handleAddToCalendar = () => {
    // Placeholder for calendar integration
    alert("Add to calendar feature coming soon!");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Success Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6 animate-in zoom-in duration-500">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Booking Confirmed!
        </h1>
        <p className="text-lg text-gray-600">
          Thank you, {customerName}. Your aircraft detailing service is scheduled.
        </p>
      </div>

      {/* Confirmation Details */}
      <Card className="border-2 border-green-200 shadow-lg">
        <CardHeader className="bg-green-50 border-b">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Booking Details
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Service Date & Time */}
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">
                  Scheduled Service
                </div>
                {selectedDate && selectedTime && (
                  <div className="text-gray-700">
                    <div className="text-lg">
                      {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </div>
                    <div className="text-gray-600 mt-1">{selectedTime}</div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Location */}
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                <MapPin className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">Location</div>
                <div className="text-gray-700">{airportName}</div>
                <Badge variant="outline" className="mt-2 text-xs">
                  {locationType === "hangar" ? "Hangar" : "Ramp"}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Service Type */}
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-blue-100 p-3 text-blue-600">
                <Plane className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 mb-1">
                  Service Type
                </div>
                <div className="text-gray-700">Aircraft Detailing Service</div>
              </div>
            </div>

            {pricing && (
              <>
                <Separator />

                {/* Payment Summary */}
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="font-semibold text-gray-900 mb-3">
                    Payment Summary
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-700">
                      <span>Total Service Cost</span>
                      <span className="font-medium">
                        ${pricing.totalPrice.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-green-700">
                      <span>Deposit Paid</span>
                      <span className="font-medium">
                        -${pricing.depositAmount.toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-gray-900 font-semibold">
                      <span>Balance Due at Completion</span>
                      <span>
                        ${(pricing.totalPrice - pricing.depositAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Confirmation Sent To</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-700">
              <Mail className="h-5 w-5 text-gray-500" />
              <span>{customerEmail}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <Phone className="h-5 w-5 text-gray-500" />
              <span>{customerPhone}</span>
            </div>
          </div>
          <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm text-blue-900">
              We&apos;ve sent a confirmation email with all the details. Please check
              your inbox (and spam folder, just in case).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* What's Next */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle>What Happens Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-semibold">
                1
              </span>
              <span>
                You&apos;ll receive a confirmation email with your booking details and
                receipt
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-semibold">
                2
              </span>
              <span>
                Our team will contact you 24 hours before service to confirm arrival
                time
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-semibold">
                3
              </span>
              <span>
                On service day, our technicians will arrive and perform the detail
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-semibold">
                4
              </span>
              <span>
                Final payment and walk-through inspection upon completion
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
        <Button
          variant="outline"
          onClick={handleAddToCalendar}
          className="gap-2"
        >
          <CalendarPlus className="h-4 w-4" />
          Add to Calendar
        </Button>
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Download Confirmation
        </Button>
      </div>

      {/* Book Another */}
      <div className="text-center pt-8 border-t">
        <p className="text-gray-600 mb-4">Need to schedule another service?</p>
        <Button onClick={handleBookAnother} size="lg">
          Book Another Service
        </Button>
      </div>
    </div>
  );
}
