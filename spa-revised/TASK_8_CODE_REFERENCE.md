# Task 8: Code Reference & Snippets

## Quick Code Samples

### 1. Initialize Reminders (in API startup)

**File**: `apps/api/src/index.ts`

```typescript
import { initializeReminderJobs } from './jobs/reminders.cron'

// ... after route setup ...

// Initialize reminder jobs
if (process.env.NODE_ENV !== 'test') {
  initializeReminderJobs()
}
```

### 2. Send Email Reminder

```typescript
import { sendReminderEmails } from './services/reminder.service'

// Send 24-hour reminders
await sendReminderEmails(24)

// Send 2-hour reminders
await sendReminderEmails(2)
```

### 3. Send SMS Reminder

```typescript
import { sendReminderSMS } from './services/reminder.service'

// Send 24-hour SMS reminders
await sendReminderSMS(24)

// Send 2-hour SMS reminders
await sendReminderSMS(2)
```

### 4. Send Confirmation Email

```typescript
import { sendConfirmationEmail } from './services/reminder.service'

await sendConfirmationEmail(
  'customer@example.com',
  'John Doe',
  'Hair Cut',
  'Jane Smith',
  '2:00 PM',
  'Friday, January 17, 2025',
  'Beauty Salon',
  '555-1234',
  'salon@example.com'
)
```

### 5. Generate Email Template

```typescript
import { generateReminderEmail } from './services/email.service'

const { subject, htmlContent } = generateReminderEmail({
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  serviceName: 'Hair Cut',
  staffName: 'Jane Smith',
  appointmentTime: '2:00 PM',
  appointmentDate: 'Friday, January 17, 2025',
  salonName: 'Beauty Salon',
  salonPhone: '555-1234',
}, 24) // hoursUntil: 24

console.log(subject)
// Output: Reminder: Your Hair Cut appointment with Jane Smith in 24 hours
```

### 6. Generate SMS Message

```typescript
import { generateReminderSMS } from './services/sms.service'

const message = generateReminderSMS({
  customerName: 'John',
  salonName: 'Beauty Salon',
  serviceName: 'Hair Cut',
  appointmentTime: '2:00 PM',
}, 24)

console.log(message)
// Output: Hi John, reminder: Your Hair Cut at Beauty Salon is in 24 hours at 2:00 PM. Reply STOP to unsubscribe.
```

## Database Query Examples

### Find All Sent Reminders

```sql
SELECT * FROM "ReminderLog"
WHERE status = 'sent'
ORDER BY "sentAt" DESC
LIMIT 100;
```

### Find Failed Reminders

```sql
SELECT * FROM "ReminderLog"
WHERE status = 'failed'
ORDER BY "sentAt" DESC;
```

### Find Reminders for Specific Appointment

```sql
SELECT * FROM "ReminderLog"
WHERE "appointmentId" = 'apt-uuid-here'
ORDER BY "sentAt" DESC;
```

### Find Recent Email Reminders

```sql
SELECT * FROM "ReminderLog"
WHERE "reminderType" = 'email'
AND "sentAt" > NOW() - INTERVAL '24 hours'
ORDER BY "sentAt" DESC;
```

### Count Reminders Sent Today

```sql
SELECT
  "reminderType",
  "hoursBefore",
  COUNT(*) as count
FROM "ReminderLog"
WHERE DATE("sentAt") = CURRENT_DATE
GROUP BY "reminderType", "hoursBefore";
```

### Find Duplicate Attempts

```sql
SELECT
  "appointmentId",
  "reminderType",
  "hoursBefore",
  COUNT(*) as attempts,
  MIN("sentAt") as first_sent,
  MAX("sentAt") as last_sent
FROM "ReminderLog"
WHERE "status" = 'sent'
GROUP BY "appointmentId", "reminderType", "hoursBefore"
HAVING COUNT(*) > 1;
```

## Prisma Query Examples

### Find Appointment with Reminder Logs

```typescript
import { prisma } from '@pecase/database'

const appointment = await prisma.appointment.findUnique({
  where: { id: 'apt-uuid' },
  include: {
    reminderLogs: true,
    client: true,
    service: true,
    staff: true,
    salon: true,
  },
})
```

### Find Appointments Needing Reminders

```typescript
const now = new Date()
const reminderTime = new Date(now.getTime() + 24 * 60 * 60 * 1000)
const windowStart = new Date(reminderTime.getTime() - 15 * 60 * 1000)
const windowEnd = new Date(reminderTime.getTime() + 15 * 60 * 1000)

const appointments = await prisma.appointment.findMany({
  where: {
    startTime: {
      gte: windowStart,
      lte: windowEnd,
    },
    status: 'confirmed',
  },
})
```

### Check if Reminder Already Sent

```typescript
const existingReminder = await prisma.reminderLog.findFirst({
  where: {
    appointmentId: 'apt-uuid',
    reminderType: 'email',
    hoursBefore: 24,
    sentAt: {
      gte: new Date(Date.now() - 30 * 60 * 1000), // Last 30 minutes
    },
  },
})

if (existingReminder) {
  console.log('Reminder already sent')
}
```

### Create Reminder Log Entry

```typescript
await prisma.reminderLog.create({
  data: {
    appointmentId: 'apt-uuid',
    reminderType: 'email',
    hoursBefore: 24,
    sentAt: new Date(),
    status: 'sent',
  },
})
```

### Log Failed Reminder

```typescript
await prisma.reminderLog.create({
  data: {
    appointmentId: 'apt-uuid',
    reminderType: 'sms',
    hoursBefore: 2,
    sentAt: new Date(),
    status: 'failed',
    errorMessage: 'Invalid phone number format',
  },
})
```

## Environment Configuration

### .env Template

```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# API Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pecase
```

### Using Environment Variables in Code

```typescript
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
if (!SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY not configured')
  return
}

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER
```

## Testing Examples

### Test Email Generation

```typescript
import { generateReminderEmail } from '../services/email.service'

describe('Email Generation', () => {
  it('should generate valid email', () => {
    const { subject, htmlContent } = generateReminderEmail({
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      serviceName: 'Test Service',
      staffName: 'Test Staff',
      appointmentTime: '10:00 AM',
      appointmentDate: 'Monday, January 20, 2025',
      salonName: 'Test Salon',
      salonPhone: '555-0000',
    }, 24)

    expect(subject).toContain('24 hours')
    expect(htmlContent).toContain('Test User')
    expect(htmlContent).toContain('10:00 AM')
  })
})
```

### Test SMS Generation

```typescript
import { generateReminderSMS } from '../services/sms.service'

describe('SMS Generation', () => {
  it('should generate valid SMS', () => {
    const message = generateReminderSMS({
      customerName: 'John',
      salonName: 'Salon',
      serviceName: 'Service',
      appointmentTime: '3:00 PM',
    }, 2)

    expect(message).toContain('Hi John')
    expect(message).toContain('2 hours')
    expect(message.length).toBeLessThan(160)
  })
})
```

### Mock SendGrid API

```typescript
jest.mock('axios')

const mockAxios = axios as jest.Mocked<typeof axios>

mockAxios.post.mockResolvedValueOnce({
  status: 202,
  data: { errors: [] },
})
```

### Mock Twilio API

```typescript
jest.mock('axios')

mockAxios.post.mockResolvedValueOnce({
  status: 201,
  data: { sid: 'SMxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
})
```

## Logging Examples

### Log Reminder Job Start

```typescript
console.log('[Cron] Starting 24-hour email reminders at', new Date().toISOString())
```

### Log Appointment Processing

```typescript
console.log(`[Reminder] Found ${appointments.length} appointments for 24h reminder`)
console.log(`[Reminder] Email sent for appointment ${apt.id} to ${apt.client.email}`)
```

### Log Errors

```typescript
console.error(`[Reminder] Failed to send email for appointment ${apt.id}:`, error.message)
console.error(`[SMS Reminder] Error in sendReminderSMS(2):`, error)
```

### Log Skipped Reminders

```typescript
console.log(`[Reminder] Email already sent for appointment ${apt.id}`)
console.log(`[SMS Reminder] Client ${apt.client.id} opted out of SMS`)
console.log(`[Reminder] No email address for client ${apt.client.id}`)
```

## API Request Examples

### SendGrid Email Request

```bash
curl -X POST "https://api.sendgrid.com/v3/mail/send" \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "personalizations": [{
      "to": [{"email": "recipient@example.com", "name": "Recipient Name"}],
      "subject": "Your Appointment Reminder"
    }],
    "from": {"email": "reminders@pecase.com", "name": "Pecase Reminders"},
    "content": [{
      "type": "text/html",
      "value": "<html><body>Appointment reminder</body></html>"
    }],
    "reply_to": {"email": "salon@example.com"}
  }'
```

### Twilio SMS Request

```bash
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN" \
  -d "From=$TWILIO_PHONE_NUMBER&To=%2B15551234567&Body=Your%20appointment%20reminder"
```

## Performance Tuning

### Add Database Indexes

```sql
-- These are already added in schema, but for reference:
CREATE INDEX idx_reminder_logs_appointment_id ON "ReminderLog"("appointmentId");
CREATE INDEX idx_reminder_logs_sent_at ON "ReminderLog"("sentAt");
CREATE INDEX idx_reminder_logs_status ON "ReminderLog"("status");

CREATE INDEX idx_appointments_start_time ON "Appointment"("startTime", "endTime");
CREATE INDEX idx_appointments_status ON "Appointment"("status");
```

### Batch Process Appointments

```typescript
// Process in smaller batches to avoid timeout
const BATCH_SIZE = 50
for (let i = 0; i < appointments.length; i += BATCH_SIZE) {
  const batch = appointments.slice(i, i + BATCH_SIZE)
  for (const apt of batch) {
    // Process appointment
  }
}
```

### Add Request Timeout

```typescript
const timeoutMs = 5000
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

try {
  await axios.post(url, data, {
    signal: controller.signal,
  })
} finally {
  clearTimeout(timeoutId)
}
```

## Troubleshooting Snippets

### Debug Missing Appointments

```typescript
console.log('Query start time:', windowStart)
console.log('Query end time:', windowEnd)

const allAppointments = await prisma.appointment.findMany({
  where: {
    status: 'confirmed',
  },
})

const matchingAppointments = allAppointments.filter(apt => {
  return apt.startTime >= windowStart && apt.startTime <= windowEnd
})

console.log(`Total appointments: ${allAppointments.length}`)
console.log(`Matching appointments: ${matchingAppointments.length}`)
```

### Debug API Errors

```typescript
try {
  await axios.post(url, data, { headers })
} catch (error: any) {
  if (error.response) {
    console.log('Status:', error.response.status)
    console.log('Data:', error.response.data)
  } else if (error.request) {
    console.log('No response:', error.request)
  } else {
    console.log('Error:', error.message)
  }
}
```

### Debug Database Issues

```typescript
const reminderCount = await prisma.reminderLog.count()
console.log(`Total reminders in database: ${reminderCount}`)

const failedCount = await prisma.reminderLog.count({
  where: { status: 'failed' },
})
console.log(`Failed reminders: ${failedCount}`)

const recentReminders = await prisma.reminderLog.findMany({
  where: {
    sentAt: {
      gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
  },
})
console.log(`Reminders sent in last 24 hours: ${recentReminders.length}`)
```

---

## Summary

This reference guide provides ready-to-use code snippets for:
- Initializing reminders
- Sending reminders
- Generating templates
- Database queries
- Testing
- Debugging
- API requests
- Performance tuning

All snippets are production-ready and follow the implementation patterns.

---

**Last Updated**: January 10, 2026
**Reference Version**: 1.0
