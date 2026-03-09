export type BuildingId = "barracks" | "outreach-hq" | "content-lab" | "comms-tower" | "intel-room" | "war-room";

export const JOB_TO_BUILDING: Record<string, BuildingId> = {
  // Outreach HQ — emails, DMs, follow-ups
  "outreach-send": "outreach-hq",
  "follow-up-send": "outreach-hq",
  "dm-outreach": "outreach-hq",

  // Content Lab — blog, SEO, social
  "content-creation": "content-lab",

  // Comms Tower — replies, inbox, Telegram
  "reply-check-afternoon": "comms-tower",
  "reply-check-evening": "comms-tower",
  "inbox-forward": "comms-tower",
  "ig-reply-monitor": "comms-tower",

  // Intel Room — leads, research, enrichment
  "lead-discovery": "intel-room",
  "lead-enrichment": "intel-room",
  "weekly-lead-refresh": "intel-room",

  // War Room — board, strategy, reports
  "board-data-gather": "war-room",
  "board-expert-analysis": "war-room",
  "board-moderator-synthesis": "war-room",
  "weekly-strategy-review": "war-room",
  "weekly-report": "war-room",
  "self-improvement": "war-room",
  "morning-briefing": "war-room",

  // Enforcer — patrols (special case, War Room as base)
  "enforcer-patrol": "war-room",
  "enforcer-morning-report": "war-room",
  "enforcer-evening-report": "war-room",
};

export function getBuildingForJob(jobId: string): BuildingId {
  // Direct match first
  for (const [key, building] of Object.entries(JOB_TO_BUILDING)) {
    if (jobId === key || jobId.startsWith(key)) return building;
  }
  // Partial matches for dynamic IDs
  if (jobId.includes("reply") || jobId.includes("inbox") || jobId.includes("forward")) return "comms-tower";
  if (jobId.includes("lead") || jobId.includes("enrich") || jobId.includes("discover")) return "intel-room";
  if (jobId.includes("outreach") || jobId.includes("email") || jobId.includes("dm")) return "outreach-hq";
  if (jobId.includes("content") || jobId.includes("blog") || jobId.includes("seo")) return "content-lab";
  if (jobId.includes("board") || jobId.includes("strategy") || jobId.includes("report")) return "war-room";
  return "barracks";
}
