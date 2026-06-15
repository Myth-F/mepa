import { NextResponse, type NextRequest } from "next/server";

export const FIRST_VISIT_COOKIE = "mepa_seen";

/**
 * Sets a strictly functional "already seen" cookie on the first landing-page
 * visit. It carries no identifier and no behavioural data — it only lets the
 * landing page vary its onboarding copy — so it needs no consent banner (CNIL).
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  if (!request.cookies.has(FIRST_VISIT_COOKIE)) {
    response.cookies.set(FIRST_VISIT_COOKIE, "1", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }
  return response;
}

export const config = { matcher: ["/"] };
