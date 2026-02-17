export interface CrewScheduleEntry {
  userId: string;
  startTime: string;
  endTime: string;
}

export interface ExistingBooking {
  technicianId: string;
  startTime: string;
  endTime: string;
  bufferMinutes: number;
}

export interface ScheduleContext {
  date: Date;
  durationMinutes: number;
  travelBufferMinutes: number;
  crewSchedules: CrewScheduleEntry[];
  existingBookings: ExistingBooking[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  availableTechnicians: string[];
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function isSlotAvailable(
  slotStart: number,
  slotEnd: number,
  techId: string,
  existingBookings: ExistingBooking[],
  buffer: number
): boolean {
  for (const booking of existingBookings) {
    if (booking.technicianId !== techId) continue;
    const bookingStart = timeToMinutes(booking.startTime) - buffer;
    const bookingEnd = timeToMinutes(booking.endTime) + booking.bufferMinutes;
    if (slotStart < bookingEnd && slotEnd > bookingStart) {
      return false;
    }
  }
  return true;
}

export function getAvailableSlots(ctx: ScheduleContext): TimeSlot[] {
  if (ctx.crewSchedules.length === 0) return [];

  const slotInterval = 30;
  const slots: TimeSlot[] = [];

  let earliestStart = Infinity;
  let latestEnd = 0;
  for (const cs of ctx.crewSchedules) {
    earliestStart = Math.min(earliestStart, timeToMinutes(cs.startTime));
    latestEnd = Math.max(latestEnd, timeToMinutes(cs.endTime));
  }

  for (let start = earliestStart; start + ctx.durationMinutes <= latestEnd; start += slotInterval) {
    const end = start + ctx.durationMinutes;
    const availableTechs: string[] = [];

    for (const cs of ctx.crewSchedules) {
      const crewStart = timeToMinutes(cs.startTime);
      const crewEnd = timeToMinutes(cs.endTime);

      if (start < crewStart || end > crewEnd) continue;

      if (isSlotAvailable(start, end, cs.userId, ctx.existingBookings, ctx.travelBufferMinutes)) {
        availableTechs.push(cs.userId);
      }
    }

    if (availableTechs.length > 0) {
      slots.push({
        startTime: minutesToTime(start),
        endTime: minutesToTime(end),
        availableTechnicians: availableTechs,
      });
    }
  }

  return slots;
}
