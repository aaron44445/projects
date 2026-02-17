"use client";

export function getSubdomain(): string | null {
  if (typeof window === "undefined") return null;

  // Check cookie first (set by middleware)
  const cookies = document.cookie.split(";").map((c) => c.trim());
  const subdomainCookie = cookies.find((c) =>
    c.startsWith("business-subdomain=")
  );
  if (subdomainCookie) {
    return subdomainCookie.split("=")[1] || null;
  }

  // Fallback: parse from hostname
  const hostname = window.location.hostname;
  const appDomain =
    process.env.NEXT_PUBLIC_APP_DOMAIN?.split(":")[0] || "localhost";

  if (hostname !== appDomain && hostname !== "localhost") {
    const parts = hostname.split(".");
    const appParts = appDomain.split(".");
    if (parts.length > appParts.length) {
      return parts[0];
    }
  }

  // Development fallback: check URL params
  const params = new URLSearchParams(window.location.search);
  return params.get("subdomain");
}

export function getTenantHeaders(): Record<string, string> {
  const subdomain = getSubdomain();
  return subdomain ? { "x-business-subdomain": subdomain } : {};
}
