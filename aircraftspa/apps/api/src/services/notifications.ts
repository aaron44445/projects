import { prisma } from "@aircraftspa/database";
import { sendEmail } from "./sendr";
import { sendSMS } from "./twilio";

type NotificationType =
  | "booking_confirmation"
  | "booking_reminder"
  | "status_update"
  | "job_complete"
  | "payment_received";

interface BookingDetails {
  id: string;
  businessId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  serviceName: string;
  aircraftClassName: string;
  scheduledAt: Date;
  airportCode?: string;
  totalPrice: number;
  depositAmount: number;
  status: string;
}

// Email templates
function getEmailSubject(type: NotificationType, details: BookingDetails): string {
  const dateStr = details.scheduledAt.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric"
  });

  switch (type) {
    case "booking_confirmation":
      return `Booking Confirmed — ${details.serviceName} on ${dateStr}`;
    case "booking_reminder":
      return `Reminder: ${details.serviceName} Tomorrow at ${details.scheduledAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    case "status_update":
      return `Your booking status has been updated`;
    case "job_complete":
      return `Your ${details.serviceName} is complete!`;
    case "payment_received":
      return `Payment received — $${details.depositAmount.toFixed(2)}`;
    default:
      return "AircraftSpa Booking Update";
  }
}

function getEmailHtml(type: NotificationType, details: BookingDetails): string {
  const dateStr = details.scheduledAt.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric"
  });
  const timeStr = details.scheduledAt.toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit"
  });

  const header = `
    <div style="background: #1e3a5f; padding: 24px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px;">AircraftSpa</h1>
    </div>
  `;

  const footer = `
    <div style="padding: 16px; text-align: center; color: #666; font-size: 12px;">
      <p>AircraftSpa — Professional Aircraft Cleaning & Detailing</p>
    </div>
  `;

  let body = "";

  switch (type) {
    case "booking_confirmation":
      body = `
        <h2>Your booking is confirmed!</h2>
        <p>Hi ${details.customerName},</p>
        <p>We've confirmed your aircraft detailing appointment:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Service</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.serviceName}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Aircraft</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.aircraftClassName}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Date</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${dateStr}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Time</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${timeStr}</td></tr>
          ${details.airportCode ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Location</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${details.airportCode}</td></tr>` : ""}
          <tr><td style="padding: 8px; font-weight: bold;">Total</td><td style="padding: 8px; font-weight: bold;">$${details.totalPrice.toFixed(2)}</td></tr>
        </table>
      `;
      break;
    case "booking_reminder":
      body = `
        <h2>Reminder: Your appointment is tomorrow</h2>
        <p>Hi ${details.customerName},</p>
        <p>Just a friendly reminder that your ${details.serviceName} appointment is scheduled for tomorrow at ${timeStr}${details.airportCode ? ` at ${details.airportCode}` : ""}.</p>
      `;
      break;
    case "job_complete":
      body = `
        <h2>Your aircraft is looking great!</h2>
        <p>Hi ${details.customerName},</p>
        <p>We've completed your ${details.serviceName}. Your aircraft is clean and ready to fly!</p>
        <p>The remaining balance of <strong>$${(details.totalPrice - details.depositAmount).toFixed(2)}</strong> will be charged to your payment method on file.</p>
      `;
      break;
    case "payment_received":
      body = `
        <h2>Payment Received</h2>
        <p>Hi ${details.customerName},</p>
        <p>We've received your deposit of <strong>$${details.depositAmount.toFixed(2)}</strong> for your upcoming ${details.serviceName} on ${dateStr}.</p>
      `;
      break;
    default:
      body = `
        <h2>Booking Update</h2>
        <p>Hi ${details.customerName},</p>
        <p>Your booking status has been updated to: <strong>${details.status}</strong>.</p>
      `;
  }

  return `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #333;">
      ${header}
      <div style="padding: 24px;">${body}</div>
      ${footer}
    </div>
  `;
}

function getSMSBody(type: NotificationType, details: BookingDetails): string {
  const dateStr = details.scheduledAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const timeStr = details.scheduledAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  switch (type) {
    case "booking_confirmation":
      return `AircraftSpa: Your ${details.serviceName} is confirmed for ${dateStr} at ${timeStr}. Total: $${details.totalPrice.toFixed(2)}`;
    case "booking_reminder":
      return `AircraftSpa: Reminder — ${details.serviceName} tomorrow at ${timeStr}${details.airportCode ? ` (${details.airportCode})` : ""}`;
    case "job_complete":
      return `AircraftSpa: Your ${details.serviceName} is complete! Your aircraft is ready.`;
    case "payment_received":
      return `AircraftSpa: Payment of $${details.depositAmount.toFixed(2)} received. Thank you!`;
    default:
      return `AircraftSpa: Your booking has been updated to: ${details.status}`;
  }
}

export async function sendBookingNotification(
  type: NotificationType,
  details: BookingDetails
): Promise<void> {
  const subject = getEmailSubject(type, details);
  const html = getEmailHtml(type, details);
  const smsBody = getSMSBody(type, details);

  const results = await Promise.allSettled([
    // Email
    sendEmail({ to: details.customerEmail, subject, html }).then(async (result) => {
      await prisma.notificationLog.create({
        data: {
          businessId: details.businessId,
          bookingId: details.id,
          channel: "email",
          type,
          recipient: details.customerEmail,
          subject,
          body: html,
          status: "sent",
          externalId: result.id,
          sentAt: new Date(),
        },
      });
    }),
    // SMS (only if phone provided)
    ...(details.customerPhone ? [
      sendSMS(details.customerPhone, smsBody).then(async (result) => {
        await prisma.notificationLog.create({
          data: {
            businessId: details.businessId,
            bookingId: details.id,
            channel: "sms",
            type,
            recipient: details.customerPhone!,
            body: smsBody,
            status: "sent",
            externalId: result.sid,
            sentAt: new Date(),
          },
        });
      })
    ] : []),
  ]);

  // Log failures
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(`[Notifications] ${index === 0 ? "Email" : "SMS"} failed:`, result.reason);
      prisma.notificationLog.create({
        data: {
          businessId: details.businessId,
          bookingId: details.id,
          channel: index === 0 ? "email" : "sms",
          type,
          recipient: index === 0 ? details.customerEmail : (details.customerPhone || ""),
          status: "failed",
          error: String(result.reason),
        },
      }).catch(console.error);
    }
  });
}

export type { NotificationType, BookingDetails };
