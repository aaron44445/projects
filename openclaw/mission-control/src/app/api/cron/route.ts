import { gateway } from "@/lib/gateway";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const jobs = await gateway.getCronJobs();
    return NextResponse.json({ jobs });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
