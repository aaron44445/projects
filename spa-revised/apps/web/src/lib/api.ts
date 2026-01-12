const API_BASE = 'http://localhost:3001/api/v1'

export async function apiCall(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken')
          window.location.href = '/login'
        }
      }
      throw new Error(`API Error: ${response.statusText}`)
    }

    return response.json()
  } catch (error) {
    console.error('API call error:', error)
    throw error
  }
}

// Dashboard data fetchers
export async function getDashboardMetrics() {
  try {
    const [clients, services, staff, appointments] = await Promise.all([
      apiCall('/clients').catch(() => []),
      apiCall('/services').catch(() => []),
      apiCall('/staff').catch(() => []),
      apiCall('/appointments').catch(() => [])
    ])

    const totalRevenue = appointments.reduce((sum: number, apt: any) => sum + (apt.price || 0), 0)

    return {
      totalClients: clients.length || 0,
      totalServices: services.length || 0,
      totalStaff: staff.length || 0,
      totalRevenue: totalRevenue,
      totalAppointments: appointments.length || 0,
      growth: calculateGrowth(appointments)
    }
  } catch (error) {
    console.error('Failed to fetch dashboard metrics:', error)
    throw error
  }
}

function calculateGrowth(appointments: any[]): number {
  if (appointments.length === 0) return 0

  const today = new Date()
  const thisMonth = appointments.filter((apt: any) => {
    const aptDate = new Date(apt.start_time)
    return aptDate.getMonth() === today.getMonth() && aptDate.getFullYear() === today.getFullYear()
  })

  const lastMonth = appointments.filter((apt: any) => {
    const aptDate = new Date(apt.start_time)
    const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1)
    return aptDate.getMonth() === lastMonthDate.getMonth() && aptDate.getFullYear() === lastMonthDate.getFullYear()
  })

  if (lastMonth.length === 0) return thisMonth.length > 0 ? 100 : 0
  return Math.round(((thisMonth.length - lastMonth.length) / lastMonth.length) * 100)
}

export async function getScheduleSlots() {
  try {
    const appointments = await apiCall('/appointments')

    // Group appointments by time slot
    const slots: Record<string, any[]> = {}

    appointments.forEach((apt: any) => {
      const time = new Date(apt.start_time).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })

      if (!slots[time]) {
        slots[time] = []
      }

      slots[time].push({
        id: apt.id,
        name: apt.service?.name || 'Service',
        staff: apt.staff?.first_name || 'Staff',
        client: apt.client?.first_name || 'Client',
        duration: apt.duration_minutes || 60,
        color: getColorForService(apt.service?.name)
      })
    })

    // Convert to array of time slots
    return Object.entries(slots).map(([time, services]) => ({
      time,
      services: services.slice(0, 3) // Limit to 3 services per slot for display
    }))
  } catch (error) {
    console.error('Failed to fetch schedule slots:', error)
    return []
  }
}

function getColorForService(serviceName?: string): string {
  const colors = ['#F4D9C8', '#E8D4F1', '#D9E8DC', '#F0D9D9', '#D9E0F0', '#F4E8C8']
  const hash = (serviceName || 'default').charCodeAt(0) % colors.length
  return colors[hash]
}

export async function getUpcomingAppointments() {
  try {
    const appointments = await apiCall('/appointments')

    const now = new Date()
    const upcoming = appointments
      .filter((apt: any) => new Date(apt.start_time) >= now)
      .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 6) // Get next 6 appointments

    return upcoming.map((apt: any) => ({
      id: apt.id,
      name: apt.client?.first_name + ' ' + apt.client?.last_name || 'Client',
      service: apt.service?.name || 'Service',
      time: formatTimeRange(apt.start_time, apt.duration_minutes),
      price: '$' + (apt.price || 0).toFixed(2),
      initials: getInitials(apt.client?.first_name, apt.client?.last_name)
    }))
  } catch (error) {
    console.error('Failed to fetch upcoming appointments:', error)
    return []
  }
}

function formatTimeRange(startTime: string, durationMinutes: number): string {
  const start = new Date(startTime)
  const end = new Date(start.getTime() + durationMinutes * 60000)

  const startStr = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const endStr = end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })

  return `${startStr} to ${endStr}`
}

function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.[0]?.toUpperCase() || ''
  const last = lastName?.[0]?.toUpperCase() || ''
  return (first + last).slice(0, 2) || 'UN'
}
