import { useEffect, useState } from 'react'
import { getDashboardMetrics, getScheduleSlots, getUpcomingAppointments } from '@/lib/api'

export interface DashboardData {
  metrics: {
    totalClients: number
    totalServices: number
    totalStaff: number
    totalRevenue: number
    totalAppointments: number
    growth: number
  }
  scheduleSlots: Array<{ time: string; services: any[] }>
  upcomingAppointments: Array<any>
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>({
    metrics: {
      totalClients: 0,
      totalServices: 0,
      totalStaff: 0,
      totalRevenue: 0,
      totalAppointments: 0,
      growth: 0
    },
    scheduleSlots: [],
    upcomingAppointments: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        setError('')

        const [metrics, scheduleSlots, upcomingAppointments] = await Promise.all([
          getDashboardMetrics(),
          getScheduleSlots(),
          getUpcomingAppointments()
        ])

        setData({
          metrics,
          scheduleSlots,
          upcomingAppointments
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
        // Use fallback data on error so page still displays
        console.error('Dashboard data fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  return { data, loading, error }
}
