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
      return new NextResponse(
        `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Access Restricted | Skylink Aviation Academy</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0a1628;
      color: #e2e8f0;
      padding: 1.5rem;
    }
    .card {
      max-width: 440px;
      text-align: center;
      background: #111d33;
      border: 1px solid #1e3a5f;
      border-radius: 16px;
      padding: 3rem 2rem;
    }
    .icon {
      width: 64px; height: 64px;
      margin: 0 auto 1.5rem;
      background: rgba(56, 189, 248, 0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon svg { width: 32px; height: 32px; color: #38bdf8; }
    h1 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.75rem; }
    p { font-size: 0.9rem; color: #94a3b8; line-height: 1.6; }
    .hint {
      margin-top: 1.5rem;
      padding: 0.75rem 1rem;
      background: rgba(56, 189, 248, 0.08);
      border: 1px solid rgba(56, 189, 248, 0.15);
      border-radius: 8px;
      font-size: 0.8rem;
      color: #7dd3fc;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12 18.75h.008v.008H12v-.008Z"/>
      </svg>
    </div>
    <h1>Access Restricted</h1>
    <p>This site is only accessible through the WiFi network at Skylink Aviation Academy.</p>
    <div class="hint">Please head to the academy and connect to the router to access this site.</div>
  </div>
</body>
</html>`,
        { status: 403, headers: { "Content-Type": "text/html" } },
      );
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
