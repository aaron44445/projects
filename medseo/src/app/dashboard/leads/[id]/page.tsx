"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ExternalLink,
  Phone,
  Mail,
  Instagram,
  MapPin,
  MessageSquare,
  FileSearch,
  FileText,
  ArrowLeft,
  Clock,
  Database,
} from "lucide-react";

interface Lead {
  id: string;
  businessName: string;
  website: string | null;
  instagram: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  googleRating: number | null;
  reviewCount: number | null;
  seoScore: number | null;
  priority: "HIGH" | "MEDIUM" | "LOW";
  status: string;
  notes: string | null;
  followUpDate: string | null;
  lastContactDate: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  DMED: "DMed",
  REPLIED: "Replied",
  CALL_BOOKED: "Call Booked",
  PROPOSAL_SENT: "Proposal Sent",
  CLOSED: "Closed",
  LOST: "Lost",
};

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  DMED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  REPLIED: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  CALL_BOOKED: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  PROPOSAL_SENT: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  CLOSED: "bg-lume/10 text-lume border-lume/20",
  LOST: "bg-red-500/10 text-red-400 border-red-500/20",
};

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: "bg-red-500/10 text-red-400 border-red-500/20",
  MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  LOW: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function LeadDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchLead = useCallback(async () => {
    try {
      const res = await fetch(`/api/leads/${id}`);
      if (!res.ok) throw new Error("Failed to fetch lead");
      const data = await res.json();
      setLead(data);
      setNotes(data.notes || "");
      setError(null);
    } catch {
      setError("database");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  // Auto-save notes with debounce
  function handleNotesChange(value: string) {
    setNotes(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await fetch(`/api/leads/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: value }),
        });
      } catch {
        // Silent fail for auto-save
      } finally {
        setSaving(false);
      }
    }, 1000);
  }

  if (loading) {
    return (
      <div className="space-y-8 max-w-4xl">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-12 text-center">
          <div className="inline-block w-2 h-4 bg-lume/60 animate-pulse" />
          <p className="text-sm text-white/40 font-mono mt-3">
            Loading lead...
          </p>
        </div>
      </div>
    );
  }

  if (error === "database" || !lead) {
    return (
      <div className="space-y-8 max-w-4xl">
        <Link
          href="/dashboard/leads"
          className="flex items-center gap-2 text-sm font-mono text-white/40 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Pipeline
        </Link>
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-12 text-center">
          <Database className="w-10 h-10 text-white/20 mx-auto mb-4" />
          <h2 className="font-heading text-lg font-semibold text-white mb-2">
            {error === "database"
              ? "Connect Database to View Lead"
              : "Lead Not Found"}
          </h2>
          <p className="text-sm text-white/40 font-mono">
            {error === "database"
              ? "Set up your DATABASE_URL to access lead data."
              : "This lead may have been deleted."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back Link */}
      <Link
        href="/dashboard/leads"
        className="flex items-center gap-2 text-sm font-mono text-white/40 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Pipeline
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-white mb-2">
            {lead.businessName}
          </h1>
          <div className="flex items-center gap-3">
            <Badge className={STATUS_COLORS[lead.status] || "bg-white/10 text-white/60"}>
              {STATUS_LABELS[lead.status] || lead.status}
            </Badge>
            <Badge className={PRIORITY_COLORS[lead.priority]}>
              {lead.priority} Priority
            </Badge>
            {lead.website && (
              <a
                href={lead.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-mono text-lume/70 hover:text-lume transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                {lead.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Notes */}
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-sm font-semibold text-white">
                Notes
              </h2>
              {saving && (
                <span className="text-xs font-mono text-lume/60 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-lume/60 animate-pulse" />
                  Saving...
                </span>
              )}
            </div>
            <Textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              rows={6}
              placeholder="Add notes about this lead... (auto-saves)"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm resize-none"
            />
          </div>

          {/* Activity Timeline */}
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
            <h2 className="font-heading text-sm font-semibold text-white mb-4">
              Activity Timeline
            </h2>
            <div className="text-center py-8">
              <Clock className="w-8 h-8 text-white/10 mx-auto mb-3" />
              <p className="text-sm text-white/30 font-mono">
                Activity timeline coming soon
              </p>
              <p className="text-xs text-white/15 font-mono mt-1">
                Track DMs, audits, proposals, and status changes
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Card */}
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
            <h2 className="font-heading text-sm font-semibold text-white mb-3">
              Contact Info
            </h2>
            <div className="space-y-3">
              {lead.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-white/30" />
                  <a
                    href={`tel:${lead.phone}`}
                    className="text-sm font-mono text-white/60 hover:text-white transition-colors"
                  >
                    {lead.phone}
                  </a>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-white/30" />
                  <a
                    href={`mailto:${lead.email}`}
                    className="text-sm font-mono text-white/60 hover:text-white transition-colors"
                  >
                    {lead.email}
                  </a>
                </div>
              )}
              {lead.instagram && (
                <div className="flex items-center gap-2.5">
                  <Instagram className="w-4 h-4 text-white/30" />
                  <span className="text-sm font-mono text-white/60">
                    {lead.instagram}
                  </span>
                </div>
              )}
              {(lead.address || lead.city) && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-white/30 mt-0.5" />
                  <span className="text-sm font-mono text-white/60">
                    {lead.address && <>{lead.address}<br /></>}
                    {lead.city}
                    {lead.state ? `, ${lead.state}` : ""}
                  </span>
                </div>
              )}
              {!lead.phone &&
                !lead.email &&
                !lead.instagram &&
                !lead.address &&
                !lead.city && (
                  <p className="text-xs font-mono text-white/20">
                    No contact info available
                  </p>
                )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
            <h2 className="font-heading text-sm font-semibold text-white mb-3">
              Quick Actions
            </h2>
            <div className="space-y-2">
              <Link
                href={`/dashboard/dm-generator${lead.website ? `?url=${encodeURIComponent(lead.website)}` : ""}`}
                className="w-full"
              >
                <Button
                  variant="outline"
                  className="w-full border-white/10 text-white/60 hover:text-white justify-start font-mono text-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  Generate DM
                </Button>
              </Link>
              <Link
                href={`/dashboard/audit${lead.website ? `?url=${encodeURIComponent(lead.website)}` : ""}`}
                className="w-full"
              >
                <Button
                  variant="outline"
                  className="w-full border-white/10 text-white/60 hover:text-white justify-start font-mono text-sm"
                >
                  <FileSearch className="w-4 h-4" />
                  Run Audit
                </Button>
              </Link>
              <Link
                href={`/dashboard/proposals?lead=${lead.id}`}
                className="w-full"
              >
                <Button
                  variant="outline"
                  className="w-full border-white/10 text-white/60 hover:text-white justify-start font-mono text-sm"
                >
                  <FileText className="w-4 h-4" />
                  Create Proposal
                </Button>
              </Link>
            </div>
          </div>

          {/* Metadata */}
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
            <h2 className="font-heading text-sm font-semibold text-white mb-3">
              Details
            </h2>
            <div className="space-y-2 text-xs font-mono">
              {lead.googleRating && (
                <div className="flex justify-between">
                  <span className="text-white/30">Google Rating</span>
                  <span className="text-white/60">
                    {lead.googleRating} ({lead.reviewCount} reviews)
                  </span>
                </div>
              )}
              {lead.seoScore !== null && (
                <div className="flex justify-between">
                  <span className="text-white/30">SEO Score</span>
                  <span className="text-white/60">{lead.seoScore}/100</span>
                </div>
              )}
              {lead.followUpDate && (
                <div className="flex justify-between">
                  <span className="text-white/30">Follow-up</span>
                  <span className="text-white/60">
                    {new Date(lead.followUpDate).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-white/30">Created</span>
                <span className="text-white/60">
                  {new Date(lead.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/30">Updated</span>
                <span className="text-white/60">
                  {new Date(lead.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
