/**
 * Booking API Client
 * HTTP client for booking-related API endpoints
 */

import axios, { AxiosInstance } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

class BookingAPI {
  private api: AxiosInstance

  constructor(baseURL: string = API_BASE_URL) {
    this.api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  /**
   * Create a Stripe payment intent
   */
  createPaymentIntent(data: {
    salonId: string
    serviceId: string
    staffId: string
    startTime: string
    customerName: string
    customerEmail: string
    customerPhone: string
    amount: number
  }) {
    return this.api.post('/payments/create-intent', data)
  }

  /**
   * Confirm a booking and payment
   */
  confirmBooking(data: {
    paymentIntentId: string
    salonId: string
    serviceId: string
    staffId: string
    startTime: string
    customerName: string
    customerEmail: string
    customerPhone: string
    price: number
  }) {
    return this.api.post('/payments/confirm-booking', data)
  }

  /**
   * Get available staff for a service
   */
  getAvailableStaff(salonId: string, serviceId: string) {
    return this.api.get(`/services/${serviceId}/staff`, {
      params: { salonId },
    })
  }

  /**
   * Get available time slots
   */
  getAvailableSlots(salonId: string, staffId: string, date: string) {
    return this.api.get('/availability/slots', {
      params: { salonId, staffId, date },
    })
  }

  /**
   * Get services for a salon
   */
  getSalonServices(salonId: string) {
    return this.api.get(`/services`, {
      params: { salonId },
    })
  }
}

export const bookingAPI = new BookingAPI()
