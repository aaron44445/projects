"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Plus,
  Users,
  ExternalLink,
  Phone,
  Mail,
  Instagram,
  Calendar,
  MessageSquare,
  FileSearch,
  FileText,
  Database,
  AlertTriangle,
} from "lucide-react";

// --- Types ---

interface LeadCounts {
  audits: number;
  proposals: number;
  messages: number;
}

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
  _count: LeadCounts;
}

interface StatusCount {
  status: string;
  _count: number;
}

const PIPELINE_COLUMNS = [
  { key: "NEW", label: "New", color: "bg-blue-500" },
  { key: "DMED", label: "DMed", color: "bg-purple-500" },
  { key: "REPLIED", label: "Replied", color: "bg-teal-clinical" },
  { key: "CALL_BOOKED", label: "Call Booked", color: "bg-amber-500" },
  { key: "PROPOSAL_SENT", label: "Proposal Sent", color: "bg-orange-500" },
  { key: "CLOSED", label: "Closed", color: "bg-lume" },
  { key: "LOST", label: "Lost", color: "bg-red-500" },
] as const;

const PRIORITY_CONFIG = {
  HIGH: { label: "High", classes: "bg-red-500/10 text-red-400 border-red-500/20" },
  MEDIUM: { label: "Med", classes: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  LOW: { label: "Low", classes: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
} as const;

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// --- Main Component ---

export default function LeadsPipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Add lead form state
  const [newLead, setNewLead] = useState({
    businessName: "",
    website: "",
    city: "",
    state: "",
    notes: "",
  });

  // Editing state for sheet
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editFollowUp, setEditFollowUp] = useState("");

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/leads");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLeads(data.leads);
      setStatusCounts(data.statusCounts);
      setError(null);
    } catch {
      setError("database");
      setLeads([]);
      setStatusCounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  function openSheet(lead: Lead) {
    setSelectedLead(lead);
    setEditNotes(lead.notes || "");
    setEditStatus(lead.status);
    setEditFollowUp(
      lead.followUpDate ? lead.followUpDate.split("T")[0] : ""
    );
    setSheetOpen(true);
  }

  async function handleCreateLead() {
    if (!newLead.businessName.trim()) return;

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLead),
      });

      if (!res.ok) throw new Error("Failed to create lead");

      setNewLead({ businessName: "", website: "", city: "", state: "", notes: "" });
      setDialogOpen(false);
      await fetchLeads();
    } catch {
      // Silently handle - the error state will show in the pipeline
    }
  }

  async function handleUpdateLead() {
    if (!selectedLead) return;

    try {
      await fetch(`/api/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: editNotes,
          status: editStatus,
          followUpDate: editFollowUp || null,
        }),
      });

      await fetchLeads();
      setSheetOpen(false);
    } catch {
      // Silently handle
    }
  }

  function getCountForStatus(status: string): number {
    const found = statusCounts.find((s) => s.status === status);
    return found ? found._count : 0;
  }

  function getLeadsForStatus(status: string): Lead[] {
    return leads.filter((l) => l.status === status);
  }

  const totalLeads = leads.length;

  // --- Empty / DB-not-connected state ---
  if (!loading && error === "database") {
    return (
      <div className="space-y-8 max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-white">
              Lead Pipeline
            </h1>
            <p className="text-sm text-white/40 mt-1 font-mono">
              Track and manage your med spa leads through the sales pipeline
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-12 text-center">
          <Database className="w-10 h-10 text-white/20 mx-auto mb-4" />
          <h2 className="font-heading text-lg font-semibold text-white mb-2">
            Connect Database to View Leads
          </h2>
          <p className="text-sm text-white/40 font-mono max-w-md mx-auto">
            Set up your DATABASE_URL environment variable and run Prisma
            migrations to start tracking leads through your pipeline.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">
            Lead Pipeline
          </h1>
          <p className="text-sm text-white/40 mt-1 font-mono">
            {totalLeads} lead{totalLeads !== 1 ? "s" : ""} in pipeline
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-lume hover:bg-lume/90 text-black font-heading font-semibold">
              <Plus className="w-4 h-4" />
              Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0D0D0E] border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="font-heading text-white">
                Add New Lead
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label className="text-xs font-mono text-white/40 uppercase tracking-wider">
                  Business Name *
                </Label>
                <Input
                  value={newLead.businessName}
                  onChange={(e) =>
                    setNewLead({ ...newLead, businessName: e.target.value })
                  }
                  placeholder="Glow Med Spa"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono text-white/40 uppercase tracking-wider">
                  Website
                </Label>
                <Input
                  value={newLead.website}
                  onChange={(e) =>
                    setNewLead({ ...newLead, website: e.target.value })
                  }
                  placeholder="https://glowmedspa.com"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-mono text-white/40 uppercase tracking-wider">
                    City
                  </Label>
                  <Input
                    value={newLead.city}
                    onChange={(e) =>
                      setNewLead({ ...newLead, city: e.target.value })
                    }
                    placeholder="Austin"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-mono text-white/40 uppercase tracking-wider">
                    State
                  </Label>
                  <Input
                    value={newLead.state}
                    onChange={(e) =>
                      setNewLead({ ...newLead, state: e.target.value })
                    }
                    placeholder="TX"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono text-white/40 uppercase tracking-wider">
                  Notes
                </Label>
                <Textarea
                  value={newLead.notes}
                  onChange={(e) =>
                    setNewLead({ ...newLead, notes: e.target.value })
                  }
                  placeholder="Initial notes about this lead..."
                  rows={3}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" className="border-white/10 text-white/60 hover:text-white">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                onClick={handleCreateLead}
                disabled={!newLead.businessName.trim()}
                className="bg-lume hover:bg-lume/90 text-black font-heading font-semibold"
              >
                Create Lead
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {PIPELINE_COLUMNS.map((col) => (
          <div
            key={col.key}
            className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-center"
          >
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div className={`w-2 h-2 rounded-full ${col.color}`} />
              <span className="text-xs font-mono text-white/40 truncate">
                {col.label}
              </span>
            </div>
            <span className="text-lg font-heading font-bold text-white">
              {getCountForStatus(col.key)}
            </span>
          </div>
        ))}
      </div>

      {/* Pipeline Columns */}
      {loading ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-12 text-center">
          <div className="inline-block w-2 h-4 bg-lume/60 animate-pulse" />
          <p className="text-sm text-white/40 font-mono mt-3">
            Loading pipeline...
          </p>
        </div>
      ) : leads.length === 0 && !error ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-12 text-center">
          <Users className="w-10 h-10 text-white/20 mx-auto mb-4" />
          <h2 className="font-heading text-lg font-semibold text-white mb-2">
            No Leads Yet
          </h2>
          <p className="text-sm text-white/40 font-mono max-w-md mx-auto mb-4">
            Add your first lead manually or use the Lead Finder to discover med
            spas in your target markets.
          </p>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-lume hover:bg-lume/90 text-black font-heading font-semibold"
          >
            <Plus className="w-4 h-4" />
            Add First Lead
          </Button>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 lg:mx-0 lg:px-0">
          {PIPELINE_COLUMNS.map((col) => {
            const colLeads = getLeadsForStatus(col.key);
            return (
              <div
                key={col.key}
                className="flex-shrink-0 w-[260px] lg:w-auto lg:flex-1"
              >
                {/* Column Header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={`w-2 h-2 rounded-full ${col.color}`} />
                  <span className="text-xs font-mono text-white/50 uppercase tracking-wider">
                    {col.label}
                  </span>
                  <span className="text-xs font-mono text-white/20 ml-auto">
                    {colLeads.length}
                  </span>
                </div>

                {/* Column Body */}
                <div className="space-y-2 min-h-[200px] rounded-lg border border-white/5 bg-white/[0.01] p-2">
                  {colLeads.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-xs font-mono text-white/15">
                        No leads
                      </p>
                    </div>
                  )}
                  {colLeads.map((lead) => {
                    const days = daysSince(
                      lead.lastContactDate || lead.createdAt
                    );
                    const priorityCfg = PRIORITY_CONFIG[lead.priority];

                    return (
                      <button
                        key={lead.id}
                        onClick={() => openSheet(lead)}
                        className="w-full text-left rounded-lg border border-white/10 bg-[#0D0D0E] p-3 hover:border-white/20 hover:bg-white/[0.03] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <span className="text-sm font-heading font-semibold text-white truncate">
                            {lead.businessName}
                          </span>
                          <Badge
                            className={`text-[10px] px-1.5 py-0 shrink-0 ${priorityCfg.classes}`}
                          >
                            {priorityCfg.label}
                          </Badge>
                        </div>
                        {lead.city && (
                          <p className="text-xs font-mono text-white/30 mb-2 truncate">
                            {lead.city}
                            {lead.state ? `, ${lead.state}` : ""}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[10px] font-mono text-white/20">
                            {lead._count.audits > 0 && (
                              <span>{lead._count.audits} audit{lead._count.audits !== 1 ? "s" : ""}</span>
                            )}
                            {lead._count.messages > 0 && (
                              <span>{lead._count.messages} DM{lead._count.messages !== 1 ? "s" : ""}</span>
                            )}
                          </div>
                          {days !== null && (
                            <span
                              className={`text-[10px] font-mono ${
                                days > 7
                                  ? "text-amber-400/60"
                                  : "text-white/20"
                              }`}
                            >
                              {days}d ago
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lead Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="bg-[#0A0A0B] border-white/10 text-white w-full sm:max-w-lg overflow-y-auto"
        >
          {selectedLead && (
            <>
              <SheetHeader className="pb-4 border-b border-white/5">
                <SheetTitle className="font-heading text-xl text-white">
                  {selectedLead.businessName}
                </SheetTitle>
                <SheetDescription className="text-white/40 font-mono text-xs">
                  {selectedLead.city
                    ? `${selectedLead.city}${selectedLead.state ? `, ${selectedLead.state}` : ""}`
                    : "No location set"}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 py-4 px-4">
                {/* Website */}
                {selectedLead.website && (
                  <a
                    href={selectedLead.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-mono text-lume/80 hover:text-lume transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {selectedLead.website}
                  </a>
                )}

                {/* Contact Info */}
                <div className="space-y-2">
                  <span className="text-xs font-mono text-white/30 uppercase tracking-wider">
                    Contact
                  </span>
                  <div className="space-y-1.5">
                    {selectedLead.phone && (
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <Phone className="w-3.5 h-3.5 text-white/30" />
                        {selectedLead.phone}
                      </div>
                    )}
                    {selectedLead.email && (
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <Mail className="w-3.5 h-3.5 text-white/30" />
                        {selectedLead.email}
                      </div>
                    )}
                    {selectedLead.instagram && (
                      <div className="flex items-center gap-2 text-sm text-white/60">
                        <Instagram className="w-3.5 h-3.5 text-white/30" />
                        {selectedLead.instagram}
                      </div>
                    )}
                    {!selectedLead.phone &&
                      !selectedLead.email &&
                      !selectedLead.instagram && (
                        <p className="text-xs text-white/20 font-mono">
                          No contact info
                        </p>
                      )}
                  </div>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label className="text-xs font-mono text-white/30 uppercase tracking-wider">
                    Status
                  </Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1A1A1B] border-white/10">
                      {PIPELINE_COLUMNS.map((col) => (
                        <SelectItem
                          key={col.key}
                          value={col.key}
                          className="text-white/80 focus:bg-white/10 focus:text-white"
                        >
                          {col.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <span className="text-xs font-mono text-white/30 uppercase tracking-wider">
                    Priority
                  </span>
                  <Badge
                    className={`${PRIORITY_CONFIG[selectedLead.priority].classes}`}
                  >
                    {PRIORITY_CONFIG[selectedLead.priority].label} Priority
                  </Badge>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label className="text-xs font-mono text-white/30 uppercase tracking-wider">
                    Notes
                  </Label>
                  <Textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={4}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm resize-none"
                    placeholder="Add notes about this lead..."
                  />
                </div>

                {/* Follow-up Date */}
                <div className="space-y-2">
                  <Label className="text-xs font-mono text-white/30 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    Follow-up Date
                  </Label>
                  <Input
                    type="date"
                    value={editFollowUp}
                    onChange={(e) => setEditFollowUp(e.target.value)}
                    className="bg-white/5 border-white/10 text-white font-mono text-sm"
                  />
                </div>

                {/* Related Items */}
                <div className="space-y-2">
                  <span className="text-xs font-mono text-white/30 uppercase tracking-wider">
                    Related
                  </span>
                  <div className="flex gap-3 text-xs font-mono text-white/40">
                    <span>{selectedLead._count.audits} audits</span>
                    <span>{selectedLead._count.proposals} proposals</span>
                    <span>{selectedLead._count.messages} DMs</span>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <span className="text-xs font-mono text-white/30 uppercase tracking-wider">
                    Quick Actions
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <Link
                      href={`/dashboard/dm-generator${selectedLead.website ? `?url=${encodeURIComponent(selectedLead.website)}` : ""}`}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 text-white/40" />
                      <span className="text-[10px] font-mono text-white/40">
                        DMs
                      </span>
                    </Link>
                    <Link
                      href={`/dashboard/audit${selectedLead.website ? `?url=${encodeURIComponent(selectedLead.website)}` : ""}`}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-colors"
                    >
                      <FileSearch className="w-4 h-4 text-white/40" />
                      <span className="text-[10px] font-mono text-white/40">
                        Audit
                      </span>
                    </Link>
                    <Link
                      href={`/dashboard/proposals${selectedLead.website ? `?lead=${selectedLead.id}` : ""}`}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-white/40" />
                      <span className="text-[10px] font-mono text-white/40">
                        Proposal
                      </span>
                    </Link>
                  </div>
                </div>

                {/* View Full Page + Save */}
                <div className="flex gap-2 pt-2">
                  <Link
                    href={`/dashboard/leads/${selectedLead.id}`}
                    className="flex-1"
                  >
                    <Button
                      variant="outline"
                      className="w-full border-white/10 text-white/60 hover:text-white font-mono text-sm"
                    >
                      View Full Page
                    </Button>
                  </Link>
                  <Button
                    onClick={handleUpdateLead}
                    className="flex-1 bg-lume hover:bg-lume/90 text-black font-heading font-semibold"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
