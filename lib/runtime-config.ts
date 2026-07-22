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

export function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL || loadRuntimeConfig().databaseUrl || undefined;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getDatabaseUrl());
}
