# Phase 5, Task 5: Public Client-Facing Booking Interface - File Reference

## Complete File Listing

### Store Files
- `/c/projects/spa-revised/apps/booking/src/stores/bookingStore.ts` - Zustand state management

### Component Files
- `/c/projects/spa-revised/apps/booking/src/components/BookingFlow.tsx` - Main wizard component
- `/c/projects/spa-revised/apps/booking/src/components/ServiceSelector.tsx` - Service selection step
- `/c/projects/spa-revised/apps/booking/src/components/StaffSelector.tsx` - Staff selection step
- `/c/projects/spa-revised/apps/booking/src/components/TimeSlotSelector.tsx` - Time slot selection step
- `/c/projects/spa-revised/apps/booking/src/components/ClientForm.tsx` - Client information form
- `/c/projects/spa-revised/apps/booking/src/components/PaymentForm.tsx` - Payment processing form

### Page Files
- `/c/projects/spa-revised/apps/booking/src/app/page.tsx` - Booking home page

## File Sizes

```
  6,506 bytes - BookingFlow.tsx
  2,465 bytes - StaffSelector.tsx
  2,442 bytes - ServiceSelector.tsx
  3,756 bytes - TimeSlotSelector.tsx
  5,371 bytes - PaymentForm.tsx
  1,664 bytes - ClientForm.tsx
  1,231 bytes - bookingStore.ts
    820 bytes - page.tsx
```

## Key Implementation Details

### bookingStore.ts
- Exports: `useBookingStore` hook, `BookingState` interface
- State fields: salonId, serviceId, staffId, appointmentDate, clientName, clientEmail, clientPhone
- Methods: setSalonId, setServiceId, setStaffId, setAppointmentDate, setClientInfo, reset

### BookingFlow.tsx
- Manages step progression (0-5)
- Handles step validation
- Renders current step component
- Shows progress indicator and navigation
- Handles confirmation state with checkmark

### ServiceSelector.tsx
- Fetches from: `http://localhost:3001/api/v1/services?salon_id={salonId}`
- Uses radio selection
- Shows loading state
- Handles API errors

### StaffSelector.tsx
- Fetches from: `http://localhost:3001/api/v1/staff?salon_id={salonId}`
- Uses radio selection
- Shows loading state
- Handles API errors

### TimeSlotSelector.tsx
- Fetches from: `http://localhost:3001/api/v1/availability?salon_id={salonId}&staff_id={staffId}&service_id={serviceId}&date={date}`
- Date picker triggers availability fetch
- Grid layout (3 columns)
- Time formatted in 12-hour format
- Shows loading state

### ClientForm.tsx
- Three fields: name (text), email (email), phone (tel)
- Updates store on each change
- No local validation (done in parent)

### PaymentForm.tsx
- Card number: accepts 16 digits
- Expiry date: MM/YY format (5 chars)
- CVC: 3 digits
- Posts to: `http://localhost:3001/api/v1/appointments`
- Simulates payment with 1.5s delay
- Shows success state with checkmark icon

### page.tsx
- Reads query parameter: `salon`
- Shows error if missing
- Passes to BookingFlow

## Color Usage

All components use the approved color palette:
- Sage Green (#C7DCC8) - Primary button, borders, progress
- Cream (#F5F3F0) - Background, selected states
- Light Taupe (#E8E6E4) - Secondary button, borders
- Charcoal (#2C2C2C) - Main text
- Gray (#666) - Secondary text

## Icons Used (Inline SVG)

- Clock (24x24): Time selection step
- Users (24x24): Staff selection step
- Dollar Sign (20x20): Payment button
- Check (24x24): Completed steps
- Arrow Right (20x20): Continue button
- Arrow Left (20x20): Back button
- Alert Circle (20x20): Error indicator
- Check Circle (24x24): Success indicator

## Design Compliance

- Mobile-first responsive design
- No external UI libraries
- Inline SVG icons for performance
- Tailwind CSS for styling
- Touch-friendly button sizes (48px+ height)
- Clear visual hierarchy
- Proper loading and error states

## Testing Checklist

```
URL Format: http://localhost:3002?salon=<uuid>

Step 1: Service Selection
- [ ] Services load from API
- [ ] Selection changes color
- [ ] Selected service shows with checkmark

Step 2: Staff Selection
- [ ] Staff members load from API
- [ ] Selection changes color
- [ ] Selected staff shows with checkmark

Step 3: Time Selection
- [ ] Date picker appears
- [ ] Availability loads after date select
- [ ] Time slots display in grid
- [ ] Selected time changes color

Step 4: Client Info
- [ ] Name field accepts input
- [ ] Email field accepts input
- [ ] Phone field accepts input
- [ ] Cannot continue without name/email

Step 5: Payment
- [ ] Card field accepts 16 digits
- [ ] Expiry field accepts MM/YY format
- [ ] CVC field accepts 3 digits
- [ ] Processing message appears
- [ ] Cannot submit without all fields

Step 6: Confirmation
- [ ] Checkmark displays
- [ ] Confirmation message shows
- [ ] Email reference displays
- [ ] "New Booking" button resets flow

Progress Bar
- [ ] Updates as steps advance
- [ ] Shows completion percentage
- [ ] Completed steps show checkmarks

Navigation
- [ ] Back button disabled on step 1
- [ ] Can navigate back to previous steps
- [ ] Continue button disabled with invalid data
```

## API Endpoints Required

1. `GET /api/v1/services?salon_id={salonId}`
   Returns: Array of service objects with id, name, price, duration_minutes

2. `GET /api/v1/staff?salon_id={salonId}`
   Returns: Array of staff objects with id, first_name, last_name, certifications

3. `GET /api/v1/availability?salon_id={salonId}&staff_id={staffId}&service_id={serviceId}&date={date}`
   Returns: Array of ISO date strings representing available time slots

4. `POST /api/v1/appointments`
   Body: { salon_id, service_id, staff_id, start_time, client_name, client_email, client_phone }
   Returns: Appointment confirmation

## Dependencies

- react@^18.2.0
- next@^14.0.0
- zustand@^4.4.0
- typescript@^5.3.0
- tailwindcss@^3.3.0 (configured via workspace)
