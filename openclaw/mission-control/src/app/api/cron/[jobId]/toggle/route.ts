import { gateway } from "@/lib/gateway";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const { enabled } = await request.json();
    const result = await gateway.toggleCronJob(jobId, enabled);
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
