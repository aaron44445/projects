"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";

interface EnvVarsProps {
  config: Record<string, unknown> | null;
}

function extractEnvVars(
  config: Record<string, unknown> | null
): { key: string; value: string }[] {
  const env = (config?.env ?? {}) as Record<string, unknown>;
  const vars = (env.vars ?? {}) as Record<string, string>;
  return Object.entries(vars).map(([key, value]) => ({
    key,
    value: String(value),
  }));
}

export function EnvVars({ config }: EnvVarsProps) {
  const vars = extractEnvVars(config);

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Environment Variables
            </CardTitle>
          </div>
          <Badge
            variant="outline"
            className="text-[9px] font-mono uppercase tracking-wider border-border/50 text-muted-foreground"
          >
            {vars.length} vars
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {vars.length === 0 ? (
          <p className="font-mono text-[11px] text-muted-foreground/60">
            No environment variables configured
          </p>
        ) : (
          <div className="rounded-md bg-[oklch(0.06_0.01_280)] border border-border/30 divide-y divide-border/20">
            {vars.map(({ key, value }) => (
              <div
                key={key}
                className="flex items-center justify-between px-3 py-2.5 gap-4"
              >
                <span className="font-mono text-xs text-foreground/90 shrink-0">
                  {key}
                </span>
                <span className="font-mono text-xs text-muted-foreground/50 tracking-widest select-none">
                  {value}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
