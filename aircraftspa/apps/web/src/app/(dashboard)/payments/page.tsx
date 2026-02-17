"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  CreditCard,
  CheckCircle2,
  RefreshCw,
  Download,
  Search,
} from "lucide-react";
import { useState } from "react";

// Mock payment data
const mockPayments = [
  {
    id: "PAY-001",
    bookingId: "BK-2024-001",
    date: "2024-02-17",
    customer: "John Anderson",
    type: "deposit" as const,
    amount: 1400,
    status: "completed" as const,
    method: "Credit Card",
  },
  {
    id: "PAY-002",
    bookingId: "BK-2024-002",
    date: "2024-02-17",
    customer: "Sarah Mitchell",
    type: "deposit" as const,
    amount: 425,
    status: "pending" as const,
    method: "Credit Card",
  },
  {
    id: "PAY-003",
    bookingId: "BK-2024-003",
    date: "2024-02-18",
    customer: "Robert Chen",
    type: "deposit" as const,
    amount: 1600,
    status: "completed" as const,
    method: "ACH",
  },
  {
    id: "PAY-004",
    bookingId: "BK-2023-045",
    date: "2024-02-16",
    customer: "Emily Davis",
    type: "final" as const,
    amount: 700,
    status: "to_capture" as const,
    method: "Credit Card",
  },
  {
    id: "PAY-005",
    bookingId: "BK-2024-005",
    date: "2024-02-15",
    customer: "Michael Torres",
    type: "deposit" as const,
    amount: 325,
    status: "completed" as const,
    method: "Credit Card",
  },
  {
    id: "PAY-006",
    bookingId: "BK-2024-006",
    date: "2024-02-14",
    customer: "Jennifer Lopez",
    type: "final" as const,
    amount: 1600,
    status: "completed" as const,
    method: "Credit Card",
  },
  {
    id: "PAY-007",
    bookingId: "BK-2023-012",
    date: "2024-02-10",
    customer: "David Kim",
    type: "refund" as const,
    amount: 580,
    status: "refunded" as const,
    method: "Credit Card",
  },
  {
    id: "PAY-008",
    bookingId: "BK-2024-007",
    date: "2024-02-18",
    customer: "Lisa Thompson",
    type: "deposit" as const,
    amount: 900,
    status: "pending" as const,
    method: "ACH",
  },
];

const paymentTypeConfig = {
  deposit: { label: "Deposit", color: "bg-blue-100 text-blue-800" },
  final: { label: "Final Payment", color: "bg-green-100 text-green-800" },
  refund: { label: "Refund", color: "bg-red-100 text-red-800" },
};

const statusConfig = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  to_capture: { label: "To Capture", color: "bg-orange-100 text-orange-800" },
  completed: { label: "Completed", color: "bg-green-100 text-green-800" },
  refunded: { label: "Refunded", color: "bg-red-100 text-red-800" },
  failed: { label: "Failed", color: "bg-red-100 text-red-800" },
};

export default function PaymentsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPayments = mockPayments.filter(
    (payment) =>
      payment.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    pendingDeposits: mockPayments
      .filter((p) => p.status === "pending" && p.type === "deposit")
      .reduce((sum, p) => sum + p.amount, 0),
    toCapture: mockPayments
      .filter((p) => p.status === "to_capture")
      .reduce((sum, p) => sum + p.amount, 0),
    completed: mockPayments
      .filter((p) => p.status === "completed")
      .reduce((sum, p) => sum + p.amount, 0),
    refunded: mockPayments
      .filter((p) => p.status === "refunded")
      .reduce((sum, p) => sum + p.amount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Payments</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track deposits, final payments, and refunds
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Pending Deposits
            </CardTitle>
            <div className="rounded-lg bg-yellow-50 p-2">
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              ${stats.pendingDeposits.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500">
              {mockPayments.filter((p) => p.status === "pending").length} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              To Capture
            </CardTitle>
            <div className="rounded-lg bg-orange-50 p-2">
              <CreditCard className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              ${stats.toCapture.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500">
              {mockPayments.filter((p) => p.status === "to_capture").length} ready
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Completed
            </CardTitle>
            <div className="rounded-lg bg-green-50 p-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              ${stats.completed.toLocaleString()}
            </div>
            <p className="text-xs text-green-600">This period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Refunded
            </CardTitle>
            <div className="rounded-lg bg-red-50 p-2">
              <RefreshCw className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              ${stats.refunded.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500">
              {mockPayments.filter((p) => p.status === "refunded").length} refunds
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Payments</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search payments..."
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
                  <th className="pb-3">Payment ID</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Booking #</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Method</th>
                  <th className="pb-3 text-right">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment, index) => (
                  <tr
                    key={payment.id}
                    className={`border-b border-slate-100 text-sm ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50"
                    }`}
                  >
                    <td className="py-3 font-medium text-slate-900">
                      {payment.id}
                    </td>
                    <td className="py-3 text-slate-600">{payment.date}</td>
                    <td className="py-3 text-slate-600">{payment.bookingId}</td>
                    <td className="py-3 text-slate-900">{payment.customer}</td>
                    <td className="py-3">
                      <Badge
                        variant="secondary"
                        className={paymentTypeConfig[payment.type].color}
                      >
                        {paymentTypeConfig[payment.type].label}
                      </Badge>
                    </td>
                    <td className="py-3 text-slate-600">{payment.method}</td>
                    <td className="py-3 text-right font-semibold text-slate-900">
                      ${payment.amount.toLocaleString()}
                    </td>
                    <td className="py-3">
                      <Badge
                        variant="secondary"
                        className={statusConfig[payment.status].color}
                      >
                        {statusConfig[payment.status].label}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="py-8 text-center text-sm text-slate-500">
              No payments found matching "{searchQuery}"
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
