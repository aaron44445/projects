"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Skeleton } from "@/components/ui/skeleton";
import type { WidgetConfig } from "@/lib/types";

export function MarkdownViewer({ config }: { config: WidgetConfig }) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for inline content first
    if (config.config?.content && typeof config.config.content === "string") {
      setContent(config.config.content);
      return;
    }

    if (!config.data) {
      setContent(null);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(
          `/api/files?path=${encodeURIComponent(config.data!)}`
        );
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const data = await res.json();

        // The API returns { content: "..." } for non-JSON files
        if (typeof data === "string") {
          setContent(data);
        } else if (data.content && typeof data.content === "string") {
          setContent(data.content);
        } else {
          // JSON data - render as formatted JSON markdown
          setContent(
            "```json\n" + JSON.stringify(data, null, 2) + "\n```"
          );
        }
      } catch (err) {
        setError(String(err));
      }
    };

    fetchData();
  }, [config.data, config.config?.content]);

  if (error) {
    return (
      <div className="text-xs text-red-400/80 py-2">
        Failed to load content
      </div>
    );
  }

  if (content === null && config.data) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-5/6 rounded" />
        <Skeleton className="h-4 w-2/3 rounded" />
      </div>
    );
  }

  if (content === null) {
    return (
      <div className="flex items-center justify-center h-16 text-xs text-muted-foreground">
        No content configured
      </div>
    );
  }

  const maxHeight = (config.config?.maxHeight as number) ?? 300;

  return (
    <div
      className="overflow-y-auto scrollbar-thin"
      style={{ maxHeight }}
    >
      <div className="prose prose-invert prose-xs max-w-none
        prose-headings:text-foreground prose-headings:font-semibold prose-headings:tracking-tight
        prose-h1:text-sm prose-h2:text-xs prose-h3:text-xs
        prose-p:text-[11px] prose-p:leading-relaxed prose-p:text-muted-foreground
        prose-li:text-[11px] prose-li:text-muted-foreground
        prose-strong:text-foreground prose-strong:font-semibold
        prose-code:text-[10px] prose-code:font-mono prose-code:bg-background/60 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
        prose-pre:bg-background/60 prose-pre:border prose-pre:border-border/30 prose-pre:rounded-md prose-pre:text-[10px]
        prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
        prose-blockquote:border-border/40 prose-blockquote:text-muted-foreground prose-blockquote:text-[11px]
        prose-hr:border-border/30
        prose-table:text-[10px]
        prose-th:text-muted-foreground prose-th:font-medium prose-th:uppercase prose-th:tracking-wider
        prose-td:text-foreground
      ">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
