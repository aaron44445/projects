import { createEvent, EventAttributes } from 'ics';
import { google, outlook, yahoo, ics as icsLink } from 'calendar-link';

export interface CalendarEventData {
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
  timezone?: string;  // e.g., 'America/New_York'
  organizerName?: string;
  organizerEmail?: string;
}

export interface CalendarLinks {
  google: string;
  outlook: string;
  yahoo: string;
  icsDownload: string;  // Data URL for direct download
}

/**
 * Generate add-to-calendar links for various providers
 */
export function generateCalendarLinks(event: CalendarEventData): CalendarLinks {
  const calendarEvent = {
    title: event.title,
    description: event.description,
    location: event.location,
    start: event.startTime.toISOString(),
    end: event.endTime.toISOString(),
  };

  // Generate ICS content for download link
  const icsContent = generateICSContent(event);
  const icsDataUrl = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;

  return {
    google: google(calendarEvent),
    outlook: outlook(calendarEvent),
    yahoo: yahoo(calendarEvent),
    icsDownload: icsDataUrl,
  };
}

/**
 * Generate ICS file content for Apple Calendar and other ICS apps
 */
export function generateICSContent(event: CalendarEventData): string {
  const start = event.startTime;
  const end = event.endTime;

  const eventAttrs: EventAttributes = {
    start: [
      start.getFullYear(),
      start.getMonth() + 1,  // ics uses 1-indexed months
      start.getDate(),
      start.getHours(),
      start.getMinutes(),
    ],
    end: [
      end.getFullYear(),
      end.getMonth() + 1,
      end.getDate(),
      end.getHours(),
      end.getMinutes(),
    ],
    title: event.title,
    description: event.description,
    location: event.location,
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
  };

  // Add organizer if provided
  if (event.organizerName && event.organizerEmail) {
    eventAttrs.organizer = {
      name: event.organizerName,
      email: event.organizerEmail,
    };
  }

  const { error, value } = createEvent(eventAttrs);

  if (error) {
    console.error('Error generating ICS:', error);
    // Return minimal valid ICS on error
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Peacase//Appointment//EN
BEGIN:VEVENT
DTSTART:${formatICSDate(start)}
DTEND:${formatICSDate(end)}
SUMMARY:${event.title}
LOCATION:${event.location}
END:VEVENT
END:VCALENDAR`;
  }

  return value!;
}

/**
 * Format date for ICS (YYYYMMDDTHHmmssZ)
 */
function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Generate calendar event for an appointment
 */
export function createAppointmentCalendarEvent(data: {
  serviceName: string;
  staffName: string;
  salonName: string;
  salonAddress: string;
  salonEmail?: string;
  startTime: Date;
  endTime: Date;
  salonTimezone?: string;
}): CalendarEventData {
  return {
    title: `${data.serviceName} at ${data.salonName}`,
    description: `Your appointment with ${data.staffName}`,
    location: data.salonAddress,
    startTime: data.startTime,
    endTime: data.endTime,
    timezone: data.salonTimezone,
    organizerName: data.salonName,
    organizerEmail: data.salonEmail,
  };
}
