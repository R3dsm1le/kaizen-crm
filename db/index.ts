import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { getDatabaseUrl } from "@/lib/runtime-config";

/**
 * Shared Drizzle client, created lazily on first query so the app can
 * build and boot without DATABASE_URL (a friendly setup screen shows
 * instead). `prepare: false` is required for Supabase's transaction-mode
 * pooler (Supavisor). A global singleton avoids exhausting connections
 * during dev HMR.
 */
type Database = PostgresJsDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { drizzleDb?: Database };

function createDb(): Database {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      "No database is configured. Complete the setup screen or set DATABASE_URL in .env.local."
    );
  }
  const client = postgres(url, { prepare: false, max: 10 });
  return drizzle(client, { schema });
}

export const db: Database = new Proxy({} as Database, {
  get(_target, prop) {
    if (!globalForDb.drizzleDb) globalForDb.drizzleDb = createDb();
    const value = globalForDb.drizzleDb[prop as keyof Database];
    return typeof value === "function" ? value.bind(globalForDb.drizzleDb) : value;
  },
});

export * from "./schema";
