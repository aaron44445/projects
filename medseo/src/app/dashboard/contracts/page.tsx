"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { BorderBeamCard } from "@/components/border-beam";
import {
  ScrollText,
  Plus,
  X,
  Download,
  AlertTriangle,
} from "lucide-react";

const DEFAULT_SERVICES = [
  "On-page SEO optimization",
  "Google Business Profile management",
  "Monthly SEO content creation (4 blog posts)",
  "Technical SEO monitoring & fixes",
  "Monthly performance reporting",
];

export default function ContractsPage() {
  const [clientName, setClientName] = useState("");
  const [services, setServices] = useState<string[]>(DEFAULT_SERVICES);
  const [newService, setNewService] = useState("");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function addService() {
    if (!newService.trim()) return;
    setServices([...services, newService.trim()]);
    setNewService("");
  }

  function removeService(index: number) {
    setServices(services.filter((_, i) => i !== index));
  }

  async function handleGenerate() {
    if (!clientName.trim() || !monthlyPrice || services.length === 0) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/contract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: clientName.trim(),
          services,
          monthlyPrice: parseInt(monthlyPrice),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate contract");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `injectseo-contract-${clientName.trim().replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate contract"
      );
    } finally {
      setLoading(false);
    }
  }

  const canGenerate =
    clientName.trim() && monthlyPrice && services.length > 0;

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Page Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">
          Contract Generator
        </h1>
        <p className="text-sm text-white/40 mt-1 font-mono">
          Generate a branded service agreement PDF for new clients
        </p>
      </div>

      <BorderBeamCard duration={5}>
        <div className="p-6 space-y-6">
          {/* Client Name */}
          <div className="space-y-2">
            <Label className="text-xs font-mono text-white/40 uppercase tracking-wider flex items-center gap-1.5">
              <ScrollText className="w-3 h-3" />
              Client Name
            </Label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Glow Med Spa LLC"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm h-10"
            />
          </div>

          {/* Monthly Price */}
          <div className="space-y-2">
            <Label className="text-xs font-mono text-white/40 uppercase tracking-wider">
              Monthly Retainer ($)
            </Label>
            <Input
              type="number"
              value={monthlyPrice}
              onChange={(e) => setMonthlyPrice(e.target.value)}
              placeholder="2500"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm h-10"
            />
          </div>

          {/* Services */}
          <div className="space-y-3">
            <Label className="text-xs font-mono text-white/40 uppercase tracking-wider">
              Scope of Services
            </Label>
            <div className="space-y-2">
              {services.map((service, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2"
                >
                  <span className="text-sm text-white/70 font-mono flex-1">
                    {service}
                  </span>
                  <button
                    onClick={() => removeService(i)}
                    className="text-white/20 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addService()}
                placeholder="Add a service..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 font-mono text-sm h-9"
              />
              <Button
                onClick={addService}
                disabled={!newService.trim()}
                variant="outline"
                className="border-white/10 text-white/60 hover:text-white h-9 px-3"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-400 font-mono">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={loading || !canGenerate}
            className="w-full bg-lume hover:bg-lume/90 text-black font-heading font-semibold h-11"
          >
            <Download className="w-4 h-4" />
            {loading ? "Generating PDF..." : "Generate Contract PDF"}
          </Button>
        </div>
      </BorderBeamCard>

      {/* Info */}
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
        <h3 className="font-heading text-sm font-semibold text-white mb-2">
          Contract Includes
        </h3>
        <ul className="space-y-1 text-xs font-mono text-white/40">
          <li>InjectSEO branding and header</li>
          <li>Party identification (Agency + Client)</li>
          <li>Detailed scope of services</li>
          <li>Monthly retainer and payment terms (due 1st via Stripe)</li>
          <li>3-month minimum term</li>
          <li>30-day written cancellation notice</li>
          <li>Confidentiality clause</li>
          <li>Signature lines with date fields</li>
        </ul>
      </div>
    </div>
  );
}
