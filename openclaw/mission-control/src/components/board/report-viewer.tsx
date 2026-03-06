"use client";

import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Calendar } from "lucide-react";

interface ReportViewerProps {
  content: string | null;
  date: string | null;
  loading: boolean;
}

/**
 * Determine the accent border color for a heading based on its text.
 * - Green: achievements, completed, done, wins, success, delivered
 * - Amber: issues, improvements, risks, concerns, blockers, warnings, challenges
 * - Blue: plans, next, upcoming, action items, recommendations, priorities, strategy
 */
function getHeadingAccent(text: string): string {
  const lower = text.toLowerCase();

  const greenKeywords = [
    "achievement",
    "completed",
    "done",
    "win",
    "success",
    "delivered",
    "accomplishment",
    "highlight",
    "progress",
    "milestone",
  ];
  const amberKeywords = [
    "issue",
    "improvement",
    "risk",
    "concern",
    "blocker",
    "warning",
    "challenge",
    "problem",
    "obstacle",
    "weakness",
    "threat",
    "gap",
  ];
  const blueKeywords = [
    "plan",
    "next",
    "upcoming",
    "action",
    "recommendation",
    "priority",
    "strategy",
    "future",
    "goal",
    "objective",
    "initiative",
    "proposal",
    "forecast",
  ];

  if (greenKeywords.some((k) => lower.includes(k))) {
    return "border-l-status-green";
  }
  if (amberKeywords.some((k) => lower.includes(k))) {
    return "border-l-status-amber";
  }
  if (blueKeywords.some((k) => lower.includes(k))) {
    return "border-l-status-blue";
  }
  return "border-l-primary";
}

function formatDateHeader(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T12:00:00");
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/** Custom markdown components styled for the dark tactical theme */
const markdownComponents: Components = {
  h1: ({ children }) => {
    const text = String(children);
    const accent = getHeadingAccent(text);
    return (
      <h1
        className={`text-xl font-bold mt-8 mb-4 pb-2 pl-3 border-l-4 ${accent} border-b border-border/30 text-foreground`}
      >
        {children}
      </h1>
    );
  },
  h2: ({ children }) => {
    const text = String(children);
    const accent = getHeadingAccent(text);
    return (
      <h2
        className={`text-lg font-semibold mt-6 mb-3 pl-3 border-l-3 ${accent} text-foreground/90`}
      >
        {children}
      </h2>
    );
  },
  h3: ({ children }) => {
    const text = String(children);
    const accent = getHeadingAccent(text);
    return (
      <h3
        className={`text-base font-semibold mt-4 mb-2 pl-3 border-l-2 ${accent} text-foreground/80`}
      >
        {children}
      </h3>
    );
  },
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold mt-3 mb-1.5 text-foreground/70 uppercase tracking-wide">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="text-sm leading-relaxed text-foreground/70 mb-3">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="space-y-1.5 mb-4 ml-1">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="space-y-1.5 mb-4 ml-1 list-decimal list-inside">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-sm text-foreground/70 flex gap-2">
      <span className="text-primary/50 mt-1.5 shrink-0">--</span>
      <span className="leading-relaxed">{children}</span>
    </li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground/90">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="text-primary/80 not-italic font-medium">{children}</em>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-status-amber/50 pl-4 py-1 my-3 bg-status-amber/5 rounded-r">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code
          className={`block bg-[oklch(0.1_0.01_280)] rounded-lg p-4 my-3 text-xs font-mono text-foreground/80 overflow-x-auto border border-border/30 ${
            className ?? ""
          }`}
        >
          {children}
        </code>
      );
    }
    return (
      <code className="bg-secondary/60 text-primary/90 px-1.5 py-0.5 rounded text-xs font-mono">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-[oklch(0.1_0.01_280)] rounded-lg p-4 my-3 overflow-x-auto border border-border/30">
      {children}
    </pre>
  ),
  hr: () => (
    <hr className="my-6 border-border/30" />
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-4 rounded-lg border border-border/30">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-secondary/30 border-b border-border/30">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="text-left text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold px-3 py-2">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-sm text-foreground/70 border-b border-border/20">
      {children}
    </td>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/30"
    >
      {children}
    </a>
  ),
};

export function ReportViewer({ content, date, loading }: ReportViewerProps) {
  // Loading skeleton
  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-48" />
        <div className="space-y-3 mt-6">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
          <Skeleton className="h-20 w-full mt-2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-16 w-full mt-2" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  // Empty state -- no report selected
  if (!content || !date) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <FileText className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <p className="text-sm text-muted-foreground/60">
          Select a report from the sidebar to view the board briefing.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-none">
      {/* Briefing header */}
      <div className="mb-6 pb-4 border-b border-border/30">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] uppercase tracking-widest text-primary/60 font-semibold font-mono">
            Board Advisory Report
          </span>
          <div className="flex-1 h-px bg-border/20" />
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-mono">
            Classified
          </span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground/50" />
          <span className="text-sm font-mono text-muted-foreground/70">
            {formatDateHeader(date)}
          </span>
        </div>
      </div>

      {/* Markdown content */}
      <article className="prose-none">
        <ReactMarkdown components={markdownComponents}>
          {content}
        </ReactMarkdown>
      </article>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-border/20">
        <p className="text-[10px] font-mono text-muted-foreground/30 text-center uppercase tracking-widest">
          End of Report -- {date}
        </p>
      </div>
    </div>
  );
}
