import { create } from 'zustand'

export interface BookingState {
  salonId: string
  serviceId: string | null
  staffId: string | null
  appointmentDate: Date | null
  clientName: string
  clientEmail: string
  clientPhone: string

  // Actions
  setSalonId: (id: string) => void
  setServiceId: (id: string) => void
  setStaffId: (id: string) => void
  setAppointmentDate: (date: Date) => void
  setClientInfo: (name: string, email: string, phone: string) => void
  reset: () => void
}

export const useBookingStore = create<BookingState>((set) => ({
  salonId: '',
  serviceId: null,
  staffId: null,
  appointmentDate: null,
  clientName: '',
  clientEmail: '',
  clientPhone: '',

  setSalonId: (id) => set({ salonId: id }),
  setServiceId: (id) => set({ serviceId: id }),
  setStaffId: (id) => set({ staffId: id }),
  setAppointmentDate: (date) => set({ appointmentDate: date }),
  setClientInfo: (name, email, phone) => set({
    clientName: name,
    clientEmail: email,
    clientPhone: phone
  }),
  reset: () => set({
    salonId: '',
    serviceId: null,
    staffId: null,
    appointmentDate: null,
    clientName: '',
    clientEmail: '',
    clientPhone: ''
  })
}))
