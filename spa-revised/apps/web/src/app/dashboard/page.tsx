'use client'

import { Users, Scissors, Users2, DollarSign, Calendar, TrendingUp, Search, Bell, Settings, HelpCircle, LogOut, BarChart3 } from 'lucide-react'
import { useDashboardData } from '@/lib/hooks/useDashboardData'

export default function DashboardPage() {
  const { data, loading, error } = useDashboardData()

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F3F0' }}>
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 border-b" style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E6E4' }}>
        <div className="px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold" style={{ color: '#2C2C2C' }}>Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="relative w-96">
              <input
                type="text"
                placeholder="Search here..."
                className="w-full px-4 py-2 rounded-lg border"
                style={{ borderColor: '#E8E6E4', backgroundColor: '#FAFAF8' }}
              />
              <Search size={18} className="absolute right-3 top-3" style={{ color: '#999' }} />
            </div>
            <button className="p-2" style={{ color: '#666' }}>
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ backgroundColor: '#F5F3F0' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#C7DCC8', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>
                SM
              </div>
              <span className="text-sm font-medium">Sofia Martinez</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        {/* Left Sidebar - Navigation */}
        <div className="w-56 border-r" style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E6E4' }}>
          <div className="p-6 space-y-1">
            <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#999' }}>Main Menu</div>
            {[
              { name: 'Dashboard', icon: BarChart3, active: true },
              { name: 'Appointments', icon: Calendar, active: false },
              { name: 'Clients', icon: Users, active: false },
              { name: 'Services', icon: Scissors, active: false },
              { name: 'Staff', icon: Users2, active: false },
              { name: 'Reports', icon: TrendingUp, active: false }
            ].map((item, i) => {
              const IconComponent = item.icon
              return (
                <div
                  key={i}
                  className="px-4 py-3 rounded-lg cursor-pointer transition-all flex items-center gap-3"
                  style={{
                    backgroundColor: item.active ? '#C7DCC8' : 'transparent',
                    color: item.active ? '#FFFFFF' : '#666'
                  }}
                >
                  <IconComponent size={20} />
                  <span className="font-medium text-sm">{item.name}</span>
                </div>
              )
            })}
            <div className="mt-8 pt-6 border-t" style={{ borderColor: '#E8E6E4' }}>
              <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#999' }}>Other</div>
              {[
                { name: 'Settings', icon: Settings },
                { name: 'Help Center', icon: HelpCircle },
                { name: 'Log Out', icon: LogOut }
              ].map((item, i) => {
                const IconComponent = item.icon
                return (
                  <div key={i} className="px-4 py-3 rounded-lg cursor-pointer transition-all flex items-center gap-3 hover:bg-gray-50">
                    <IconComponent size={20} />
                    <span className="font-medium text-sm text-gray-700">{item.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-auto">
            <div className="p-8">
              {/* Loading State */}
              {loading && (
                <div className="text-center py-8">
                  <div style={{ color: '#999' }}>Loading dashboard data...</div>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#FFF5F5', borderLeft: '4px solid #FF6B6B', color: '#CC5555' }}>
                  <div className="text-sm font-semibold">Error loading data</div>
                  <div className="text-xs mt-1">{error}</div>
                </div>
              )}

              {/* Metrics Bar - 6 Equal Columns */}
              {!loading && data.metrics && (
                <div className="grid grid-cols-6 gap-4 mb-8">
                  {[
                    { label: 'Total Clients', value: data.metrics.totalClients || 0, icon: Users, accentColor: '#F4D9C8' },
                    { label: 'Total Services', value: data.metrics.totalServices || 0, icon: Scissors, accentColor: '#E8D4F1' },
                    { label: 'Total Staff', value: data.metrics.totalStaff || 0, icon: Users2, accentColor: '#D9E8DC' },
                    { label: 'Revenue', value: '$' + (data.metrics.totalRevenue || 0).toLocaleString('en-US', { maximumFractionDigits: 0 }), icon: DollarSign, accentColor: '#F0D9D9' },
                    { label: 'Appointments', value: data.metrics.totalAppointments || 0, icon: Calendar, accentColor: '#D9E0F0' },
                    { label: 'This Month Growth', value: (data.metrics.growth >= 0 ? '+' : '') + (data.metrics.growth || 0) + '%', icon: TrendingUp, accentColor: '#F4E8C8' }
                  ].map((metric, i) => {
                    const IconComponent = metric.icon
                    return (
                      <div
                        key={i}
                        className="p-6 rounded-2xl transition-transform hover:scale-105"
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderLeft: `4px solid ${metric.accentColor}`,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}
                      >
                        <div className="mb-2" style={{ color: metric.accentColor }}>
                          <IconComponent size={28} />
                        </div>
                        <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#999', marginBottom: '8px' }}>
                          {metric.label}
                        </div>
                        <div className="text-2xl font-bold" style={{ color: '#2C2C2C' }}>
                          {metric.value}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Day Schedule Section */}
              {!loading && data.scheduleSlots && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4" style={{ color: '#2C2C2C' }}>Day Schedule</h2>
                  {data.scheduleSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4">
                      {data.scheduleSlots.map((slot, i) => (
                        <div key={i} className="rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                          <div className="flex items-center gap-2 mb-4">
                            <Calendar size={16} style={{ color: '#C7DCC8' }} />
                            <span className="text-sm font-semibold" style={{ color: '#C7DCC8' }}>{slot.time}</span>
                          </div>
                          <div className="space-y-3">
                            {slot.services.map((service) => (
                              <div
                                key={service.id}
                                className="p-3 rounded-lg text-white text-sm font-medium"
                                style={{ backgroundColor: service.color }}
                              >
                                <div className="font-bold">{service.name}</div>
                                <div className="text-xs opacity-90 mt-1">{service.staff} • {service.client}</div>
                                <div className="text-xs opacity-90">{service.duration} min</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', color: '#999' }}>
                      No appointments scheduled for today
                    </div>
                  )}
                </div>
              )}

              {/* Revenue Analytics Chart Section */}
              <div className="rounded-2xl p-6" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h2 className="text-xl font-bold mb-4" style={{ color: '#2C2C2C' }}>Revenue Analytics</h2>
                <div className="h-64 flex items-end justify-around px-4 gap-2">
                  {[65, 45, 75, 55, 85, 60, 70].map((height, i) => (
                    <div key={i} className="flex flex-col items-center flex-1">
                      <div
                        className="w-full rounded-t-lg transition-all hover:opacity-80"
                        style={{
                          height: `${height * 2}px`,
                          backgroundColor: i % 2 === 0 ? '#C7DCC8' : '#E8D4F1'
                        }}
                      />
                      <span className="text-xs mt-2" style={{ color: '#999' }}>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Upcoming Appointments */}
        <div className="w-80 border-l" style={{ backgroundColor: '#FFFFFF', borderColor: '#E8E6E4' }}>
          <div className="p-6 h-screen flex flex-col">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#2C2C2C' }}>Upcoming Appointments</h3>
            <div className="flex-1 overflow-y-auto space-y-3">
              {loading && (
                <div style={{ color: '#999', fontSize: '14px' }}>Loading appointments...</div>
              )}
              {!loading && data.upcomingAppointments && data.upcomingAppointments.length > 0 ? (
                data.upcomingAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-4 rounded-xl cursor-pointer transition-all hover:shadow-md"
                    style={{ backgroundColor: '#F5F3F0', border: '1px solid #E8E6E4' }}
                  >
                    <div className="flex gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#C7DCC8', color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>
                        {apt.initials}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm" style={{ color: '#2C2C2C' }}>{apt.name}</div>
                        <div className="text-xs" style={{ color: '#999' }}>{apt.service}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: '#666' }}>{apt.time}</span>
                      <span className="font-bold" style={{ color: '#C7DCC8' }}>{apt.price}</span>
                    </div>
                  </div>
                ))
              ) : !loading ? (
                <div style={{ color: '#999', fontSize: '14px' }}>No upcoming appointments</div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
