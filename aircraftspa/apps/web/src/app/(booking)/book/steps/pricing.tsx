"use client";

import { useEffect, useState } from "react";
import { useBookingStore } from "@/stores/booking-store";
import { usePricing } from "@/hooks/use-pricing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Info, ChevronDown, ChevronUp } from "lucide-react";

export function Pricing() {
  const {
    aircraftClassId,
    serviceId,
    addOnIds,
    airportId,
    selectedDate,
    pricing,
    setPricing,
  } = useBookingStore();

  const [showBreakdown, setShowBreakdown] = useState(false);

  const pricingInput =
    aircraftClassId && serviceId && airportId
      ? {
          aircraftClassId,
          serviceId,
          addOnIds,
          airportId,
          scheduledDate: selectedDate?.toISOString(),
        }
      : null;

  const { data: pricingData, isLoading } = usePricing(pricingInput);

  useEffect(() => {
    if (pricingData) {
      setPricing(pricingData);
    }
  }, [pricingData, setPricing]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <Card>
          <CardContent className="py-8">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!pricing) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-gray-500">
          Please complete the previous steps to see pricing
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          Service Pricing
        </h2>
        <p className="text-sm text-gray-600">
          Review the cost breakdown for your service
        </p>
      </div>

      {/* Main Pricing Card */}
      <Card className="max-w-2xl border-2 border-blue-200">
        <CardHeader className="border-b bg-blue-50">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Your Service Total
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Base Price */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Base Service</div>
                <div className="text-sm text-gray-600">Core detailing service</div>
              </div>
              <div className="text-lg font-semibold text-gray-900">
                ${pricing.basePrice.toFixed(2)}
              </div>
            </div>

            {/* Add-ons */}
            {pricing.addOnItems && pricing.addOnItems.length > 0 && (
              <>
                <Separator />
                <div>
                  <div className="font-medium text-gray-900 mb-3">
                    Additional Services
                  </div>
                  <div className="space-y-2">
                    {pricing.addOnItems.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <div className="text-gray-600">{item.name}</div>
                        <div className="font-medium text-gray-900">
                          ${item.price.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-between border-t pt-3">
                    <div className="text-sm font-medium text-gray-700">
                      Add-ons Subtotal
                    </div>
                    <div className="font-semibold text-gray-900">
                      ${pricing.addOnsTotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Travel Fee */}
            {pricing.travelFee > 0 && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Travel Fee</div>
                    <div className="text-sm text-gray-600">
                      Distance from our base
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    ${pricing.travelFee.toFixed(2)}
                  </div>
                </div>
              </>
            )}

            {/* Rush Surcharge */}
            {pricing.rushSurcharge > 0 && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="font-medium text-gray-900">Rush Service</div>
                      <div className="text-sm text-gray-600">
                        Same-day or next-day booking
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Rush
                    </Badge>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    ${pricing.rushSurcharge.toFixed(2)}
                  </div>
                </div>
              </>
            )}

            {/* Total */}
            <Separator className="!my-6" />
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  Total Service Cost
                </div>
                <div className="text-sm text-gray-600">Due at completion</div>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                ${pricing.totalPrice.toFixed(2)}
              </div>
            </div>

            {/* Deposit */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-gray-900">
                    Deposit Required Today
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {pricing.depositPercent}% to confirm your booking
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  ${pricing.depositAmount.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How is this priced? */}
      <div className="max-w-2xl">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-900">
              How is this priced?
            </span>
          </div>
          {showBreakdown ? (
            <ChevronUp className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-500" />
          )}
        </button>

        {showBreakdown && (
          <Card className="mt-2 border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
            <CardContent className="py-4">
              <div className="space-y-3 text-sm">
                <p className="text-gray-700">
                  <strong>Base pricing</strong> is determined by your aircraft class
                  and the type of service selected. Larger aircraft require more time
                  and materials.
                </p>
                <p className="text-gray-700">
                  <strong>Add-on services</strong> are priced individually and may use
                  aircraft size multipliers for items like polish and wax.
                </p>
                {pricing.travelFee > 0 && (
                  <p className="text-gray-700">
                    <strong>Travel fees</strong> apply based on the distance from our
                    home base to your airport location.
                  </p>
                )}
                {pricing.rushSurcharge > 0 && (
                  <p className="text-gray-700">
                    <strong>Rush service fees</strong> apply for bookings made within
                    48 hours of the scheduled service date.
                  </p>
                )}
                <p className="text-gray-700">
                  The <strong>deposit</strong> secures your booking slot and is
                  deducted from the final total. The remaining balance is due upon
                  service completion.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary Note */}
      <div className="max-w-2xl rounded-lg bg-gray-50 border border-gray-200 p-4">
        <p className="text-sm text-gray-600">
          All prices are in USD. Final pricing may vary slightly based on actual
          service time and any additional requests made during the service.
        </p>
      </div>
    </div>
  );
}
