"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";

// Mock pricing data
const aircraftClasses = [
  { id: "light_jet", name: "Light Jet", example: "Citation CJ3, Learjet 45" },
  { id: "mid_jet", name: "Mid-Size Jet", example: "Hawker 800, Citation X" },
  { id: "super_mid", name: "Super Mid", example: "Citation Sovereign" },
  { id: "heavy_jet", name: "Heavy Jet", example: "Gulfstream G650" },
  { id: "ultra_long", name: "Ultra Long Range", example: "Global 7500" },
];

const services = [
  { id: "express_wash", name: "Express Wash" },
  { id: "exterior_detail", name: "Exterior Detail" },
  { id: "interior_detail", name: "Interior Detail" },
  { id: "full_detail", name: "Full Detail" },
  { id: "polish", name: "Polish & Wax" },
];

const addOns = [
  { id: "engine_clean", name: "Engine Cleaning" },
  { id: "wheel_detail", name: "Wheel Well Detail" },
  { id: "leather_treatment", name: "Leather Treatment" },
  { id: "carpet_shampoo", name: "Carpet Shampoo" },
  { id: "deice_treatment", name: "De-Ice Treatment" },
];

export default function PricingPage() {
  // Mock pricing matrix (aircraft x service)
  const [pricingMatrix, setPricingMatrix] = useState({
    light_jet: {
      express_wash: 450,
      exterior_detail: 850,
      interior_detail: 950,
      full_detail: 1600,
      polish: 600,
    },
    mid_jet: {
      express_wash: 650,
      exterior_detail: 1200,
      interior_detail: 1300,
      full_detail: 2200,
      polish: 850,
    },
    super_mid: {
      express_wash: 800,
      exterior_detail: 1450,
      interior_detail: 1550,
      full_detail: 2650,
      polish: 1000,
    },
    heavy_jet: {
      express_wash: 950,
      exterior_detail: 1750,
      interior_detail: 1850,
      full_detail: 3200,
      polish: 1200,
    },
    ultra_long: {
      express_wash: 1100,
      exterior_detail: 2000,
      interior_detail: 2100,
      full_detail: 3800,
      polish: 1400,
    },
  });

  const [addOnPricing, setAddOnPricing] = useState({
    engine_clean: 350,
    wheel_detail: 200,
    leather_treatment: 250,
    carpet_shampoo: 300,
    deice_treatment: 150,
  });

  const [travelConfig, setTravelConfig] = useState({
    perMileRate: 2.5,
    minimumFee: 50,
    maxRadius: 100,
  });

  const [rushMultiplier, setRushMultiplier] = useState(1.5);
  const [depositPercentage, setDepositPercentage] = useState(50);

  const handleMatrixChange = (
    aircraftClass: string,
    service: string,
    value: string
  ) => {
    setPricingMatrix((prev) => ({
      ...prev,
      [aircraftClass]: {
        ...prev[aircraftClass as keyof typeof prev],
        [service]: parseFloat(value) || 0,
      },
    }));
  };

  const handleAddOnChange = (addOnId: string, value: string) => {
    setAddOnPricing((prev) => ({
      ...prev,
      [addOnId]: parseFloat(value) || 0,
    }));
  };

  const handleSave = () => {
    // TODO: Save to API
    alert("Pricing configuration saved!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pricing Admin</h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure pricing for all services and aircraft classes
          </p>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      {/* Base Pricing Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Base Service Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 text-left text-sm font-semibold text-slate-700">
                    Aircraft Class
                  </th>
                  {services.map((service) => (
                    <th
                      key={service.id}
                      className="pb-3 text-center text-sm font-semibold text-slate-700"
                    >
                      {service.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {aircraftClasses.map((aircraftClass, rowIndex) => (
                  <tr
                    key={aircraftClass.id}
                    className={`border-b border-slate-100 ${
                      rowIndex % 2 === 0 ? "bg-slate-50" : "bg-white"
                    }`}
                  >
                    <td className="py-3">
                      <div className="font-medium text-slate-900">
                        {aircraftClass.name}
                      </div>
                      <div className="text-xs text-slate-500">
                        {aircraftClass.example}
                      </div>
                    </td>
                    {services.map((service) => (
                      <td key={service.id} className="px-2 py-3 text-center">
                        <div className="flex items-center justify-center">
                          <span className="text-slate-600">$</span>
                          <Input
                            type="number"
                            className="ml-1 w-24 text-center"
                            value={
                              pricingMatrix[
                                aircraftClass.id as keyof typeof pricingMatrix
                              ][service.id as keyof (typeof pricingMatrix)["light_jet"]]
                            }
                            onChange={(e) =>
                              handleMatrixChange(
                                aircraftClass.id,
                                service.id,
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add-On Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Add-On Services</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {addOns.map((addOn) => (
              <div key={addOn.id} className="space-y-2">
                <Label htmlFor={addOn.id}>{addOn.name}</Label>
                <div className="flex items-center">
                  <span className="mr-2 text-slate-600">$</span>
                  <Input
                    id={addOn.id}
                    type="number"
                    className="flex-1"
                    value={addOnPricing[addOn.id as keyof typeof addOnPricing]}
                    onChange={(e) =>
                      handleAddOnChange(addOn.id, e.target.value)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Travel Fee Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Travel Fee Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="perMileRate">Per Mile Rate</Label>
              <div className="flex items-center">
                <span className="mr-2 text-slate-600">$</span>
                <Input
                  id="perMileRate"
                  type="number"
                  step="0.1"
                  value={travelConfig.perMileRate}
                  onChange={(e) =>
                    setTravelConfig((prev) => ({
                      ...prev,
                      perMileRate: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimumFee">Minimum Fee</Label>
              <div className="flex items-center">
                <span className="mr-2 text-slate-600">$</span>
                <Input
                  id="minimumFee"
                  type="number"
                  value={travelConfig.minimumFee}
                  onChange={(e) =>
                    setTravelConfig((prev) => ({
                      ...prev,
                      minimumFee: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxRadius">Max Service Radius (miles)</Label>
              <Input
                id="maxRadius"
                type="number"
                value={travelConfig.maxRadius}
                onChange={(e) =>
                  setTravelConfig((prev) => ({
                    ...prev,
                    maxRadius: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rush & Deposit Settings */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Rush Service Multiplier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="rushMultiplier">
                Multiplier (e.g., 1.5 = 50% surcharge)
              </Label>
              <Input
                id="rushMultiplier"
                type="number"
                step="0.1"
                value={rushMultiplier}
                onChange={(e) =>
                  setRushMultiplier(parseFloat(e.target.value) || 1)
                }
              />
              <p className="text-xs text-slate-500">
                Applied to base service price for rush bookings
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deposit Requirement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="depositPercentage">Deposit Percentage</Label>
              <div className="flex items-center">
                <Input
                  id="depositPercentage"
                  type="number"
                  className="flex-1"
                  value={depositPercentage}
                  onChange={(e) =>
                    setDepositPercentage(parseFloat(e.target.value) || 0)
                  }
                />
                <span className="ml-2 text-slate-600">%</span>
              </div>
              <p className="text-xs text-slate-500">
                Required upfront when booking is created
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button (bottom) */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          <Save className="mr-2 h-4 w-4" />
          Save All Changes
        </Button>
      </div>
    </div>
  );
}
