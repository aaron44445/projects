"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BorderBeamCard } from "@/components/border-beam";
import {
  Search,
  MapPin,
  ExternalLink,
  MessageSquare,
  FileSearch,
  AlertTriangle,
  CheckCircle2,
  Star,
  Flame,
  Minus,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Lead {
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  placeId: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  priorityReason: string;
}

interface FindLeadsResult {
  leads: Lead[];
  city: string;
  state: string;
  total: number;
  breakdown: {
    high: number;
    medium: number;
    low: number;
  };
  message?: string;
}

const loadingMessages = [
  "Searching Google Places...",
  "Found businesses, fetching details...",
  "Checking websites for SEO signals...",
  "Scoring leads with AI...",
  "Sorting by priority...",
];

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
];

function PriorityBadge({ priority }: { priority: "HIGH" | "MEDIUM" | "LOW" }) {
  if (priority === "HIGH") {
    return (
      <Badge className="bg-lume/10 text-lume border-lume/30 text-xs gap-1">
        <Flame className="w-3 h-3" />
        Hot Lead
      </Badge>
    );
  }
  if (priority === "MEDIUM") {
    return (
      <Badge className="bg-yellow-400/10 text-yellow-400 border-yellow-400/30 text-xs gap-1">
        <Star className="w-3 h-3" />
        Medium
      </Badge>
    );
  }
  return (
    <Badge className="bg-white/5 text-white/40 border-white/10 text-xs gap-1">
      <Minus className="w-3 h-3" />
      Low
    </Badge>
  );
}

export default function LeadFinderPage() {
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<FindLeadsResult | null>(null);
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const [progressText, setProgressText] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  // Animated loading steps
  useEffect(() => {
    if (!loading) {
      setVisibleSteps([]);
      setProgressText("");
      return;
    }

    setVisibleSteps([0]);
    setProgressText(loadingMessages[0]);

    const timers = loadingMessages.slice(1).map((msg, i) =>
      setTimeout(() => {
        setVisibleSteps((prev) => [...prev, i + 1]);
        setProgressText(msg);
      }, (i + 1) * 2500)
    );

    return () => timers.forEach(clearTimeout);
  }, [loading]);

  // Scroll to results
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  async function handleSearch() {
    if (!city.trim() || !state.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/find-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city: city.trim(),
          state: state.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to find leads"
      );
    } finally {
      setLoading(false);
    }
  }

  function getRatingColor(rating?: number) {
    if (!rating) return "text-white/30";
    if (rating >= 4.5) return "text-lume";
    if (rating >= 4.0) return "text-yellow-400";
    return "text-red-400";
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-3">
          <Search className="w-6 h-6 text-lume" />
          Lead Finder
        </h1>
        <p className="text-sm text-white/40 mt-1 font-mono">
          Find med spas in any city and score them for SEO opportunity
        </p>
      </div>

      {/* Search Section */}
      <BorderBeamCard duration={5}>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* City */}
            <div className="flex-1 space-y-2">
              <label className="text-xs font-mono text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3 h-3" />
                City
              </label>
              <Input
                placeholder="Dallas"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                disabled={loading}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm h-10"
              />
            </div>

            {/* State */}
            <div className="w-full sm:w-32 space-y-2">
              <label className="text-xs font-mono text-white/40 uppercase tracking-wider">
                State
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                disabled={loading}
                className="flex h-10 w-full rounded-md border bg-white/5 border-white/10 text-white font-mono text-sm px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lume/50"
              >
                <option value="" className="bg-[#0A0A0B]">
                  Select
                </option>
                {US_STATES.map((s) => (
                  <option key={s} value={s} className="bg-[#0A0A0B]">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Button */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-white/40 uppercase tracking-wider invisible hidden sm:block">
                Action
              </label>
              <Button
                onClick={handleSearch}
                disabled={loading || !city.trim() || !state.trim()}
                className="bg-lume hover:bg-lume/90 text-black font-heading font-semibold h-10 px-6 w-full sm:w-auto"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Find Med Spas
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      </BorderBeamCard>

      {/* Loading State */}
      {loading && (
        <div className="rounded-lg border border-white/10 bg-black/40 p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="ml-2 text-white/30 text-xs font-mono">
              injectseo-lead-finder
            </span>
          </div>
          <div className="font-mono text-sm space-y-2">
            {visibleSteps.map((stepIdx) => (
              <div key={stepIdx} className="flex items-center gap-2">
                {stepIdx < visibleSteps.length - 1 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-lume shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-lume animate-pulse" />
                  </div>
                )}
                <span
                  className={cn(
                    stepIdx < visibleSteps.length - 1
                      ? "text-white/40"
                      : "text-lume"
                  )}
                >
                  {loadingMessages[stepIdx]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-400/20 bg-red-400/5 p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Search Failed</p>
            <p className="text-sm text-white/50 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div ref={resultRef} className="space-y-6 animate-fade-in">
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 text-center">
              <p className="text-2xl font-mono font-bold text-white">
                {result.total}
              </p>
              <p className="text-xs font-mono text-white/30 mt-1">
                Total Found
              </p>
            </div>
            <div className="rounded-lg border border-lume/20 bg-lume/5 p-4 text-center">
              <p className="text-2xl font-mono font-bold text-lume">
                {result.breakdown.high}
              </p>
              <p className="text-xs font-mono text-white/30 mt-1">Hot Leads</p>
            </div>
            <div className="rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-4 text-center">
              <p className="text-2xl font-mono font-bold text-yellow-400">
                {result.breakdown.medium}
              </p>
              <p className="text-xs font-mono text-white/30 mt-1">Medium</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 text-center">
              <p className="text-2xl font-mono font-bold text-white/40">
                {result.breakdown.low}
              </p>
              <p className="text-xs font-mono text-white/30 mt-1">Low</p>
            </div>
          </div>

          {/* Results info */}
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-sm font-semibold text-white">
              Med Spas in {result.city}, {result.state}
            </h2>
            <span className="text-xs font-mono text-white/30">
              Sorted by priority
            </span>
          </div>

          {/* Results Table */}
          {result.leads.length > 0 ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-white/40 font-mono text-xs uppercase">
                      Business
                    </TableHead>
                    <TableHead className="text-white/40 font-mono text-xs uppercase">
                      Priority
                    </TableHead>
                    <TableHead className="text-white/40 font-mono text-xs uppercase">
                      Rating
                    </TableHead>
                    <TableHead className="text-white/40 font-mono text-xs uppercase">
                      Reviews
                    </TableHead>
                    <TableHead className="text-white/40 font-mono text-xs uppercase text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.leads.map((lead) => (
                    <TableRow
                      key={lead.placeId}
                      className="border-white/5 hover:bg-white/[0.03]"
                    >
                      {/* Business name + website */}
                      <TableCell>
                        <div>
                          {lead.website ? (
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-white hover:text-lume transition-colors inline-flex items-center gap-1.5"
                            >
                              {lead.name}
                              <ExternalLink className="w-3 h-3 text-white/30" />
                            </a>
                          ) : (
                            <span className="text-sm font-medium text-white/60">
                              {lead.name}
                            </span>
                          )}
                          <p className="text-xs text-white/30 mt-0.5 truncate max-w-xs">
                            {lead.address}
                          </p>
                          {lead.priorityReason && (
                            <p className="text-[10px] font-mono text-white/20 mt-0.5">
                              {lead.priorityReason}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* Priority badge */}
                      <TableCell>
                        <PriorityBadge priority={lead.priority} />
                      </TableCell>

                      {/* Rating */}
                      <TableCell>
                        <span
                          className={cn(
                            "text-sm font-mono",
                            getRatingColor(lead.rating)
                          )}
                        >
                          {lead.rating ? lead.rating.toFixed(1) : "N/A"}
                        </span>
                      </TableCell>

                      {/* Review count */}
                      <TableCell>
                        <span className="text-sm font-mono text-white/50">
                          {lead.reviewCount ?? "—"}
                        </span>
                      </TableCell>

                      {/* Quick actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {lead.website && (
                            <>
                              <Link
                                href={`/dashboard/dm-generator?url=${encodeURIComponent(lead.website)}`}
                                className="inline-flex items-center gap-1 text-xs font-mono text-white/30 hover:text-lume transition-colors px-2 py-1 rounded border border-white/5 hover:border-lume/20"
                              >
                                <MessageSquare className="w-3 h-3" />
                                DM
                              </Link>
                              <Link
                                href={`/dashboard/audit?url=${encodeURIComponent(lead.website)}`}
                                className="inline-flex items-center gap-1 text-xs font-mono text-white/30 hover:text-teal-clinical transition-colors px-2 py-1 rounded border border-white/5 hover:border-teal-clinical/20"
                              >
                                <FileSearch className="w-3 h-3" />
                                Audit
                              </Link>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-lg border border-white/5 bg-white/[0.01] p-8 text-center">
              <Search className="w-8 h-8 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/30 font-mono">
                {result.message || "No results found"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
