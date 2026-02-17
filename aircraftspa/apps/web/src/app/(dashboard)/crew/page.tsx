"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, MapPin, CheckCircle2, XCircle } from "lucide-react";

// Mock crew data
const mockCrew = [
  {
    id: "1",
    name: "Mike Johnson",
    role: "Lead Detailer",
    skills: ["Exterior", "Interior", "Polish"],
    homeBase: "LAX",
    status: "available" as const,
    phone: "(555) 111-2222",
    email: "mike.j@aircraftspa.com",
  },
  {
    id: "2",
    name: "Sarah Williams",
    role: "Interior Specialist",
    skills: ["Interior", "Leather Treatment"],
    homeBase: "VNY",
    status: "on_job" as const,
    phone: "(555) 222-3333",
    email: "sarah.w@aircraftspa.com",
  },
  {
    id: "3",
    name: "Carlos Martinez",
    role: "Exterior Specialist",
    skills: ["Exterior", "Engine Clean", "Polish"],
    homeBase: "BUR",
    status: "available" as const,
    phone: "(555) 333-4444",
    email: "carlos.m@aircraftspa.com",
  },
  {
    id: "4",
    name: "Jessica Chen",
    role: "Full Service Tech",
    skills: ["Exterior", "Interior", "Engine Clean"],
    homeBase: "LAX",
    status: "available" as const,
    phone: "(555) 444-5555",
    email: "jessica.c@aircraftspa.com",
  },
  {
    id: "5",
    name: "Tom Davis",
    role: "Detailer",
    skills: ["Exterior", "Wheel Detail"],
    homeBase: "SNA",
    status: "off_duty" as const,
    phone: "(555) 555-6666",
    email: "tom.d@aircraftspa.com",
  },
];

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const statusConfig = {
  available: { label: "Available", color: "bg-green-100 text-green-800" },
  on_job: { label: "On Job", color: "bg-blue-100 text-blue-800" },
  off_duty: { label: "Off Duty", color: "bg-slate-100 text-slate-800" },
};

export default function CrewPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCrewId, setSelectedCrewId] = useState<string | null>(null);

  // Mock availability data (crew member -> day -> available)
  const [availability] = useState({
    "1": [true, true, true, true, true, false, false],
    "2": [true, true, true, true, true, true, false],
    "3": [false, true, true, true, true, true, true],
    "4": [true, true, true, true, true, false, false],
    "5": [true, true, false, true, true, false, false],
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Crew Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your team and their schedules
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Crew Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Crew Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Enter name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input id="role" placeholder="e.g., Lead Detailer" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="email@aircraftspa.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="(555) 000-0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="homeBase">Home Base</Label>
                <Input id="homeBase" placeholder="e.g., LAX" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddDialogOpen(false)}>
                  Add Crew Member
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Crew
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {mockCrew.length}
            </div>
            <p className="text-xs text-slate-500">Active members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Available Now
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {mockCrew.filter((c) => c.status === "available").length}
            </div>
            <p className="text-xs text-slate-500">Ready for assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              On Job
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {mockCrew.filter((c) => c.status === "on_job").length}
            </div>
            <p className="text-xs text-slate-500">Currently working</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Off Duty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-600">
              {mockCrew.filter((c) => c.status === "off_duty").length}
            </div>
            <p className="text-xs text-slate-500">Not scheduled</p>
          </CardContent>
        </Card>
      </div>

      {/* Crew Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockCrew.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <p className="text-sm text-slate-500">{member.role}</p>
                </div>
                <Badge
                  variant="secondary"
                  className={statusConfig[member.status].color}
                >
                  {statusConfig[member.status].label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="h-4 w-4" />
                <span>Home Base: {member.homeBase}</span>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {member.skills.map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 text-xs text-slate-600">
                <p>{member.email}</p>
                <p>{member.phone}</p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setSelectedCrewId(member.id)}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly Availability */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 text-left text-sm font-semibold text-slate-700">
                    Crew Member
                  </th>
                  {daysOfWeek.map((day) => (
                    <th
                      key={day}
                      className="pb-3 text-center text-sm font-semibold text-slate-700"
                    >
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockCrew.map((member, index) => (
                  <tr
                    key={member.id}
                    className={`border-b border-slate-100 ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50"
                    }`}
                  >
                    <td className="py-3">
                      <div className="font-medium text-slate-900">
                        {member.name}
                      </div>
                      <div className="text-xs text-slate-500">{member.role}</div>
                    </td>
                    {availability[member.id as keyof typeof availability].map(
                      (isAvailable, dayIndex) => (
                        <td key={dayIndex} className="py-3 text-center">
                          {isAvailable ? (
                            <CheckCircle2 className="inline h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="inline h-5 w-5 text-slate-300" />
                          )}
                        </td>
                      )
                    )}
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
