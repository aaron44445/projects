import { NextRequest, NextResponse } from "next/server";
import { searchMedSpas, type PlaceResult } from "@/lib/google-places";
import Anthropic from "@anthropic-ai/sdk";

interface SiteCheck {
  hasMetaDescription: boolean;
  hasBlog: boolean;
  reachable: boolean;
}

interface ScoredLead extends PlaceResult {
  priority: "HIGH" | "MEDIUM" | "LOW";
  priorityReason: string;
  siteCheck?: SiteCheck;
}

async function quickSiteCheck(url: string): Promise<SiteCheck> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "InjectSEO-LeadChecker/1.0" },
    });
    clearTimeout(timeout);

    const html = await response.text();

    const descMatch =
      html.match(
        /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i
      ) ||
      html.match(
        /<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i
      );
    const hasMetaDescription = !!descMatch?.[1]?.trim();

    const hasBlog = /\/(blog|news|articles|insights|resources)\b/i.test(html);

    return { hasMetaDescription, hasBlog, reachable: true };
  } catch {
    return { hasMetaDescription: false, hasBlog: false, reachable: false };
  }
}

function scoreLead(
  place: PlaceResult,
  siteCheck?: SiteCheck
): { priority: "HIGH" | "MEDIUM" | "LOW"; reason: string } {
  const issues: string[] = [];

  if (siteCheck && siteCheck.reachable) {
    if (!siteCheck.hasMetaDescription) issues.push("no meta description");
    if (!siteCheck.hasBlog) issues.push("no blog");
  }

  if (!place.website) {
    issues.push("no website found");
  }

  if (place.rating && place.rating < 4.0) {
    issues.push(`low Google rating (${place.rating})`);
  }

  if (issues.length >= 2) {
    return { priority: "HIGH", reason: issues.join(", ") };
  }
  if (issues.length === 1) {
    return { priority: "MEDIUM", reason: issues.join(", ") };
  }
  return { priority: "LOW", reason: "SEO appears decent" };
}

async function batchScoreWithAI(
  leads: Array<PlaceResult & { siteCheck?: SiteCheck }>
): Promise<ScoredLead[]> {
  // If no API key, use rule-based scoring only
  if (!process.env.ANTHROPIC_API_KEY) {
    return leads.map((lead) => {
      const { priority, reason } = scoreLead(lead, lead.siteCheck);
      return {
        ...lead,
        priority,
        priorityReason: reason,
      };
    });
  }

  const anthropic = new Anthropic();

  // Process in batches of 5
  const batches: ScoredLead[] = [];
  for (let i = 0; i < leads.length; i += 5) {
    const batch = leads.slice(i, i + 5);

    const leadsDescription = batch
      .map((lead, idx) => {
        const checks = lead.siteCheck;
        return `Lead ${idx + 1}: "${lead.name}"
  - Website: ${lead.website || "NONE"}
  - Rating: ${lead.rating ?? "N/A"} (${lead.reviewCount ?? 0} reviews)
  - Meta description: ${checks?.reachable ? (checks.hasMetaDescription ? "Yes" : "MISSING") : "Could not check"}
  - Blog: ${checks?.reachable ? (checks.hasBlog ? "Yes" : "NONE") : "Could not check"}`;
      })
      .join("\n\n");

    try {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `Score these med spa leads for an SEO agency. Return JSON only.

${leadsDescription}

Score each as HIGH (hot lead, easy SEO wins), MEDIUM (some opportunity), or LOW (they don't need us).

HIGH indicators: missing meta description, no blog, no website, low rating
MEDIUM indicators: one minor issue
LOW indicators: good SEO presence already

Return this JSON:
[
  { "index": 0, "priority": "HIGH|MEDIUM|LOW", "reason": "<brief reason>" },
  ...
]

Return ONLY valid JSON array.`,
          },
        ],
      });

      const text =
        message.content[0].type === "text" ? message.content[0].text : "";

      let scores: Array<{
        index: number;
        priority: "HIGH" | "MEDIUM" | "LOW";
        reason: string;
      }>;

      try {
        scores = JSON.parse(text);
      } catch {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        scores = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      }

      for (let j = 0; j < batch.length; j++) {
        const lead = batch[j];
        const score = scores.find((s) => s.index === j);
        if (score) {
          batches.push({
            ...lead,
            priority: score.priority,
            priorityReason: score.reason,
          });
        } else {
          // Fallback to rule-based
          const { priority, reason } = scoreLead(lead, lead.siteCheck);
          batches.push({ ...lead, priority, priorityReason: reason });
        }
      }
    } catch {
      // On AI failure, fall back to rule-based scoring
      for (const lead of batch) {
        const { priority, reason } = scoreLead(lead, lead.siteCheck);
        batches.push({ ...lead, priority, priorityReason: reason });
      }
    }
  }

  return batches;
}

export async function POST(request: NextRequest) {
  try {
    const { city, state } = await request.json();

    if (!city || !state) {
      return NextResponse.json(
        { error: "City and state are required" },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        {
          error:
            "Google Maps API key not configured. Add GOOGLE_MAPS_API_KEY to your environment variables.",
        },
        { status: 500 }
      );
    }

    // Step 1: Search Google Places
    const places = await searchMedSpas(city, state);

    if (places.length === 0) {
      return NextResponse.json({
        leads: [],
        city,
        state,
        message: "No med spas found in this area",
      });
    }

    // Step 2: Quick site check for leads with websites
    const placesWithChecks = await Promise.all(
      places.map(async (place) => {
        if (place.website) {
          const siteCheck = await quickSiteCheck(place.website);
          return { ...place, siteCheck };
        }
        return place;
      })
    );

    // Step 3: Score leads with AI (or fallback to rules)
    const scored = await batchScoreWithAI(placesWithChecks);

    // Step 4: Sort by priority (HIGH first)
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    scored.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return NextResponse.json({
      leads: scored.map(({ siteCheck, ...lead }) => lead),
      city,
      state,
      total: scored.length,
      breakdown: {
        high: scored.filter((l) => l.priority === "HIGH").length,
        medium: scored.filter((l) => l.priority === "MEDIUM").length,
        low: scored.filter((l) => l.priority === "LOW").length,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to find leads";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
