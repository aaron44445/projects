import { describe, it, expect } from "vitest";
import { calculatePrice, type PricingInput } from "../../services/pricing";

describe("PricingEngine", () => {
  const baseInput: PricingInput = {
    basePrice: 200,
    aircraftSizeMultiplier: 1.0,
    addOns: [],
    travelDistanceMiles: 0,
    travelFeePerMile: 2.0,
    minimumTravelFee: 0,
    maximumTravelFee: null,
    isRushSameDay: false,
    isRushNextDay: false,
    rushSameDayMultiplier: 1.5,
    rushNextDayMultiplier: 1.25,
    depositPercent: 25,
  };

  it("calculates base price with aircraft multiplier", () => {
    const result = calculatePrice({ ...baseInput, aircraftSizeMultiplier: 2.0 });
    expect(result.basePrice).toBe(400);
    expect(result.totalPrice).toBe(400);
  });

  it("adds add-on prices correctly", () => {
    const result = calculatePrice({
      ...baseInput,
      addOns: [
        { name: "Carpet Shampoo", price: 50, useAircraftMultiplier: false },
        { name: "Brightwork", price: 100, useAircraftMultiplier: true },
      ],
      aircraftSizeMultiplier: 2.0,
    });
    expect(result.addOnsTotal).toBe(250);
    expect(result.totalPrice).toBe(650);
  });

  it("calculates travel fee", () => {
    const result = calculatePrice({
      ...baseInput,
      travelDistanceMiles: 30,
      minimumTravelFee: 25,
    });
    expect(result.travelFee).toBe(60);
    expect(result.totalPrice).toBe(260);
  });

  it("enforces minimum travel fee", () => {
    const result = calculatePrice({
      ...baseInput,
      travelDistanceMiles: 5,
      minimumTravelFee: 25,
    });
    expect(result.travelFee).toBe(25);
  });

  it("caps travel fee at maximum", () => {
    const result = calculatePrice({
      ...baseInput,
      travelDistanceMiles: 100,
      maximumTravelFee: 100,
    });
    expect(result.travelFee).toBe(100);
  });

  it("applies same-day rush surcharge", () => {
    const result = calculatePrice({ ...baseInput, isRushSameDay: true });
    expect(result.rushSurcharge).toBe(100);
    expect(result.totalPrice).toBe(300);
  });

  it("applies next-day rush surcharge", () => {
    const result = calculatePrice({ ...baseInput, isRushNextDay: true });
    expect(result.rushSurcharge).toBe(50);
    expect(result.totalPrice).toBe(250);
  });

  it("calculates deposit amount", () => {
    const result = calculatePrice({ ...baseInput, depositPercent: 50 });
    expect(result.depositAmount).toBe(100);
  });

  it("same-day takes priority over next-day", () => {
    const result = calculatePrice({ ...baseInput, isRushSameDay: true, isRushNextDay: true });
    expect(result.rushSurcharge).toBe(100);
  });
});
