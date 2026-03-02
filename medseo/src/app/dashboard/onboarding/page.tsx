"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BorderBeamCard } from "@/components/border-beam";
import {
  ClipboardList,
  Copy,
  CheckCircle2,
} from "lucide-react";

interface OnboardingData {
  businessName: string;
  address: string;
  phone: string;
  website: string;
  gbpEmail: string;
  targetKeywords: string;
  competitors: string;
  communication: string;
  notes: string;
}

const INITIAL_DATA: OnboardingData = {
  businessName: "",
  address: "",
  phone: "",
  website: "",
  gbpEmail: "",
  targetKeywords: "",
  competitors: "",
  communication: "",
  notes: "",
};

function generateBrief(data: OnboardingData): string {
  const lines: string[] = [];

  lines.push("=".repeat(50));
  lines.push("CLIENT ONBOARDING BRIEF");
  lines.push("InjectSEO");
  lines.push(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`);
  lines.push("=".repeat(50));
  lines.push("");

  lines.push("--- BUSINESS INFO ---");
  lines.push(`Business Name: ${data.businessName || "N/A"}`);
  lines.push(`Address: ${data.address || "N/A"}`);
  lines.push(`Phone: ${data.phone || "N/A"}`);
  lines.push(`Website: ${data.website || "N/A"}`);
  lines.push(`GBP Email: ${data.gbpEmail || "N/A"}`);
  lines.push("");

  lines.push("--- TARGET KEYWORDS / SERVICES ---");
  if (data.targetKeywords.trim()) {
    data.targetKeywords
      .split("\n")
      .filter((l) => l.trim())
      .forEach((kw) => lines.push(`  - ${kw.trim()}`));
  } else {
    lines.push("  N/A");
  }
  lines.push("");

  lines.push("--- KNOWN COMPETITORS ---");
  if (data.competitors.trim()) {
    data.competitors
      .split("\n")
      .filter((l) => l.trim())
      .forEach((c) => lines.push(`  - ${c.trim()}`));
  } else {
    lines.push("  N/A");
  }
  lines.push("");

  lines.push("--- COMMUNICATION ---");
  lines.push(`Preferred: ${data.communication || "Not specified"}`);
  lines.push("");

  if (data.notes.trim()) {
    lines.push("--- ADDITIONAL NOTES ---");
    lines.push(data.notes.trim());
    lines.push("");
  }

  lines.push("=".repeat(50));

  return lines.join("\n");
}

export default function OnboardingPage() {
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [brief, setBrief] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function updateField(field: keyof OnboardingData, value: string) {
    setData({ ...data, [field]: value });
  }

  function handleGenerate() {
    const text = generateBrief(data);
    setBrief(text);
  }

  function handleCopy() {
    if (!brief) return;
    navigator.clipboard.writeText(brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">
          Client Onboarding
        </h1>
        <p className="text-sm text-white/40 mt-1 font-mono">
          Collect client info and generate a structured brief for the team
        </p>
      </div>

      <BorderBeamCard duration={5}>
        <div className="p-6 space-y-6">
          {/* Business Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 mb-2">
              <ClipboardList className="w-3.5 h-3.5 text-white/40" />
              <span className="text-xs font-mono text-white/40 uppercase tracking-wider">
                Business Information
              </span>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-mono text-white/40 uppercase tracking-wider">
                Business Name
              </Label>
              <Input
                value={data.businessName}
                onChange={(e) => updateField("businessName", e.target.value)}
                placeholder="Glow Med Spa"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm h-10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-mono text-white/40 uppercase tracking-wider">
                Business Address
              </Label>
              <Input
                value={data.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="123 Main St, Austin, TX 78701"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm h-10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs font-mono text-white/40 uppercase tracking-wider">
                  Phone
                </Label>
                <Input
                  value={data.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="(512) 555-1234"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm h-10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-mono text-white/40 uppercase tracking-wider">
                  Website URL
                </Label>
                <Input
                  value={data.website}
                  onChange={(e) => updateField("website", e.target.value)}
                  placeholder="https://glowmedspa.com"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm h-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-mono text-white/40 uppercase tracking-wider">
                Google Business Profile Email
              </Label>
              <Input
                value={data.gbpEmail}
                onChange={(e) => updateField("gbpEmail", e.target.value)}
                placeholder="owner@glowmedspa.com"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm h-10"
              />
            </div>
          </div>

          {/* SEO Details */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <span className="text-xs font-mono text-white/40 uppercase tracking-wider">
              SEO Details
            </span>

            <div className="space-y-2">
              <Label className="text-xs font-mono text-white/40 uppercase tracking-wider">
                Top 5 Target Keywords / Services
              </Label>
              <Textarea
                value={data.targetKeywords}
                onChange={(e) => updateField("targetKeywords", e.target.value)}
                placeholder={"Botox Austin\nLip filler Austin TX\nMed spa near me\nCoolSculpting Austin\nFacial rejuvenation"}
                rows={5}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-mono text-white/40 uppercase tracking-wider">
                Known Competitors
              </Label>
              <Textarea
                value={data.competitors}
                onChange={(e) => updateField("competitors", e.target.value)}
                placeholder={"Competitor A - competitora.com\nCompetitor B - competitorb.com"}
                rows={3}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm resize-none"
              />
            </div>
          </div>

          {/* Communication */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <div className="space-y-2">
              <Label className="text-xs font-mono text-white/40 uppercase tracking-wider">
                Preferred Communication
              </Label>
              <Select
                value={data.communication}
                onValueChange={(v) => updateField("communication", v)}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white text-sm w-full">
                  <SelectValue placeholder="Select preference..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1B] border-white/10">
                  <SelectItem
                    value="email"
                    className="text-white/80 focus:bg-white/10 focus:text-white"
                  >
                    Email
                  </SelectItem>
                  <SelectItem
                    value="phone"
                    className="text-white/80 focus:bg-white/10 focus:text-white"
                  >
                    Phone
                  </SelectItem>
                  <SelectItem
                    value="text"
                    className="text-white/80 focus:bg-white/10 focus:text-white"
                  >
                    Text
                  </SelectItem>
                  <SelectItem
                    value="slack"
                    className="text-white/80 focus:bg-white/10 focus:text-white"
                  >
                    Slack
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-mono text-white/40 uppercase tracking-wider">
                Additional Notes
              </Label>
              <Textarea
                value={data.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Any other details about the client, their goals, or special requests..."
                rows={3}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm resize-none"
              />
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!data.businessName.trim()}
            className="w-full bg-lume hover:bg-lume/90 text-black font-heading font-semibold h-11"
          >
            <ClipboardList className="w-4 h-4" />
            Generate Client Brief
          </Button>
        </div>
      </BorderBeamCard>

      {/* Brief Output */}
      {brief && (
        <div className="rounded-lg border border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <span className="text-xs font-mono text-white/40 uppercase tracking-wider">
              Client Brief
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs font-mono text-white/30 hover:text-lume transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-lume" />
                  <span className="text-lume">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy to Clipboard
                </>
              )}
            </button>
          </div>
          <pre className="p-4 text-sm text-white/70 font-mono whitespace-pre-wrap overflow-x-auto">
            {brief}
          </pre>
        </div>
      )}
    </div>
  );
}
