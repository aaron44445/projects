"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Mail, Phone, Calendar } from "lucide-react";

// Mock customer data
const mockCustomers = [
  {
    id: "1",
    name: "John Anderson",
    email: "john.anderson@example.com",
    phone: "(555) 123-4567",
    totalBookings: 12,
    lifetimeValue: 28450,
    lastBooking: "2024-02-15",
    status: "active" as const,
    aircraftOwned: "Gulfstream G650",
  },
  {
    id: "2",
    name: "Sarah Mitchell",
    email: "sarah.mitchell@corporate.com",
    phone: "(555) 234-5678",
    totalBookings: 8,
    lifetimeValue: 15200,
    lastBooking: "2024-02-17",
    status: "active" as const,
    aircraftOwned: "Citation X",
  },
  {
    id: "3",
    name: "Robert Chen",
    email: "robert.chen@aviation.net",
    phone: "(555) 345-6789",
    totalBookings: 24,
    lifetimeValue: 67800,
    lastBooking: "2024-02-18",
    status: "vip" as const,
    aircraftOwned: "Bombardier Global 7500",
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily.davis@skymail.com",
    phone: "(555) 456-7890",
    totalBookings: 5,
    lifetimeValue: 8900,
    lastBooking: "2024-01-28",
    status: "active" as const,
    aircraftOwned: "Learjet 75",
  },
  {
    id: "5",
    name: "Michael Torres",
    email: "michael.torres@jets.com",
    phone: "(555) 567-8901",
    totalBookings: 3,
    lifetimeValue: 4200,
    lastBooking: "2024-02-10",
    status: "new" as const,
    aircraftOwned: "Pilatus PC-24",
  },
  {
    id: "6",
    name: "Jennifer Lopez",
    email: "jlopez@execair.com",
    phone: "(555) 678-9012",
    totalBookings: 18,
    lifetimeValue: 42300,
    lastBooking: "2024-02-16",
    status: "vip" as const,
    aircraftOwned: "Falcon 7X",
  },
  {
    id: "7",
    name: "David Kim",
    email: "david.kim@privateflights.net",
    phone: "(555) 789-0123",
    totalBookings: 6,
    lifetimeValue: 11600,
    lastBooking: "2024-02-05",
    status: "active" as const,
    aircraftOwned: "Citation Sovereign",
  },
  {
    id: "8",
    name: "Lisa Thompson",
    email: "lisa.thompson@aviation.co",
    phone: "(555) 890-1234",
    totalBookings: 1,
    lifetimeValue: 1800,
    lastBooking: "2024-02-14",
    status: "new" as const,
    aircraftOwned: "Hawker 800",
  },
];

const statusConfig = {
  new: { label: "New", color: "bg-green-100 text-green-800" },
  active: { label: "Active", color: "bg-blue-100 text-blue-800" },
  vip: { label: "VIP", color: "bg-purple-100 text-purple-800" },
  inactive: { label: "Inactive", color: "bg-slate-100 text-slate-800" },
};

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredCustomers = mockCustomers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your customer relationships
          </p>
        </div>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">142</div>
            <p className="text-xs text-green-600">+12 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              VIP Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">28</div>
            <p className="text-xs text-slate-500">19.7% of total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total LTV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">$892K</div>
            <p className="text-xs text-green-600">+$42K this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Avg. Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">8.4</div>
            <p className="text-xs text-slate-500">Per customer</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Customers</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search customers..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 text-left text-sm font-medium text-slate-600">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Contact</th>
                  <th className="pb-3">Aircraft</th>
                  <th className="pb-3 text-center">Total Bookings</th>
                  <th className="pb-3 text-right">Lifetime Value</th>
                  <th className="pb-3">Last Booking</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, index) => (
                  <tr
                    key={customer.id}
                    className={`border-b border-slate-100 cursor-pointer transition-colors hover:bg-slate-50 ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                    } ${expandedId === customer.id ? "bg-blue-50" : ""}`}
                    onClick={() =>
                      setExpandedId(expandedId === customer.id ? null : customer.id)
                    }
                  >
                    <td className="py-3">
                      <div className="font-medium text-slate-900">
                        {customer.name}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex flex-col gap-1 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {customer.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-slate-600">
                      {customer.aircraftOwned}
                    </td>
                    <td className="py-3 text-center font-semibold text-slate-900">
                      {customer.totalBookings}
                    </td>
                    <td className="py-3 text-right font-semibold text-slate-900">
                      ${customer.lifetimeValue.toLocaleString()}
                    </td>
                    <td className="py-3 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {customer.lastBooking}
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge
                        variant="secondary"
                        className={statusConfig[customer.status].color}
                      >
                        {statusConfig[customer.status].label}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredCustomers.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-500">
              No customers found matching "{searchQuery}"
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
