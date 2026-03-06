"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import { MessageCircle, Phone } from "lucide-react";

interface ChannelStatusProps {
  config: Record<string, unknown> | null;
}

interface ChannelInfo {
  name: string;
  key: string;
  icon: React.ReactNode;
  enabled: boolean;
  details: { label: string; value: string }[];
}

function extractChannels(config: Record<string, unknown> | null): ChannelInfo[] {
  const channels = (config?.channels ?? {}) as Record<string, unknown>;

  const telegram = (channels.telegram ?? {}) as Record<string, unknown>;
  const telegramEnabled = Boolean(telegram.botToken);
  const telegramPolicy = (telegram.policy ?? {}) as Record<string, unknown>;

  const whatsapp = (channels.whatsapp ?? {}) as Record<string, unknown>;
  const whatsappEnabled = Boolean(whatsapp.enabled ?? whatsapp.accountSid);

  return [
    {
      name: "Telegram",
      key: "telegram",
      icon: <MessageCircle className="h-4 w-4" />,
      enabled: telegramEnabled,
      details: [
        ...(telegramPolicy.defaultMode
          ? [{ label: "Default Mode", value: String(telegramPolicy.defaultMode) }]
          : []),
        ...(telegramPolicy.allowedCommands
          ? [
              {
                label: "Commands",
                value: Array.isArray(telegramPolicy.allowedCommands)
                  ? telegramPolicy.allowedCommands.join(", ")
                  : String(telegramPolicy.allowedCommands),
              },
            ]
          : []),
        ...(telegram.botToken
          ? [{ label: "Bot Token", value: String(telegram.botToken) }]
          : []),
        ...(telegram.allowedChatIds
          ? [
              {
                label: "Allowed Chats",
                value: Array.isArray(telegram.allowedChatIds)
                  ? `${telegram.allowedChatIds.length} configured`
                  : String(telegram.allowedChatIds),
              },
            ]
          : []),
      ],
    },
    {
      name: "WhatsApp",
      key: "whatsapp",
      icon: <Phone className="h-4 w-4" />,
      enabled: whatsappEnabled,
      details: [
        ...(whatsapp.accountSid
          ? [{ label: "Account SID", value: String(whatsapp.accountSid) }]
          : []),
        ...(whatsapp.phoneNumber
          ? [{ label: "Phone", value: String(whatsapp.phoneNumber) }]
          : []),
      ],
    },
  ];
}

export function ChannelStatus({ config }: ChannelStatusProps) {
  const channels = extractChannels(config);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {channels.map((channel) => (
        <Card key={channel.key} className="border-border/50 bg-card">
          <CardHeader className="pb-3 pt-4 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-muted-foreground">{channel.icon}</span>
                <CardTitle className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {channel.name}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <StatusDot
                  status={channel.enabled ? "online" : "offline"}
                  size="sm"
                  pulse={channel.enabled}
                />
                <Badge
                  variant={channel.enabled ? "default" : "secondary"}
                  className="text-[9px] font-mono uppercase tracking-wider"
                >
                  {channel.enabled ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {channel.details.length > 0 ? (
              <div className="space-y-2">
                {channel.details.map((detail) => (
                  <div
                    key={detail.label}
                    className="flex items-center justify-between border-t border-border/30 pt-2 first:border-t-0 first:pt-0"
                  >
                    <span className="text-[11px] text-muted-foreground">
                      {detail.label}
                    </span>
                    <span className="font-mono text-[11px] text-foreground/80 max-w-[180px] truncate">
                      {detail.value}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="font-mono text-[11px] text-muted-foreground/60">
                No configuration found
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
