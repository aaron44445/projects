import ical, {
  ICalCalendarMethod,
  ICalEventStatus,
  ICalAlarmType,
} from "ical-generator";

interface CalendarEventInput {
  bookingId: string;
  summary: string;
  description: string;
  location: string;
  start: Date;
  durationMinutes: number;
  organizerName: string;
  organizerEmail: string;
  attendeeEmail: string;
  attendeeName: string;
}

export function generateCalendarInvite(input: CalendarEventInput): string {
  const calendar = ical({
    method: ICalCalendarMethod.REQUEST,
    name: "AircraftSpa Booking",
    prodId: { company: "AircraftSpa", product: "Booking System" },
  });

  const endDate = new Date(
    input.start.getTime() + input.durationMinutes * 60 * 1000
  );

  calendar.createEvent({
    id: input.bookingId,
    start: input.start,
    end: endDate,
    summary: input.summary,
    description: input.description,
    location: input.location,
    status: ICalEventStatus.CONFIRMED,
    organizer: {
      name: input.organizerName,
      email: input.organizerEmail,
    },
    attendees: [
      {
        name: input.attendeeName,
        email: input.attendeeEmail,
        rsvp: true,
      },
    ],
    alarms: [
      { type: ICalAlarmType.display, trigger: 60 * 60 }, // 1 hour before
      { type: ICalAlarmType.display, trigger: 24 * 60 * 60 }, // 1 day before
    ],
  });

  return calendar.toString();
}

export function generateBookingCalendarInvite(booking: {
  id: string;
  scheduledAt: Date;
  durationMinutes: number;
  service: { name: string };
  aircraftClass: { displayName: string };
  customer: { name: string; email: string };
  location?: { airport: { icaoCode: string | null; name: string } } | null;
  technician?: { name: string; email: string } | null;
  businessName?: string;
}): string {
  const airportInfo = booking.location
    ? `${booking.location.airport.icaoCode || "ZZZZ"} — ${booking.location.airport.name}`
    : "TBD";

  return generateCalendarInvite({
    bookingId: booking.id,
    summary: `${booking.service.name} — ${booking.aircraftClass.displayName}`,
    description: [
      `Service: ${booking.service.name}`,
      `Aircraft: ${booking.aircraftClass.displayName}`,
      `Location: ${airportInfo}`,
      booking.technician ? `Technician: ${booking.technician.name}` : "",
      `Booking ID: ${booking.id}`,
    ]
      .filter(Boolean)
      .join("\n"),
    location: airportInfo,
    start: booking.scheduledAt,
    durationMinutes: booking.durationMinutes,
    organizerName: booking.businessName || "AircraftSpa",
    organizerEmail: "bookings@aircraftspa.com",
    attendeeEmail: booking.customer.email,
    attendeeName: booking.customer.name,
  });
}
