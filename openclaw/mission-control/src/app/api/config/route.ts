import { gateway } from "@/lib/gateway";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const config = await gateway.getConfig();
    // Mask sensitive values
    const masked = JSON.parse(JSON.stringify(config));
    if (masked.env?.vars) {
      for (const key of Object.keys(masked.env.vars)) {
        masked.env.vars[key] = "****";
      }
    }
    if (masked.gateway?.auth?.token) masked.gateway.auth.token = "****";
    if (masked.channels?.telegram?.botToken)
      masked.channels.telegram.botToken = "****";
    if (masked.hooks?.token) masked.hooks.token = "****";
    if (masked.tools?.web?.search?.apiKey)
      masked.tools.web.search.apiKey = "****";
    return NextResponse.json(masked);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
