"use client";

import { useBookingStore } from "@/stores/booking-store";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AircraftDetails } from "./steps/aircraft-details";
import { Location } from "./steps/location";
import { Pricing } from "./steps/pricing";
import { DateTime } from "./steps/date-time";
import { Payment } from "./steps/payment";
import { Confirmation } from "./steps/confirmation";

const STEPS = [
  { id: 1, name: "Aircraft", component: AircraftDetails },
  { id: 2, name: "Location", component: Location },
  { id: 3, name: "Pricing", component: Pricing },
  { id: 4, name: "Schedule", component: DateTime },
  { id: 5, name: "Payment", component: Payment },
  { id: 6, name: "Confirmation", component: Confirmation },
];

export default function BookPage() {
  const { step, nextStep, prevStep } = useBookingStore();
  const currentStep = STEPS.find((s) => s.id === step);
  const CurrentComponent = currentStep?.component;

  const canGoBack = step > 1 && step < 6;
  const showNavigation = step < 6;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        {/* Step Indicator */}
        <div className="mb-8 md:mb-12">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Book Your Service</h1>
            <p className="mt-2 text-gray-600">
              Step {step} of {STEPS.length}: {currentStep?.name}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
            <div
              className="absolute top-5 left-0 h-0.5 bg-blue-600 transition-all duration-500"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
            />

            {/* Desktop Step Indicators */}
            <div className="relative hidden md:flex justify-between">
              {STEPS.map((s, idx) => (
                <div key={s.id} className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                      s.id < step
                        ? "border-blue-600 bg-blue-600 text-white"
                        : s.id === step
                          ? "border-blue-600 bg-white text-blue-600 ring-4 ring-blue-100"
                          : "border-gray-300 bg-white text-gray-400"
                    }`}
                  >
                    {s.id < step ? (
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <span className="text-sm font-semibold">{s.id}</span>
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      s.id <= step ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {s.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Mobile Step Indicators */}
            <div className="relative flex md:hidden justify-between">
              {STEPS.map((s) => (
                <div
                  key={s.id}
                  className={`h-10 w-10 flex items-center justify-center rounded-full border-2 transition-all ${
                    s.id < step
                      ? "border-blue-600 bg-blue-600 text-white"
                      : s.id === step
                        ? "border-blue-600 bg-white text-blue-600 ring-4 ring-blue-100"
                        : "border-gray-300 bg-white text-gray-400"
                  }`}
                >
                  {s.id < step ? (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="text-xs font-semibold">{s.id}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[500px]">
          {CurrentComponent && <CurrentComponent />}
        </div>

        {/* Navigation */}
        {showNavigation && (
          <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={!canGoBack}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>

            <div className="text-sm text-gray-500">
              Step {step} of {STEPS.length}
            </div>

            <Button onClick={nextStep} className="gap-1">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
