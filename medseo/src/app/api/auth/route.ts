import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (password !== process.env.DASHBOARD_PASSWORD) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const secret = new TextEncoder().encode(process.env.DASHBOARD_PASSWORD);
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);

  const response = NextResponse.json({ success: true });
  response.cookies.set("injectseo-auth", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
