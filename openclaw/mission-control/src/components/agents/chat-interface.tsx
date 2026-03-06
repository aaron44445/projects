"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AGENTS, type AgentDef } from "./agent-detail-card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  Terminal,
  Loader2,
  User,
  Bot,
  ChevronRight,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  agentId: string;
  agentLabel: string;
  timestamp: number;
}

export function ChatInterface() {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(AGENTS[0].id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedAgent: AgentDef =
    AGENTS.find((a) => a.id === selectedAgentId) ?? AGENTS[0];

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector(
        '[data-slot="scroll-area-viewport"]'
      );
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      agentId: selectedAgentId,
      agentLabel: selectedAgent.label,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgentId,
          message: trimmed,
        }),
      });

      const data = await res.json();

      const agentMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "agent",
        content: data.response ?? data.error ?? "No response received.",
        agentId: selectedAgentId,
        agentLabel: selectedAgent.label,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "agent",
        content: `Connection error: ${err instanceof Error ? err.message : "Failed to reach gateway."}`,
        agentId: selectedAgentId,
        agentLabel: selectedAgent.label,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-420px)] min-h-[400px] rounded-lg border border-border/50 bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3 bg-secondary/30">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary border border-border/50">
            <Terminal className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight">
              Agent Console
            </span>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono text-xs text-primary">
              {selectedAgent.label}
            </span>
          </div>
        </div>

        <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
          <SelectTrigger className="w-[200px] h-8 text-xs font-mono bg-secondary/50 border-border/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AGENTS.map((agent) => (
              <SelectItem
                key={agent.id}
                value={agent.id}
                className="font-mono text-xs"
              >
                {agent.label} ({agent.id})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 overflow-hidden" ref={scrollRef}>
        <div className="p-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/60 border border-border/40 mb-4">
                <Bot className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                No messages yet
              </p>
              <p className="text-xs text-muted-foreground/60 font-mono">
                Send a message to{" "}
                <span className="text-primary">{selectedAgent.label}</span> to
                begin
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "agent" && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary border border-border/50 mt-0.5">
                  <Bot className="h-3 w-3 text-primary" />
                </div>
              )}

              <div
                className={`max-w-[75%] rounded-lg px-3.5 py-2.5 ${
                  msg.role === "user"
                    ? "bg-primary/15 border border-primary/20 text-foreground"
                    : "bg-secondary/60 border border-border/40 text-foreground"
                }`}
              >
                {/* Message header */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`font-mono text-[10px] font-medium uppercase tracking-wider ${
                      msg.role === "user"
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {msg.role === "user" ? "You" : msg.agentLabel}
                  </span>
                  <span className="font-mono text-[9px] text-muted-foreground/50">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>

                {/* Message body */}
                <div
                  className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    msg.role === "agent" ? "font-mono text-[13px]" : ""
                  }`}
                >
                  {msg.content}
                </div>
              </div>

              {msg.role === "user" && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary/20 border border-primary/30 mt-0.5">
                  <User className="h-3 w-3 text-primary" />
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary border border-border/50 mt-0.5">
                <Bot className="h-3 w-3 text-primary" />
              </div>
              <div className="bg-secondary/60 border border-border/40 rounded-lg px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                    {selectedAgent.label} is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t border-border/50 bg-secondary/20 p-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-muted-foreground/40 select-none">
            <ChevronRight className="h-3 w-3" />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${selectedAgent.label}...`}
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm font-mono text-foreground placeholder:text-muted-foreground/40 outline-none disabled:opacity-50"
          />
          <Button
            size="icon-sm"
            variant={input.trim() ? "default" : "ghost"}
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
