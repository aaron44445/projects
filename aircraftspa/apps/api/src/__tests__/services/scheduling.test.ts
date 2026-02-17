import { describe, it, expect } from "vitest";
import {
  getAvailableSlots,
  isSlotAvailable,
  type ScheduleContext,
} from "../../services/scheduling";

describe("SchedulingEngine", () => {
  const baseContext: ScheduleContext = {
    date: new Date("2026-03-15"),
    durationMinutes: 120,
    travelBufferMinutes: 30,
    crewSchedules: [
      { userId: "tech1", startTime: "08:00", endTime: "17:00" },
    ],
    existingBookings: [],
  };

  it("returns available slots for an open day", () => {
    const slots = getAvailableSlots(baseContext);
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].startTime).toBe("08:00");
  });

  it("blocks slots that overlap existing bookings", () => {
    const ctx: ScheduleContext = {
      ...baseContext,
      existingBookings: [
        { technicianId: "tech1", startTime: "10:00", endTime: "12:00", bufferMinutes: 30 },
      ],
    };
    const slots = getAvailableSlots(ctx);
    const conflicting = slots.filter(
      (s) => s.startTime >= "09:30" && s.startTime < "12:30"
    );
    expect(conflicting.length).toBe(0);
  });

  it("returns empty if no crew available", () => {
    const ctx: ScheduleContext = { ...baseContext, crewSchedules: [] };
    const slots = getAvailableSlots(ctx);
    expect(slots.length).toBe(0);
  });

  it("respects crew schedule end time minus duration", () => {
    const ctx: ScheduleContext = {
      ...baseContext,
      crewSchedules: [{ userId: "tech1", startTime: "08:00", endTime: "12:00" }],
    };
    const slots = getAvailableSlots(ctx);
    const lastSlot = slots[slots.length - 1];
    expect(lastSlot.startTime).toBe("10:00");
  });
});
