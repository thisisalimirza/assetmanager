import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

// Auth gate for the advisor portal (Next's `proxy` convention, formerly
// `middleware`). NOTE: this file must live in src/ — at the same level as
// `app` — or Next silently ignores it.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Public surfaces: marketing site, login, and share links (gated by their
  // own secret capability tokens in the page, not by the advisor session).
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/share/")
  ) {
    return NextResponse.next();
  }

  // Everything else under /app and /api requires a session.
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (await verifySessionToken(token)) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Run on portal + API only — leave marketing static assets alone.
  matcher: ["/app/:path*", "/api/:path*"],
};
