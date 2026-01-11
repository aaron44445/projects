/**
 * Availability Service
 * Implements 30-minute grid availability algorithm for appointment scheduling
 *
 * Algorithm:
 * 1. Validate input (dates, ranges)
 * 2. Get staff working hours for the day
 * 3. Check for time off
 * 4. Get service details
 * 5. Generate 30-minute slots
 * 6. Return array of available Date objects
 */

import { prisma } from '@pecase/database'

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const NINETY_DAYS_MS = 90 * ONE_DAY_MS
const SLOT_INCREMENT_MINUTES = 30
const MINUTES_PER_HOUR = 60

/**
 * Main availability function: get available slots for appointment scheduling
 * Uses 30-minute grid based on staff working hours
 *
 * @param salonId - The salon ID
 * @param serviceId - The service ID (to get duration)
 * @param staffId - The staff member ID
 * @param date - The date to check availability for
 * @param bufferMinutes - Optional override for buffer time (uses service buffer if not provided)
 * @returns Array of Date objects representing valid appointment start times
 */
export async function getAvailableSlots(
  salonId: string,
  serviceId: string,
  staffId: string,
  date: Date,
  bufferMinutes?: number
): Promise<Date[]> {
  try {
    // STEP 1: VALIDATE INPUT
    const validationResult = validateInput(date)
    if (!validationResult.valid) {
      return [] // Invalid date
    }

    // STEP 2: GET STAFF WORKING HOURS FOR THE DAY
    const dayOfWeek = date.getDay()
    const staffAvailability = await prisma.staffAvailability.findUnique({
      where: {
        staffId_dayOfWeek: {
          staffId,
          dayOfWeek,
        },
      },
    })

    // If no availability record, staff doesn't work this day
    if (!staffAvailability || !staffAvailability.isAvailable) {
      return []
    }

    // Extract working hours
    const workStart = timeStringToMinutes(staffAvailability.startTime)
    const workEnd = timeStringToMinutes(staffAvailability.endTime)
    const lunchStart = staffAvailability.lunchStart ? timeStringToMinutes(staffAvailability.lunchStart) : null
    const lunchEnd = staffAvailability.lunchEnd ? timeStringToMinutes(staffAvailability.lunchEnd) : null

    // STEP 3: CHECK TIME OFF
    const timeOffRecord = await prisma.timeOff.findFirst({
      where: {
        staffId,
        startDate: {
          lte: date,
        },
        endDate: {
          gte: date,
        },
      },
    })

    // If staff is on time off, no availability
    if (timeOffRecord) {
      return []
    }

    // STEP 4: GET SERVICE DETAILS
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    })

    if (!service) {
      throw new Error(`Service not found: ${serviceId}`)
    }

    // Calculate total slot time = duration + buffer
    const serviceDuration = service.durationMinutes
    const buffer = bufferMinutes ?? 0
    const totalSlotTime = serviceDuration + buffer

    // STEP 5: GENERATE 30-MINUTE SLOTS
    const slots: Date[] = []

    // Iterate through each 30-minute increment from start to end
    for (let slotMinutes = workStart; slotMinutes < workEnd; slotMinutes += SLOT_INCREMENT_MINUTES) {
      // Calculate when the appointment would end if started at this slot
      const slotEndMinutes = slotMinutes + totalSlotTime

      // Check if appointment fits before work ends
      if (slotEndMinutes > workEnd) {
        continue // Slot doesn't fit, skip
      }

      // Check if slot overlaps with lunch break
      if (lunchStart !== null && lunchEnd !== null) {
        // Lunch break exists, check for overlap
        // Overlap occurs if: slotStart < lunchEnd AND slotEnd > lunchStart
        if (slotMinutes < lunchEnd && slotEndMinutes > lunchStart) {
          continue // Overlaps with lunch, skip
        }
      }

      // Check if there are existing appointments that would conflict
      const slotStartDate = minutesToDateOnDay(date, slotMinutes)
      const slotEndDate = minutesToDateOnDay(date, slotEndMinutes)

      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          staffId,
          salonId,
          status: {
            // Include appointments that aren't cancelled or no-show
            notIn: ['cancelled', 'no_show'],
          },
          // Find any appointment that overlaps with [slotStart, slotEnd)
          startTime: {
            lt: slotEndDate, // Appointment starts before slot ends
          },
          endTime: {
            gt: slotStartDate, // Appointment ends after slot starts
          },
        },
      })

      // If no conflicting appointment, add this slot to available slots
      if (!conflictingAppointment) {
        slots.push(slotStartDate)
      }
    }

    // STEP 6: RETURN
    // Slots should already be sorted chronologically due to iteration order
    return slots
  } catch (error) {
    throw error
  }
}

/**
 * Validate input parameters
 * - Reject past dates
 * - Reject dates >90 days in future
 */
function validateInput(date: Date): { valid: boolean; error?: string } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  // Check if date is in the past
  if (checkDate < today) {
    return { valid: false, error: 'Cannot schedule appointments in the past' }
  }

  // Check if date is more than 90 days in future
  const maxDate = new Date(today.getTime() + NINETY_DAYS_MS)
  if (checkDate > maxDate) {
    return { valid: false, error: 'Cannot schedule appointments more than 90 days in the future' }
  }

  return { valid: true }
}

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * MINUTES_PER_HOUR + minutes
}

/**
 * Convert minutes since midnight to a Date on the given day
 */
function minutesToDateOnDay(day: Date, minutes: number): Date {
  const hours = Math.floor(minutes / MINUTES_PER_HOUR)
  const mins = minutes % MINUTES_PER_HOUR

  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, mins, 0, 0)
}
