import { NextResponse, type NextRequest } from "next/server";
import { runAutomation, runScheduledAutomations } from "@/jobs";
import { AUTOMATION_KEYS, type AutomationKey } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Single cron endpoint. Vercel Cron (or any scheduler: GitHub Actions,
 * cron-job.org, a self-hosted crontab) hits this every 15 minutes and the
 * AutomationService decides what is actually due.
 *
 * GET /api/cron              → run everything due
 * GET /api/cron?key=follow_ups → run one automation
 *
 * Protected by CRON_SECRET when set (Vercel sends it automatically).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const key = request.nextUrl.searchParams.get("key");
    if (key) {
      if (!AUTOMATION_KEYS.includes(key as AutomationKey)) {
        return NextResponse.json({ error: `Unknown automation: ${key}` }, { status: 400 });
      }
      const result = await runAutomation(key as AutomationKey);
      return NextResponse.json({ ok: true, results: { [key]: result } });
    }

    const results = await runScheduledAutomations();
    return NextResponse.json({ ok: true, results });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
