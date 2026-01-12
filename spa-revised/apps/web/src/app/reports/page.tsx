'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp, DollarSign, Calendar } from 'lucide-react'

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState('month')
  const [stats] = useState({
    totalRevenue: 12450,
    appointmentsCompleted: 156,
    averageServicePrice: 79.75,
    clientRetentionRate: 87
  })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#2C2C2C' }}>
            Reports & Analytics
          </h1>
          <p style={{ color: '#666' }}>
            Track your salon&apos;s performance and growth
          </p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border rounded-lg"
          style={{ borderColor: '#E8E6E4' }}
        >
          <option>This Week</option>
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Revenue', value: '$' + stats.totalRevenue.toLocaleString(), icon: DollarSign, color: '#F4D9C8' },
          { label: 'Appointments', value: stats.appointmentsCompleted, icon: Calendar, color: '#E8D4F1' },
          { label: 'Avg Service Price', value: '$' + stats.averageServicePrice.toFixed(2), icon: TrendingUp, color: '#D9E8DC' },
          { label: 'Client Retention', value: stats.clientRetentionRate + '%', icon: BarChart3, color: '#F0D9D9' }
        ].map((metric, i) => {
          const IconComponent = metric.icon
          return (
            <div
              key={i}
              className="p-6 rounded-2xl"
              style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
            >
              <div className="mb-3" style={{ color: metric.color }}>
                <IconComponent size={28} />
              </div>
              <p className="text-sm" style={{ color: '#999', marginBottom: '4px' }}>
                {metric.label}
              </p>
              <h3 className="text-2xl font-bold" style={{ color: '#2C2C2C' }}>
                {metric.value}
              </h3>
            </div>
          )
        })}
      </div>

      {/* Revenue Chart */}
      <div className="rounded-2xl p-6 mb-8" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h2 className="text-xl font-bold mb-6" style={{ color: '#2C2C2C' }}>Revenue Trend</h2>
        <div className="h-64 flex items-end justify-around px-4 gap-2">
          {[65, 45, 75, 55, 85, 60, 70, 72, 68, 82, 75, 88].map((h, i) => (
            <div key={i} className="flex flex-col items-center flex-1">
              <div
                className="w-full rounded-t-lg transition-all hover:opacity-80"
                style={{
                  height: (h * 2) + 'px',
                  backgroundColor: i % 2 === 0 ? '#C7DCC8' : '#E8D4F1'
                }}
              />
              <span className="text-xs mt-2" style={{ color: '#999' }}>
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Services */}
      <div className="rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h2 className="text-xl font-bold mb-6" style={{ color: '#2C2C2C' }}>Top Services</h2>
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E8E6E4' }}>
              <th className="p-4 text-left" style={{ color: '#2C2C2C' }}>Service</th>
              <th className="p-4 text-left" style={{ color: '#2C2C2C' }}>Bookings</th>
              <th className="p-4 text-left" style={{ color: '#2C2C2C' }}>Revenue</th>
              <th className="p-4 text-left" style={{ color: '#2C2C2C' }}>Avg Rating</th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: 'Hair Styling', bookings: 34, revenue: 2720, rating: 4.9 },
              { name: 'Coloring', bookings: 28, revenue: 2800, rating: 4.8 },
              { name: 'Massage', bookings: 22, revenue: 1760, rating: 5.0 },
              { name: 'Facials', bookings: 19, revenue: 1520, rating: 4.7 },
              { name: 'Manicure', bookings: 53, revenue: 2650, rating: 4.6 }
            ].map((service, i) => (
              <tr key={service.name} style={{ borderBottom: i < 4 ? '1px solid #E8E6E4' : 'none' }}>
                <td className="p-4" style={{ color: '#2C2C2C' }}>{service.name}</td>
                <td className="p-4" style={{ color: '#666' }}>{service.bookings}</td>
                <td className="p-4" style={{ color: '#666' }}>${service.revenue}</td>
                <td className="p-4">
                  <span className="px-3 py-1 rounded-lg text-sm font-medium" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                    {service.rating}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
