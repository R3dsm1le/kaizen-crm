"use server";

import { revalidatePath } from "next/cache";
import { assertAuthenticated } from "@/lib/auth";
import { AutomationService } from "@/services/automation-service";
import { AUTOMATION_KEYS, type AutomationKey, type AutomationSchedule } from "@/types";

function assertKey(key: string): asserts key is AutomationKey {
  if (!AUTOMATION_KEYS.includes(key as AutomationKey)) throw new Error("Unknown automation");
}

export async function setAutomationEnabledAction(key: string, enabled: boolean) {
  await assertAuthenticated();
  assertKey(key);
  await AutomationService.update(key, { enabled, paused: false });
  revalidatePath("/automations");
}

export async function setAutomationPausedAction(key: string, paused: boolean) {
  await assertAuthenticated();
  assertKey(key);
  await AutomationService.update(key, { paused });
  revalidatePath("/automations");
}

export async function updateAutomationSettingsAction(
  key: string,
  input: { schedule?: AutomationSchedule; dailyLimit?: number }
) {
  await assertAuthenticated();
  assertKey(key);
  await AutomationService.update(key, input);
  revalidatePath("/automations");
}

export async function runAutomationNowAction(key: string) {
  await assertAuthenticated();
  assertKey(key);
  const result = await AutomationService.runNow(key, "manual");
  revalidatePath("/", "layout");
  return result;
}
