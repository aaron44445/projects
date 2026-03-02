import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { AuditPDF } from "@/lib/audit-pdf";
import { runFullAudit } from "@/lib/audit-analyzer";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    const audit = await runFullAudit(url);
    const buffer = await renderToBuffer(<AuditPDF audit={audit} />);

    const businessName =
      audit.siteAnalysis.businessName?.replace(/[^a-zA-Z0-9]/g, "-") ||
      "audit";

    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="seo-audit-${businessName}.pdf"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
