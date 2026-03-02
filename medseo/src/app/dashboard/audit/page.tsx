"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BorderBeamCard } from "@/components/border-beam";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  FileSearch,
  Download,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gauge,
  Search,
  Zap,
  Eye,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditIssue {
  title: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  description: string;
  recommendation: string;
  impact: string;
}

interface AuditResult {
  siteAnalysis: {
    url: string;
    title: string;
    description: string;
    headings: string[];
    imageCount: number;
    imagesWithAlt: number;
    hasBlog: boolean;
    socialLinks: string[];
    businessName: string;
    servicesMentioned: string[];
    issues: string[];
  };
  pageSpeed: {
    performanceScore: number;
    seoScore: number;
    accessibilityScore: number;
    fcp: string;
    lcp: string;
    cls: string;
    audits: Array<{
      id: string;
      title: string;
      score: number | null;
      description: string;
    }>;
  };
  aiAnalysis: {
    overallScore: number;
    executiveSummary: string;
    issues: AuditIssue[];
  };
}

const loadingSteps = [
  { text: "Fetching site data...", delay: 0 },
  { text: "Analyzing page structure...", delay: 1500 },
  { text: "Running PageSpeed analysis...", delay: 3000 },
  { text: "Measuring Core Web Vitals...", delay: 6000 },
  { text: "AI analyzing results...", delay: 9000 },
  { text: "Generating recommendations...", delay: 13000 },
];

function getScoreColor(score: number): string {
  if (score >= 75) return "text-lume";
  if (score >= 50) return "text-yellow-400";
  return "text-red-400";
}

function getScoreBg(score: number): string {
  if (score >= 75) return "bg-lume/10 border-lume/20";
  if (score >= 50) return "bg-yellow-400/10 border-yellow-400/20";
  return "bg-red-400/10 border-red-400/20";
}

function getPriorityColor(priority: string): string {
  if (priority === "HIGH") return "text-red-400 bg-red-400/10 border-red-400/30";
  if (priority === "MEDIUM")
    return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
  return "text-lume bg-lume/10 border-lume/30";
}

function TerminalLoader({ steps }: { steps: string[] }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-6 font-mono text-sm">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
        <div className="w-3 h-3 rounded-full bg-red-500/80" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <div className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="ml-2 text-white/30 text-xs">injectseo-audit</span>
      </div>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            {i < steps.length - 1 ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-lume shrink-0" />
            ) : (
              <div className="w-3.5 h-3.5 shrink-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-lume animate-pulse" />
              </div>
            )}
            <span
              className={cn(
                i < steps.length - 1 ? "text-white/40" : "text-lume"
              )}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreRing({ score, label, icon: Icon }: { score: number; label: string; icon: React.ElementType }) {
  const color = score >= 75 ? "#00FF8F" : score >= 50 ? "#FFB800" : "#FF4444";
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-mono font-bold text-white">
            {score}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-white/40" />
        <span className="text-xs font-mono text-white/40 uppercase tracking-wider">
          {label}
        </span>
      </div>
    </div>
  );
}

export default function AuditPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [visibleSteps, setVisibleSteps] = useState<string[]>([]);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const runAudit = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setVisibleSteps([]);

    // Clear old timers
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    // Start loading animation
    loadingSteps.forEach((step) => {
      const timer = setTimeout(() => {
        setVisibleSteps((prev) => [...prev, step.text]);
      }, step.delay);
      timersRef.current.push(timer);
    });

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Audit failed");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    }
  };

  const downloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const res = await fetch("/api/audit/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) throw new Error("PDF generation failed");

      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `seo-audit-${result?.siteAnalysis.businessName?.replace(/[^a-zA-Z0-9]/g, "-") || "report"}.pdf`;
      a.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF download failed");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const resetAudit = () => {
    setResult(null);
    setError(null);
    setUrl("");
    setVisibleSteps([]);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-white flex items-center gap-3">
          <FileSearch className="w-6 h-6 text-lume" />
          SEO Audit Tool
        </h1>
        <p className="text-sm text-white/40 font-mono mt-1">
          Comprehensive site analysis with AI-powered recommendations
        </p>
      </div>

      {/* Input Section */}
      {!result && (
        <BorderBeamCard duration={5}>
          <div className="p-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  placeholder="https://example-medspa.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !loading && runAudit()}
                  disabled={loading}
                  className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm h-11 focus-visible:ring-lume/50 focus-visible:border-lume/30"
                />
              </div>
              <Button
                onClick={runAudit}
                disabled={loading || !url.trim()}
                className="bg-lume hover:bg-lume/90 text-black font-heading font-semibold px-6 h-11 disabled:opacity-40"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Analyzing
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Run Audit
                  </div>
                )}
              </Button>
            </div>
          </div>
        </BorderBeamCard>
      )}

      {/* Loading State */}
      {loading && visibleSteps.length > 0 && (
        <TerminalLoader steps={visibleSteps} />
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="rounded-lg border border-red-400/20 bg-red-400/5 p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Audit Failed</p>
            <p className="text-sm text-white/50 mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null);
                runAudit();
              }}
              className="mt-3 border-red-400/20 text-red-400 hover:bg-red-400/10"
            >
              <RotateCcw className="w-3 h-3 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Health Score */}
          <BorderBeamCard duration={6}>
            <div className="p-8 flex flex-col items-center">
              <div className="relative w-36 h-36 mb-4">
                <svg
                  className="w-36 h-36 -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={
                      result.aiAnalysis.overallScore >= 75
                        ? "#00FF8F"
                        : result.aiAnalysis.overallScore >= 50
                          ? "#FFB800"
                          : "#FF4444"
                    }
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={
                      2 * Math.PI * 42 -
                      (result.aiAnalysis.overallScore / 100) * 2 * Math.PI * 42
                    }
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span
                    className={cn(
                      "text-4xl font-mono font-bold",
                      getScoreColor(result.aiAnalysis.overallScore)
                    )}
                  >
                    {result.aiAnalysis.overallScore}
                  </span>
                  <span className="text-xs font-mono text-white/30 uppercase tracking-wider">
                    / 100
                  </span>
                </div>
              </div>
              <h2 className="font-heading text-lg font-semibold text-white">
                SEO Health Score
              </h2>
              <p className="text-sm text-white/40 font-mono mt-1">
                {result.siteAnalysis.businessName || result.siteAnalysis.url}
              </p>
            </div>
          </BorderBeamCard>

          {/* Score Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              className={cn(
                "rounded-lg border p-5 flex flex-col items-center",
                getScoreBg(result.pageSpeed.performanceScore)
              )}
            >
              <ScoreRing
                score={result.pageSpeed.performanceScore}
                label="Performance"
                icon={Gauge}
              />
            </div>
            <div
              className={cn(
                "rounded-lg border p-5 flex flex-col items-center",
                getScoreBg(result.pageSpeed.seoScore)
              )}
            >
              <ScoreRing
                score={result.pageSpeed.seoScore}
                label="SEO"
                icon={Search}
              />
            </div>
            <div
              className={cn(
                "rounded-lg border p-5 flex flex-col items-center",
                getScoreBg(result.pageSpeed.accessibilityScore)
              )}
            >
              <ScoreRing
                score={result.pageSpeed.accessibilityScore}
                label="Accessibility"
                icon={Eye}
              />
            </div>
          </div>

          {/* Core Web Vitals */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "First Contentful Paint", value: result.pageSpeed.fcp, icon: Clock },
              { label: "Largest Contentful Paint", value: result.pageSpeed.lcp, icon: Gauge },
              { label: "Cumulative Layout Shift", value: result.pageSpeed.cls, icon: Shield },
            ].map((metric) => (
              <div
                key={metric.label}
                className="rounded-lg border border-white/10 bg-white/[0.02] p-4 text-center"
              >
                <metric.icon className="w-4 h-4 text-white/30 mx-auto mb-2" />
                <p className="text-lg font-mono font-bold text-white">
                  {metric.value}
                </p>
                <p className="text-xs font-mono text-white/30 mt-1">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>

          {/* Executive Summary */}
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-6">
            <h3 className="font-heading text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-lume" />
              Executive Summary
            </h3>
            <p className="text-sm text-white/60 leading-relaxed">
              {result.aiAnalysis.executiveSummary}
            </p>
          </div>

          {/* Issues List */}
          <div className="rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h3 className="font-heading text-sm font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                Issues Found ({result.aiAnalysis.issues.length})
              </h3>
            </div>
            <Accordion type="multiple" className="px-4">
              {result.aiAnalysis.issues.map((issue, i) => (
                <AccordionItem
                  key={i}
                  value={`issue-${i}`}
                  className="border-white/5"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3 text-left">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0",
                          getPriorityColor(issue.priority)
                        )}
                      >
                        {issue.priority}
                      </span>
                      <span className="text-sm font-medium text-white">
                        {issue.title}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="space-y-3 pl-[72px]">
                      <p className="text-sm text-white/50">
                        {issue.description}
                      </p>
                      <div className="rounded-md bg-lume/5 border border-lume/10 p-3">
                        <p className="text-xs font-mono text-lume/80 uppercase tracking-wider mb-1">
                          Recommendation
                        </p>
                        <p className="text-sm text-lume/90">
                          {issue.recommendation}
                        </p>
                      </div>
                      <div className="rounded-md bg-teal-clinical/5 border border-teal-clinical/10 p-3">
                        <p className="text-xs font-mono text-teal-clinical/80 uppercase tracking-wider mb-1">
                          Expected Impact
                        </p>
                        <p className="text-sm text-teal-clinical/90">
                          {issue.impact}
                        </p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={downloadPdf}
              disabled={downloadingPdf}
              className="bg-lume hover:bg-lume/90 text-black font-heading font-semibold px-6 h-11"
            >
              {downloadingPdf ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Generating PDF
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download PDF Report
                </div>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={resetAudit}
              className="border-white/10 text-white/60 hover:text-white hover:bg-white/5 font-heading h-11"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Run New Audit
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
