/**
 * Booking Store
 * Zustand store for managing booking wizard state
 */

import { create } from 'zustand'

interface BookingStore {
  // Salon & Service Selection (Step 1-2)
  salonId: string
  setSalonId: (id: string) => void
  serviceId: string
  setServiceId: (id: string) => void
  service?: {
    id: string
    name: string
    price: number
    durationMinutes: number
  }
  setService: (service: any) => void

  // Staff Selection (Step 3)
  staffId: string
  setStaffId: (id: string) => void

  // Date & Time Selection (Step 4)
  selectedDate: Date | null
  setSelectedDate: (date: Date | null) => void
  selectedTime: Date | null
  setSelectedTime: (time: Date | null) => void

  // Customer Information (Step 5)
  customerName: string
  setCustomerName: (name: string) => void
  customerEmail: string
  setCustomerEmail: (email: string) => void
  customerPhone: string
  setCustomerPhone: (phone: string) => void

  // Payment
  paymentIntentId: string
  setPaymentIntent: (id: string) => void

  // Reset
  reset: () => void
}

const initialState = {
  salonId: '',
  serviceId: '',
  staffId: '',
  selectedDate: null,
  selectedTime: null,
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  paymentIntentId: '',
}

export const useBookingStore = create<BookingStore>((set) => ({
  ...initialState,

  setSalonId: (salonId) => set({ salonId }),
  setServiceId: (serviceId) => set({ serviceId }),
  setService: (service) => set({ service }),
  setStaffId: (staffId) => set({ staffId }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setSelectedTime: (selectedTime) => set({ selectedTime }),
  setCustomerName: (customerName) => set({ customerName }),
  setCustomerEmail: (customerEmail) => set({ customerEmail }),
  setCustomerPhone: (customerPhone) => set({ customerPhone }),
  setPaymentIntent: (paymentIntentId) => set({ paymentIntentId }),

  reset: () => set(initialState),
}))
