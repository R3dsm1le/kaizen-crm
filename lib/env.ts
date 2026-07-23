import { z } from "zod";

/**
 * Central, validated view of the environment. Everything is optional —
 * the app boots with nothing set (database via the setup screen, all
 * integrations via Settings).
 *
 * APP_ACCESS_CODE  – single code gating the whole app (no accounts).
 * CRON_SECRET      – bearer token protecting /api/cron.
 * DATABASE_URL     – overrides the connection saved from the setup screen.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  APP_ACCESS_CODE: z.string().optional(),
  CRON_SECRET: z.string().optional(),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  APP_ACCESS_CODE: process.env.APP_ACCESS_CODE,
  CRON_SECRET: process.env.CRON_SECRET,
});

export const isAccessCodeConfigured = Boolean(env.APP_ACCESS_CODE);
