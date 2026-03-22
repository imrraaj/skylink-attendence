import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

import {
  apiAuthPrefix,
  authRoutes,
  DEFAULT_LOGIN_REDIRECT,
  publicRoutes,
} from "./routes";

// Cache the resolved DDNS IP for 60 seconds
let cachedAllowedIp: string | null = null;
let cacheExpiry = 0;

async function getAllowedIp(): Promise<string | null> {
  const host = process.env.ALLOWED_DDNS_HOST;
  if (!host) return null;

  if (cachedAllowedIp && Date.now() < cacheExpiry) return cachedAllowedIp;

  try {
    // Use Cloudflare DNS-over-HTTPS to resolve the DDNS hostname (works in Edge Runtime)
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${host}&type=A`,
      { headers: { Accept: "application/dns-json" } },
    );
    const data = await res.json();
    const ip = data?.Answer?.[0]?.data;
    if (ip) {
      cachedAllowedIp = ip;
      cacheExpiry = Date.now() + 60_000;
      return ip;
    }
  } catch {
    // If DNS resolution fails, use cached value if available
    if (cachedAllowedIp) return cachedAllowedIp;
  }

  return null;
}

export async function proxy(request: NextRequest) {
  // IP restriction: only allow traffic from the configured network
  const allowedIp = await getAllowedIp();
  if (allowedIp) {
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip");
    // Allow localhost in development
    const isLocal = clientIp === "127.0.0.1" || clientIp === "::1" || !clientIp;
    if (!isLocal && clientIp !== allowedIp) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const session = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  // Always allow static assets and internal Next.js routes
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  const isApiAuth = pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthRoute = authRoutes.some((path) => pathname.startsWith(path));
  const isApiRoute = pathname.startsWith("/api/");

  // Always allow auth API routes
  if (isApiAuth) return NextResponse.next();

  // Allow other API routes (they do their own auth checks)
  if (isApiRoute) return NextResponse.next();

  // Auth routes (signin/signup): redirect to student dashboard if already logged in
  if (isAuthRoute) {
    // if (session) {
    //   return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, request.url));
    // }
    return NextResponse.next();
  }

  // Public routes: always allowed
  if (isPublicRoute) return NextResponse.next();

  // All other routes require a session
  if (!session) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return NextResponse.next();
}
