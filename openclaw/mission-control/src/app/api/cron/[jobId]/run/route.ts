import { gateway } from "@/lib/gateway";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const result = await gateway.runCronJob(jobId);
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
