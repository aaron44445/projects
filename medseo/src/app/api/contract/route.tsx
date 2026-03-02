import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { ContractPDF } from "@/lib/contract-pdf";

export async function POST(request: NextRequest) {
  try {
    const { clientName, services, monthlyPrice } = await request.json();

    if (!clientName || !services?.length || !monthlyPrice) {
      return NextResponse.json(
        { error: "clientName, services, and monthlyPrice are required" },
        { status: 400 }
      );
    }

    const buffer = await renderToBuffer(
      <ContractPDF
        clientName={clientName}
        services={services}
        monthlyPrice={monthlyPrice}
      />
    );

    const safeName = clientName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const uint8 = new Uint8Array(buffer);

    return new NextResponse(uint8, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="injectseo-contract-${safeName}.pdf"`,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate contract";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
