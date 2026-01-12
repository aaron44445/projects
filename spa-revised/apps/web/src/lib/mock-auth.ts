// Mock authentication for local demo
export const MOCK_USER = {
  id: 'user-demo-1',
  email: 'demo@salon.com',
  password: 'demo123',
  salon_id: 'salon-demo-1',
  role: 'admin'
}

export const MOCK_SALON = {
  id: 'salon-demo-1',
  name: 'Acme Salon & Spa',
  email: 'salon@acme.com',
  phone: '555-0100',
  slug: 'acme-salon',
  timezone: 'America/Chicago',
  logo_url: 'https://via.placeholder.com/100',
  hours: {
    monday: { start: '09:00', end: '18:00' },
    tuesday: { start: '09:00', end: '18:00' },
    wednesday: { start: '09:00', end: '18:00' },
    thursday: { start: '09:00', end: '20:00' },
    friday: { start: '09:00', end: '20:00' },
    saturday: { start: '10:00', end: '16:00' },
    sunday: { start: 'closed', end: 'closed' }
  }
}

export const MOCK_SERVICES = [
  { id: 's1', name: 'Haircut', duration_minutes: 30, price: 45, category: 'Hair', color: '#C7DCC8' },
  { id: 's2', name: 'Hair Styling', duration_minutes: 45, price: 65, category: 'Hair', color: '#C7DCC8' },
  { id: 's3', name: 'Manicure', duration_minutes: 30, price: 35, category: 'Nails', color: '#F4D9C8' },
  { id: 's4', name: 'Pedicure', duration_minutes: 45, price: 50, category: 'Nails', color: '#F4D9C8' },
  { id: 's5', name: 'Massage', duration_minutes: 60, price: 80, category: 'Spa', color: '#E8DDF0' },
  { id: 's6', name: 'Facial', duration_minutes: 50, price: 70, category: 'Spa', color: '#E8DDF0' }
]

export const MOCK_STAFF = [
  { id: 'staff1', first_name: 'Sarah', last_name: 'Johnson', role: 'staff', email: 'sarah@salon.com', phone: '555-0101' },
  { id: 'staff2', first_name: 'Emma', last_name: 'Davis', role: 'staff', email: 'emma@salon.com', phone: '555-0102' },
  { id: 'staff3', first_name: 'Maria', last_name: 'Garcia', role: 'staff', email: 'maria@salon.com', phone: '555-0103' },
  { id: 'staff4', first_name: 'Lisa', last_name: 'Chen', role: 'receptionist', email: 'lisa@salon.com', phone: '555-0104' }
]

export const MOCK_CLIENTS = [
  { id: 'c1', first_name: 'Jennifer', last_name: 'Smith', email: 'jen@example.com', phone: '555-0201' },
  { id: 'c2', first_name: 'Michelle', last_name: 'Brown', email: 'michelle@example.com', phone: '555-0202' },
  { id: 'c3', first_name: 'Angela', last_name: 'Wilson', email: 'angela@example.com', phone: '555-0203' },
  { id: 'c4', first_name: 'Lisa', last_name: 'Anderson', email: 'lisa@example.com', phone: '555-0204' }
]

export const MOCK_APPOINTMENTS = [
  {
    id: 'apt1',
    client_id: 'c1',
    service_id: 's1',
    staff_id: 'staff1',
    start_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    duration_minutes: 30,
    price: 45,
    status: 'confirmed'
  },
  {
    id: 'apt2',
    client_id: 'c2',
    service_id: 's3',
    staff_id: 'staff2',
    start_time: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
    duration_minutes: 30,
    price: 35,
    status: 'confirmed'
  }
]

export const MOCK_DASHBOARD_METRICS = {
  revenue: 12450,
  appointments: 28,
  clients: 47,
  no_show_rate: 8
}
