import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Allowlist of club short URLs we want to support at the root level.
// Example: /cba (or /cba/) should behave as a club-specific landing page.
const CLUB_LANDING_SHORTNAMES = new Set(["cba"]);

export default clerkMiddleware((auth, req) => {
  // Raw path of the incoming request, e.g. "/cba" or "/cba/" or "/dashboard".
  const { pathname } = req.nextUrl;

  // Normalize trailing slashes so "/cba" and "/cba/" are treated the same.
  // We intentionally do NOT strip the root path "/".
  const normalizedPath = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;

  // Convert "/cba" -> "cba" so we can check membership against our allowlist.
  const clubShortname = normalizedPath.startsWith("/") ? normalizedPath.slice(1) : normalizedPath;

  // If this request matches a known club short URL, rewrite it to the internal
  // dynamic club landing route. Rewrites keep the browser URL as-is (still /cba),
  // but serve the content from /club/<clubShortname>.
  if (CLUB_LANDING_SHORTNAMES.has(clubShortname)) {
    const url = req.nextUrl.clone();
    url.pathname = `/club/${clubShortname}`;
    return NextResponse.rewrite(url);
  }

  // Otherwise, let the request continue normally.
  return NextResponse.next();
});

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
};
