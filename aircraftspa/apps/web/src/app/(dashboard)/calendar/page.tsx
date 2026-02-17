"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

// Mock calendar data
const mockBookings = [
  {
    id: "1",
    day: 0, // Monday
    startHour: 9,
    duration: 3,
    customer: "John Anderson",
    service: "Full Detail",
    aircraft: "G650",
    status: "confirmed" as const,
  },
  {
    id: "2",
    day: 0,
    startHour: 14,
    duration: 2,
    customer: "Sarah Mitchell",
    service: "Express Wash",
    aircraft: "Citation X",
    status: "in_progress" as const,
  },
  {
    id: "3",
    day: 1,
    startHour: 10,
    duration: 4,
    customer: "Robert Chen",
    service: "Full Detail + Polish",
    aircraft: "Global 7500",
    status: "pending" as const,
  },
  {
    id: "4",
    day: 2,
    startHour: 8,
    duration: 2.5,
    customer: "Emily Davis",
    service: "Interior Detail",
    aircraft: "Learjet 75",
    status: "confirmed" as const,
  },
  {
    id: "5",
    day: 3,
    startHour: 11,
    duration: 1.5,
    customer: "Michael Torres",
    service: "Exterior Wash",
    aircraft: "PC-24",
    status: "pending" as const,
  },
  {
    id: "6",
    day: 4,
    startHour: 13,
    duration: 3,
    customer: "Jennifer Lopez",
    service: "Full Detail",
    aircraft: "Falcon 7X",
    status: "confirmed" as const,
  },
];

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7 AM to 6 PM

const statusColors = {
  pending: "bg-yellow-200 border-yellow-400 text-yellow-900",
  confirmed: "bg-blue-200 border-blue-400 text-blue-900",
  in_progress: "bg-green-200 border-green-400 text-green-900",
  completed: "bg-slate-200 border-slate-400 text-slate-900",
  cancelled: "bg-red-200 border-red-400 text-red-900",
};

export default function CalendarPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  const getWeekDates = () => {
    const dates = [];
    const start = new Date(currentWeek);
    start.setDate(start.getDate() - start.getDay() + 1); // Start from Monday

    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const previousWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentWeek(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentWeek);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentWeek(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Calendar</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your booking schedule
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Booking
        </Button>
      </div>

      {/* Week Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {weekDates[0].toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={previousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentWeek(new Date())}
              >
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={nextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Calendar Grid */}
              <div className="grid grid-cols-8 gap-px bg-slate-200">
                {/* Time Column Header */}
                <div className="bg-white p-2 text-center text-sm font-semibold text-slate-700">
                  Time
                </div>

                {/* Day Headers */}
                {daysOfWeek.map((day, index) => (
                  <div
                    key={day}
                    className="bg-white p-2 text-center"
                  >
                    <div className="text-sm font-semibold text-slate-700">
                      {day}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDate(weekDates[index])}
                    </div>
                  </div>
                ))}

                {/* Time Rows */}
                {hours.map((hour) => (
                  <div key={hour} className="contents">
                    {/* Time Label */}
                    <div className="bg-white p-2 text-right text-xs text-slate-600">
                      {hour === 12
                        ? "12 PM"
                        : hour > 12
                        ? `${hour - 12} PM`
                        : `${hour} AM`}
                    </div>

                    {/* Day Cells */}
                    {daysOfWeek.map((_, dayIndex) => {
                      const booking = mockBookings.find(
                        (b) => b.day === dayIndex && b.startHour === hour
                      );

                      return (
                        <div
                          key={`${hour}-${dayIndex}`}
                          className="relative bg-white p-1"
                          style={{ minHeight: "60px" }}
                        >
                          {booking && (
                            <div
                              className={`absolute inset-x-1 rounded border-l-4 p-2 text-xs ${
                                statusColors[booking.status]
                              }`}
                              style={{
                                height: `${booking.duration * 60}px`,
                                zIndex: 10,
                              }}
                            >
                              <div className="font-semibold">
                                {booking.customer}
                              </div>
                              <div className="mt-1">{booking.service}</div>
                              <div className="text-[10px]">
                                {booking.aircraft}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 border-t border-slate-200 pt-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-yellow-200 border border-yellow-400"></div>
              <span className="text-xs text-slate-600">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-blue-200 border border-blue-400"></div>
              <span className="text-xs text-slate-600">Confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-green-200 border border-green-400"></div>
              <span className="text-xs text-slate-600">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-slate-200 border border-slate-400"></div>
              <span className="text-xs text-slate-600">Completed</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
