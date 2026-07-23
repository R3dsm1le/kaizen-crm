import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Mobile-shell entry point. The Android app loads /m, which marks this
 * device as a "results-only" client (no Settings / Automations config)
 * and forwards to the dashboard.
 */
export function GET(request: NextRequest) {
  const home = request.nextUrl.clone();
  home.pathname = "/";
  home.search = "";

  const response = NextResponse.redirect(home);
  response.cookies.set("kaizen_shell", "mobile", {
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return response;
}
