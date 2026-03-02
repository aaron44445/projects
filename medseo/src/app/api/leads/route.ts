import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const where: Record<string, string> = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const leads = await db.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { audits: true, proposals: true, messages: true } },
      },
    });

    const statusCounts = await db.lead.groupBy({
      by: ["status"],
      _count: true,
    });

    return NextResponse.json({ leads, statusCounts });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch leads";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.businessName) {
      return NextResponse.json(
        { error: "Business name is required" },
        { status: 400 }
      );
    }

    const lead = await db.lead.create({
      data: {
        businessName: data.businessName,
        website: data.website || null,
        instagram: data.instagram || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        notes: data.notes || null,
        priority: data.priority || "MEDIUM",
        status: data.status || "NEW",
      },
    });

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create lead";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
