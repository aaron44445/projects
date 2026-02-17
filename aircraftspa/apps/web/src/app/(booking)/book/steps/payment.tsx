"use client";

import { useBookingStore } from "@/stores/booking-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CreditCard, User, Mail, Phone, Lock } from "lucide-react";
import { format } from "date-fns";

export function Payment() {
  const {
    customerName,
    customerEmail,
    customerPhone,
    customerNotes,
    setCustomerInfo,
    aircraftClassId,
    serviceId,
    airportName,
    selectedDate,
    selectedTime,
    pricing,
  } = useBookingStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // This will be handled by the wizard's next button
    // Actual payment integration will be added later
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          Contact & Payment
        </h2>
        <p className="text-sm text-gray-600">
          Complete your booking with contact details and deposit payment
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Your Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <Label htmlFor="customerName">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) =>
                      setCustomerInfo({
                        name: e.target.value,
                        email: customerEmail,
                        phone: customerPhone,
                        notes: customerNotes,
                      })
                    }
                    placeholder="John Doe"
                    required
                    className="mt-2"
                  />
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="customerEmail">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="customerEmail"
                      type="email"
                      value={customerEmail}
                      onChange={(e) =>
                        setCustomerInfo({
                          name: customerName,
                          email: e.target.value,
                          phone: customerPhone,
                          notes: customerNotes,
                        })
                      }
                      placeholder="john@example.com"
                      required
                      className="pl-10"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    We&apos;ll send your booking confirmation here
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="customerPhone">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative mt-2">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="customerPhone"
                      type="tel"
                      value={customerPhone}
                      onChange={(e) =>
                        setCustomerInfo({
                          name: customerName,
                          email: customerEmail,
                          phone: e.target.value,
                          notes: customerNotes,
                        })
                      }
                      placeholder="(555) 123-4567"
                      required
                      className="pl-10"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    For service day coordination and updates
                  </p>
                </div>

                {/* Additional Notes */}
                <div>
                  <Label htmlFor="customerNotes">
                    Special Requests or Notes{" "}
                    <span className="text-gray-500 font-normal">(Optional)</span>
                  </Label>
                  <textarea
                    id="customerNotes"
                    value={customerNotes}
                    onChange={(e) =>
                      setCustomerInfo({
                        name: customerName,
                        email: customerEmail,
                        phone: customerPhone,
                        notes: e.target.value,
                      })
                    }
                    placeholder="Any special instructions or requests..."
                    rows={3}
                    className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-xs transition-all outline-none focus-visible:border-blue-600 focus-visible:ring-[3px] focus-visible:ring-blue-600/50"
                  />
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Payment Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-blue-600" />
                Deposit Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="font-medium text-gray-900 mb-2">
                  Stripe Payment Integration
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Secure payment processing coming soon
                </p>
                <div className="inline-flex items-center gap-2 rounded-md bg-white border border-gray-300 px-4 py-2 text-sm">
                  <Lock className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">
                    256-bit SSL encryption
                  </span>
                </div>
              </div>

              <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm text-blue-900">
                  <strong>Deposit Amount:</strong> ${pricing?.depositAmount.toFixed(2) || "0.00"}
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  The deposit secures your booking. The remaining balance of $
                  {pricing ? (pricing.totalPrice - pricing.depositAmount).toFixed(2) : "0.00"}{" "}
                  is due upon service completion.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-8 border-2 border-blue-200">
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4 text-sm">
                {/* Service */}
                <div>
                  <div className="font-medium text-gray-900 mb-1">Service</div>
                  <div className="text-gray-600">
                    Aircraft Detail Service
                  </div>
                </div>

                <Separator />

                {/* Location */}
                <div>
                  <div className="font-medium text-gray-900 mb-1">Location</div>
                  <div className="text-gray-600">{airportName || "Not selected"}</div>
                </div>

                <Separator />

                {/* Date & Time */}
                <div>
                  <div className="font-medium text-gray-900 mb-1">
                    Date & Time
                  </div>
                  <div className="text-gray-600">
                    {selectedDate && selectedTime ? (
                      <>
                        {format(selectedDate, "MMM d, yyyy")}
                        <br />
                        {selectedTime}
                      </>
                    ) : (
                      "Not selected"
                    )}
                  </div>
                </div>

                <Separator />

                {/* Pricing Breakdown */}
                {pricing && (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between text-gray-600">
                        <span>Base Price</span>
                        <span>${pricing.basePrice.toFixed(2)}</span>
                      </div>
                      {pricing.addOnsTotal > 0 && (
                        <div className="flex justify-between text-gray-600">
                          <span>Add-ons</span>
                          <span>${pricing.addOnsTotal.toFixed(2)}</span>
                        </div>
                      )}
                      {pricing.travelFee > 0 && (
                        <div className="flex justify-between text-gray-600">
                          <span>Travel Fee</span>
                          <span>${pricing.travelFee.toFixed(2)}</span>
                        </div>
                      )}
                      {pricing.rushSurcharge > 0 && (
                        <div className="flex justify-between text-gray-600">
                          <span>Rush Surcharge</span>
                          <span>${pricing.rushSurcharge.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="flex justify-between font-semibold text-gray-900">
                      <span>Total</span>
                      <span>${pricing.totalPrice.toFixed(2)}</span>
                    </div>

                    <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-blue-700">
                          Deposit Due Today
                        </span>
                        <span className="text-lg font-bold text-blue-600">
                          ${pricing.depositAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Terms Notice */}
          <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 p-4">
            <p className="text-xs text-gray-600">
              By completing this booking, you agree to our{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Cancellation Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
