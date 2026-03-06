"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GatewayConfig } from "@/components/settings/gateway-config";
import { ChannelStatus } from "@/components/settings/channel-status";
import { EnvVars } from "@/components/settings/env-vars";
import { ConnectionStatus } from "@/components/settings/connection-status";
import { Settings, Server, Radio, Lock, Wifi } from "lucide-react";

export default function SettingsPage() {
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
            System Configuration & Diagnostics
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="gateway" className="w-full">
        <TabsList className="bg-muted/50 border border-border/30">
          <TabsTrigger value="gateway" className="gap-1.5 text-[11px] font-mono uppercase tracking-wider">
            <Server className="h-3 w-3" />
            Gateway
          </TabsTrigger>
          <TabsTrigger value="channels" className="gap-1.5 text-[11px] font-mono uppercase tracking-wider">
            <Radio className="h-3 w-3" />
            Channels
          </TabsTrigger>
          <TabsTrigger value="environment" className="gap-1.5 text-[11px] font-mono uppercase tracking-wider">
            <Lock className="h-3 w-3" />
            Environment
          </TabsTrigger>
          <TabsTrigger value="connection" className="gap-1.5 text-[11px] font-mono uppercase tracking-wider">
            <Wifi className="h-3 w-3" />
            Connection
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gateway" className="mt-4">
          <GatewayConfig onConfigLoaded={setConfig} />
        </TabsContent>

        <TabsContent value="channels" className="mt-4">
          <ChannelStatus config={config} />
        </TabsContent>

        <TabsContent value="environment" className="mt-4">
          <EnvVars config={config} />
        </TabsContent>

        <TabsContent value="connection" className="mt-4">
          <ConnectionStatus />
        </TabsContent>
      </Tabs>
    </div>
  );
}
