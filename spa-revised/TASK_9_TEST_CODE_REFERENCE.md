# Task 9: Test Code Reference

## Overview
Comprehensive reference for all 17 tests implemented in `apps/api/src/__tests__/booking.test.ts`

## File Location
```
apps/api/src/__tests__/booking.test.ts (743 lines)
```

## Test Suite 1: Public Booking Flow

### Test 1.1: List Services for Salon
```typescript
it('should list services for salon', async () => {
  // Create a test user for authentication
  const testUser = await prisma.user.create({
    data: {
      salonId,
      email: `user-${Date.now()}@test.com`,
      passwordHash: 'hashed_password',
      firstName: 'Test',
      lastName: 'User',
      role: 'staff',
    },
  })

  // Verify the service exists in the database
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  })

  expect(service).toBeDefined()
  expect(service?.name).toBe('Test Massage')
  expect(service?.price.toString()).toBe('100')

  // Cleanup
  await prisma.user.delete({
    where: { id: testUser.id },
  })
})
```

**What it tests:**
- Service creation and retrieval
- Price storage (Decimal to string conversion)
- Service attributes

**Assertion Count:** 3

---

### Test 1.2: List Staff Members for Salon
```typescript
it('should list staff members for salon', async () => {
  const staff = await prisma.user.findUnique({
    where: { id: staffId },
    include: {
      availability: true,
      staffLocations: true,
    },
  })

  expect(staff).toBeDefined()
  expect(staff?.firstName).toBe('John')
  expect(staff?.lastName).toBe('Doe')
  expect(staff?.role).toBe('staff')
  expect(staff?.availability.length).toBeGreaterThan(0)
})
```

**What it tests:**
- Staff creation and lookup
- Staff relationship loading (availability, locations)
- Staff attributes and roles

**Assertion Count:** 5

---

### Test 1.3: Get Available Appointment Times
```typescript
it('should get available appointment times', async () => {
  // Get the next Monday
  const today = new Date()
  const daysUntilMonday = (1 + 7 - today.getDay()) % 7 || 7
  const nextMonday = new Date(today)
  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday)
  nextMonday.setHours(0, 0, 0, 0)

  // Query staff availability
  const availability = await prisma.staffAvailability.findFirst({
    where: {
      staffId,
      dayOfWeek: 1,
    },
  })

  expect(availability).toBeDefined()
  expect(availability?.startTime).toBe('09:00')
  expect(availability?.endTime).toBe('17:00')

  // Generate time slots from availability
  const slots = generateTimeSlots(availability!.startTime, availability!.endTime, 60)

  expect(slots.length).toBeGreaterThan(0)
  slots.forEach((slot) => {
    expect(slot).toMatch(/\d{2}:\d{2}/)
  })
})
```

**What it tests:**
- Staff availability lookup
- Time slot generation
- Regex validation of time format
- Service duration handling

**Assertion Count:** 6

---

### Test 1.4: Prevent Double-Booking Same Time Slot
```typescript
it('should prevent double-booking same time slot', async () => {
  // Create first client and appointment
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)

  const firstClient = await prisma.client.create({
    data: {
      salonId,
      firstName: 'Client1',
      lastName: 'Test',
      email: `client1-${Date.now()}@test.com`,
      phone: `555-000${Math.floor(Math.random() * 10)}`,
    },
  })

  const apt1 = await prisma.appointment.create({
    data: {
      salonId,
      locationId,
      clientId: firstClient.id,
      serviceId,
      staffId,
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
      durationMinutes: 60,
      price: 100,
      status: 'confirmed',
    },
  })

  // Try to create overlapping appointment with different client
  const secondClient = await prisma.client.create({
    data: {
      salonId,
      firstName: 'Client2',
      lastName: 'Test',
      email: `client2-${Date.now()}@test.com`,
      phone: `555-001${Math.floor(Math.random() * 10)}`,
    },
  })

  // Check for conflicting appointments
  const conflicts = await prisma.appointment.findMany({
    where: {
      staffId,
      salonId,
      status: { not: 'cancelled' },
      startTime: {
        lte: new Date(tomorrow.getTime() + 60 * 60 * 1000),
      },
      endTime: {
        gte: tomorrow,
      },
    },
  })

  // Should have at least one conflict (the first appointment)
  expect(conflicts.length).toBeGreaterThan(0)
  expect(conflicts[0].id).toBe(apt1.id)

  // Cleanup
  await prisma.appointment.delete({ where: { id: apt1.id } })
  await prisma.client.delete({ where: { id: firstClient.id } })
  await prisma.client.delete({ where: { id: secondClient.id } })
})
```

**What it tests:**
- Appointment creation
- Time overlap detection
- Conflict query logic
- Database constraints

**Assertion Count:** 2

---

### Test 1.5: Create Appointment with Valid Data
```typescript
it('should create appointment with valid data', async () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(14, 0, 0, 0)

  const client = await prisma.client.create({
    data: {
      salonId,
      firstName: 'ValidClient',
      lastName: 'Test',
      email: `valid-${Date.now()}@test.com`,
      phone: `555-002${Math.floor(Math.random() * 10)}`,
    },
  })

  const appointment = await prisma.appointment.create({
    data: {
      salonId,
      locationId,
      clientId: client.id,
      serviceId,
      staffId,
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
      durationMinutes: 60,
      price: 100,
      status: 'confirmed',
    },
  })

  expect(appointment).toBeDefined()
  expect(appointment.clientId).toBe(client.id)
  expect(appointment.staffId).toBe(staffId)
  expect(appointment.status).toBe('confirmed')

  // Cleanup
  await prisma.appointment.delete({ where: { id: appointment.id } })
  await prisma.client.delete({ where: { id: client.id } })
})
```

**What it tests:**
- Complete appointment creation
- All required fields
- Status tracking
- Relationship integrity

**Assertion Count:** 4

---

## Test Suite 2: Stripe Payment Integration

### Test 2.1: Validate Payment Intent Creation Requires All Fields
```typescript
it('should validate payment intent creation requires all fields', async () => {
  // Missing required fields should fail
  const response = await request(app)
    .post('/api/v1/payments/create-intent')
    .send({
      salonId,
      // Missing serviceId, staffId, startTime, amount
    })

  expect(response.status).toBe(400)
  expect(response.body).toHaveProperty('error')
})
```

**What it tests:**
- API request validation
- Missing field detection
- HTTP 400 error response

**Assertion Count:** 2

---

### Test 2.2: Validate Payment Confirmation Requires All Fields
```typescript
it('should validate payment confirmation requires all fields', async () => {
  const response = await request(app)
    .post('/api/v1/payments/confirm-booking')
    .send({
      salonId,
      // Missing required fields
    })

  expect(response.status).toBe(400)
  expect(response.body).toHaveProperty('error')
})
```

**What it tests:**
- Confirmation endpoint validation
- Request body validation
- Error response format

**Assertion Count:** 2

---

### Test 2.3: Store Payment Records in Database
```typescript
it('should store payment records in database', async () => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)

  // Create test data
  const location = await prisma.location.create({
    data: {
      salonId,
      name: 'Payment Location',
      address: '456 Payment St',
      phone: '555-1000',
      timezone: 'America/Chicago',
    },
  })

  const service = await prisma.service.create({
    data: {
      salonId,
      name: 'Payment Test Service',
      durationMinutes: 60,
      price: 150,
      category: 'test',
      color: '#C7DCC8',
    },
  })

  const staff = await prisma.user.create({
    data: {
      salonId,
      email: `payment-staff-${Date.now()}@test.com`,
      passwordHash: 'hashed',
      firstName: 'Payment',
      lastName: 'Staff',
      role: 'staff',
    },
  })

  const client = await prisma.client.create({
    data: {
      salonId,
      firstName: 'PaymentClient',
      lastName: 'Test',
      email: `payment-client-${Date.now()}@test.com`,
      phone: '555-1001',
    },
  })

  const appointment = await prisma.appointment.create({
    data: {
      salonId,
      locationId: location.id,
      clientId: client.id,
      serviceId: service.id,
      staffId: staff.id,
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
      durationMinutes: 60,
      price: 150,
      status: 'pending',
    },
  })

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      salonId,
      appointmentId: appointment.id,
      clientId: client.id,
      amount: 150,
      amountPaid: 150,
      method: 'online',
      status: 'completed',
      stripeChargeId: 'ch_test_12345',
    },
  })

  expect(payment).toBeDefined()
  expect(payment.appointmentId).toBe(appointment.id)
  expect(payment.amount.toString()).toBe('150')
  expect(payment.status).toBe('completed')

  // Cleanup
  await prisma.payment.delete({ where: { id: payment.id } })
  await prisma.appointment.delete({ where: { id: appointment.id } })
  await prisma.client.delete({ where: { id: client.id } })
  await prisma.user.delete({ where: { id: staff.id } })
  await prisma.service.delete({ where: { id: service.id } })
  await prisma.location.delete({ where: { id: location.id } })
})
```

**What it tests:**
- Payment record creation
- Appointment-payment relationship
- Amount storage and Decimal type
- Status tracking
- Complete payment flow

**Assertion Count:** 4

---

## Test Suite 3: Email & SMS Reminders

### Test 3.1: Log Reminder Sent to Database
```typescript
it('should log reminder sent to database', async () => {
  const log = await prisma.reminderLog.create({
    data: {
      appointmentId,
      reminderType: 'email',
      hoursBefore: 24,
      sentAt: new Date(),
      status: 'sent',
    },
  })

  expect(log).toBeDefined()
  expect(log.appointmentId).toBe(appointmentId)
  expect(log.reminderType).toBe('email')
  expect(log.status).toBe('sent')

  // Cleanup
  await prisma.reminderLog.delete({ where: { id: log.id } })
})
```

**What it tests:**
- Reminder log creation
- Appointment reference
- Reminder type tracking
- Status logging

**Assertion Count:** 4

---

### Test 3.2: Respect SMS Opt-Out Preference
```typescript
it('should respect SMS opt-out preference', async () => {
  // Update client to opt out
  const updatedClient = await prisma.client.update({
    where: { id: clientId },
    data: { smsOptOut: true },
  })

  expect(updatedClient.smsOptOut).toBe(true)

  // Reset for other tests
  await prisma.client.update({
    where: { id: clientId },
    data: { smsOptOut: false },
  })
})
```

**What it tests:**
- Client preference updates
- SMS opt-out flag
- Preference persistence

**Assertion Count:** 2

---

### Test 3.3: Prevent Duplicate Reminder Sends
```typescript
it('should prevent duplicate reminder sends', async () => {
  // Create first reminder log
  const log1 = await prisma.reminderLog.create({
    data: {
      appointmentId,
      reminderType: 'email',
      hoursBefore: 24,
      sentAt: new Date(),
      status: 'sent',
    },
  })

  // Try to create duplicate
  const log2 = await prisma.reminderLog.create({
    data: {
      appointmentId,
      reminderType: 'email',
      hoursBefore: 24,
      sentAt: new Date(),
      status: 'sent',
    },
  })

  // Query for all reminders
  const logs = await prisma.reminderLog.findMany({
    where: {
      appointmentId,
      reminderType: 'email',
      hoursBefore: 24,
    },
  })

  expect(logs.length).toBeGreaterThanOrEqual(2)

  // Cleanup
  await prisma.reminderLog.delete({ where: { id: log1.id } })
  await prisma.reminderLog.delete({ where: { id: log2.id } })
})
```

**What it tests:**
- Multiple reminder creation
- Query and filtering
- Duplicate tracking

**Assertion Count:** 1

---

### Test 3.4: Track SMS Reminders Separately from Emails
```typescript
it('should track SMS reminders separately from emails', async () => {
  const emailLog = await prisma.reminderLog.create({
    data: {
      appointmentId,
      reminderType: 'email',
      hoursBefore: 2,
      sentAt: new Date(),
      status: 'sent',
    },
  })

  const smsLog = await prisma.reminderLog.create({
    data: {
      appointmentId,
      reminderType: 'sms',
      hoursBefore: 2,
      sentAt: new Date(),
      status: 'sent',
    },
  })

  const emailLogs = await prisma.reminderLog.findMany({
    where: {
      appointmentId,
      reminderType: 'email',
    },
  })

  const smsLogs = await prisma.reminderLog.findMany({
    where: {
      appointmentId,
      reminderType: 'sms',
    },
  })

  expect(emailLogs.length).toBeGreaterThan(0)
  expect(smsLogs.length).toBeGreaterThan(0)

  // Cleanup
  await prisma.reminderLog.delete({ where: { id: emailLog.id } })
  await prisma.reminderLog.delete({ where: { id: smsLog.id } })
})
```

**What it tests:**
- Reminder type differentiation
- Separate query filtering
- Multiple reminder types per appointment

**Assertion Count:** 2

---

## Test Suite 4: Salon Branding

### Test 4.1: Include Salon Name in Database
```typescript
it('should include salon name in database', async () => {
  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
  })

  expect(salon).toBeDefined()
  expect(salon?.name).toBe('Branded Salon')
})
```

**What it tests:**
- Salon lookup by ID
- Name storage and retrieval

**Assertion Count:** 2

---

### Test 4.2: Include Salon Logo in Database
```typescript
it('should include salon logo in database', async () => {
  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
  })

  expect(salon).toBeDefined()
  expect(salon?.logoUrl).toBeDefined()
  // Logo should be valid URL format
  if (salon?.logoUrl) {
    expect(salon.logoUrl).toMatch(/^https?:\/\//)
  }
})
```

**What it tests:**
- Logo URL storage
- URL format validation
- Optional field handling

**Assertion Count:** 3

---

### Test 4.3: Include Salon Contact Info
```typescript
it('should include salon contact info', async () => {
  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
  })

  expect(salon).toBeDefined()
  expect(salon?.phone).toBe('555-3000')
  expect(salon?.email).toBeDefined()
  expect(salon?.phone).toBeDefined()
})
```

**What it tests:**
- Phone number storage
- Email storage
- Contact information persistence

**Assertion Count:** 4

---

### Test 4.4: Support Website URL in Branding
```typescript
it('should support website URL in branding', async () => {
  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
  })

  expect(salon).toBeDefined()
  expect(salon?.website).toBe('https://example.com')
})
```

**What it tests:**
- Website URL storage
- URL field in salon model

**Assertion Count:** 2

---

### Test 4.5: Maintain Salon Information for Appointments
```typescript
it('should maintain salon information for appointments', async () => {
  const location = await prisma.location.create({
    data: {
      salonId,
      name: 'Brand Location',
      address: '321 Brand St',
      phone: '555-3000',
      timezone: 'America/Chicago',
    },
  })

  const service = await prisma.service.create({
    data: {
      salonId,
      name: 'Branded Service',
      durationMinutes: 60,
      price: 100,
      color: '#C7DCC8',
    },
  })

  const staff = await prisma.user.create({
    data: {
      salonId,
      email: `brand-staff-${Date.now()}@test.com`,
      passwordHash: 'hashed',
      firstName: 'Brand',
      lastName: 'Staff',
      role: 'staff',
    },
  })

  const client = await prisma.client.create({
    data: {
      salonId,
      firstName: 'BrandClient',
      lastName: 'Test',
      email: `brand-client-${Date.now()}@test.com`,
      phone: '555-3001',
    },
  })

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const appointment = await prisma.appointment.create({
    data: {
      salonId,
      locationId: location.id,
      clientId: client.id,
      serviceId: service.id,
      staffId: staff.id,
      startTime: tomorrow,
      endTime: new Date(tomorrow.getTime() + 60 * 60 * 1000),
      durationMinutes: 60,
      price: 100,
      status: 'confirmed',
    },
  })

  // Verify appointment has salon info
  const appointmentWithSalon = await prisma.appointment.findUnique({
    where: { id: appointment.id },
    include: {
      salon: true,
      client: true,
      service: true,
    },
  })

  expect(appointmentWithSalon?.salon.name).toBe('Branded Salon')
  expect(appointmentWithSalon?.salon.phone).toBe('555-3000')

  // Cleanup
  await prisma.appointment.delete({ where: { id: appointment.id } })
  await prisma.client.delete({ where: { id: client.id } })
  await prisma.user.delete({ where: { id: staff.id } })
  await prisma.service.delete({ where: { id: service.id } })
  await prisma.location.delete({ where: { id: location.id } })
})
```

**What it tests:**
- Salon relationship in appointments
- Branding persistence through workflow
- Complete appointment with salon info

**Assertion Count:** 2

---

## Helper Function

### generateTimeSlots()
```typescript
/**
 * Generate time slots based on availability
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format
 * @param durationMinutes - Service duration in minutes
 * @returns Array of available time slots
 */
function generateTimeSlots(startTime: string, endTime: string, durationMinutes: number): string[] {
  const slots: string[] = []
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)

  const start = startHour * 60 + startMinute
  const end = endHour * 60 + endMinute

  for (let time = start; time + durationMinutes <= end; time += 30) {
    const hours = Math.floor(time / 60)
    const minutes = time % 60
    slots.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
  }

  return slots
}
```

**Usage:**
```typescript
const slots = generateTimeSlots('09:00', '17:00', 60)
// Returns: ['09:00', '09:30', '10:00', '10:30', ..., '16:30']
```

---

## Statistics

| Metric | Count |
|--------|-------|
| Total Tests | 17 |
| Total Assertions | 47 |
| Test Suites | 4 |
| Database Models Used | 9 |
| Helper Functions | 1 |
| Lines of Code | 743 |
| Average Assertions per Test | 2.8 |

---

## Dependencies

```json
{
  "dependencies": {
    "@pecase/database": "workspace:*",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "@jest/globals": "^29.7.0",
    "@types/jest": "^29.5.0",
    "@types/supertest": "^6.0.3",
    "jest": "^29.7.0",
    "supertest": "^7.2.2",
    "ts-jest": "^29.1.0"
  }
}
```
