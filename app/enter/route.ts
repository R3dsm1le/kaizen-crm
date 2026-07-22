import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * "Open the web app" target on the chooser page. Sets the cookie the
 * middleware checks so future visits to / go straight into the app
 * instead of the chooser.
 */
export function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";
  const response = NextResponse.redirect(url);
  response.cookies.set("kaizen_entered", "1", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}
