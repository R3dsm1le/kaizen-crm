import fs from "node:fs";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js convention: secrets live in .env.local, with .env as fallback.
config({ path: [".env.local", ".env"] });

// Fall back to the connection string saved from the in-app setup screen.
function runtimeConfigUrl(): string {
  try {
    const parsed = JSON.parse(fs.readFileSync(".kaizen/config.json", "utf8")) as {
      databaseUrl?: string;
    };
    return parsed.databaseUrl ?? "";
  } catch {
    return "";
  }
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || runtimeConfigUrl(),
  },
  verbose: true,
  strict: true,
});
