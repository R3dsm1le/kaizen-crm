import { and, desc, eq, gte, sql } from "drizzle-orm";
import { automationRuns, automations, db, type Automation, type AutomationRun } from "@/db";
import {
  AUTOMATION_KEYS,
  SCHEDULE_INTERVAL_MS,
  emptyRunResult,
  type AutomationKey,
  type AutomationSchedule,
  type RunResult,
} from "@/types";
import { CompanyResearchService } from "./company-research-service";
import { EmailDeliveryService } from "./email-delivery-service";
import { FollowUpService } from "./follow-up-service";
import { LeadDiscoveryService } from "./lead-discovery-service";
import { LeadEnrichmentService } from "./lead-enrichment-service";
import { ReplyDetectionService } from "./reply-detection-service";

interface AutomationDefinition {
  name: string;
  description: string;
  defaultSchedule: AutomationSchedule;
  defaultDailyLimit: number;
  run: (options: { limit: number }) => Promise<RunResult>;
}

/**
 * The registry is the single mapping from automation keys to services.
 * Manual "Run now", the Automation Center and cron all execute the
 * exact same service through `runNow`.
 */
const REGISTRY: Record<AutomationKey, AutomationDefinition> = {
  lead_discovery: {
    name: "Lead Discovery",
    description: "Finds new companies through your configured lead source and imports them.",
    defaultSchedule: "daily",
    defaultDailyLimit: 25,
    run: (o) => LeadDiscoveryService.run(o),
  },
  ai_research: {
    name: "AI Research",
    description: "Researches new leads: summary, digital maturity, opportunities and a score.",
    defaultSchedule: "hourly",
    defaultDailyLimit: 25,
    run: (o) => CompanyResearchService.run(o),
  },
  lead_enrichment: {
    name: "Lead Enrichment",
    description: "Fills in missing industry, location, size and LinkedIn from company websites.",
    defaultSchedule: "every_6_hours",
    defaultDailyLimit: 25,
    run: (o) => LeadEnrichmentService.run(o),
  },
  email_sending: {
    name: "Email Sending",
    description: "Sends emails you've queued, respecting the daily limit.",
    defaultSchedule: "hourly",
    defaultDailyLimit: 20,
    run: (o) => EmailDeliveryService.run(o),
  },
  reply_detection: {
    name: "Reply Detection",
    description: "Checks your inbox for replies and moves leads to Replied automatically.",
    defaultSchedule: "every_15_min",
    defaultDailyLimit: 500,
    run: () => ReplyDetectionService.run(),
  },
  follow_ups: {
    name: "Follow Ups",
    description: "Sends due follow-ups and schedules the next attempt (max 3).",
    defaultSchedule: "hourly",
    defaultDailyLimit: 20,
    run: (o) => FollowUpService.run(o),
  },
};

export type AutomationWithStats = Automation & {
  nextRunAt: Date | null;
  recentRuns: AutomationRun[];
  successRate: number | null;
  itemsProcessedToday: number;
};

export const AutomationService = {
  definition(key: AutomationKey) {
    return REGISTRY[key];
  },

  /** Creates missing automation rows with sensible defaults (idempotent). */
  async ensureDefaults(): Promise<void> {
    const existing = await db.select({ key: automations.key }).from(automations);
    const existingKeys = new Set(existing.map((r) => r.key));
    const missing = AUTOMATION_KEYS.filter((k) => !existingKeys.has(k));
    if (!missing.length) return;

    await db.insert(automations).values(
      missing.map((key) => ({
        key,
        name: REGISTRY[key].name,
        description: REGISTRY[key].description,
        schedule: REGISTRY[key].defaultSchedule,
        dailyLimit: REGISTRY[key].defaultDailyLimit,
      }))
    );
  },

  async list(): Promise<AutomationWithStats[]> {
    await this.ensureDefaults();
    const rows = (await db.select().from(automations)).sort(
      (a, b) =>
        AUTOMATION_KEYS.indexOf(a.key as AutomationKey) -
        AUTOMATION_KEYS.indexOf(b.key as AutomationKey)
    );

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return Promise.all(
      rows.map(async (automation) => {
        const recentRuns = await db.query.automationRuns.findMany({
          where: eq(automationRuns.automationKey, automation.key),
          orderBy: desc(automationRuns.startedAt),
          limit: 10,
        });

        const finished = recentRuns.filter((r) => r.status !== "running");
        const successRate = finished.length
          ? Math.round((finished.filter((r) => r.status === "success").length / finished.length) * 100)
          : null;

        const [today] = await db
          .select({ total: sql<number>`coalesce(sum(${automationRuns.itemsProcessed}), 0)` })
          .from(automationRuns)
          .where(
            and(
              eq(automationRuns.automationKey, automation.key),
              gte(automationRuns.startedAt, startOfDay)
            )
          );

        return {
          ...automation,
          nextRunAt: computeNextRun(automation),
          recentRuns,
          successRate,
          itemsProcessedToday: Number(today?.total ?? 0),
        };
      })
    );
  },

  async update(
    key: AutomationKey,
    input: Partial<Pick<Automation, "enabled" | "paused" | "schedule" | "dailyLimit" | "settings">>
  ): Promise<Automation> {
    await this.ensureDefaults();
    const [automation] = await db
      .update(automations)
      .set(input)
      .where(eq(automations.key, key))
      .returning();
    return automation;
  },

  /**
   * Executes one automation immediately and records the run.
   * `trigger` distinguishes the Run Now button from cron.
   */
  async runNow(key: AutomationKey, trigger: "manual" | "scheduled" = "manual"): Promise<RunResult> {
    await this.ensureDefaults();
    const automation = await db.query.automations.findFirst({ where: eq(automations.key, key) });
    if (!automation) throw new Error(`Unknown automation: ${key}`);

    const remaining = await this.remainingDailyBudget(automation);
    if (trigger === "scheduled" && remaining <= 0) {
      const result = emptyRunResult();
      result.errors.push("Daily limit reached — skipped.");
      return result;
    }

    const [run] = await db
      .insert(automationRuns)
      .values({ automationKey: key, trigger })
      .returning();

    const startedAt = Date.now();
    try {
      const result = await REGISTRY[key].run({ limit: Math.max(1, remaining) });
      const status =
        result.failed === 0 && result.errors.length === 0
          ? "success"
          : result.succeeded > 0
            ? "partial"
            : "error";

      await db
        .update(automationRuns)
        .set({
          status,
          finishedAt: new Date(),
          durationMs: Date.now() - startedAt,
          itemsProcessed: result.processed,
          itemsSucceeded: result.succeeded,
          itemsFailed: result.failed,
          error: result.errors.slice(0, 5).join("\n") || null,
        })
        .where(eq(automationRuns.id, run.id));

      await db
        .update(automations)
        .set({ lastRunAt: new Date() })
        .where(eq(automations.key, key));

      return result;
    } catch (error) {
      await db
        .update(automationRuns)
        .set({
          status: "error",
          finishedAt: new Date(),
          durationMs: Date.now() - startedAt,
          error: error instanceof Error ? error.message : String(error),
        })
        .where(eq(automationRuns.id, run.id));
      throw error;
    }
  },

  /** All automations due for a scheduled run (called by cron). */
  async runDue(): Promise<Record<string, RunResult>> {
    await this.ensureDefaults();
    const rows = await db.select().from(automations);
    const results: Record<string, RunResult> = {};

    for (const automation of rows) {
      if (!automation.enabled || automation.paused) continue;
      const nextRun = computeNextRun(automation);
      if (nextRun && nextRun > new Date()) continue;

      try {
        results[automation.key] = await this.runNow(automation.key as AutomationKey, "scheduled");
      } catch (error) {
        const failed = emptyRunResult();
        failed.errors.push(error instanceof Error ? error.message : String(error));
        results[automation.key] = failed;
      }
    }
    return results;
  },

  async remainingDailyBudget(automation: Automation): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const [row] = await db
      .select({ total: sql<number>`coalesce(sum(${automationRuns.itemsProcessed}), 0)` })
      .from(automationRuns)
      .where(
        and(
          eq(automationRuns.automationKey, automation.key),
          gte(automationRuns.startedAt, startOfDay)
        )
      );
    return automation.dailyLimit - Number(row?.total ?? 0);
  },
};

function computeNextRun(automation: Automation): Date | null {
  if (!automation.enabled || automation.paused) return null;
  const interval = SCHEDULE_INTERVAL_MS[automation.schedule as AutomationSchedule];
  if (!interval) return null;
  if (!automation.lastRunAt) return new Date();
  return new Date(automation.lastRunAt.getTime() + interval);
}
