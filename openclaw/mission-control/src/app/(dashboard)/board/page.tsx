"use client";

import { useState, useEffect, useCallback } from "react";
import { FileText, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ReportList } from "@/components/board/report-list";
import { ReportViewer } from "@/components/board/report-viewer";

interface ReportEntry {
  filename: string;
  date: string;
}

export default function BoardReports() {
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [reportContent, setReportContent] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch report list
  const fetchReports = useCallback(async () => {
    setLoadingList(true);
    setError(null);
    try {
      const res = await fetch("/api/board");
      const data = await res.json();
      if (data.error && data.reports.length === 0) {
        setError(data.error);
      }
      setReports(data.reports ?? []);
      // Auto-select latest report
      if (data.reports?.length > 0 && !selectedDate) {
        setSelectedDate(data.reports[0].date);
      }
    } catch (err) {
      setError(String(err));
      setReports([]);
    } finally {
      setLoadingList(false);
    }
  }, [selectedDate]);

  // Fetch specific report content
  const fetchReport = useCallback(async (date: string) => {
    setLoadingReport(true);
    setReportContent(null);
    try {
      const res = await fetch(`/api/board/${date}`);
      const data = await res.json();
      if (res.ok) {
        setReportContent(data.content);
      } else {
        setReportContent(null);
        setError(data.error ?? "Failed to load report");
      }
    } catch (err) {
      setReportContent(null);
      setError(String(err));
    } finally {
      setLoadingReport(false);
    }
  }, []);

  // Load report list on mount
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Load report content when selection changes
  useEffect(() => {
    if (selectedDate) {
      fetchReport(selectedDate);
    }
  }, [selectedDate, fetchReport]);

  // Loading skeleton for sidebar
  const sidebarSkeleton = (
    <div className="p-3 space-y-2">
      <Skeleton className="h-3 w-16 mb-3" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );

  // Empty state
  if (!loadingList && reports.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Board Reports</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchReports}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">
            No board reports found.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Reports will appear here after the nightly board advisory runs.
          </p>
          {error && (
            <p className="text-xs text-destructive/70 mt-3 font-mono max-w-md">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Board Reports</h1>
          <Badge variant="secondary" className="font-mono text-[11px]">
            {reports.length} report{reports.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchReports}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      {/* Main layout: sidebar + viewer */}
      <div className="flex gap-0 rounded-lg border border-border/40 bg-card/40 overflow-hidden min-h-[calc(100vh-10rem)]">
        {/* Sidebar: Report list */}
        <div className="w-60 shrink-0 border-r border-border/30 bg-card/60">
          {loadingList ? (
            sidebarSkeleton
          ) : (
            <ReportList
              reports={reports}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
            />
          )}
        </div>

        {/* Content: Report viewer */}
        <div className="flex-1 min-w-0">
          <ScrollArea className="h-[calc(100vh-10rem)]">
            <ReportViewer
              content={reportContent}
              date={selectedDate}
              loading={loadingReport}
            />
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
