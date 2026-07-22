import fs from "node:fs";
import path from "node:path";

/**
 * Runtime configuration saved from the UI (first-run setup), so the app
 * needs zero manual env editing. Env vars always take priority when set.
 *
 * The config lives in `.kaizen/config.json` next to the project, or in
 * KAIZEN_DATA_DIR when packaged (the desktop app points this at the OS
 * user-data folder). It holds only the database connection string —
 * every other setting lives in the database itself (Settings page).
 */

interface RuntimeConfig {
  databaseUrl?: string;
}

function dataDir(): string {
  return process.env.KAIZEN_DATA_DIR || path.join(process.cwd(), ".kaizen");
}

function configPath(): string {
  return path.join(dataDir(), "config.json");
}

export function loadRuntimeConfig(): RuntimeConfig {
  try {
    return JSON.parse(fs.readFileSync(configPath(), "utf8")) as RuntimeConfig;
  } catch {
    return {};
  }
}

export function saveRuntimeConfig(config: RuntimeConfig): void {
  fs.mkdirSync(dataDir(), { recursive: true });
  fs.writeFileSync(configPath(), JSON.stringify(config, null, 2), "utf8");
}

/**
 * Database URL provided via environment variables. DATABASE_URL wins;
 * the POSTGRES_* names are what the Vercel × Supabase integration
 * injects (pooled URL first — the non-pooling one is a direct,
 * IPv6-only connection that serverless platforms can't reach).
 */
export function envDatabaseUrl(): string | undefined {
  return (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    undefined
  );
}

export function getDatabaseUrl(): string | undefined {
  return envDatabaseUrl() || loadRuntimeConfig().databaseUrl || undefined;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}
