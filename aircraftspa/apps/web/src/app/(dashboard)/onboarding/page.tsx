"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2,
  MapPin,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Search,
  Plane,
  Shield,
  Sparkles,
  ArrowRight,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = 1 | 2 | 3 | 4;

interface StepConfig {
  number: Step;
  title: string;
  description: string;
  icon: React.ElementType;
}

const STEPS: StepConfig[] = [
  { number: 1, title: "Business Info", description: "Tell us about your company", icon: Building2 },
  { number: 2, title: "Home Base", description: "Set your service area", icon: MapPin },
  { number: 3, title: "Payments", description: "Connect Stripe", icon: CreditCard },
  { number: 4, title: "Complete", description: "You're all set", icon: CheckCircle2 },
];

// Mock airports for the search combobox
const MOCK_AIRPORTS = [
  { id: "apt_lax", code: "LAX", name: "Los Angeles International", city: "Los Angeles", state: "CA" },
  { id: "apt_jfk", code: "JFK", name: "John F. Kennedy International", city: "New York", state: "NY" },
  { id: "apt_sfo", code: "SFO", name: "San Francisco International", city: "San Francisco", state: "CA" },
  { id: "apt_ord", code: "ORD", name: "O'Hare International", city: "Chicago", state: "IL" },
  { id: "apt_mia", code: "MIA", name: "Miami International", city: "Miami", state: "FL" },
  { id: "apt_dfw", code: "DFW", name: "Dallas/Fort Worth International", city: "Dallas", state: "TX" },
  { id: "apt_den", code: "DEN", name: "Denver International", city: "Denver", state: "CO" },
  { id: "apt_sea", code: "SEA", name: "Seattle-Tacoma International", city: "Seattle", state: "WA" },
  { id: "apt_las", code: "LAS", name: "Harry Reid International", city: "Las Vegas", state: "NV" },
  { id: "apt_atl", code: "ATL", name: "Hartsfield-Jackson Atlanta", city: "Atlanta", state: "GA" },
  { id: "apt_teb", code: "TEB", name: "Teterboro Airport", city: "Teterboro", state: "NJ" },
  { id: "apt_vny", code: "VNY", name: "Van Nuys Airport", city: "Van Nuys", state: "CA" },
  { id: "apt_sdl", code: "SDL", name: "Scottsdale Airport", city: "Scottsdale", state: "AZ" },
  { id: "apt_opa", code: "OPA", name: "Opa-locka Executive", city: "Opa-locka", state: "FL" },
];

// ---------------------------------------------------------------------------
// Progress Stepper Component
// ---------------------------------------------------------------------------

function ProgressStepper({ currentStep }: { currentStep: Step }) {
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = currentStep > step.number;
          const isCurrent = currentStep === step.number;
          const isUpcoming = currentStep < step.number;

          return (
            <div key={step.number} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300
                    ${isCompleted
                      ? "border-blue-600 bg-blue-600 text-white"
                      : isCurrent
                        ? "border-blue-600 bg-blue-50 text-blue-600 shadow-md shadow-blue-100"
                        : "border-slate-200 bg-white text-slate-400"
                    }
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={`text-xs font-semibold ${
                      isCurrent ? "text-blue-600" : isCompleted ? "text-slate-700" : "text-slate-400"
                    }`}
                  >
                    {step.title}
                  </p>
                  <p className="hidden text-[10px] text-slate-400 sm:block">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div className="mx-3 mt-[-24px] h-0.5 flex-1">
                  <div
                    className={`h-full rounded transition-all duration-500 ${
                      isCompleted ? "bg-blue-600" : "bg-slate-200"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Business Information
// ---------------------------------------------------------------------------

function BusinessInfoStep({
  data,
  onChange,
}: {
  data: {
    businessName: string;
    subdomain: string;
    email: string;
    phone: string;
    ownerName: string;
  };
  onChange: (field: string, value: string) => void;
}) {
  const [subdomainStatus, setSubdomainStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  // Simulated subdomain availability check
  useEffect(() => {
    if (data.subdomain.length < 3) {
      setSubdomainStatus("idle");
      return;
    }

    setSubdomainStatus("checking");
    const timer = setTimeout(() => {
      // Simulate: "demo" and "test" are taken, everything else available
      const taken = ["demo", "test", "admin", "www"];
      setSubdomainStatus(taken.includes(data.subdomain) ? "taken" : "available");
    }, 600);

    return () => clearTimeout(timer);
  }, [data.subdomain]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Tell us about your business</h2>
        <p className="mt-1 text-slate-500">
          This information will be used to set up your AircraftSpa account and public booking page.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="ownerName">Your Name</Label>
          <Input
            id="ownerName"
            placeholder="John Smith"
            value={data.ownerName}
            onChange={(e) => onChange("ownerName", e.target.value)}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="businessName">Business Name</Label>
          <Input
            id="businessName"
            placeholder="Elite Aviation Detailing"
            value={data.businessName}
            onChange={(e) => onChange("businessName", e.target.value)}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="subdomain">Your Booking URL</Label>
          <div className="flex items-center">
            <Input
              id="subdomain"
              placeholder="your-company"
              value={data.subdomain}
              onChange={(e) => {
                const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                onChange("subdomain", val);
              }}
              className="rounded-r-none"
            />
            <span className="inline-flex h-9 items-center rounded-r-md border border-l-0 border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
              .aircraftspa.com
            </span>
          </div>
          {/* Subdomain status indicator */}
          <div className="flex items-center gap-1.5 text-xs">
            {subdomainStatus === "checking" && (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                <span className="text-slate-400">Checking availability...</span>
              </>
            )}
            {subdomainStatus === "available" && (
              <>
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span className="text-green-600">
                  {data.subdomain}.aircraftspa.com is available
                </span>
              </>
            )}
            {subdomainStatus === "taken" && (
              <>
                <span className="inline-block h-3 w-3 rounded-full bg-red-400" />
                <span className="text-red-600">This subdomain is already taken</span>
              </>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Business Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="contact@yourcompany.com"
            value={data.email}
            onChange={(e) => onChange("email", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number (optional)</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={data.phone}
            onChange={(e) => onChange("phone", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Home Base / Service Area
// ---------------------------------------------------------------------------

function HomeBaseStep({
  selectedAirport,
  onSelectAirport,
  serviceRadius,
  onRadiusChange,
}: {
  selectedAirport: (typeof MOCK_AIRPORTS)[number] | null;
  onSelectAirport: (airport: (typeof MOCK_AIRPORTS)[number] | null) => void;
  serviceRadius: number;
  onRadiusChange: (radius: number) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const filteredAirports = MOCK_AIRPORTS.filter((apt) => {
    const query = searchQuery.toLowerCase();
    return (
      apt.code.toLowerCase().includes(query) ||
      apt.name.toLowerCase().includes(query) ||
      apt.city.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Set your home base</h2>
        <p className="mt-1 text-slate-500">
          Choose your primary airport and how far you are willing to travel for jobs. Travel fees will be calculated automatically for airports outside your area.
        </p>
      </div>

      {/* Airport search */}
      <div className="space-y-2">
        <Label>Home Airport</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by airport code, name, or city..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            className="pl-9"
          />
          {isSearchOpen && searchQuery.length > 0 && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
              {filteredAirports.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-500">No airports found</div>
              ) : (
                filteredAirports.map((apt) => (
                  <button
                    key={apt.id}
                    onClick={() => {
                      onSelectAirport(apt);
                      setSearchQuery(`${apt.code} - ${apt.name}`);
                      setIsSearchOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                      <Plane className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {apt.code} <span className="font-normal text-slate-500">-</span> {apt.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {apt.city}, {apt.state}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        {selectedAirport && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
            <Plane className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              {selectedAirport.code} - {selectedAirport.name}
            </span>
            <button
              onClick={() => {
                onSelectAirport(null);
                setSearchQuery("");
              }}
              className="ml-auto text-xs text-blue-600 underline"
            >
              Change
            </button>
          </div>
        )}
      </div>

      {/* Service radius slider */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Service Radius</Label>
          <span className="text-sm font-semibold text-blue-600">{serviceRadius} miles</span>
        </div>
        <input
          type="range"
          min={25}
          max={250}
          step={25}
          value={serviceRadius}
          onChange={(e) => onRadiusChange(parseInt(e.target.value))}
          className="w-full accent-blue-600"
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>25 mi</span>
          <span>100 mi</span>
          <span>175 mi</span>
          <span>250 mi</span>
        </div>
      </div>

      {/* Map placeholder */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        <div className="flex h-64 flex-col items-center justify-center">
          <div
            className="absolute rounded-full border-2 border-dashed border-blue-300 bg-blue-50/40"
            style={{
              width: `${Math.min(serviceRadius * 1.2, 240)}px`,
              height: `${Math.min(serviceRadius * 1.2, 240)}px`,
            }}
          />
          {selectedAirport ? (
            <>
              <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
                <MapPin className="h-5 w-5" />
              </div>
              <p className="relative z-10 mt-3 text-sm font-medium text-slate-700">
                {selectedAirport.code} - {serviceRadius} mile radius
              </p>
              <p className="relative z-10 text-xs text-slate-500">
                Travel fees apply beyond this radius
              </p>
            </>
          ) : (
            <>
              <MapPin className="h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm text-slate-400">Select an airport to see your service area</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Stripe Connect
// ---------------------------------------------------------------------------

function StripeConnectStep({
  stripeStatus,
  onConnect,
}: {
  stripeStatus: "idle" | "connecting" | "connected";
  onConnect: () => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Set up payments</h2>
        <p className="mt-1 text-slate-500">
          Connect your Stripe account to accept deposits and payments from customers. Funds are deposited directly to your bank account.
        </p>
      </div>

      <Card className="border-slate-200">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            {/* Stripe logo placeholder */}
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
              <CreditCard className="h-8 w-8" />
            </div>

            <h3 className="text-lg font-semibold text-slate-900">Stripe Connect</h3>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              We use Stripe to process payments securely. You will be redirected to Stripe to complete setup. This usually takes about 5 minutes.
            </p>

            {/* Benefits */}
            <div className="mt-8 grid w-full gap-4 md:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-4">
                <Shield className="mx-auto h-6 w-6 text-blue-600" />
                <p className="mt-2 text-sm font-medium text-slate-700">Secure Payments</p>
                <p className="mt-1 text-xs text-slate-500">PCI-compliant card processing</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <Sparkles className="mx-auto h-6 w-6 text-blue-600" />
                <p className="mt-2 text-sm font-medium text-slate-700">Automatic Deposits</p>
                <p className="mt-1 text-xs text-slate-500">Direct to your bank account</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <CreditCard className="mx-auto h-6 w-6 text-blue-600" />
                <p className="mt-2 text-sm font-medium text-slate-700">Accept All Cards</p>
                <p className="mt-1 text-xs text-slate-500">Visa, Mastercard, Amex, and more</p>
              </div>
            </div>

            {/* Connect button */}
            <div className="mt-8 w-full">
              {stripeStatus === "idle" && (
                <Button
                  size="lg"
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  onClick={onConnect}
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  Connect with Stripe
                </Button>
              )}
              {stripeStatus === "connecting" && (
                <Button size="lg" className="w-full" disabled>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connecting to Stripe...
                </Button>
              )}
              {stripeStatus === "connected" && (
                <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Stripe Connected Successfully</span>
                  </div>
                  <p className="mt-1 text-xs text-green-600">
                    You can start accepting payments immediately
                  </p>
                </div>
              )}
            </div>

            {/* Skip option */}
            <p className="mt-4 text-xs text-slate-400">
              You can also set up Stripe later from your Settings page.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Complete
// ---------------------------------------------------------------------------

function CompleteStep({ businessName }: { businessName: string }) {
  const [showItems, setShowItems] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowItems(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const setupItems = [
    { label: "Services created", value: "3", detail: "Interior, Exterior, Full Detail" },
    { label: "Add-ons configured", value: "6", detail: "Carpet Shampoo, Leather, Brightwork, and more" },
    { label: "Pricing rules", value: "15+", detail: "Per aircraft class and service type" },
    { label: "Checklist templates", value: "3", detail: "Ready for your crew to use" },
  ];

  return (
    <div className="space-y-8">
      {/* Success animation area */}
      <div className="flex flex-col items-center text-center">
        <div
          className={`mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 transition-all duration-700 ${
            showItems ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        >
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>

        <h2
          className={`text-3xl font-bold text-slate-900 transition-all duration-500 delay-200 ${
            showItems ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          Your business is ready!
        </h2>

        <p
          className={`mt-2 text-slate-500 transition-all duration-500 delay-300 ${
            showItems ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          {businessName || "Your company"} is all set up on AircraftSpa.
          Here is what we created for you:
        </p>
      </div>

      {/* What was created */}
      <div
        className={`grid gap-3 transition-all duration-500 delay-500 ${
          showItems ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        {setupItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">{item.label}</p>
              <p className="text-xs text-slate-500">{item.detail}</p>
            </div>
            <span className="text-lg font-bold text-blue-600">{item.value}</span>
          </div>
        ))}
      </div>

      {/* Next steps */}
      <Card
        className={`border-blue-200 bg-blue-50 transition-all duration-500 delay-700 ${
          showItems ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900">Recommended next steps</h3>
          <ul className="mt-3 space-y-2 text-sm text-blue-800">
            <li className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3" />
              Review and customize your default services and pricing
            </li>
            <li className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3" />
              Add your crew members so they can receive job assignments
            </li>
            <li className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3" />
              Share your booking page link with customers
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Onboarding Page
// ---------------------------------------------------------------------------

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 data
  const [businessInfo, setBusinessInfo] = useState({
    businessName: "",
    subdomain: "",
    email: "",
    phone: "",
    ownerName: "",
  });

  // Step 2 data
  const [selectedAirport, setSelectedAirport] = useState<(typeof MOCK_AIRPORTS)[number] | null>(null);
  const [serviceRadius, setServiceRadius] = useState(100);

  // Step 3 data
  const [stripeStatus, setStripeStatus] = useState<"idle" | "connecting" | "connected">("idle");

  const handleBusinessInfoChange = useCallback((field: string, value: string) => {
    setBusinessInfo((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleStripeConnect = useCallback(() => {
    setStripeStatus("connecting");
    // Simulate Stripe connection delay
    setTimeout(() => setStripeStatus("connected"), 2000);
  }, []);

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return (
          businessInfo.businessName.length >= 2 &&
          businessInfo.subdomain.length >= 3 &&
          businessInfo.email.includes("@") &&
          businessInfo.ownerName.length >= 2
        );
      case 2:
        return true; // Airport is optional
      case 3:
        return true; // Stripe can be skipped
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (currentStep === 4) {
      router.push("/dashboard");
      return;
    }

    if (currentStep === 3) {
      // Simulate setting up default business data
      setIsSubmitting(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSubmitting(false);
    }

    setCurrentStep((prev) => Math.min(prev + 1, 4) as Step);
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1) as Step);
  };

  return (
    <div className="mx-auto max-w-3xl py-4">
      {/* Page header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
          <Plane className="h-4 w-4" />
          AircraftSpa Setup
        </div>
      </div>

      {/* Progress Stepper */}
      <ProgressStepper currentStep={currentStep} />

      {/* Step Content */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-8">
          {currentStep === 1 && (
            <BusinessInfoStep data={businessInfo} onChange={handleBusinessInfoChange} />
          )}
          {currentStep === 2 && (
            <HomeBaseStep
              selectedAirport={selectedAirport}
              onSelectAirport={setSelectedAirport}
              serviceRadius={serviceRadius}
              onRadiusChange={setServiceRadius}
            />
          )}
          {currentStep === 3 && (
            <StripeConnectStep stripeStatus={stripeStatus} onConnect={handleStripeConnect} />
          )}
          {currentStep === 4 && (
            <CompleteStep businessName={businessInfo.businessName} />
          )}

          {/* Navigation */}
          <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
            <div>
              {currentStep > 1 && currentStep < 4 && (
                <Button variant="ghost" onClick={handleBack}>
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {currentStep === 3 && stripeStatus === "idle" && (
                <Button variant="ghost" onClick={handleNext}>
                  Skip for now
                </Button>
              )}

              <Button
                onClick={handleNext}
                disabled={!canProceed() || isSubmitting}
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : currentStep === 4 ? (
                  <>
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
