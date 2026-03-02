import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const { clientName, services, monthlyPrice, callNotes } =
      await request.json();

    if (!clientName || !services?.length || !monthlyPrice) {
      return NextResponse.json(
        { error: "Missing required fields: clientName, services, and monthlyPrice are required" },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic();

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: `Generate a professional SEO proposal for ${clientName}, a med spa. Return JSON only.

Services: ${services.join(", ")}
Monthly Investment: $${Number(monthlyPrice).toLocaleString()}
Discovery Call Notes: ${callNotes || "N/A"}

Return this exact JSON structure:
{
  "executiveSummary": "<2-3 sentences showing you understand their business>",
  "scopeOfWork": [
    { "service": "<service name>", "description": "<what we'll do>", "deliverables": ["<specific deliverable>", "..."] }
  ],
  "timeline": {
    "month1": "<what happens month 1>",
    "month2": "<what happens month 2>",
    "month3": "<what happens month 3>"
  },
  "investment": {
    "monthly": ${monthlyPrice},
    "includes": ["<what's included>"]
  },
  "whyInjectSEO": "<2-3 sentences about specialization in med spas>"
}

Return ONLY valid JSON.`,
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    let proposal;
    try {
      proposal = JSON.parse(text);
    } catch {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        proposal = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json(
          { error: "Failed to parse AI response", raw: text },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      clientName,
      services,
      monthlyPrice,
      callNotes,
      ...proposal,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate proposal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
