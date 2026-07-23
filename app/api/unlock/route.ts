import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.object({ code: z.string().min(1).max(200) });

/** Exchanges the access code for the HttpOnly access cookie. */
export async function POST(request: NextRequest) {
  const accessCode = process.env.APP_ACCESS_CODE;
  if (!accessCode) {
    return NextResponse.json({ ok: true }); // no gate configured — nothing to unlock
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter the access code." }, { status: 400 });
  }

  const expected = createHash("sha256").update(accessCode).digest();
  const received = createHash("sha256").update(parsed.data.code).digest();
  if (!timingSafeEqual(expected, received)) {
    return NextResponse.json({ error: "Wrong access code." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set("kaizen_access", expected.toString("hex"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return response;
}
