import path from "node:path";
import fs from "node:fs";
import { NextResponse, type NextRequest } from "next/server";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { z } from "zod";
import { isDatabaseConfigured, loadRuntimeConfig, saveRuntimeConfig } from "@/lib/runtime-config";
import { assertAuthenticated } from "@/lib/auth";

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
 * from the UI. Once a database is configured, changing it requires the
 * unlock cookie (when APP_ACCESS_CODE is set).
 */
export async function POST(request: NextRequest) {
  if (isDatabaseConfigured()) {
    // Reconfiguring an existing database requires the access cookie (when gated).
    try {
      await assertAuthenticated();
    } catch {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
  }
  if (process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "DATABASE_URL is set via environment variables — change it there instead." },
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
    return NextResponse.json(
      { error: `Could not connect: ${error instanceof Error ? error.message : error}` },
      { status: 400 }
    );
  } finally {
    await client.end({ timeout: 5 }).catch(() => {});
  }

  // 3. Persist. The lazy db client picks it up on the next query.
  // On serverless hosts (Vercel) the filesystem is read-only/ephemeral —
  // the schema is migrated by now, so point the user at env vars instead.
  try {
    saveRuntimeConfig({ ...loadRuntimeConfig(), databaseUrl });
  } catch {
    return NextResponse.json(
      {
        error:
          "Connected and created your tables, but this host has a read-only filesystem. " +
          "Add DATABASE_URL as an environment variable in your hosting dashboard (e.g. Vercel → Settings → Environment Variables) and redeploy.",
      },
      { status: 507 }
    );
  }
  return NextResponse.json({ ok: true });
}

function resolveMigrationsFolder(): string | null {
  const candidates = [
    process.env.KAIZEN_MIGRATIONS_DIR,
    path.join(process.cwd(), "db", "migrations"),
  ].filter(Boolean) as string[];
  return candidates.find((c) => fs.existsSync(path.join(c, "meta", "_journal.json"))) ?? null;
}
