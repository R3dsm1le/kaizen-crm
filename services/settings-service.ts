import { eq, sql } from "drizzle-orm";
import { db, settings } from "@/db";
import {
  SETTINGS_SCHEMAS,
  type AllSettings,
  type SettingsKey,
} from "@/lib/settings-schema";

/**
 * Typed access to the key/value settings store. Values are always parsed
 * through their Zod schema, so callers get defaults even when nothing
 * has been saved yet.
 */
export const SettingsService = {
  async get<K extends SettingsKey>(key: K): Promise<AllSettings[K]> {
    const row = await db.query.settings.findFirst({ where: eq(settings.key, key) });
    return SETTINGS_SCHEMAS[key].parse(row?.value ?? {}) as AllSettings[K];
  },

  async getAll(): Promise<AllSettings> {
    const rows = await db.select().from(settings);
    const byKey = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return Object.fromEntries(
      (Object.keys(SETTINGS_SCHEMAS) as SettingsKey[]).map((key) => [
        key,
        SETTINGS_SCHEMAS[key].parse(byKey[key] ?? {}),
      ])
    ) as unknown as AllSettings;
  },

  async save<K extends SettingsKey>(key: K, value: AllSettings[K]): Promise<AllSettings[K]> {
    const parsed = SETTINGS_SCHEMAS[key].parse(value) as AllSettings[K];
    await db
      .insert(settings)
      .values({ key, value: parsed as Record<string, unknown> })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: parsed as Record<string, unknown>, updatedAt: sql`now()` },
      });
    return parsed;
  },

  /** Untyped state blobs (e.g. reply-detection cursor). Not user-facing. */
  async getState<T extends Record<string, unknown>>(key: string): Promise<T | null> {
    const row = await db.query.settings.findFirst({ where: eq(settings.key, `state:${key}`) });
    return (row?.value as T) ?? null;
  },

  async setState(key: string, value: Record<string, unknown>): Promise<void> {
    await db
      .insert(settings)
      .values({ key: `state:${key}`, value })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedAt: sql`now()` },
      });
  },
};
