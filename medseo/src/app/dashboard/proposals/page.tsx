"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { BorderBeamCard } from "@/components/border-beam";
import {
  FileText,
  Sparkles,
  Download,
  ChevronRight,
  Check,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Clock,
  Briefcase,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ScopeItem {
  service: string;
  description: string;
  deliverables: string[];
}

interface ProposalResult {
  clientName: string;
  services: string[];
  monthlyPrice: number;
  callNotes?: string;
  executiveSummary: string;
  scopeOfWork: ScopeItem[];
  timeline: {
    month1: string;
    month2: string;
    month3: string;
  };
  investment: {
    monthly: number;
    includes: string[];
  };
  whyInjectSEO: string;
}

const SERVICE_OPTIONS = [
  "Local SEO",
  "Content Marketing",
  "Google Business Profile",
  "On-Page Optimization",
  "Technical SEO",
  "Link Building",
];

const loadingSteps = [
  "Analyzing service requirements...",
  "Building scope of work...",
  "Generating timeline...",
  "Crafting executive summary...",
  "Finalizing proposal...",
];

export default function ProposalsPage() {
  const [clientName, setClientName] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ProposalResult | null>(null);
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Animated loading steps
  useEffect(() => {
    if (!loading) {
      setVisibleSteps([]);
      return;
    }

    setVisibleSteps([0]);

    const timers = loadingSteps.slice(1).map((_, i) =>
      setTimeout(() => {
        setVisibleSteps((prev) => [...prev, i + 1]);
      }, (i + 1) * 1200)
    );

    return () => timers.forEach(clearTimeout);
  }, [loading]);

  // Scroll to results
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  function toggleService(service: string) {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  }

  async function handleGenerate() {
    if (!clientName.trim() || selectedServices.length === 0 || !monthlyPrice) {
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName.trim(),
          services: selectedServices,
          monthlyPrice: Number(monthlyPrice),
          callNotes: callNotes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate proposal"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadPdf() {
    if (!result) return;

    setDownloadingPdf(true);
    try {
      const res = await fetch("/api/proposal/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });

      if (!res.ok) throw new Error("PDF generation failed");

      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `proposal-${result.clientName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "PDF download failed"
      );
    } finally {
      setDownloadingPdf(false);
    }
  }

  function resetForm() {
    setResult(null);
    setError("");
    setClientName("");
    setSelectedServices([]);
    setMonthlyPrice("");
    setCallNotes("");
  }

  const canGenerate =
    clientName.trim() && selectedServices.length > 0 && Number(monthlyPrice) > 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-3">
          <FileText className="w-6 h-6 text-lume" />
          Proposal Generator
        </h1>
        <p className="text-sm text-white/40 mt-1 font-mono">
          Generate branded SEO proposals with AI-powered scope and timeline
        </p>
      </div>

      {/* Form Section */}
      {!result && (
        <BorderBeamCard duration={5}>
          <div className="p-6 space-y-6">
            {/* Client Name */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3 h-3" />
                Client Name
              </label>
              <Input
                placeholder="Glow Aesthetics"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                disabled={loading}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm h-10"
              />
            </div>

            {/* Services */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-white/40 uppercase tracking-wider">
                Services
              </label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_OPTIONS.map((service) => {
                  const isSelected = selectedServices.includes(service);
                  return (
                    <button
                      key={service}
                      onClick={() => toggleService(service)}
                      disabled={loading}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-sm font-mono border transition-colors",
                        isSelected
                          ? "bg-lume/10 text-lume border-lume/30"
                          : "bg-white/5 text-white/50 border-white/10 hover:border-white/20 hover:text-white/70"
                      )}
                    >
                      {isSelected && (
                        <CheckCircle2 className="w-3 h-3 inline mr-1.5" />
                      )}
                      {service}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Monthly Price */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3 h-3" />
                Monthly Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 font-mono text-sm">
                  $
                </span>
                <Input
                  type="number"
                  placeholder="2000"
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(e.target.value)}
                  disabled={loading}
                  className="pl-7 bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm h-10"
                />
              </div>
            </div>

            {/* Call Notes */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-white/40 uppercase tracking-wider">
                Discovery Call Notes (optional)
              </label>
              <Textarea
                placeholder="They want to rank for 'botox near me' in Dallas. Currently getting most leads from Instagram..."
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                disabled={loading}
                rows={4}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm resize-none"
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={loading || !canGenerate}
              className="bg-lume hover:bg-lume/90 text-black font-heading font-semibold h-11 px-6 w-full sm:w-auto"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Generating...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Generate Proposal
                </div>
              )}
            </Button>
          </div>
        </BorderBeamCard>
      )}

      {/* Loading State */}
      {loading && (
        <div className="rounded-lg border border-white/10 bg-black/40 p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="ml-2 text-white/30 text-xs font-mono">
              injectseo-proposal
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
                  {loadingSteps[stepIdx]}
                </span>
                {stepIdx < visibleSteps.length - 1 && (
                  <Check className="w-3 h-3 text-lume/60 ml-auto" />
                )}
                {stepIdx === visibleSteps.length - 1 && (
                  <span className="ml-auto inline-block w-2 h-4 bg-lume/60 animate-pulse" />
                )}
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
            <p className="text-sm font-medium text-red-400">
              Generation Failed
            </p>
            <p className="text-sm text-white/50 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div ref={resultRef} className="space-y-6 animate-fade-in">
          {/* Header with actions */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-semibold text-white">
                Proposal for {result.clientName}
              </h2>
              <p className="text-xs font-mono text-white/40 mt-1">
                {result.services.length} services &middot; $
                {result.monthlyPrice.toLocaleString()}/mo
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="bg-lume hover:bg-lume/90 text-black font-heading font-semibold px-6 h-10"
              >
                {downloadingPdf ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Generating PDF
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download PDF
                  </div>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={resetForm}
                className="border-white/10 text-white/60 hover:text-white hover:bg-white/5 font-heading h-10"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                New Proposal
              </Button>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
            <h3 className="font-heading text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-lume" />
              Executive Summary
            </h3>
            <p className="text-sm text-white/60 leading-relaxed">
              {result.executiveSummary}
            </p>
          </div>

          {/* Scope of Work */}
          <div>
            <h3 className="font-heading text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-lume" />
              Scope of Work
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.scopeOfWork.map((item, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-white/10 bg-white/[0.02] p-5"
                >
                  <h4 className="font-heading text-sm font-semibold text-white mb-2">
                    {item.service}
                  </h4>
                  <p className="text-xs text-white/50 mb-3 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-teal-clinical uppercase tracking-wider">
                      Deliverables
                    </span>
                    {item.deliverables.map((d, j) => (
                      <div
                        key={j}
                        className="flex items-start gap-2 text-xs text-white/40"
                      >
                        <ChevronRight className="w-3 h-3 text-lume shrink-0 mt-0.5" />
                        {d}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
            <h3 className="font-heading text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-lume" />
              90-Day Timeline
            </h3>
            <div className="space-y-4">
              {[
                {
                  label: "Month 1",
                  text: result.timeline.month1,
                },
                {
                  label: "Month 2",
                  text: result.timeline.month2,
                },
                {
                  label: "Month 3",
                  text: result.timeline.month3,
                },
              ].map((item) => (
                <div key={item.label} className="flex gap-4">
                  <Badge className="bg-lume/10 text-lume border-lume/20 text-xs shrink-0 h-fit">
                    {item.label}
                  </Badge>
                  <p className="text-sm text-white/50 leading-relaxed">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Investment */}
          <div className="rounded-lg border border-lume/20 bg-lume/5 p-6 text-center">
            <h3 className="font-heading text-sm font-semibold text-white mb-4 flex items-center gap-2 justify-center">
              <DollarSign className="w-4 h-4 text-lume" />
              Investment
            </h3>
            <p className="text-4xl font-mono font-bold text-lume">
              ${result.investment.monthly.toLocaleString()}
            </p>
            <p className="text-xs font-mono text-white/40 mt-1">per month</p>
            {result.investment.includes.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10 text-left max-w-md mx-auto">
                <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">
                  Includes
                </span>
                <div className="mt-2 space-y-1">
                  {result.investment.includes.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-xs text-white/50"
                    >
                      <CheckCircle2 className="w-3 h-3 text-lume shrink-0 mt-0.5" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Why InjectSEO */}
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
            <h3 className="font-heading text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-lume" />
              Why InjectSEO
            </h3>
            <p className="text-sm text-white/60 leading-relaxed">
              {result.whyInjectSEO}
            </p>
          </div>
        </div>
      )}

      {/* Past Proposals placeholder */}
      {!result && !loading && (
        <div className="rounded-lg border border-white/5 bg-white/[0.01] p-8 text-center">
          <FileText className="w-8 h-8 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/30 font-mono">No proposals yet</p>
          <p className="text-xs text-white/15 font-mono mt-1">
            Generated proposals will appear here
          </p>
        </div>
      )}
    </div>
  );
}
