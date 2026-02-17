import { NextRequest, NextResponse } from "next/server";

const PUBLIC_SUBDOMAINS = ["www", "app", "admin"];
const IGNORED_PATHS = ["/_next", "/api", "/favicon.ico", "/sw.js"];

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // Skip static files and API routes
  if (IGNORED_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Extract subdomain
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000";
  const hostname = host.split(":")[0]; // Remove port
  const appHostname = appDomain.split(":")[0];

  let subdomain: string | null = null;

  if (hostname !== appHostname && hostname !== "localhost") {
    // e.g., "aircraftspa.example.com" → "aircraftspa"
    const parts = hostname.split(".");
    if (parts.length > appHostname.split(".").length) {
      subdomain = parts[0];
    }
  }

  // For localhost development, check for x-subdomain header or query param
  if (!subdomain && hostname === "localhost") {
    subdomain = request.nextUrl.searchParams.get("subdomain") || null;
  }

  // Skip public subdomains
  if (subdomain && PUBLIC_SUBDOMAINS.includes(subdomain)) {
    return NextResponse.next();
  }

  // If we have a tenant subdomain, set it in headers for API calls
  if (subdomain) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-business-subdomain", subdomain);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    // Also set as a cookie so client-side JS can read it
    response.cookies.set("business-subdomain", subdomain, {
      path: "/",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
