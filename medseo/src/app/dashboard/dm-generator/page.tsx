"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BorderBeamCard } from "@/components/border-beam";
import {
  Globe,
  Instagram,
  Sparkles,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import type { SiteAnalysis } from "@/lib/site-analyzer";

interface DmVariant {
  variant: number;
  content: string;
}

interface Followups {
  day3: string;
  day7: string;
  day14: string;
}

interface GenerateResult {
  analysis: SiteAnalysis;
  dms: DmVariant[];
  followups: Followups;
}

const loadingSteps = [
  "Analyzing website...",
  "Scanning SEO signals...",
  "Generating personalized messages...",
];

export default function DmGeneratorPage() {
  const [url, setUrl] = useState("");
  const [instagram, setInstagram] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
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
      }, (i + 1) * 1000)
    );

    return () => timers.forEach(clearTimeout);
  }, [loading]);

  // Scroll to results when they arrive
  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  async function handleGenerate() {
    if (!url.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/generate-dm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          instagram: instagram.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate DMs");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">
          DM Generator
        </h1>
        <p className="text-sm text-white/40 mt-1 font-mono">
          Analyze a med spa website and generate personalized cold DMs
        </p>
      </div>

      {/* Input Section */}
      <BorderBeamCard duration={5}>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-end">
            {/* URL Input */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3 h-3" />
                Website URL
              </label>
              <Input
                placeholder="https://example-medspa.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                disabled={loading}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm h-10"
              />
            </div>

            {/* Instagram Handle */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                <Instagram className="w-3 h-3" />
                Instagram (optional)
              </label>
              <Input
                placeholder="@theirhandle"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                disabled={loading}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm h-10"
              />
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={loading || !url.trim()}
              className="bg-lume hover:bg-lume/90 text-black font-heading font-semibold h-10 px-6"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? "Generating..." : "Generate DMs"}
            </Button>
          </div>
        </div>
      </BorderBeamCard>

      {/* Loading State */}
      {loading && (
        <div className="rounded-lg border border-white/10 bg-[#0D0D0E] p-6">
          <div className="font-mono text-sm space-y-2">
            {visibleSteps.map((stepIdx) => (
              <div
                key={stepIdx}
                className="flex items-center gap-2 animate-fade-in"
              >
                <ChevronRight className="w-3 h-3 text-lume" />
                <span className="text-lume/80">{loadingSteps[stepIdx]}</span>
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
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-red-400 font-mono">{error}</p>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div ref={resultRef} className="space-y-6">
          {/* Analysis Summary */}
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-sm font-semibold text-white">
                Site Analysis
              </h2>
              <Badge className="bg-lume/10 text-lume border-lume/20 text-xs">
                {result.analysis.issues.length} issue
                {result.analysis.issues.length !== 1 ? "s" : ""} found
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Business Name */}
              <div className="space-y-1">
                <span className="text-xs font-mono text-white/30 uppercase tracking-wider">
                  Business
                </span>
                <p className="text-sm text-white truncate">
                  {result.analysis.businessName || "Unknown"}
                </p>
              </div>

              {/* Services Found */}
              <div className="space-y-1">
                <span className="text-xs font-mono text-white/30 uppercase tracking-wider">
                  Services Detected
                </span>
                <p className="text-sm text-white">
                  {result.analysis.servicesMentioned.length > 0
                    ? result.analysis.servicesMentioned.length + " services"
                    : "None detected"}
                </p>
              </div>

              {/* Images */}
              <div className="space-y-1">
                <span className="text-xs font-mono text-white/30 uppercase tracking-wider">
                  Images
                </span>
                <p className="text-sm text-white">
                  {result.analysis.imagesWithAlt}/{result.analysis.imageCount}{" "}
                  with alt text
                </p>
              </div>
            </div>

            {/* Issues List */}
            {result.analysis.issues.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex flex-wrap gap-2">
                  {result.analysis.issues.map((issue, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 text-xs font-mono px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      {issue}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Services Tags */}
            {result.analysis.servicesMentioned.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <span className="text-xs font-mono text-white/30 uppercase tracking-wider block mb-2">
                  Services Found
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {result.analysis.servicesMentioned.map((svc) => (
                    <span
                      key={svc}
                      className="text-xs font-mono px-2 py-0.5 rounded bg-teal-clinical/10 text-teal-clinical border border-teal-clinical/20"
                    >
                      {svc}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* DM Variants */}
          <div>
            <h2 className="font-heading text-sm font-semibold text-white mb-4">
              Generated DMs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {result.dms.map((dm) => (
                <div
                  key={dm.variant}
                  className="rounded-lg border border-white/10 bg-white/[0.02] flex flex-col"
                >
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                    <span className="text-xs font-mono text-white/40 uppercase tracking-wider">
                      Variant {dm.variant}
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(dm.content, `dm-${dm.variant}`)
                      }
                      className="flex items-center gap-1 text-xs font-mono text-white/30 hover:text-lume transition-colors"
                    >
                      {copiedId === `dm-${dm.variant}` ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-lume" />
                          <span className="text-lume">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>

                  {/* Body */}
                  <div className="px-4 py-3 flex-1">
                    <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                      {dm.content}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2 border-t border-white/5">
                    <span className="text-xs font-mono text-white/20">
                      {dm.content.length} chars
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Follow-up Messages */}
          <div>
            <h2 className="font-heading text-sm font-semibold text-white mb-4">
              Follow-up Sequence
            </h2>
            <Accordion
              type="multiple"
              className="rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden"
            >
              {[
                {
                  key: "day3",
                  label: "Day 3 Follow-up",
                  desc: "Soft bump",
                  content: result.followups.day3,
                },
                {
                  key: "day7",
                  label: "Day 7 Follow-up",
                  desc: "Value-add tip",
                  content: result.followups.day7,
                },
                {
                  key: "day14",
                  label: "Day 14 Follow-up",
                  desc: "Final check-in",
                  content: result.followups.day14,
                },
              ].map((followup) => (
                <AccordionItem
                  key={followup.key}
                  value={followup.key}
                  className="border-white/5"
                >
                  <AccordionTrigger className="px-4 text-white hover:no-underline">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-heading">
                        {followup.label}
                      </span>
                      <span className="text-xs font-mono text-white/30">
                        {followup.desc}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4">
                    <div className="bg-white/[0.02] rounded-lg border border-white/5 p-4">
                      <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">
                        {followup.content}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs font-mono text-white/20">
                          {followup.content.length} chars
                        </span>
                        <button
                          onClick={() =>
                            handleCopy(
                              followup.content,
                              `followup-${followup.key}`
                            )
                          }
                          className="flex items-center gap-1 text-xs font-mono text-white/30 hover:text-lume transition-colors"
                        >
                          {copiedId === `followup-${followup.key}` ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-lume" />
                              <span className="text-lume">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      )}
    </div>
  );
}
