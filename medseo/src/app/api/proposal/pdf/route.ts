import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createElement } from "react";
import { ProposalPDF, type ProposalData } from "@/lib/proposal-pdf";

export async function POST(request: NextRequest) {
  try {
    const data: ProposalData = await request.json();

    if (!data.clientName || !data.executiveSummary || !data.scopeOfWork) {
      return NextResponse.json(
        { error: "Missing required proposal data" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = createElement(ProposalPDF, { data }) as any;
    const buffer = await renderToBuffer(element);

    const filename = `proposal-${data.clientName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate PDF";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
