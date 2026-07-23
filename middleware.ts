import { NextResponse, type NextRequest } from "next/server";

/**
 * Optional single-code access gate. There are no user accounts:
 * set APP_ACCESS_CODE (e.g. in Vercel env vars) and every visitor gets
 * one prompt for the code. Without it the app runs open — fine locally,
 * risky on a public URL since anyone could use your AI/email quota.
 *
 * The cookie stores a SHA-256 of the code, so the raw secret never
 * leaves the server response cycle.
 */

const PUBLIC_PATHS = ["/unlock", "/api/unlock", "/api/cron", "/m", "/manifest.webmanifest"];

export async function middleware(request: NextRequest) {
  const accessCode = process.env.APP_ACCESS_CODE;
  if (!accessCode) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get("kaizen_access")?.value;
  if (cookie && cookie === (await sha256(accessCode))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const unlockUrl = request.nextUrl.clone();
  unlockUrl.pathname = "/unlock";
  unlockUrl.search = "";
  return NextResponse.redirect(unlockUrl);
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
