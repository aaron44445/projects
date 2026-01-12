'use client'

import { Users, Scissors, Users2, DollarSign, Calendar, TrendingUp, Search, Bell, Settings, HelpCircle, LogOut, BarChart3 } from 'lucide-react'

export default function DashboardPage() {
  // Metrics data
  const metrics = [
    { label: 'Total Clients', value: '247', icon: Users, accentColor: '#F4D9C8' },
    { label: 'Total Services', value: '35', icon: Scissors, accentColor: '#E8D4F1' },
    { label: 'Total Staff', value: '12', icon: Users2, accentColor: '#D9E8DC' },
    { label: 'Revenue', value: '$24,500', icon: DollarSign, accentColor: '#F0D9D9' },
    { label: 'Appointments', value: '156', icon: Calendar, accentColor: '#D9E0F0' },
    { label: 'This Month Growth', value: '+18%', icon: TrendingUp, accentColor: '#F4E8C8' }
  ]

  // Day schedule data
  const scheduleSlots = [
    { time: '09:00', services: [
      { id: 1, name: 'Hair Cut', staff: 'Sofia', client: 'Emma', duration: '45min', color: '#F4D9C8' },
      { id: 2, name: 'Coloring', staff: 'Maria', client: 'Lisa', duration: '90min', color: '#E8D4F1' }
    ]},
    { time: '10:30', services: [
      { id: 3, name: 'Styling', staff: 'Sofia', client: 'Jane', duration: '30min', color: '#D9E8DC' }
    ]},
    { time: '12:00', services: [
      { id: 4, name: 'Treatment', staff: 'Ana', client: 'Sarah', duration: '60min', color: '#F0D9D9' }
    ]},
    { time: '14:00', services: [
      { id: 5, name: 'Hair Spa', staff: 'Maria', client: 'Jessica', duration: '75min', color: '#D9E0F0' }
    ]},
    { time: '15:30', services: [
      { id: 6, name: 'Manicure', staff: 'Elena', client: 'Rachel', duration: '60min', color: '#F4E8C8' }
    ]}
  ]

  // Upcoming appointments (right sidebar)
  const upcomingAppointments = [
    { id: 1, name: 'Emily Johnson', service: 'Hair & Styling', time: '09:00 to 11:00', price: '$125.40', initials: 'EJ' },
    { id: 2, name: 'Olivia Smith', service: 'Hair Spa Treatment', time: '09:00 to 11:00', price: '$200.14', initials: 'OS' },
    { id: 3, name: 'Liam Miller', service: 'Beard Grooming & Shaping', time: '09:00 to 11:00', price: '$180.25', initials: 'LM' },
    { id: 4, name: 'Charlotte Anderson', service: 'Hair Wash & Blow Dry', time: '09:00 to 11:00', price: '$110.00', initials: 'CA' },
    { id: 5, name: 'Benjamin Walker', service: 'Beard Grooming', time: '09:00 to 11:00', price: '$85.45', initials: 'BW' },
    { id: 6, name: 'Amelia Thomas', service: 'Keratin Hair Treatment', time: '09:00 to 11:00', price: '$130.20', initials: 'AT' }
  ]

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
              {/* Metrics Bar - 6 Equal Columns */}
              <div className="grid grid-cols-6 gap-4 mb-8">
                {metrics.map((metric, i) => {
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

              {/* Day Schedule Section */}
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4" style={{ color: '#2C2C2C' }}>Day Schedule</h2>
                <div className="grid grid-cols-3 gap-4">
                  {scheduleSlots.map((slot, i) => (
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
                            <div className="text-xs opacity-90">{service.duration}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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
              {upcomingAppointments.map((apt) => (
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
