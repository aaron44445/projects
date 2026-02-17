"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plane,
  MapPin,
  Navigation,
  Phone,
  Mail,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Flag,
  Tag,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Mock data modeled after the Prisma schema
// ---------------------------------------------------------------------------

interface ChecklistItem {
  id: string;
  text: string;
  required: boolean;
  completed: boolean;
  completedAt: string | null;
  sortOrder: number;
}

interface JobDetail {
  id: string;
  status: "confirmed" | "in_progress" | "completed";
  scheduledAt: string;
  durationMinutes: number;
  tailNumber: string;
  customerNotes: string | null;
  techNotes: string | null;
  aircraftClass: {
    name: string;
    displayName: string;
    icon: string | null;
  };
  service: {
    name: string;
    type: string;
  };
  addOns: { id: string; name: string; price: number }[];
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  location: {
    airport: {
      icaoCode: string;
      name: string;
      city: string;
      state: string;
      latitude: number;
      longitude: number;
    };
    locationType: string;
    locationNotes: string | null;
  };
  checklistItems: ChecklistItem[];
}

const MOCK_JOB: JobDetail = {
  id: "clx8f2k3900001",
  status: "in_progress",
  scheduledAt: "2026-02-17T14:00:00Z",
  durationMinutes: 180,
  tailNumber: "N747SP",
  customerNotes: "Aircraft is in Hangar 4B, east side. Gate code: 4521.",
  techNotes: "",
  aircraftClass: {
    name: "heavy_jet",
    displayName: "Heavy Jet",
    icon: null,
  },
  service: {
    name: "Full Detail",
    type: "full_detail",
  },
  addOns: [
    { id: "a1", name: "Engine Rinse", price: 350 },
    { id: "a2", name: "Leather Conditioning", price: 275 },
    { id: "a3", name: "Brightwork Polish", price: 200 },
  ],
  customer: {
    name: "Meridian Aviation Group",
    phone: "(310) 555-0182",
    email: "ops@meridianaviation.com",
  },
  location: {
    airport: {
      icaoCode: "KVNY",
      name: "Van Nuys Airport",
      city: "Van Nuys",
      state: "CA",
      latitude: 34.2098,
      longitude: -118.4898,
    },
    locationType: "hangar",
    locationNotes: "Hangar 4B, east side. Use employee entrance on Waterman Dr.",
  },
  checklistItems: [
    {
      id: "cl1",
      text: "Pre-inspect aircraft exterior for existing damage",
      required: true,
      completed: true,
      completedAt: "2026-02-17T14:12:00Z",
      sortOrder: 1,
    },
    {
      id: "cl2",
      text: "Photo-document pre-service condition (min 8 photos)",
      required: true,
      completed: true,
      completedAt: "2026-02-17T14:18:00Z",
      sortOrder: 2,
    },
    {
      id: "cl3",
      text: "Rinse exterior with deionized water",
      required: true,
      completed: true,
      completedAt: "2026-02-17T14:35:00Z",
      sortOrder: 3,
    },
    {
      id: "cl4",
      text: "Apply soap with foam cannon - nose to tail",
      required: true,
      completed: false,
      completedAt: null,
      sortOrder: 4,
    },
    {
      id: "cl5",
      text: "Clean landing gear and wheel wells",
      required: true,
      completed: false,
      completedAt: null,
      sortOrder: 5,
    },
    {
      id: "cl6",
      text: "Vacuum and shampoo interior carpets",
      required: true,
      completed: false,
      completedAt: null,
      sortOrder: 6,
    },
    {
      id: "cl7",
      text: "Clean and condition all leather surfaces",
      required: true,
      completed: false,
      completedAt: null,
      sortOrder: 7,
    },
    {
      id: "cl8",
      text: "Clean lavatory and galley",
      required: true,
      completed: false,
      completedAt: null,
      sortOrder: 8,
    },
    {
      id: "cl9",
      text: "Polish brightwork and chrome accents",
      required: false,
      completed: false,
      completedAt: null,
      sortOrder: 9,
    },
    {
      id: "cl10",
      text: "Apply exterior sealant / wax coat",
      required: false,
      completed: false,
      completedAt: null,
      sortOrder: 10,
    },
    {
      id: "cl11",
      text: "Final walk-around inspection",
      required: true,
      completed: false,
      completedAt: null,
      sortOrder: 11,
    },
    {
      id: "cl12",
      text: "Photo-document post-service condition",
      required: true,
      completed: false,
      completedAt: null,
      sortOrder: 12,
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function statusLabel(s: JobDetail["status"]) {
  const map: Record<JobDetail["status"], string> = {
    confirmed: "Confirmed",
    in_progress: "In Progress",
    completed: "Completed",
  };
  return map[s];
}

function statusColor(s: JobDetail["status"]) {
  const map: Record<JobDetail["status"], string> = {
    confirmed: "bg-blue-50 text-blue-700 border-blue-200",
    in_progress: "bg-amber-50 text-amber-700 border-amber-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return map[s];
}

// Aircraft icon selection based on class name
function aircraftIcon(className: string) {
  // We use Plane from lucide; in production you could swap per class
  return <Plane className="size-6" />;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  // In production this would come from an API call using jobId
  const [job, setJob] = useState<JobDetail>(MOCK_JOB);
  const [techNotes, setTechNotes] = useState(job.techNotes ?? "");
  const [confirmDialog, setConfirmDialog] = useState<
    "start" | "complete" | "issue" | null
  >(null);
  const [saving, setSaving] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Checklist toggle ----
  const toggleChecklist = useCallback(
    async (itemId: string) => {
      setJob((prev) => ({
        ...prev,
        checklistItems: prev.checklistItems.map((item) =>
          item.id === itemId
            ? {
                ...item,
                completed: !item.completed,
                completedAt: !item.completed
                  ? new Date().toISOString()
                  : null,
              }
            : item
        ),
      }));

      // API call placeholder
      try {
        await fetch(`/api/bookings/${jobId}/checklist/${itemId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: true }),
        });
      } catch {
        // Silently fail for now — mock mode
      }
    },
    [jobId]
  );

  // ---- Notes auto-save (debounced on blur) ----
  const saveNotes = useCallback(async () => {
    setSaving(true);
    try {
      await fetch(`/api/bookings/${jobId}/notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ techNotes }),
      });
    } catch {
      // Silently fail for now — mock mode
    } finally {
      setSaving(false);
    }
  }, [jobId, techNotes]);

  const handleNotesBlur = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(saveNotes, 400);
  }, [saveNotes]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // ---- Status transitions ----
  const handleStatusChange = useCallback(
    async (action: "start" | "complete") => {
      const newStatus = action === "start" ? "in_progress" : "completed";
      setJob((prev) => ({ ...prev, status: newStatus as JobDetail["status"] }));
      setConfirmDialog(null);

      try {
        await fetch(`/api/bookings/${jobId}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
      } catch {
        // Silently fail for now
      }
    },
    [jobId]
  );

  // ---- Derived values ----
  const completedCount = job.checklistItems.filter((i) => i.completed).length;
  const totalCount = job.checklistItems.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const requiredRemaining = job.checklistItems.filter(
    (i) => i.required && !i.completed
  ).length;

  return (
    <div className="min-h-screen bg-gray-50/60">
      {/* ============================================================= */}
      {/* Top Bar                                                       */}
      {/* ============================================================= */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Jobs</span>
          </button>

          <Badge
            variant="outline"
            className={`${statusColor(job.status)} text-xs font-semibold px-2.5 py-0.5`}
          >
            {statusLabel(job.status)}
          </Badge>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pb-36 pt-4 space-y-4">
        {/* ============================================================= */}
        {/* 1. Aircraft Info Card                                         */}
        {/* ============================================================= */}
        <Card className="border-0 shadow-md overflow-hidden">
          {/* Accent strip */}
          <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-sky-400" />

          <CardContent className="pt-5 pb-4 space-y-4">
            {/* Aircraft class + tail */}
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                {aircraftIcon(job.aircraftClass.name)}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold text-gray-900 leading-tight">
                  {job.aircraftClass.displayName}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5 font-mono tracking-wide">
                  {job.tailNumber}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                  {formatDate(job.scheduledAt)}
                </p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {formatTime(job.scheduledAt)}
                </p>
              </div>
            </div>

            <Separator className="bg-gray-100" />

            {/* Service + duration */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {job.service.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Clock className="size-3.5" />
                <span className="font-medium">{formatDuration(job.durationMinutes)}</span>
              </div>
            </div>

            {/* Add-ons */}
            {job.addOns.length > 0 && (
              <div className="flex items-start gap-2">
                <Tag className="size-3.5 text-gray-400 mt-0.5 shrink-0" />
                <div className="flex flex-wrap gap-1.5">
                  {job.addOns.map((addon) => (
                    <span
                      key={addon.id}
                      className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
                    >
                      {addon.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ============================================================= */}
        {/* 2. Location Section                                           */}
        {/* ============================================================= */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">
              <MapPin className="size-3.5" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-bold text-gray-900 tracking-tight">
                  {job.location.airport.icaoCode}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {job.location.airport.name}
                </p>
                <p className="text-xs text-gray-400">
                  {job.location.airport.city}, {job.location.airport.state}
                </p>
              </div>
              <Badge
                variant="outline"
                className={`shrink-0 text-xs font-medium capitalize ${
                  job.location.locationType === "hangar"
                    ? "bg-violet-50 text-violet-700 border-violet-200"
                    : "bg-orange-50 text-orange-700 border-orange-200"
                }`}
              >
                {job.location.locationType}
              </Badge>
            </div>

            {job.location.locationNotes && (
              <div className="rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-600 leading-relaxed">
                {job.location.locationNotes}
              </div>
            )}

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() =>
                window.open(
                  `https://www.google.com/maps/search/?api=1&query=${job.location.airport.latitude},${job.location.airport.longitude}`,
                  "_blank"
                )
              }
            >
              <Navigation className="size-4" />
              Navigate to Airport
            </Button>
          </CardContent>
        </Card>

        {/* ============================================================= */}
        {/* 3. Customer Contact                                           */}
        {/* ============================================================= */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">
              <User className="size-3.5" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-base font-semibold text-gray-900">
              {job.customer.name}
            </p>

            <div className="flex gap-2">
              <a
                href={`tel:${job.customer.phone.replace(/\D/g, "")}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
              >
                <Phone className="size-4 text-blue-500" />
                Call
              </a>
              <a
                href={`mailto:${job.customer.email}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100"
              >
                <Mail className="size-4 text-blue-500" />
                Email
              </a>
            </div>

            {job.customerNotes && (
              <div className="rounded-lg bg-amber-50/60 border border-amber-100 px-3 py-2.5 text-sm text-amber-800 leading-relaxed">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
                  Customer Note
                </p>
                {job.customerNotes}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ============================================================= */}
        {/* 4. Checklist Section                                          */}
        {/* ============================================================= */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Checklist
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">
                  {completedCount}/{totalCount}
                </span>
                {requiredRemaining > 0 && (
                  <span className="text-xs text-red-500 font-medium">
                    {requiredRemaining} req&apos;d left
                  </span>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </CardHeader>

          <CardContent className="space-y-1 -mt-1">
            {job.checklistItems
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((item) => (
                <label
                  key={item.id}
                  className={`flex items-start gap-3 rounded-lg px-3 py-3 cursor-pointer transition-colors ${
                    item.completed
                      ? "bg-emerald-50/50"
                      : "hover:bg-gray-50 active:bg-gray-100"
                  }`}
                >
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => toggleChecklist(item.id)}
                    className={`mt-0.5 ${
                      item.completed
                        ? "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                        : ""
                    }`}
                  />
                  <span
                    className={`text-sm leading-relaxed flex-1 ${
                      item.completed
                        ? "line-through text-gray-400"
                        : "text-gray-800"
                    }`}
                  >
                    {item.text}
                  </span>
                  {item.required && !item.completed && (
                    <span className="mt-1.5 size-2 shrink-0 rounded-full bg-red-400" />
                  )}
                  {item.completed && (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  )}
                </label>
              ))}
          </CardContent>
        </Card>

        {/* ============================================================= */}
        {/* 5. Notes Section                                              */}
        {/* ============================================================= */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                Tech Notes
              </CardTitle>
              {saving && (
                <span className="text-xs text-blue-500 font-medium animate-pulse">
                  Saving...
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={techNotes}
              onChange={(e) => setTechNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Add notes about the job, findings, or issues..."
              className="min-h-24 resize-none text-sm bg-gray-50/50 border-gray-200 focus:bg-white"
              rows={4}
            />
          </CardContent>
        </Card>
      </div>

      {/* ============================================================= */}
      {/* 6. Status Action Buttons (sticky bottom)                       */}
      {/* ============================================================= */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-white/90 backdrop-blur-md border-t border-gray-100">
        <div className="mx-auto max-w-lg px-4 py-3 space-y-2">
          {job.status === "confirmed" && (
            <Button
              size="lg"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base h-12 gap-2 shadow-lg shadow-emerald-200"
              onClick={() => setConfirmDialog("start")}
            >
              <Play className="size-5" />
              Start Job
            </Button>
          )}

          {job.status === "in_progress" && (
            <Button
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base h-12 gap-2 shadow-lg shadow-blue-200"
              onClick={() => setConfirmDialog("complete")}
            >
              <Flag className="size-5" />
              Complete Job
            </Button>
          )}

          {job.status !== "completed" && (
            <Button
              variant="outline"
              size="lg"
              className="w-full h-11 gap-2 text-amber-700 border-amber-200 hover:bg-amber-50 font-medium"
              onClick={() => setConfirmDialog("issue")}
            >
              <AlertTriangle className="size-4" />
              Report Issue
            </Button>
          )}
        </div>
      </div>

      {/* ============================================================= */}
      {/* Confirmation Dialogs                                           */}
      {/* ============================================================= */}

      {/* Start Job */}
      <Dialog
        open={confirmDialog === "start"}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start this job?</DialogTitle>
            <DialogDescription>
              This will mark the job as &quot;In Progress&quot; and notify the
              customer that service has begun on {job.tailNumber}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => handleStatusChange("start")}
            >
              Start Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Job */}
      <Dialog
        open={confirmDialog === "complete"}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete this job?</DialogTitle>
            <DialogDescription>
              {requiredRemaining > 0 ? (
                <span className="text-amber-600">
                  Warning: {requiredRemaining} required checklist item
                  {requiredRemaining !== 1 ? "s" : ""} still incomplete. You
                  can still complete the job, but all required items should
                  ideally be checked off.
                </span>
              ) : (
                <>
                  All required checklist items are done. This will mark the job
                  as complete and notify the customer.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => handleStatusChange("complete")}
            >
              Complete Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Issue */}
      <Dialog
        open={confirmDialog === "issue"}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report an issue</DialogTitle>
            <DialogDescription>
              Describe the issue below. Your dispatcher will be notified.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="What happened? (e.g. damage found, access blocked, weather delay...)"
            className="min-h-24 text-sm"
            rows={4}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => setConfirmDialog(null)}
            >
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
