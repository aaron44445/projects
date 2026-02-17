import cron from "node-cron";
import { prisma } from "@aircraftspa/database";
import { sendBookingNotification } from "../services/notifications";

export function startReminderCron() {
  // Run every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    console.log("[Cron] Checking for booking reminders...");

    try {
      const now = new Date();
      const reminderWindowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000); // 23 hours from now
      const reminderWindowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000); // 25 hours from now

      // Find confirmed bookings in the reminder window that haven't been reminded
      const bookings = await prisma.booking.findMany({
        where: {
          status: "confirmed",
          scheduledAt: {
            gte: reminderWindowStart,
            lte: reminderWindowEnd,
          },
          // Check no reminder notification already sent
          notificationLogs: {
            none: {
              type: "booking_reminder",
              status: "sent",
            },
          },
        },
        include: {
          customer: true,
          service: true,
          aircraftClass: true,
          location: {
            include: { airport: true },
          },
        },
      });

      if (bookings.length === 0) {
        return;
      }

      console.log(`[Cron] Sending ${bookings.length} reminder(s)`);

      for (const booking of bookings) {
        try {
          await sendBookingNotification("booking_reminder", {
            id: booking.id,
            businessId: booking.businessId,
            customerName: booking.customer.name,
            customerEmail: booking.customer.email,
            customerPhone: booking.customer.phone,
            serviceName: booking.service.name,
            aircraftClassName: booking.aircraftClass.displayName,
            scheduledAt: booking.scheduledAt,
            airportCode: booking.location?.airport.icaoCode ?? undefined,
            totalPrice: booking.totalPrice,
            depositAmount: booking.depositAmount,
            status: booking.status,
          });
          console.log(`[Cron] Reminder sent for booking ${booking.id}`);
        } catch (error) {
          console.error(`[Cron] Failed to send reminder for booking ${booking.id}:`, error);
        }
      }
    } catch (error) {
      console.error("[Cron] Reminder job failed:", error);
    }
  });

  console.log("[Cron] Reminder cron job started (every 15 minutes)");
}
