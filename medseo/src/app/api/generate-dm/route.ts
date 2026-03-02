import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { analyzeSite } from "@/lib/site-analyzer";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const { url, instagram } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Analyze site first
    const analysis = await analyzeSite(url);

    // Generate DMs with Claude
    const anthropic = new Anthropic();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `You are a cold DM copywriter for InjectSEO, a premium med spa SEO agency.

Based on this analysis of ${analysis.businessName || "this med spa"}'s online presence:
- Website: ${analysis.url}
- Title: ${analysis.title}
- Meta description: ${analysis.description || "MISSING"}
- Services found: ${analysis.servicesMentioned.join(", ") || "none detected"}
- Has blog: ${analysis.hasBlog ? "Yes" : "No"}
- Images: ${analysis.imageCount} total, ${analysis.imagesWithAlt} with alt text
- SEO issues: ${analysis.issues.join(", ")}
${instagram ? `- Instagram: ${instagram}` : ""}

Generate a JSON response with this exact structure:
{
  "dms": [
    { "variant": 1, "content": "..." },
    { "variant": 2, "content": "..." },
    { "variant": 3, "content": "..." }
  ],
  "followups": {
    "day3": "...",
    "day7": "...",
    "day14": "..."
  }
}

Rules for each DM:
1. Reference something SPECIFIC about their business (a service they offer, their location, something from their website)
2. Identify a specific problem (weak SEO, no blog, missing meta tags, etc.)
3. Offer a free SEO audit as the hook
4. Under 150 words, Instagram DM friendly
5. Sound human and conversational, NOT salesy
6. Don't mention "InjectSEO" by name in the initial DM

Rules for follow-ups:
- Day 3: Soft bump, casual
- Day 7: Share a specific tip or stat relevant to their niche
- Day 14: Final polite follow-up

Return ONLY valid JSON, no markdown.`,
        },
      ],
    });

    // Parse the response
    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      // If Claude returns wrapped JSON, try extracting it
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json(
          { error: "Failed to parse AI response", raw: text },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      analysis,
      ...parsed,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate DMs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
