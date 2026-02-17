import { create } from "zustand";

interface PricingResult {
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

interface BookingState {
  step: number;
  aircraftClassId: string | null;
  tailNumber: string;
  serviceId: string | null;
  addOnIds: string[];
  airportId: string | null;
  airportName: string;
  locationType: "hangar" | "ramp";
  locationNotes: string;
  selectedDate: Date | null;
  selectedTime: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerNotes: string;
  pricing: PricingResult | null;

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setAircraftClass: (id: string) => void;
  setTailNumber: (tail: string) => void;
  setService: (id: string) => void;
  toggleAddOn: (id: string) => void;
  setAirport: (id: string, name: string) => void;
  setLocationType: (type: "hangar" | "ramp") => void;
  setLocationNotes: (notes: string) => void;
  setDate: (date: Date) => void;
  setTime: (time: string) => void;
  setCustomerInfo: (info: { name: string; email: string; phone: string; notes?: string }) => void;
  setPricing: (pricing: PricingResult) => void;
  reset: () => void;
}

const initialState = {
  step: 1,
  aircraftClassId: null,
  tailNumber: "",
  serviceId: null,
  addOnIds: [] as string[],
  airportId: null,
  airportName: "",
  locationType: "hangar" as const,
  locationNotes: "",
  selectedDate: null,
  selectedTime: null,
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  customerNotes: "",
  pricing: null,
};

export const useBookingStore = create<BookingState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),
  nextStep: () => set((s) => ({ step: Math.min(s.step + 1, 6) })),
  prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 1) })),
  setAircraftClass: (id) => set({ aircraftClassId: id }),
  setTailNumber: (tail) => set({ tailNumber: tail }),
  setService: (id) => set({ serviceId: id, addOnIds: [] }),
  toggleAddOn: (id) =>
    set((s) => ({
      addOnIds: s.addOnIds.includes(id)
        ? s.addOnIds.filter((a) => a !== id)
        : [...s.addOnIds, id],
    })),
  setAirport: (id, name) => set({ airportId: id, airportName: name }),
  setLocationType: (type) => set({ locationType: type }),
  setLocationNotes: (notes) => set({ locationNotes: notes }),
  setDate: (date) => set({ selectedDate: date, selectedTime: null }),
  setTime: (time) => set({ selectedTime: time }),
  setCustomerInfo: (info) =>
    set({
      customerName: info.name,
      customerEmail: info.email,
      customerPhone: info.phone,
      customerNotes: info.notes || "",
    }),
  setPricing: (pricing) => set({ pricing }),
  reset: () => set(initialState),
}));
