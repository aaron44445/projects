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
  Trash2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

const AGENT_COLORS: Record<string, string> = {
  main: "#00ff41",
  marketer: "#ff69b4",
  "board-moderator": "#9b59b6",
  builder: "#ff6600",
  enforcer: "#F59E0B",
};

interface ChatMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  agentId: string;
  agentLabel: string;
  timestamp: number;
  isError?: boolean;
  isRetried?: boolean;
}

const STORAGE_KEY = "mc-chat-messages";
const SESSION_KEY_PREFIX = "mc:chat:";

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMessages(msgs: ChatMessage[]) {
  try {
    // Keep last 500 messages max
    const trimmed = msgs.slice(-500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage full or unavailable
  }
}

export function ChatInterface() {
  const [selectedAgentId, setSelectedAgentId] = useState<string>(AGENTS[0].id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Session key per agent — persists across messages, resets on agent switch
  const sessionKeyRef = useRef<Record<string, string>>({});
  function getSessionKey(agentId: string): string {
    if (!sessionKeyRef.current[agentId]) {
      sessionKeyRef.current[agentId] = `${SESSION_KEY_PREFIX}${agentId}:${Date.now()}`;
    }
    return sessionKeyRef.current[agentId];
  }

  // Load messages from localStorage on mount
  useEffect(() => {
    setMessages(loadMessages());
  }, []);

  // Save messages to localStorage on change (skip initial empty load)
  const hasLoaded = useRef(false);
  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      return;
    }
    saveMessages(messages);
  }, [messages]);

  // Elapsed time counter
  useEffect(() => {
    if (isLoading) {
      setElapsedSeconds(0);
      elapsedRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (elapsedRef.current) {
        clearInterval(elapsedRef.current);
        elapsedRef.current = null;
      }
      setElapsedSeconds(0);
    }
    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, [isLoading]);

  const selectedAgent: AgentDef =
    AGENTS.find((a) => a.id === selectedAgentId) ?? AGENTS[0];

  const agentColor = AGENT_COLORS[selectedAgentId] ?? "#00ff41";

  // Filter messages for selected agent
  const agentMessages = messages.filter((m) => m.agentId === selectedAgentId);

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
  }, [agentMessages.length, scrollToBottom]);

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

    // Client-side timeout
    abortRef.current = new AbortController();
    const timeout = setTimeout(() => abortRef.current?.abort(), 130_000);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          agentId: selectedAgentId,
          message: trimmed,
          sessionKey: getSessionKey(selectedAgentId),
        }),
      });

      const data = await res.json();

      if (data.error) {
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "agent",
          content: data.error,
          agentId: selectedAgentId,
          agentLabel: selectedAgent.label,
          timestamp: Date.now(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
      } else {
        const agentMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "agent",
          content: data.response ?? "No response received.",
          agentId: selectedAgentId,
          agentLabel: selectedAgent.label,
          timestamp: Date.now(),
          isRetried: data.retried ?? false,
        };
        setMessages((prev) => [...prev, agentMessage]);
      }
    } catch (err) {
      const isAbort = err instanceof DOMException && err.name === "AbortError";
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "agent",
        content: isAbort
          ? "Timed out waiting for response. The model may be slow — try again."
          : `Connection error: ${err instanceof Error ? err.message : "Failed to reach gateway."}`,
        agentId: selectedAgentId,
        agentLabel: selectedAgent.label,
        timestamp: Date.now(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      clearTimeout(timeout);
      abortRef.current = null;
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const clearChat = () => {
    setMessages((prev) => prev.filter((m) => m.agentId !== selectedAgentId));
    // Reset session key for this agent
    delete sessionKeyRef.current[selectedAgentId];
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
      {/* Header with agent color accent */}
      <div
        className="flex items-center justify-between border-b border-border/50 px-4 py-3 bg-secondary/30"
        style={{ borderTopColor: agentColor, borderTopWidth: "2px", borderTopStyle: "solid" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border/50"
            style={{ backgroundColor: `${agentColor}15` }}
          >
            <Terminal className="h-3.5 w-3.5" style={{ color: agentColor }} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight">
              Agent Console
            </span>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <span className="font-mono text-xs" style={{ color: agentColor }}>
              {selectedAgent.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {agentMessages.length > 0 && (
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={clearChat}
              title="Clear chat"
              className="h-8 w-8"
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}
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
                  <span style={{ color: AGENT_COLORS[agent.id] ?? "#888" }}>
                    {agent.label}
                  </span>{" "}
                  ({agent.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1 overflow-hidden" ref={scrollRef}>
        <div className="p-4 space-y-3">
          {agentMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full border border-border/40 mb-4"
                style={{ backgroundColor: `${agentColor}10` }}
              >
                <Bot className="h-6 w-6" style={{ color: agentColor }} />
              </div>
              <p className="text-sm text-muted-foreground mb-1">
                No messages yet
              </p>
              <p className="text-xs text-muted-foreground/60 font-mono">
                Send a message to{" "}
                <span style={{ color: agentColor }}>{selectedAgent.label}</span> to
                begin
              </p>
            </div>
          )}

          {agentMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "agent" && (
                <div
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/50 mt-0.5"
                  style={{
                    backgroundColor: msg.isError ? "#ff2d2d15" : `${agentColor}15`,
                  }}
                >
                  {msg.isError ? (
                    <AlertTriangle className="h-3 w-3 text-[#ff2d2d]" />
                  ) : (
                    <Bot className="h-3 w-3" style={{ color: agentColor }} />
                  )}
                </div>
              )}

              <div
                className={`max-w-[75%] rounded-lg px-3.5 py-2.5 ${
                  msg.role === "user"
                    ? "bg-primary/15 border border-primary/20 text-foreground"
                    : msg.isError
                      ? "bg-[#ff2d2d]/10 border border-[#ff2d2d]/30 text-foreground"
                      : "bg-secondary/60 border border-border/40 text-foreground"
                }`}
              >
                {/* Message header */}
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="font-mono text-[10px] font-medium uppercase tracking-wider"
                    style={{
                      color: msg.role === "user"
                        ? undefined
                        : msg.isError
                          ? "#ff2d2d"
                          : agentColor,
                    }}
                  >
                    {msg.role === "user" ? "You" : msg.isError ? "ERROR" : msg.agentLabel}
                  </span>
                  <span className="font-mono text-[9px] text-muted-foreground/50">
                    {formatTime(msg.timestamp)}
                  </span>
                  {msg.isRetried && (
                    <span className="flex items-center gap-0.5 font-mono text-[8px] text-[#ffa500]">
                      <RotateCcw className="h-2 w-2" />
                      retried
                    </span>
                  )}
                </div>

                {/* Message body */}
                <div
                  className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    msg.role === "agent" ? "font-mono text-[13px]" : ""
                  } ${msg.isError ? "text-[#ff2d2d]/90" : ""}`}
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

          {/* Loading indicator with elapsed time */}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/50 mt-0.5"
                style={{ backgroundColor: `${agentColor}15` }}
              >
                <Bot className="h-3 w-3" style={{ color: agentColor }} />
              </div>
              <div className="bg-secondary/60 border border-border/40 rounded-lg px-3.5 py-2.5">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" style={{ color: agentColor }} />
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                    {selectedAgent.label} is thinking...
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground/50">
                    ({elapsedSeconds}s)
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
            <ChevronRight className="h-3 w-3" style={{ color: agentColor }} />
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
