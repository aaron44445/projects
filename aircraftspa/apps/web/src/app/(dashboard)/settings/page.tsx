"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Upload } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [businessProfile, setBusinessProfile] = useState({
    name: "Aircraft SPA Services",
    email: "contact@aircraftspa.com",
    phone: "(555) 100-2000",
    address: "123 Airport Way, Los Angeles, CA 90045",
  });

  const [serviceAreas, setServiceAreas] = useState({
    homeBase: "LAX",
    serviceRadius: 100,
    perMileRate: 2.5,
    minimumTravelFee: 50,
  });

  const [bookingPolicies, setBookingPolicies] = useState({
    cancellationWindow: 24,
    depositPercentage: 50,
    operatingHoursStart: "07:00",
    operatingHoursEnd: "18:00",
    minimumAdvanceBooking: 4,
  });

  const [notificationTemplates] = useState({
    bookingConfirmation: `Hello {{customer_name}},

Your booking has been confirmed!

Booking ID: {{booking_id}}
Date & Time: {{date}} at {{time}}
Aircraft: {{aircraft}}
Service: {{service}}
Location: {{location}}

Total: {{total_amount}}
Deposit Paid: {{deposit_amount}}

Our team will arrive promptly at the scheduled time.

Thank you for choosing Aircraft SPA!`,

    reminderEmail: `Hi {{customer_name}},

This is a reminder that your aircraft detailing service is scheduled for tomorrow.

Date & Time: {{date}} at {{time}}
Location: {{location}}
Service: {{service}}

If you need to make any changes, please contact us at least {{cancellation_window}} hours in advance.

See you soon!`,
  });

  const handleSaveBusinessProfile = () => {
    alert("Business profile saved!");
  };

  const handleSaveServiceAreas = () => {
    alert("Service areas saved!");
  };

  const handleSaveBookingPolicies = () => {
    alert("Booking policies saved!");
  };

  const handleSaveNotifications = () => {
    alert("Notification templates saved!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure your business settings and preferences
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="business">Business Profile</TabsTrigger>
          <TabsTrigger value="service-areas">Service Areas</TabsTrigger>
          <TabsTrigger value="policies">Booking Policies</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Business Profile Tab */}
        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={businessProfile.name}
                    onChange={(e) =>
                      setBusinessProfile((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Email</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={businessProfile.email}
                    onChange={(e) =>
                      setBusinessProfile((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessPhone">Phone</Label>
                  <Input
                    id="businessPhone"
                    value={businessProfile.phone}
                    onChange={(e) =>
                      setBusinessProfile((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="businessAddress">Address</Label>
                  <Input
                    id="businessAddress"
                    value={businessProfile.address}
                    onChange={(e) =>
                      setBusinessProfile((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
                    No logo
                  </div>
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Logo
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Recommended: 400x400px, PNG or JPG
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveBusinessProfile}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Areas Tab */}
        <TabsContent value="service-areas" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Service Area Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="homeBase">Home Base Airport</Label>
                  <Input
                    id="homeBase"
                    value={serviceAreas.homeBase}
                    onChange={(e) =>
                      setServiceAreas((prev) => ({
                        ...prev,
                        homeBase: e.target.value,
                      }))
                    }
                    placeholder="e.g., LAX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceRadius">Service Radius (miles)</Label>
                  <Input
                    id="serviceRadius"
                    type="number"
                    value={serviceAreas.serviceRadius}
                    onChange={(e) =>
                      setServiceAreas((prev) => ({
                        ...prev,
                        serviceRadius: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="perMileRate">Per Mile Rate</Label>
                  <div className="flex items-center">
                    <span className="mr-2 text-slate-600">$</span>
                    <Input
                      id="perMileRate"
                      type="number"
                      step="0.1"
                      value={serviceAreas.perMileRate}
                      onChange={(e) =>
                        setServiceAreas((prev) => ({
                          ...prev,
                          perMileRate: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimumTravelFee">Minimum Travel Fee</Label>
                  <div className="flex items-center">
                    <span className="mr-2 text-slate-600">$</span>
                    <Input
                      id="minimumTravelFee"
                      type="number"
                      value={serviceAreas.minimumTravelFee}
                      onChange={(e) =>
                        setServiceAreas((prev) => ({
                          ...prev,
                          minimumTravelFee: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveServiceAreas}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Booking Policies Tab */}
        <TabsContent value="policies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking Policies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cancellationWindow">
                    Cancellation Window (hours)
                  </Label>
                  <Input
                    id="cancellationWindow"
                    type="number"
                    value={bookingPolicies.cancellationWindow}
                    onChange={(e) =>
                      setBookingPolicies((prev) => ({
                        ...prev,
                        cancellationWindow: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                  <p className="text-xs text-slate-500">
                    Hours before service when cancellations are allowed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depositPercentage">
                    Deposit Percentage (%)
                  </Label>
                  <Input
                    id="depositPercentage"
                    type="number"
                    value={bookingPolicies.depositPercentage}
                    onChange={(e) =>
                      setBookingPolicies((prev) => ({
                        ...prev,
                        depositPercentage: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                  <p className="text-xs text-slate-500">
                    Required upfront when booking
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operatingStart">Operating Hours Start</Label>
                  <Input
                    id="operatingStart"
                    type="time"
                    value={bookingPolicies.operatingHoursStart}
                    onChange={(e) =>
                      setBookingPolicies((prev) => ({
                        ...prev,
                        operatingHoursStart: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operatingEnd">Operating Hours End</Label>
                  <Input
                    id="operatingEnd"
                    type="time"
                    value={bookingPolicies.operatingHoursEnd}
                    onChange={(e) =>
                      setBookingPolicies((prev) => ({
                        ...prev,
                        operatingHoursEnd: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="minimumAdvanceBooking">
                    Minimum Advance Booking (hours)
                  </Label>
                  <Input
                    id="minimumAdvanceBooking"
                    type="number"
                    value={bookingPolicies.minimumAdvanceBooking}
                    onChange={(e) =>
                      setBookingPolicies((prev) => ({
                        ...prev,
                        minimumAdvanceBooking: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                  <p className="text-xs text-slate-500">
                    Minimum hours in advance required for bookings
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveBookingPolicies}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="confirmationTemplate">
                  Booking Confirmation Email
                </Label>
                <textarea
                  id="confirmationTemplate"
                  className="min-h-[200px] w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
                  defaultValue={notificationTemplates.bookingConfirmation}
                />
                <p className="text-xs text-slate-500">
                  Available variables: {"{"}
                  {"{"}customer_name{"}"}, {"{"}
                  {"{"}booking_id{"}"}, {"{"}
                  {"{"}date{"}"}, {"{"}
                  {"{"}time{"}"}, {"{"}
                  {"{"}aircraft{"}"}, {"{"}
                  {"{"}service{"}"}, {"{"}
                  {"{"}location{"}"}, {"{"}
                  {"{"}total_amount{"}"}, {"{"}
                  {"{"}deposit_amount{"}"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminderTemplate">Reminder Email</Label>
                <textarea
                  id="reminderTemplate"
                  className="min-h-[150px] w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono"
                  defaultValue={notificationTemplates.reminderEmail}
                />
                <p className="text-xs text-slate-500">
                  Available variables: {"{"}
                  {"{"}customer_name{"}"}, {"{"}
                  {"{"}date{"}"}, {"{"}
                  {"{"}time{"}"}, {"{"}
                  {"{"}location{"}"}, {"{"}
                  {"{"}service{"}"}, {"{"}
                  {"{"}cancellation_window{"}"}
                </p>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveNotifications}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Templates
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
