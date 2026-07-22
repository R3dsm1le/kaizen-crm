import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { getDatabaseUrl } from "@/lib/runtime-config";

/**
 * Applies pending Drizzle migrations. A database can now arrive purely
 * via env vars (e.g. the Vercel × Supabase integration) without ever
 * passing through the setup route, so pages ensure the schema exists
 * themselves. Idempotent and a single cheap query when already current;
 * cached per server process.
 */

export function resolveMigrationsFolder(): string | null {
  const candidates = [
    process.env.KAIZEN_MIGRATIONS_DIR,
    path.join(process.cwd(), "db", "migrations"),
  ].filter(Boolean) as string[];
  return candidates.find((c) => fs.existsSync(path.join(c, "meta", "_journal.json"))) ?? null;
}

let pending: Promise<void> | undefined;

export function ensureMigrated(): Promise<void> {
  if (!pending) {
    pending = run().catch((error) => {
      pending = undefined; // let the next request retry
      throw error;
    });
  }
  return pending;
}

async function run(): Promise<void> {
  const url = getDatabaseUrl();
  if (!url) return;
  const folder = resolveMigrationsFolder();
  if (!folder) return;
  const client = postgres(url, { prepare: false, max: 1, connect_timeout: 10 });
  try {
    await migrate(drizzle(client), { migrationsFolder: folder });
  } finally {
    await client.end({ timeout: 5 }).catch(() => {});
  }
}
