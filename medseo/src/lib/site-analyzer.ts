export interface SiteAnalysis {
  url: string;
  title: string;
  description: string;
  headings: string[];
  imageCount: number;
  imagesWithAlt: number;
  hasBlog: boolean;
  socialLinks: string[];
  businessName: string;
  servicesMentioned: string[];
  issues: string[];
}

export async function analyzeSite(url: string): Promise<SiteAnalysis> {
  // Normalize URL
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

  // Fetch with timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  const response = await fetch(normalizedUrl, {
    signal: controller.signal,
    headers: { "User-Agent": "InjectSEO-Analyzer/1.0" },
  });
  clearTimeout(timeout);

  const html = await response.text();

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch?.[1]?.trim() || "";

  // Extract meta description
  const descMatch =
    html.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i
    ) ||
    html.match(
      /<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i
    );
  const description = descMatch?.[1]?.trim() || "";

  // Extract headings (h1, h2)
  const headingMatches = html.matchAll(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/gi);
  const headings = [...headingMatches]
    .map((m) => m[1].replace(/<[^>]*>/g, "").trim())
    .filter(Boolean);

  // Count images and alt coverage
  const imgMatches = [...html.matchAll(/<img[^>]*>/gi)];
  const imageCount = imgMatches.length;
  const imagesWithAlt = imgMatches.filter((m) =>
    /alt=["'][^"']+["']/i.test(m[0])
  ).length;

  // Check for blog
  const hasBlog = /\/(blog|news|articles|insights|resources)\b/i.test(html);

  // Find social media links
  const socialPatterns = [
    /https?:\/\/(www\.)?(facebook|fb)\.com\/[^\s"'<>]+/gi,
    /https?:\/\/(www\.)?instagram\.com\/[^\s"'<>]+/gi,
    /https?:\/\/(www\.)?(twitter|x)\.com\/[^\s"'<>]+/gi,
    /https?:\/\/(www\.)?yelp\.com\/[^\s"'<>]+/gi,
  ];
  const socialLinks = socialPatterns.flatMap((p) =>
    [...html.matchAll(p)].map((m) => m[0])
  );

  // Detect business name (from title, h1, or schema)
  const businessName = headings[0] || title.split(/[|–—-]/)[0]?.trim() || "";

  // Detect med spa services mentioned
  const medSpaKeywords = [
    "botox",
    "filler",
    "juvederm",
    "restylane",
    "laser",
    "facial",
    "chemical peel",
    "microneedling",
    "prp",
    "iv therapy",
    "body contouring",
    "coolsculpting",
    "hydrafacial",
    "dermaplaning",
    "lip filler",
    "kybella",
    "sculptra",
    "skin tightening",
  ];
  const lowerHtml = html.toLowerCase();
  const servicesMentioned = medSpaKeywords.filter((kw) =>
    lowerHtml.includes(kw)
  );

  // Identify issues
  const issues: string[] = [];
  if (!title) issues.push("Missing page title");
  if (!description) issues.push("Missing meta description");
  if (description.length > 160)
    issues.push("Meta description too long (over 160 chars)");
  if (headings.length === 0) issues.push("No H1/H2 headings found");
  if (imageCount > 0 && imagesWithAlt / imageCount < 0.5)
    issues.push("Most images missing alt text");
  if (!hasBlog) issues.push("No blog or content section detected");
  if (!normalizedUrl.startsWith("https"))
    issues.push("Site not using HTTPS");
  if (servicesMentioned.length < 3)
    issues.push(
      "Few services mentioned on homepage — missing keyword opportunities"
    );

  return {
    url: normalizedUrl,
    title,
    description,
    headings,
    imageCount,
    imagesWithAlt,
    hasBlog,
    socialLinks,
    businessName,
    servicesMentioned,
    issues,
  };
}
