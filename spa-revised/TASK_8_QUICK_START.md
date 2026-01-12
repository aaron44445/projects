# Task 8: Email & SMS Reminders - Quick Start

## Files Created

1. **Email Service**: `apps/api/src/services/email.service.ts`
   - Generates HTML emails for appointment reminders and confirmations
   - Beautiful template with customer details, appointment time, salon info

2. **SMS Service**: `apps/api/src/services/sms.service.ts`
   - Generates SMS messages for reminders and confirmations
   - Concise format under SMS character limits

3. **Reminder Service**: `apps/api/src/services/reminder.service.ts`
   - Core logic for sending email and SMS reminders
   - Integrates with SendGrid and Twilio APIs
   - Handles duplicate prevention and error logging

4. **Cron Jobs**: `apps/api/src/jobs/reminders.cron.ts`
   - Schedules automatic reminder jobs
   - 4 jobs total: 24h email/SMS, 2h email/SMS

5. **Tests**: `apps/api/src/__tests__/reminders.test.ts`
   - Comprehensive test suite for reminder services

## Database Updates

Updated `packages/database/prisma/schema.prisma`:
- Added `ReminderLog` model to track sent reminders
- Added `smsOptOut` field to `Client` model
- Added relationship from `Appointment` to `ReminderLog`

## Setup Steps

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Update Environment Variables
Add to `.env`:
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```

### 3. Run Database Migration
```bash
cd packages/database
pnpm prisma migrate dev --name add_reminder_logs_and_sms_optout
pnpm prisma generate
```

### 4. Start API Server
```bash
cd apps/api
pnpm dev
```

Watch for these logs:
```
[Cron] Initializing reminder jobs...
[Cron] Reminder jobs initialized:
[Cron]   - 24-hour email: Daily at 8:00 AM
[Cron]   - 24-hour SMS: Daily at 8:05 AM
[Cron]   - 2-hour email: Every hour at :00
[Cron]   - 2-hour SMS: Every hour at :05
```

## How It Works

**Scheduled Jobs:**
1. **8:00 AM Daily** - Sends 24-hour email reminders
2. **8:05 AM Daily** - Sends 24-hour SMS reminders
3. **Every Hour (on the hour)** - Sends 2-hour email reminders
4. **Every Hour (at :05)** - Sends 2-hour SMS reminders

**For Each Job:**
1. Find appointments in reminder window (±15 minutes from target time)
2. Check if reminder already sent (prevent duplicates)
3. Skip clients without email/phone or who opted out
4. Generate and send reminder
5. Log success or failure to database

## Testing

### Manual Test
1. Create appointment for 2 hours or 24 hours from now
2. In API code or terminal, call:
```typescript
import { sendReminderEmails } from './services/reminder.service'
await sendReminderEmails(2) // Or 24
```

3. Check logs for `[Reminder]` messages
4. Verify in SendGrid/Twilio dashboards

### Run Tests
```bash
cd apps/api
pnpm test reminders.test.ts
```

## Email Template Features

- **Sage Green Header** - Matches brand colors (#C7DCC8)
- **Appointment Details** - Service, staff, date, time
- **Important Notice** - Arrival time and cancellation info
- **Contact Info** - Salon phone and email
- **Professional Design** - Mobile-responsive HTML

## SMS Features

- **Concise** - Under SMS character limits
- **Personalized** - Customer name included
- **Actionable** - Clear appointment details
- **Opt-out** - Respects SMS opt-out preferences
- **Unsubscribe Link** - Reply STOP to unsubscribe

## Database Schema

### ReminderLog Table
```
id              - Unique identifier
appointmentId   - Reference to appointment
reminderType    - "email" or "sms"
hoursBefore     - 24 or 2 (hours before appointment)
sentAt          - When reminder was sent
status          - "sent" or "failed"
errorMessage    - Error details if failed
createdAt       - Record creation time
```

### Client Updates
- `smsOptOut: Boolean` - Whether to skip SMS reminders

## Cron Schedule Reference

```
0 8 * * *    = 8:00 AM every day (24h email)
5 8 * * *    = 8:05 AM every day (24h SMS)
0 * * * *    = Every hour at :00 (2h email)
5 * * * *    = Every hour at :05 (2h SMS)
```

## Error Handling

- **Missing Email/Phone** - Reminder skipped with log message
- **Missing API Keys** - Reminders skipped gracefully
- **Network Errors** - Logged to ReminderLog table
- **SMS Opt-Out** - Skipped for users who prefer email only

## Next Steps

1. Set up SendGrid account and API key
2. Set up Twilio account and credentials
3. Run migrations
4. Start API server and verify cron jobs initialize
5. Create test appointment and verify reminders send
6. Monitor logs and ReminderLog table

---

**All files are in place!** Ready for production use.
