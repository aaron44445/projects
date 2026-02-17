"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  DollarSign,
  Clock,
  Users,
  Plus,
  CalendarDays,
} from "lucide-react";

// Mock data
const stats = [
  {
    title: "Today's Jobs",
    value: "3",
    icon: Calendar,
    change: "+2 from yesterday",
    changeType: "positive" as const,
  },
  {
    title: "This Week's Revenue",
    value: "$12,450",
    icon: DollarSign,
    change: "+18% from last week",
    changeType: "positive" as const,
  },
  {
    title: "Pending Bookings",
    value: "7",
    icon: Clock,
    change: "Awaiting confirmation",
    changeType: "neutral" as const,
  },
  {
    title: "Total Customers",
    value: "142",
    icon: Users,
    change: "+12 this month",
    changeType: "positive" as const,
  },
];

const recentBookings = [
  {
    id: "BK-2024-001",
    date: "2024-02-17",
    time: "09:00 AM",
    customer: "John Anderson",
    aircraft: "Gulfstream G650",
    service: "Full Detail",
    status: "confirmed" as const,
    amount: "$2,800",
  },
  {
    id: "BK-2024-002",
    date: "2024-02-17",
    time: "02:00 PM",
    customer: "Sarah Mitchell",
    aircraft: "Cessna Citation X",
    service: "Express Wash",
    status: "in_progress" as const,
    amount: "$850",
  },
  {
    id: "BK-2024-003",
    date: "2024-02-18",
    time: "10:30 AM",
    customer: "Robert Chen",
    aircraft: "Bombardier Global 7500",
    service: "Full Detail + Polish",
    status: "pending" as const,
    amount: "$3,200",
  },
  {
    id: "BK-2024-004",
    date: "2024-02-18",
    time: "03:00 PM",
    customer: "Emily Davis",
    aircraft: "Learjet 75",
    service: "Interior Detail",
    status: "confirmed" as const,
    amount: "$1,400",
  },
  {
    id: "BK-2024-005",
    date: "2024-02-19",
    time: "11:00 AM",
    customer: "Michael Torres",
    aircraft: "Pilatus PC-24",
    service: "Exterior Wash",
    status: "pending" as const,
    amount: "$650",
  },
];

const statusConfig = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800" },
  in_progress: { label: "In Progress", color: "bg-green-100 text-green-800" },
  completed: { label: "Completed", color: "bg-slate-100 text-slate-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Welcome back! Here's what's happening today.
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/calendar">
              <CalendarDays className="mr-2 h-4 w-4" />
              View Calendar
            </Link>
          </Button>
          <Button asChild>
            <Link href="/bookings/new">
              <Plus className="mr-2 h-4 w-4" />
              New Booking
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {stat.title}
                </CardTitle>
                <div className="rounded-lg bg-blue-50 p-2">
                  <Icon className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  {stat.value}
                </div>
                <p
                  className={`mt-1 text-xs ${
                    stat.changeType === "positive"
                      ? "text-green-600"
                      : "text-slate-500"
                  }`}
                >
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Bookings</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/bookings">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 text-left text-sm font-medium text-slate-600">
                  <th className="pb-3">Booking ID</th>
                  <th className="pb-3">Date & Time</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Aircraft</th>
                  <th className="pb-3">Service</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking, index) => (
                  <tr
                    key={booking.id}
                    className={`border-b border-slate-100 text-sm ${
                      index % 2 === 0 ? "bg-slate-50" : "bg-white"
                    }`}
                  >
                    <td className="py-3 font-medium text-slate-900">
                      {booking.id}
                    </td>
                    <td className="py-3 text-slate-600">
                      <div>{booking.date}</div>
                      <div className="text-xs text-slate-500">
                        {booking.time}
                      </div>
                    </td>
                    <td className="py-3 text-slate-900">{booking.customer}</td>
                    <td className="py-3 text-slate-600">{booking.aircraft}</td>
                    <td className="py-3 text-slate-600">{booking.service}</td>
                    <td className="py-3">
                      <Badge
                        variant="secondary"
                        className={statusConfig[booking.status].color}
                      >
                        {statusConfig[booking.status].label}
                      </Badge>
                    </td>
                    <td className="py-3 text-right font-semibold text-slate-900">
                      {booking.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
