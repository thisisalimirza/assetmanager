import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

// Auth gate for the whole app (Next's `proxy` convention, formerly
// `middleware`). NOTE: this file must live in src/ — at the same level as
// `app` — or Next silently ignores it.
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // The login page must be reachable without a session. Share pages are
  // read-only views gated by their own secret capability token (checked in the
  // page against the database), not by the advisor's session.
  if (pathname === "/login" || pathname.startsWith("/share/")) {
    return NextResponse.next();
  }

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
  // Run on everything except Next internals and the favicon.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
