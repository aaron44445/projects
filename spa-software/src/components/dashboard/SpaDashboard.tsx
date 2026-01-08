import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Sparkles,
  UserCog,
  Package,
  BarChart3,
  MessageSquare,
  Settings,
  HelpCircle,
  Search,
  Bell,
  Download,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Sun,
  Moon,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Types
interface NavItem {
  icon: React.ElementType;
  label: string;
  badge?: number;
  active?: boolean;
}

interface StatCardProps {
  label: string;
  value: string | number;
  change: number;
  changeText: string;
  isDark: boolean;
}

interface ServiceItem {
  name: string;
  count: number;
}

interface StaffMember {
  name: string;
  role: string;
  avatar: string;
  status: 'available' | 'unavailable' | 'leave';
}

interface Appointment {
  id: string;
  clientName: string;
  clientAvatar: string;
  dateTime: string;
  service: string;
  staffName: string;
  staffAvatar: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
}

// Sample Data
const chartData = [
  { day: 'Mon', revenue: 2400, appointments: 180 },
  { day: 'Tue', revenue: 2800, appointments: 220 },
  { day: 'Wed', revenue: 3200, appointments: 280 },
  { day: 'Thu', revenue: 2900, appointments: 250 },
  { day: 'Fri', revenue: 3800, appointments: 320 },
  { day: 'Sat', revenue: 4200, appointments: 389 },
  { day: 'Sun', revenue: 3100, appointments: 254 },
];

const topServices: ServiceItem[] = [
  { name: 'Massage Therapy', count: 128 },
  { name: 'Facial Treatment', count: 76 },
  { name: 'Manicure', count: 94 },
  { name: 'Hair Styling', count: 62 },
  { name: 'Pedicure', count: 58 },
];

const staffMembers: StaffMember[] = [
  { name: 'Sarah Johnson', role: 'Massage Therapist', avatar: 'SJ', status: 'available' },
  { name: 'Michael Chen', role: 'Hair Stylist', avatar: 'MC', status: 'available' },
  { name: 'Emily Davis', role: 'Esthetician', avatar: 'ED', status: 'unavailable' },
  { name: 'James Wilson', role: 'Nail Technician', avatar: 'JW', status: 'leave' },
];

const appointments: Appointment[] = [
  {
    id: '1',
    clientName: 'Tiana Delgado',
    clientAvatar: 'TD',
    dateTime: 'Monday, 15 Dec 2025 - 10:00 AM',
    service: 'Deep Tissue Massage',
    staffName: 'Sarah Johnson',
    staffAvatar: 'SJ',
    status: 'confirmed',
  },
  {
    id: '2',
    clientName: 'Robert Martinez',
    clientAvatar: 'RM',
    dateTime: 'Monday, 15 Dec 2025 - 11:30 AM',
    service: 'Haircut & Style',
    staffName: 'Michael Chen',
    staffAvatar: 'MC',
    status: 'pending',
  },
  {
    id: '3',
    clientName: 'Jessica Lee',
    clientAvatar: 'JL',
    dateTime: 'Monday, 15 Dec 2025 - 2:00 PM',
    service: 'Facial Treatment',
    staffName: 'Emily Davis',
    staffAvatar: 'ED',
    status: 'confirmed',
  },
];

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: Users, label: 'Clients', badge: 8 },
  { icon: Calendar, label: 'Appointments', badge: 5 },
  { icon: Sparkles, label: 'Services' },
  { icon: UserCog, label: 'Staff' },
  { icon: Package, label: 'Products' },
  { icon: BarChart3, label: 'Reports' },
  { icon: MessageSquare, label: 'Messages', badge: 3 },
];

// Components
const StatCard: React.FC<StatCardProps> = ({ label, value, change, changeText, isDark }) => {
  const isPositive = change >= 0;

  return (
    <div className={`rounded-xl p-5 ${
      isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-100 shadow-sm'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{label}</span>
        <button className={`p-1 rounded-md hover:bg-opacity-10 ${
          isDark ? 'hover:bg-white' : 'hover:bg-gray-900'
        }`}>
          <MoreHorizontal className={`w-5 h-5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
        </button>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {value}
        </span>
        <span className={`flex items-center text-xs font-medium ${
          isPositive ? 'text-emerald-500' : 'text-red-500'
        }`}>
          {isPositive ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
          {Math.abs(change)}%
        </span>
      </div>
      <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
        {changeText}
      </span>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string; isDark: boolean }> = ({ status, isDark }) => {
  const styles = {
    available: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    unavailable: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    leave: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    confirmed: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
    pending: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
    completed: 'bg-gray-50 text-gray-600 border border-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
    cancelled: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  };

  const labels = {
    available: 'Available',
    unavailable: 'Unavailable',
    leave: 'On Leave',
    confirmed: 'Confirmed',
    pending: 'Pending',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
      isDark ? styles[status as keyof typeof styles].replace('dark:', '') : styles[status as keyof typeof styles]
    }`}>
      {labels[status as keyof typeof labels]}
    </span>
  );
};

const Avatar: React.FC<{ initials: string; size?: 'sm' | 'md'; isDark: boolean }> = ({
  initials,
  size = 'md',
  isDark
}) => {
  const sizeClasses = size === 'sm' ? 'w-9 h-9 text-xs' : 'w-10 h-10 text-sm';

  return (
    <div className={`${sizeClasses} rounded-full flex items-center justify-center font-medium ${
      isDark ? 'bg-slate-700 text-slate-300' : 'bg-indigo-100 text-indigo-700'
    }`}>
      {initials}
    </div>
  );
};

// Main Dashboard Component
const SpaDashboard: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const [activeNav, setActiveNav] = useState('Dashboard');

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${
      isDark ? 'bg-slate-900' : 'bg-gray-50'
    }`}>
      {/* Sidebar */}
      <aside className={`w-60 flex flex-col border-r transition-colors duration-200 ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-2 px-5 border-b border-inherit">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isDark ? 'bg-indigo-600' : 'bg-indigo-500'
          }`}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Serenity Spa
          </span>
        </div>

        {/* Search */}
        <div className="px-3 py-4">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            isDark ? 'bg-slate-700/50' : 'bg-gray-100'
          }`}>
            <Search className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search here..."
              className={`bg-transparent text-sm outline-none w-full ${
                isDark ? 'text-slate-300 placeholder-slate-500' : 'text-gray-700 placeholder-gray-400'
              }`}
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.label === activeNav;

            return (
              <button
                key={item.label}
                onClick={() => setActiveNav(item.label)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? isDark
                      ? 'bg-indigo-500/10 text-indigo-400'
                      : 'bg-indigo-50 text-indigo-600'
                    : isDark
                      ? 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                    isDark ? 'bg-indigo-500 text-white' : 'bg-indigo-500 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="px-3 pb-3 space-y-1 border-t border-inherit pt-3">
          <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            isDark ? 'text-slate-400 hover:bg-slate-700/50' : 'text-gray-600 hover:bg-gray-100'
          }`}>
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </button>
          <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            isDark ? 'text-slate-400 hover:bg-slate-700/50' : 'text-gray-600 hover:bg-gray-100'
          }`}>
            <HelpCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Help & Center</span>
          </button>

          {/* Theme Toggle */}
          <div className={`flex items-center justify-between px-3 py-2.5 ${
            isDark ? 'text-slate-400' : 'text-gray-600'
          }`}>
            <div className="flex items-center gap-3">
              {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              <span className="text-sm font-medium">Dark Mode</span>
            </div>
            <button
              onClick={() => setIsDark(!isDark)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                isDark ? 'bg-indigo-500' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                isDark ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        {/* User Profile */}
        <div className={`p-3 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3 px-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isDark ? 'bg-gradient-to-br from-indigo-500 to-purple-500' : 'bg-gradient-to-br from-indigo-400 to-purple-400'
            }`}>
              <span className="text-white font-medium text-sm">AF</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Alice Fisher
              </p>
              <p className={`text-xs truncate ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                Super Admin
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className={`sticky top-0 z-10 px-6 py-4 border-b transition-colors duration-200 ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Welcome back, Alice
              </h1>
              <p className={`text-sm mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                View an overview of your spa metrics and appointments.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-gray-200 text-gray-700'
              }`}>
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Weekly</span>
                <ChevronDown className="w-4 h-4" />
              </div>
              <button className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm ${
                isDark
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white'
              }`}>
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Alert Banner */}
          <div className={`flex items-center justify-between px-4 py-3 rounded-xl ${
            isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-100'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                isDark ? 'bg-blue-500' : 'bg-blue-500'
              }`}>
                <span className="text-white text-xs">i</span>
              </div>
              <span className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                All set! Today's schedule has been updated with 3 new appointments.
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button className={`text-sm font-medium ${
                isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
              }`}>
                More Details
              </button>
              <button className={isDark ? 'text-slate-400' : 'text-gray-400'}>×</button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Today's Revenue"
              value="$4,276"
              change={5.2}
              changeText="+$210 vs last week"
              isDark={isDark}
            />
            <StatCard
              label="Appointments Today"
              value="24"
              change={4.8}
              changeText="+3 vs last week"
              isDark={isDark}
            />
            <StatCard
              label="New Clients"
              value="12"
              change={-3.1}
              changeText="-2 vs last week"
              isDark={isDark}
            />
            <StatCard
              label="Products Sold"
              value="38"
              change={2.2}
              changeText="+5 vs last week"
              isDark={isDark}
            />
          </div>

          {/* Middle Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Section */}
            <div className={`lg:col-span-2 rounded-xl p-5 ${
              isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-100 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Revenue Statistics
                  </h3>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-indigo-500" />
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Revenue</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-amber-400" />
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Appointments</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${
                    isDark ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-white border-gray-200 text-gray-700'
                  }`}>
                    <Calendar className="w-4 h-4" />
                    Weekly
                    <ChevronDown className="w-4 h-4" />
                  </div>
                  <button className={`p-2 rounded-lg ${
                    isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
                  }`}>
                    <MoreHorizontal className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                  </button>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={isDark ? '#334155' : '#E5E7EB'}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: isDark ? '#94A3B8' : '#6B7280', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: isDark ? '#94A3B8' : '#6B7280', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        border: `1px solid ${isDark ? '#334155' : '#E5E7EB'}`,
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                      labelStyle={{ color: isDark ? '#F1F5F9' : '#111827' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#6366F1"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, fill: '#6366F1' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="appointments"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, fill: '#F59E0B' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Services */}
            <div className={`rounded-xl p-5 ${
              isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-100 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Top Services
                </h3>
                <button className={`p-1 rounded-md ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                  <MoreHorizontal className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                </button>
              </div>
              <div className="space-y-4">
                {topServices.map((service, index) => (
                  <div key={service.name} className="flex items-center justify-between">
                    <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {service.name}
                    </span>
                    <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {service.count}
                      <span className={`font-normal ml-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                        bookings
                      </span>
                    </span>
                  </div>
                ))}
              </div>
              {/* Mini bar chart */}
              <div className="mt-4 flex gap-1 h-2">
                {topServices.map((service, index) => {
                  const colors = ['bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500'];
                  const maxCount = Math.max(...topServices.map(s => s.count));
                  const width = (service.count / maxCount) * 100;
                  return (
                    <div
                      key={service.name}
                      className={`${colors[index]} rounded-full`}
                      style={{ width: `${width}%` }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Staff Schedule */}
          <div className={`rounded-xl p-5 ${
            isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-100 shadow-sm'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Staff Schedule
              </h3>
              <button className={`p-1 rounded-md ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                <MoreHorizontal className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
              </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>8</div>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Available</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>3</div>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Unavailable</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>2</div>
                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>On Leave</div>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                Staff List
              </span>
              <button className={`text-sm font-medium ${
                isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
              }`}>
                See All →
              </button>
            </div>

            <div className="space-y-3">
              {staffMembers.map((staff) => (
                <div key={staff.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar initials={staff.avatar} isDark={isDark} />
                    <div>
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {staff.name}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                        {staff.role}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={staff.status} isDark={isDark} />
                </div>
              ))}
            </div>
          </div>

          {/* Appointments Table */}
          <div className={`rounded-xl overflow-hidden ${
            isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-gray-100 shadow-sm'
          }`}>
            <div className="p-5 border-b border-inherit">
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Appointments
                </h3>
                <button className={`p-1 rounded-md ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                  <MoreHorizontal className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border flex-1 max-w-xs ${
                  isDark ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <Search className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    placeholder="Search here..."
                    className={`bg-transparent text-sm outline-none w-full ${
                      isDark ? 'text-slate-300 placeholder-slate-500' : 'text-gray-700 placeholder-gray-400'
                    }`}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                    isDark ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-white border-gray-200 text-gray-700'
                  }`}>
                    <Calendar className="w-4 h-4" />
                    Weekly
                    <ChevronDown className="w-4 h-4" />
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                    isDark ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-white border-gray-200 text-gray-700'
                  }`}>
                    <SlidersHorizontal className="w-4 h-4" />
                    Filter
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr className={isDark ? 'border-b border-slate-700' : 'border-b border-gray-100'}>
                  <th className={`text-left py-3 px-5 text-xs font-medium uppercase tracking-wider ${
                    isDark ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    Client Name
                  </th>
                  <th className={`text-left py-3 px-5 text-xs font-medium uppercase tracking-wider ${
                    isDark ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    Date & Time
                  </th>
                  <th className={`text-left py-3 px-5 text-xs font-medium uppercase tracking-wider ${
                    isDark ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    Service
                  </th>
                  <th className={`text-left py-3 px-5 text-xs font-medium uppercase tracking-wider ${
                    isDark ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    Staff
                  </th>
                  <th className={`text-left py-3 px-5 text-xs font-medium uppercase tracking-wider ${
                    isDark ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    Status
                  </th>
                  <th className={`text-left py-3 px-5 text-xs font-medium uppercase tracking-wider ${
                    isDark ? 'text-slate-400' : 'text-gray-500'
                  }`}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr
                    key={apt.id}
                    className={`border-b transition-colors ${
                      isDark
                        ? 'border-slate-700 hover:bg-slate-700/50'
                        : 'border-gray-100 hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <Avatar initials={apt.clientAvatar} size="sm" isDark={isDark} />
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {apt.clientName}
                        </span>
                      </div>
                    </td>
                    <td className={`py-4 px-5 text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {apt.dateTime}
                    </td>
                    <td className={`py-4 px-5 text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      {apt.service}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <Avatar initials={apt.staffAvatar} size="sm" isDark={isDark} />
                        <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                          {apt.staffName}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <StatusBadge status={apt.status} isDark={isDark} />
                    </td>
                    <td className="py-4 px-5">
                      <button className={`p-2 rounded-lg ${
                        isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'
                      }`}>
                        <MoreHorizontal className={`w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SpaDashboard;
