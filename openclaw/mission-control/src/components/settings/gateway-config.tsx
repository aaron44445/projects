"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

interface GatewayConfigProps {
  onConfigLoaded?: (config: Record<string, unknown>) => void;
}

export function GatewayConfig({ onConfigLoaded }: GatewayConfigProps) {
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/config");
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      setConfig(data);
      onConfigLoaded?.(data);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Gateway Configuration
          </CardTitle>
          <button
            onClick={fetchConfig}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            aria-label="Refresh config"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : error ? (
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-[10px]">ERROR</Badge>
            <span className="font-mono text-xs text-destructive">{error}</span>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute top-2 right-2">
              <Badge variant="outline" className="text-[9px] font-mono uppercase tracking-wider border-border/50 text-muted-foreground">
                JSON
              </Badge>
            </div>
            <pre className="overflow-auto rounded-md bg-[oklch(0.06_0.01_280)] border border-border/30 p-4 max-h-[500px] scrollbar-thin">
              <code className="font-mono text-xs leading-relaxed text-foreground/80">
                {JSON.stringify(config, null, 2)}
              </code>
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
