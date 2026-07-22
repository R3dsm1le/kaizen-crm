import { NextResponse, type NextRequest } from "next/server";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { z } from "zod";
import {
  envDatabaseUrl,
  isDatabaseConfigured,
  loadRuntimeConfig,
  saveRuntimeConfig,
} from "@/lib/runtime-config";
import { resolveMigrationsFolder } from "@/db/migrate";
import { getUser } from "@/lib/supabase/server";
import { isSupabaseAuthConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodySchema = z.object({
  databaseUrl: z
    .string()
    .trim()
    .regex(/^postgres(ql)?:\/\//, "Must be a postgres:// connection string"),
});

/**
 * First-run setup: validates a Postgres connection string, applies the
 * schema migrations, and persists the URL so the app is fully configured
 * from the UI. Once a database is configured, changing it requires an
 * authenticated session (when Supabase auth is enabled).
 */
export async function POST(request: NextRequest) {
  if (isDatabaseConfigured() && isSupabaseAuthConfigured) {
    const user = await getUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (envDatabaseUrl()) {
    return NextResponse.json(
      {
        error:
          "The database is set via environment variables (DATABASE_URL / POSTGRES_URL) — change it there instead.",
      },
      { status: 409 }
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }
  const { databaseUrl } = parsed.data;

  // On Vercel the filesystem is ephemeral — config saved here would vanish
  // on the next cold start, so setup must go through the env var instead.
  if (process.env.VERCEL) {
    return NextResponse.json(
      {
        error:
          "This deployment runs on Vercel, where in-app setup can't persist. Set DATABASE_URL in Vercel → Project → Settings → Environment Variables and redeploy. Use Supabase's pooler connection string (host ends in pooler.supabase.com, from the Connect dialog) — the direct db.…supabase.co URL is IPv6-only and unreachable from Vercel.",
      },
      { status: 400 }
    );
  }

  // 1. Validate the connection actually works.
  const client = postgres(databaseUrl, { prepare: false, max: 1, connect_timeout: 10 });
  try {
    await client`select 1`;

    // 2. Apply schema migrations (idempotent).
    const migrationsFolder = resolveMigrationsFolder();
    if (migrationsFolder) {
      await migrate(drizzle(client), { migrationsFolder });
    }
  } catch (error) {
    // Supabase's direct-connection host is IPv6-only; on IPv4-only networks
    // it times out. Point at the pooler rather than leaving a bare timeout.
    const host = hostnameOf(databaseUrl);
    const supabaseHint =
      host?.startsWith("db.") && host.endsWith(".supabase.co")
        ? " Tip: Supabase's direct connection (db.…supabase.co) is IPv6-only — if this timed out, use a pooler string from Supabase's Connect dialog instead (host ends in pooler.supabase.com)."
        : "";
    return NextResponse.json(
      {
        error: `Could not connect: ${error instanceof Error ? error.message : error}.${supabaseHint}`,
      },
      { status: 400 }
    );
  } finally {
    await client.end({ timeout: 5 }).catch(() => {});
  }

  // 3. Persist. The lazy db client picks it up on the next query.
  saveRuntimeConfig({ ...loadRuntimeConfig(), databaseUrl });
  return NextResponse.json({ ok: true });
}

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}
