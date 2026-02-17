"use client";

import { useState } from "react";
import { useBookingStore } from "@/stores/booking-store";
import { useServices, useAddOns } from "@/hooks/use-services";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plane, Check } from "lucide-react";

const AIRCRAFT_CLASSES = [
  {
    id: "single-engine",
    name: "Single Engine",
    displayName: "Single Engine",
    description: "Cessna 172, Piper Cherokee",
  },
  {
    id: "twin-engine",
    name: "Twin Engine",
    displayName: "Twin Engine",
    description: "Baron, Seneca",
  },
  {
    id: "turboprop",
    name: "Turboprop",
    displayName: "Turboprop",
    description: "King Air, TBM",
  },
  {
    id: "light-jet",
    name: "Light Jet",
    displayName: "Light Jet",
    description: "Citation CJ, Phenom 100",
  },
  {
    id: "midsize-jet",
    name: "Midsize Jet",
    displayName: "Midsize Jet",
    description: "Citation Excel, Hawker 800",
  },
  {
    id: "heavy-jet",
    name: "Heavy Jet",
    displayName: "Heavy Jet",
    description: "Gulfstream, Global",
  },
  {
    id: "helicopter",
    name: "Helicopter",
    displayName: "Helicopter",
    description: "All rotorcraft",
  },
];

export function AircraftDetails() {
  const {
    aircraftClassId,
    serviceId,
    addOnIds,
    tailNumber,
    setAircraftClass,
    setService,
    toggleAddOn,
    setTailNumber,
  } = useBookingStore();

  const { data: services, isLoading: servicesLoading } = useServices();
  const { data: addOns, isLoading: addOnsLoading } = useAddOns(serviceId);

  return (
    <div className="space-y-8">
      {/* Aircraft Class Selection */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          Select Aircraft Type
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Choose the class that matches your aircraft
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {AIRCRAFT_CLASSES.map((aircraft) => (
            <button
              key={aircraft.id}
              onClick={() => setAircraftClass(aircraft.id)}
              className={`relative rounded-lg border-2 p-4 text-left transition-all hover:shadow-md ${
                aircraftClassId === aircraft.id
                  ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                  : "border-gray-200 bg-white hover:border-blue-300"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-full p-2 ${
                      aircraftClassId === aircraft.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Plane className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {aircraft.displayName}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      {aircraft.description}
                    </div>
                  </div>
                </div>
                {aircraftClassId === aircraft.id && (
                  <div className="rounded-full bg-blue-600 p-1 text-white">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tail Number (Optional) */}
      {aircraftClassId && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Label htmlFor="tailNumber">
            Tail Number <span className="text-gray-500 font-normal">(Optional)</span>
          </Label>
          <Input
            id="tailNumber"
            value={tailNumber}
            onChange={(e) => setTailNumber(e.target.value.toUpperCase())}
            placeholder="N12345"
            className="mt-2 max-w-xs"
          />
          <p className="mt-1 text-xs text-gray-500">
            Help us identify your aircraft in our records
          </p>
        </div>
      )}

      {/* Service Type Selection */}
      {aircraftClassId && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Select Service Type
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Choose the type of detailing service you need
          </p>

          {servicesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-32 rounded-lg border-2 border-gray-200 bg-gray-50 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {services?.map((service: any) => (
                <button
                  key={service.id}
                  onClick={() => setService(service.id)}
                  className={`relative rounded-lg border-2 p-6 text-center transition-all hover:shadow-md ${
                    serviceId === service.id
                      ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                      : "border-gray-200 bg-white hover:border-blue-300"
                  }`}
                >
                  <div className="text-lg font-semibold text-gray-900">
                    {service.name}
                  </div>
                  {service.description && (
                    <div className="mt-2 text-sm text-gray-600">
                      {service.description}
                    </div>
                  )}
                  <div className="mt-3 text-xs text-gray-500">
                    ~{service.baseDurationMinutes} minutes
                  </div>
                  {serviceId === service.id && (
                    <div className="absolute top-3 right-3 rounded-full bg-blue-600 p-1 text-white">
                      <Check className="h-3 w-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add-ons */}
      {serviceId && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Add Extra Services
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Optional enhancements for your service
          </p>

          {addOnsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-lg border border-gray-200 bg-gray-50 animate-pulse"
                />
              ))}
            </div>
          ) : addOns && addOns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {addOns.map((addOn: any) => (
                <button
                  key={addOn.id}
                  onClick={() => toggleAddOn(addOn.id)}
                  className={`rounded-lg border-2 p-4 text-left transition-all hover:shadow-sm ${
                    addOnIds.includes(addOn.id)
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {addOn.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          ${addOn.price}
                        </Badge>
                      </div>
                      {addOn.description && (
                        <p className="mt-1 text-sm text-gray-600">
                          {addOn.description}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        +{addOn.durationMinutes} min
                      </p>
                    </div>
                    <div
                      className={`ml-3 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-all ${
                        addOnIds.includes(addOn.id)
                          ? "border-blue-600 bg-blue-600"
                          : "border-gray-300"
                      }`}
                    >
                      {addOnIds.includes(addOn.id) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-sm text-gray-500">
                No additional services available for this service type
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Summary */}
      {aircraftClassId && serviceId && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-blue-600 p-2 text-white">
              <Check className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Ready to continue</div>
              <div className="mt-1 text-sm text-gray-600">
                {AIRCRAFT_CLASSES.find((a) => a.id === aircraftClassId)?.displayName}{" "}
                • {services?.find((s: any) => s.id === serviceId)?.name}
                {addOnIds.length > 0 && ` • ${addOnIds.length} add-on${addOnIds.length > 1 ? "s" : ""}`}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
