import { createHash } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Guards server actions and API routes. When APP_ACCESS_CODE is set,
 * the request must carry the unlock cookie (middleware sets the same
 * bar for pages — this is defense in depth for direct action calls).
 * Without an access code the app runs open, which is fine locally.
 */
export async function assertAuthenticated(): Promise<void> {
  const accessCode = process.env.APP_ACCESS_CODE;
  if (!accessCode) return;

  const cookieStore = await cookies();
  const cookie = cookieStore.get("kaizen_access")?.value;
  const expected = createHash("sha256").update(accessCode).digest("hex");
  if (cookie !== expected) throw new Error("Not authenticated — unlock the workspace first.");
}
