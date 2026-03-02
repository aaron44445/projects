export interface PageSpeedResult {
  performanceScore: number;
  seoScore: number;
  accessibilityScore: number;
  fcp: string;
  lcp: string;
  cls: string;
  audits: Array<{
    id: string;
    title: string;
    score: number | null;
    description: string;
  }>;
}

export async function getPageSpeed(url: string): Promise<PageSpeedResult> {
  const apiUrl = new URL(
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
  );
  apiUrl.searchParams.set("url", url);
  apiUrl.searchParams.set("category", "performance");
  apiUrl.searchParams.append("category", "seo");
  apiUrl.searchParams.append("category", "accessibility");
  apiUrl.searchParams.set("strategy", "mobile");

  // Add API key if available (increases rate limits)
  if (process.env.GOOGLE_MAPS_API_KEY) {
    apiUrl.searchParams.set("key", process.env.GOOGLE_MAPS_API_KEY);
  }

  const response = await fetch(apiUrl.toString(), { next: { revalidate: 0 } });
  if (!response.ok) throw new Error(`PageSpeed API error: ${response.status}`);

  const data = await response.json();

  const categories = data.lighthouseResult?.categories || {};
  const lighthouseAudits = data.lighthouseResult?.audits || {};

  // Extract key metrics
  const performanceScore = Math.round(
    (categories.performance?.score || 0) * 100
  );
  const seoScore = Math.round((categories.seo?.score || 0) * 100);
  const accessibilityScore = Math.round(
    (categories.accessibility?.score || 0) * 100
  );

  const fcp =
    lighthouseAudits["first-contentful-paint"]?.displayValue || "N/A";
  const lcp =
    lighthouseAudits["largest-contentful-paint"]?.displayValue || "N/A";
  const cls =
    lighthouseAudits["cumulative-layout-shift"]?.displayValue || "N/A";

  // Get failed audits (score < 0.9)
  const auditKeys = Object.keys(lighthouseAudits);
  const audits = auditKeys
    .filter((key) => {
      const audit = lighthouseAudits[key];
      return audit.score !== null && audit.score < 0.9 && audit.title;
    })
    .slice(0, 20)
    .map((key) => ({
      id: key,
      title: lighthouseAudits[key].title,
      score: lighthouseAudits[key].score,
      description:
        lighthouseAudits[key].description
          ?.replace(/\[.*?\]\(.*?\)/g, "")
          .substring(0, 200) || "",
    }));

  return {
    performanceScore,
    seoScore,
    accessibilityScore,
    fcp,
    lcp,
    cls,
    audits,
  };
}
