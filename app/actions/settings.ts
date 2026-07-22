"use server";

import { revalidatePath } from "next/cache";
import { assertAuthenticated } from "@/lib/auth";
import { SettingsService } from "@/services/settings-service";
import { SETTINGS_SCHEMAS, type AllSettings, type SettingsKey } from "@/lib/settings-schema";

export async function saveSettingsAction<K extends SettingsKey>(key: K, value: AllSettings[K]) {
  await assertAuthenticated();
  if (!(key in SETTINGS_SCHEMAS)) throw new Error("Unknown settings group");
  await SettingsService.save(key, value);
  revalidatePath("/settings");
}
