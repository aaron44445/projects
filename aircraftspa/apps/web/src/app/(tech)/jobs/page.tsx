"use client";

import { useRouter } from "next/navigation";
import { RefreshCw, Clock, MapPin, Plane, ChevronRight } from "lucide-react";
import { useState } from "react";

interface MockJob {
  id: string;
  scheduledAt: string;
  status: "confirmed" | "in_progress";
  customer: { name: string; phone: string };
  aircraftClass: { displayName: string; icon: string };
  service: { name: string };
  location: {
    airport: { icaoCode: string; name: string };
    hangarNumber?: string;
  };
  checklistItems: { id: string; completed: boolean }[];
}

const MOCK_JOBS: MockJob[] = [
  {
    id: "job_01",
    scheduledAt: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
    status: "in_progress",
    customer: { name: "SkyWest Aviation", phone: "(480) 555-0132" },
    aircraftClass: { displayName: "Light Jet", icon: "light-jet" },
    service: { name: "Full Detail" },
    location: {
      airport: { icaoCode: "KSDL", name: "Scottsdale Airport" },
      hangarNumber: "H-14",
    },
    checklistItems: [
      { id: "cl1", completed: true },
      { id: "cl2", completed: true },
      { id: "cl3", completed: false },
      { id: "cl4", completed: false },
      { id: "cl5", completed: false },
    ],
  },
  {
    id: "job_02",
    scheduledAt: new Date(new Date().setHours(10, 30, 0, 0)).toISOString(),
    status: "confirmed",
    customer: { name: "NetJets", phone: "(602) 555-0187" },
    aircraftClass: { displayName: "Midsize Jet", icon: "midsize-jet" },
    service: { name: "Interior Clean" },
    location: {
      airport: { icaoCode: "KPHX", name: "Phoenix Sky Harbor" },
      hangarNumber: "FBO-3",
    },
    checklistItems: [
      { id: "cl6", completed: false },
      { id: "cl7", completed: false },
      { id: "cl8", completed: false },
    ],
  },
  {
    id: "job_03",
    scheduledAt: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(),
    status: "confirmed",
    customer: { name: "Flexjet LLC", phone: "(480) 555-0214" },
    aircraftClass: { displayName: "Heavy Jet", icon: "heavy-jet" },
    service: { name: "Exterior Wash" },
    location: {
      airport: { icaoCode: "KSDL", name: "Scottsdale Airport" },
      hangarNumber: "H-27",
    },
    checklistItems: [
      { id: "cl9", completed: false },
      { id: "cl10", completed: false },
      { id: "cl11", completed: false },
      { id: "cl12", completed: false },
    ],
  },
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function StatusBadge({ status }: { status: "confirmed" | "in_progress" }) {
  const styles = {
    confirmed: "bg-blue-100 text-blue-700",
    in_progress: "bg-amber-100 text-amber-700",
  };
  const labels = {
    confirmed: "Confirmed",
    in_progress: "In Progress",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function ChecklistProgress({
  items,
}: {
  items: { id: string; completed: boolean }[];
}) {
  const done = items.filter((i) => i.completed).length;
  const total = items.length;
  const pct = total > 0 ? (done / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500">
        {done}/{total}
      </span>
    </div>
  );
}

export default function TechJobsPage() {
  const router = useRouter();
  const [jobs] = useState<MockJob[]>(MOCK_JOBS);
  const [refreshing, setRefreshing] = useState(false);

  function handleRefresh() {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => setRefreshing(false), 800);
  }

  return (
    <div className="space-y-4">
      {/* Page header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Today&apos;s Jobs</h2>
          <p className="text-sm text-gray-500">{jobs.length} jobs assigned</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Job cards */}
      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
          <Plane className="mb-3 h-12 w-12 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-600">No jobs today</h3>
          <p className="mt-1 text-sm text-gray-400">
            You&apos;re all clear. Enjoy your day!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <button
              key={job.id}
              onClick={() => router.push(`/jobs/${job.id}`)}
              className="block w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md active:bg-gray-50"
            >
              {/* Top row: time + status */}
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                  <Clock className="h-4 w-4 text-gray-400" />
                  {formatTime(job.scheduledAt)}
                </div>
                <StatusBadge status={job.status} />
              </div>

              {/* Airport + hangar */}
              <div className="mb-1.5 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-800">
                  {job.location.airport.icaoCode}
                </span>
                {job.location.hangarNumber && (
                  <span className="text-sm text-gray-500">
                    &middot; {job.location.hangarNumber}
                  </span>
                )}
              </div>

              {/* Aircraft + service */}
              <div className="mb-1.5 flex items-center gap-1.5">
                <Plane className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">
                  {job.aircraftClass.displayName}
                </span>
                <span className="text-gray-300">&middot;</span>
                <span className="text-sm text-gray-600">{job.service.name}</span>
              </div>

              {/* Customer */}
              <p className="mb-3 text-sm text-gray-500">{job.customer.name}</p>

              {/* Checklist progress + arrow */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <ChecklistProgress items={job.checklistItems} />
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
