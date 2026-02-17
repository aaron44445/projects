export interface PricingInput {
  basePrice: number;
  aircraftSizeMultiplier: number;
  addOns: Array<{ name: string; price: number; useAircraftMultiplier: boolean }>;
  travelDistanceMiles: number;
  travelFeePerMile: number;
  minimumTravelFee: number;
  maximumTravelFee: number | null;
  isRushSameDay: boolean;
  isRushNextDay: boolean;
  rushSameDayMultiplier: number;
  rushNextDayMultiplier: number;
  depositPercent: number;
}

export interface PricingResult {
  basePrice: number;
  addOnsTotal: number;
  addOnItems: Array<{ name: string; price: number }>;
  travelFee: number;
  rushSurcharge: number;
  subtotal: number;
  totalPrice: number;
  depositPercent: number;
  depositAmount: number;
}

export function calculatePrice(input: PricingInput): PricingResult {
  const basePrice = input.basePrice * input.aircraftSizeMultiplier;

  const addOnItems = input.addOns.map((addon) => ({
    name: addon.name,
    price: addon.useAircraftMultiplier
      ? addon.price * input.aircraftSizeMultiplier
      : addon.price,
  }));
  const addOnsTotal = addOnItems.reduce((sum, item) => sum + item.price, 0);

  let travelFee = 0;
  if (input.travelDistanceMiles > 0) {
    travelFee = input.travelDistanceMiles * input.travelFeePerMile;
    travelFee = Math.max(travelFee, input.minimumTravelFee);
    if (input.maximumTravelFee !== null) {
      travelFee = Math.min(travelFee, input.maximumTravelFee);
    }
  }

  let rushSurcharge = 0;
  if (input.isRushSameDay) {
    rushSurcharge = basePrice * (input.rushSameDayMultiplier - 1);
  } else if (input.isRushNextDay) {
    rushSurcharge = basePrice * (input.rushNextDayMultiplier - 1);
  }

  const subtotal = basePrice + addOnsTotal + travelFee;
  const totalPrice = subtotal + rushSurcharge;
  const depositAmount = totalPrice * (input.depositPercent / 100);

  return {
    basePrice,
    addOnsTotal,
    addOnItems,
    travelFee,
    rushSurcharge,
    subtotal,
    totalPrice,
    depositPercent: input.depositPercent,
    depositAmount,
  };
}
