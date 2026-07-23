import { cookies } from "next/headers";

/**
 * "Mobile shell" mode: the Android app enters through /m, which sets this
 * cookie. Shell clients see results (dashboard, pipeline, companies,
 * outreach) but not configuration (settings, automations) — that stays
 * in the web app.
 */
export async function isMobileShell(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get("kaizen_shell")?.value === "mobile";
}
