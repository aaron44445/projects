# Phase 5: Notification System - Research

**Researched:** 2026-01-25
**Domain:** SMS/Email notifications, delivery tracking, message templates, cron scheduling
**Confidence:** HIGH

## Summary

This phase builds on existing infrastructure for SMS (Twilio) and email (SMTP2GO/SendGrid) services that already exist in the codebase. The core cron-based reminder system is already functional with `node-cron` running every 15 minutes. The main gaps are: (1) no delivery status tracking/logging beyond basic success/failure, (2) no notification history UI, (3) hardcoded templates without salon customization, and (4) booking confirmation emails lack calendar integration.

The existing `ReminderLog` model tracks sent reminders but doesn't capture delivery status updates from providers. To implement delivery tracking, we need webhook endpoints to receive status callbacks from Twilio (for SMS) and SendGrid/SMTP2GO (for email). A new `NotificationLog` model should capture the complete notification lifecycle.

**Primary recommendation:** Extend existing services rather than rebuild. Add webhook endpoints for delivery callbacks, create a `NotificationLog` model, implement calendar link generation with `ics` + `calendar-link`, and add salon-configurable template settings.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| twilio | ^5.11.2 | SMS sending | Industry standard for programmatic SMS, already integrated |
| @sendgrid/mail | ^8.1.6 | Email sending (fallback) | Reliable email delivery with webhook support |
| node-cron | ^4.2.1 | Job scheduling | Simple, reliable cron scheduling, already running reminders |
| zod | ^3.22.0 | Schema validation | Already used throughout codebase for validation |

### Add for This Phase
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ics | ^3.8.1 | ICS file generation | Generating .ics attachments for booking confirmations |
| calendar-link | ^2.6.0 | Calendar URL generation | Creating Google/Outlook/Yahoo add-to-calendar links |
| handlebars | ^4.7.8 | Template rendering | Compiling customizable email/SMS templates (optional - can use string interpolation) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ics | ical-generator | ical-generator is more feature-rich but heavier; ics is simpler for single-event generation |
| String interpolation | handlebars/mjml | Templates are simple enough that Handlebars adds complexity without much benefit |
| node-cron | Bull/Agenda | Bull requires Redis infrastructure; node-cron is sufficient for current scale |

**Installation:**
```bash
pnpm add ics calendar-link --filter @peacase/api
```

## Architecture Patterns

### Recommended Project Structure
```
apps/api/src/
├── services/
│   ├── email.ts              # Existing - extend for delivery tracking
│   ├── sms.ts                # Existing - extend for delivery tracking
│   └── notifications.ts      # NEW - unified notification facade
├── cron/
│   ├── index.ts              # Existing - cron job manager
│   └── appointmentReminders.ts  # Existing - extend for configurable timing
├── routes/
│   ├── webhooks.ts           # Existing - add SMS/email status endpoints
│   └── notifications.ts      # NEW - notification history API
└── templates/
    └── email/                # NEW - HTML email templates with variables
```

### Pattern 1: Unified Notification Service
**What:** Single service that handles all notification types, abstracts SMS/email delivery, and logs consistently
**When to use:** All notification sends should go through this service
**Example:**
```typescript
// services/notifications.ts
export interface NotificationPayload {
  type: 'booking_confirmation' | 'reminder_24h' | 'reminder_2h' | 'cancellation';
  appointmentId: string;
  clientId: string;
  channels: ('email' | 'sms')[];
  data: Record<string, unknown>;
}

export async function sendNotification(payload: NotificationPayload): Promise<string> {
  // 1. Create NotificationLog entry with status 'pending'
  const notification = await prisma.notificationLog.create({
    data: {
      type: payload.type,
      appointmentId: payload.appointmentId,
      clientId: payload.clientId,
      status: 'pending',
      channels: payload.channels,
    }
  });

  // 2. Send via each channel, update log with provider IDs
  // 3. Return notification ID for tracking
  return notification.id;
}
```

### Pattern 2: Webhook-Based Delivery Tracking
**What:** Receive delivery status updates from Twilio/SendGrid via webhooks
**When to use:** Track actual SMS/email delivery rather than just API success
**Example:**
```typescript
// routes/webhooks.ts - Twilio status callback
router.post('/sms-status', express.urlencoded({ extended: true }), async (req, res) => {
  const { MessageSid, MessageStatus, ErrorCode } = req.body;

  // Map Twilio status to our status
  const status = mapTwilioStatus(MessageStatus); // 'sent' | 'delivered' | 'failed'

  await prisma.notificationLog.updateMany({
    where: { twilioMessageSid: MessageSid },
    data: {
      smsStatus: status,
      smsError: ErrorCode || null,
      smsDeliveredAt: status === 'delivered' ? new Date() : null,
    }
  });

  res.status(200).send('OK');
});
```

### Pattern 3: Configurable Reminder Timing
**What:** Per-salon configuration for when reminders send
**When to use:** When salons need different reminder schedules
**Example:**
```typescript
// In Salon model or separate NotificationSettings
interface ReminderSettings {
  enabled: boolean;
  timings: { hours: number; type: 'reminder' }[]; // e.g., [{ hours: 24 }, { hours: 2 }]
  smsEnabled: boolean;
  emailEnabled: boolean;
}

// In cron job - query appointments based on salon-specific timing
const salonTimings = JSON.parse(salon.notification_settings);
for (const timing of salonTimings.reminders) {
  const targetTime = new Date(now.getTime() + timing.hours * 60 * 60 * 1000);
  // Query appointments within window...
}
```

### Anti-Patterns to Avoid
- **Fire-and-forget notifications:** Always log notification attempts and track delivery status
- **Synchronous sending in request handlers:** Send confirmations async to avoid blocking user-facing requests
- **Hardcoded templates:** Even simple templates should use variables for personalization
- **No fallback strategy:** If SMS fails, try email (and vice versa based on client preference)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ICS file generation | String concatenation for VCALENDAR format | `ics` library | ICS spec has edge cases (timezones, escaping) that are easy to get wrong |
| Calendar links | Manual URL building | `calendar-link` library | Each calendar provider has different URL formats and parameters |
| Template variables | Regex replace | String interpolation or Handlebars | Edge cases with special characters, nested variables |
| Phone number formatting | Manual string manipulation | Existing `formatPhoneNumber` in sms.ts | E.164 formatting already handled correctly |
| Cron expression parsing | Manual time calculations | Continue using node-cron | Already working, well-tested |

**Key insight:** The existing codebase has working SMS and email infrastructure. Extend it rather than replacing it.

## Common Pitfalls

### Pitfall 1: Status Callback Ordering
**What goes wrong:** Twilio/SendGrid webhooks can arrive out of order (e.g., "delivered" before "sent")
**Why it happens:** Network latency, provider infrastructure, retry logic
**How to avoid:** Use timestamps from the webhook payload, not arrival time. Design status transitions to handle any order.
**Warning signs:** Notifications stuck in "sent" when they were actually delivered

### Pitfall 2: Duplicate Webhook Deliveries
**What goes wrong:** Same status callback received multiple times, leading to duplicate log entries or processing
**Why it happens:** Providers retry on timeout, network issues cause duplicate requests
**How to avoid:** Store provider message IDs (MessageSid for Twilio, sg_event_id for SendGrid) and check before processing
**Warning signs:** Multiple log entries for same notification, counts inflated

### Pitfall 3: Webhook Timeout Causing Retries
**What goes wrong:** Long processing time causes provider to retry, creating duplicates
**Why it happens:** Doing too much work in webhook handler (database queries, external calls)
**How to avoid:** Return 200 immediately, process async. Twilio expects response within 15 seconds.
**Warning signs:** High retry rates, webhook logs showing timeouts

### Pitfall 4: Missing Timezone Handling
**What goes wrong:** Reminder sent at wrong time, ICS files show incorrect times
**Why it happens:** Server timezone vs salon timezone vs client timezone confusion
**How to avoid:** Always use salon's timezone (already in `Salon.timezone`) for display and ICS generation. Store all times in UTC.
**Warning signs:** Clients complaining about wrong reminder times

### Pitfall 5: Email Bounces Not Handled
**What goes wrong:** Continuing to send to invalid emails, wasting resources and harming sender reputation
**Why it happens:** No webhook for bounce events, or bounce not persisted to client record
**How to avoid:** Process bounce webhooks, set flag on Client record (e.g., `emailBounced: true`)
**Warning signs:** High bounce rate in email provider dashboard, emails going to spam

## Code Examples

Verified patterns from official sources and existing codebase:

### ICS File Generation for Booking Confirmation
```typescript
// Source: https://github.com/adamgibbons/ics
import { createEvent } from 'ics';

function generateBookingICS(appointment: AppointmentWithDetails): string {
  const startDate = new Date(appointment.startTime);
  const event = {
    start: [
      startDate.getFullYear(),
      startDate.getMonth() + 1,  // ics uses 1-indexed months
      startDate.getDate(),
      startDate.getHours(),
      startDate.getMinutes(),
    ] as [number, number, number, number, number],
    duration: { minutes: appointment.durationMinutes },
    title: `${appointment.service.name} at ${appointment.salon.name}`,
    description: `Appointment with ${appointment.staff.firstName}`,
    location: formatAddress(appointment.salon),
    organizer: {
      name: appointment.salon.name,
      email: appointment.salon.email
    },
  };

  const { error, value } = createEvent(event);
  if (error) throw error;
  return value!;
}
```

### Calendar Links Generation
```typescript
// Source: https://github.com/AnandChowdhary/calendar-link
import { google, outlook, ics as icsLink } from 'calendar-link';

function generateCalendarLinks(appointment: AppointmentWithDetails): {
  google: string;
  outlook: string;
  ics: string;
} {
  const event = {
    title: `${appointment.service.name} at ${appointment.salon.name}`,
    description: `Appointment with ${appointment.staff.firstName}`,
    start: appointment.startTime.toISOString(),
    end: appointment.endTime.toISOString(),
    location: formatAddress(appointment.salon),
  };

  return {
    google: google(event),
    outlook: outlook(event),
    ics: icsLink(event),  // Downloads .ics file
  };
}
```

### Twilio Status Callback Webhook
```typescript
// Source: https://www.twilio.com/docs/sms/tutorials/how-to-confirm-delivery-node-js
router.post('/webhooks/sms-status',
  express.urlencoded({ extended: true }),
  asyncHandler(async (req, res) => {
    const { MessageSid, MessageStatus, ErrorCode } = req.body;

    // Respond quickly to avoid timeout retries
    res.status(200).send('OK');

    // Process async
    const statusMap: Record<string, string> = {
      'queued': 'pending',
      'sent': 'sent',
      'delivered': 'delivered',
      'failed': 'failed',
      'undelivered': 'failed',
    };

    await prisma.notificationLog.updateMany({
      where: { twilioMessageSid: MessageSid },
      data: {
        smsStatus: statusMap[MessageStatus] || 'unknown',
        smsErrorCode: ErrorCode || null,
        smsUpdatedAt: new Date(),
      },
    });
  })
);
```

### SendGrid Event Webhook
```typescript
// Source: https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/nodejs-code-example
router.post('/webhooks/email-status',
  express.json(),
  asyncHandler(async (req, res) => {
    // SendGrid sends array of events
    const events = Array.isArray(req.body) ? req.body : [req.body];

    res.status(200).send('OK');

    for (const event of events) {
      const { email, event: eventType, sg_message_id } = event;

      const statusMap: Record<string, string> = {
        'processed': 'sent',
        'delivered': 'delivered',
        'bounce': 'bounced',
        'dropped': 'failed',
        'deferred': 'pending',
      };

      if (statusMap[eventType]) {
        await prisma.notificationLog.updateMany({
          where: { sendgridMessageId: sg_message_id },
          data: {
            emailStatus: statusMap[eventType],
            emailUpdatedAt: new Date(),
          },
        });

        // Mark client email as invalid on hard bounce
        if (eventType === 'bounce') {
          await prisma.client.updateMany({
            where: { email },
            data: { emailBounced: true },
          });
        }
      }
    }
  })
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fire-and-forget SMS | Delivery status tracking via webhooks | Standard practice | Know if messages actually reached recipients |
| Plain text emails | HTML emails with calendar integration | Expected standard | Better UX, higher engagement |
| Fixed reminder times | Configurable per-salon timing | User expectation | Salons have different workflows |
| Single notification log | Separate logs per channel with status | For compliance | Better debugging, retry logic |

**Deprecated/outdated:**
- SMTP2GO is already primary email provider; SendGrid is fallback. Both support webhooks.
- Twilio `twilio@5.x` is current; no major breaking changes expected.

## Open Questions

Things that couldn't be fully resolved:

1. **SMTP2GO Webhook Support**
   - What we know: SMTP2GO is the primary email provider via REST API
   - What's unclear: Whether SMTP2GO supports delivery status webhooks like SendGrid
   - Recommendation: Check SMTP2GO documentation, may need to use SendGrid for deliveries requiring tracking or add polling

2. **Template Storage Location**
   - What we know: Context says customizable templates per salon
   - What's unclear: Store in database (Salon model) vs filesystem vs separate template service
   - Recommendation: Store in Salon.notification_settings as JSON with template strings; simpler than filesystem

3. **Retry Queue Architecture**
   - What we know: Context mentions retry failed emails after 1 hour
   - What's unclear: How to implement delayed retry without Redis/Bull
   - Recommendation: Store retry_at timestamp in NotificationLog, have cron job pick up failed notifications due for retry

## Sources

### Primary (HIGH confidence)
- Twilio SMS webhooks: [Twilio Messaging Webhooks](https://www.twilio.com/docs/usage/webhooks/messaging-webhooks)
- Twilio Node.js delivery tracking: [How to Track Delivery Status](https://www.twilio.com/docs/sms/tutorials/how-to-confirm-delivery-node-js)
- SendGrid Event Webhooks: [Event Webhook Reference](https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/event)
- SendGrid Node.js example: [Event Webhook Node.js Code](https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/nodejs-code-example)
- ICS library: [GitHub adamgibbons/ics](https://github.com/adamgibbons/ics)
- Calendar link generation: [GitHub AnandChowdhary/calendar-link](https://github.com/AnandChowdhary/calendar-link)

### Secondary (MEDIUM confidence)
- node-cron best practices: [Better Stack - Job Scheduling in Node.js](https://betterstack.com/community/guides/scaling-nodejs/node-cron-scheduled-tasks/)
- Production cron patterns: [LogRocket - Task Scheduling with node-cron](https://blog.logrocket.com/task-scheduling-or-cron-jobs-in-node-using-node-cron/)

### Tertiary (LOW confidence)
- Handlebars email templating patterns - based on common practice, verify if needed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries are already in the project or well-established npm packages
- Architecture: HIGH - Extending existing patterns, webhook approach is documented by providers
- Pitfalls: HIGH - Based on official Twilio/SendGrid documentation warnings
- ICS/Calendar: MEDIUM - Libraries are standard but specific integration needs verification

**Research date:** 2026-01-25
**Valid until:** 2026-02-25 (30 days - stable domain, providers rarely change webhook APIs)
