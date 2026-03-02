import { analyzeSite, SiteAnalysis } from "./site-analyzer";
import { getPageSpeed, PageSpeedResult } from "./pagespeed";
import Anthropic from "@anthropic-ai/sdk";

export interface AuditIssue {
  title: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  description: string;
  recommendation: string;
  impact: string;
}

export interface AuditResult {
  siteAnalysis: SiteAnalysis;
  pageSpeed: PageSpeedResult;
  aiAnalysis: {
    overallScore: number;
    executiveSummary: string;
    issues: AuditIssue[];
  };
}

export async function runFullAudit(url: string): Promise<AuditResult> {
  // Run site analysis and PageSpeed in parallel
  const [siteAnalysis, pageSpeed] = await Promise.all([
    analyzeSite(url),
    getPageSpeed(url).catch(() => null), // Don't fail if PageSpeed is down
  ]);

  // Build data summary for Claude
  const dataForAI = {
    url,
    businessName: siteAnalysis.businessName,
    title: siteAnalysis.title,
    description: siteAnalysis.description,
    hasDescription: !!siteAnalysis.description,
    headingCount: siteAnalysis.headings.length,
    imageCount: siteAnalysis.imageCount,
    imagesWithAlt: siteAnalysis.imagesWithAlt,
    hasBlog: siteAnalysis.hasBlog,
    servicesMentioned: siteAnalysis.servicesMentioned,
    siteIssues: siteAnalysis.issues,
    performanceScore: pageSpeed?.performanceScore ?? "unavailable",
    seoScore: pageSpeed?.seoScore ?? "unavailable",
    accessibilityScore: pageSpeed?.accessibilityScore ?? "unavailable",
    fcp: pageSpeed?.fcp ?? "unavailable",
    lcp: pageSpeed?.lcp ?? "unavailable",
    cls: pageSpeed?.cls ?? "unavailable",
    failedAudits: pageSpeed?.audits?.map((a) => a.title) ?? [],
  };

  const anthropic = new Anthropic();

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are an expert SEO auditor for med spa websites. Analyze this data and return a JSON response.

Site Data:
${JSON.stringify(dataForAI, null, 2)}

Return this exact JSON structure:
{
  "overallScore": <number 0-100>,
  "executiveSummary": "<3 sentences that a non-technical med spa owner would understand>",
  "issues": [
    {
      "title": "<short issue name>",
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "description": "<what's wrong>",
      "recommendation": "<specific action to take>",
      "impact": "<what fixing this will do for their business>"
    }
  ]
}

Include the top 5-7 most impactful issues, sorted by priority (HIGH first).
Score lower = more issues. A site with no blog, missing meta tags, poor speed = ~30. A decent site with minor issues = ~65. Well-optimized = ~85+.

Return ONLY valid JSON, no markdown.`,
      },
    ],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "";
  const aiAnalysis = JSON.parse(text);

  return {
    siteAnalysis,
    pageSpeed: pageSpeed || {
      performanceScore: 0,
      seoScore: 0,
      accessibilityScore: 0,
      fcp: "N/A",
      lcp: "N/A",
      cls: "N/A",
      audits: [],
    },
    aiAnalysis,
  };
}
