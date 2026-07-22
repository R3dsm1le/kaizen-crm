import { AutomationService } from "@/services/automation-service";
import type { AutomationKey, RunResult } from "@/types";

/**
 * Background jobs are deliberately thin: they only orchestrate services.
 * Business logic lives in /services — never here.
 */

/** Runs every automation that is enabled, unpaused and due. */
export async function runScheduledAutomations(): Promise<Record<string, RunResult>> {
  return AutomationService.runDue();
}

/** Runs a single automation on demand (same code path as the UI's Run Now). */
export async function runAutomation(key: AutomationKey): Promise<RunResult> {
  return AutomationService.runNow(key, "scheduled");
}
