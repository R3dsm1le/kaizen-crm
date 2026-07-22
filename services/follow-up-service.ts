import { and, asc, eq, lte } from "drizzle-orm";
import { db, followUps, messages } from "@/db";
import { CLOSED_STAGES, emptyRunResult, type MessageKind, type RunResult } from "@/types";
import { EmailDeliveryService } from "./email-delivery-service";
import { TimelineService } from "./timeline-service";

const MAX_ATTEMPTS = 3;
const DELAY_DAYS_BY_ATTEMPT: Record<number, number> = { 1: 3, 2: 4, 3: 5 };

/**
 * Processes due follow-ups: sends the matching pre-generated draft and
 * schedules the next attempt. Stops automatically on reply, won, lost
 * or pause (handled by CompanyService.moveStage cancelling schedules).
 */
export const FollowUpService = {
  async run(options?: { limit?: number }): Promise<RunResult> {
    const result = emptyRunResult();
    const due = await db.query.followUps.findMany({
      where: and(eq(followUps.status, "scheduled"), lte(followUps.scheduledAt, new Date())),
      with: { company: true },
      orderBy: asc(followUps.scheduledAt),
      limit: options?.limit ?? 20,
    });

    for (const followUp of due) {
      result.processed++;
      try {
        // Safety net — closed conversations never get follow-ups.
        if (CLOSED_STAGES.includes(followUp.company.stage as (typeof CLOSED_STAGES)[number])) {
          await db
            .update(followUps)
            .set({ status: "cancelled" })
            .where(eq(followUps.id, followUp.id));
          continue;
        }

        await this.sendFollowUp(followUp.id, followUp.companyId, followUp.attempt);
        result.succeeded++;
      } catch (error) {
        result.failed++;
        result.errors.push(
          `${followUp.company.name}: ${error instanceof Error ? error.message : error}`
        );
      }
    }
    return result;
  },

  async sendFollowUp(followUpId: string, companyId: string, attempt: number): Promise<void> {
    const kind = `follow_up_${attempt}` as MessageKind;
    const draft = await db.query.messages.findFirst({
      where: and(
        eq(messages.companyId, companyId),
        eq(messages.kind, kind),
        eq(messages.status, "draft")
      ),
    });
    if (!draft) {
      throw new Error(`No ${kind} draft found — generate outreach for this company first`);
    }

    await EmailDeliveryService.sendMessage(draft.id);
    await db
      .update(followUps)
      .set({ status: "sent", messageId: draft.id })
      .where(eq(followUps.id, followUpId));

    if (attempt < MAX_ATTEMPTS) {
      const delayDays = DELAY_DAYS_BY_ATTEMPT[attempt + 1] ?? 4;
      const scheduledAt = new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000);
      await db.insert(followUps).values({ companyId, attempt: attempt + 1, scheduledAt });
      await TimelineService.record(
        companyId,
        "follow_up_scheduled",
        `Follow-up #${attempt + 1} scheduled`,
        { description: `Due ${scheduledAt.toLocaleDateString()}` }
      );
    }
  },

  async scheduleManual(companyId: string, date: Date): Promise<void> {
    const existing = await db.query.followUps.findMany({
      where: and(eq(followUps.companyId, companyId), eq(followUps.status, "scheduled")),
    });
    const attempt = existing.length ? Math.max(...existing.map((f) => f.attempt)) : 0;
    await db.insert(followUps).values({
      companyId,
      attempt: Math.min(attempt + 1, MAX_ATTEMPTS),
      scheduledAt: date,
    });
    await TimelineService.record(companyId, "follow_up_scheduled", "Follow-up scheduled", {
      description: `Due ${date.toLocaleDateString()}`,
    });
  },

  async pauseForCompany(companyId: string): Promise<void> {
    await db
      .update(followUps)
      .set({ status: "paused" })
      .where(and(eq(followUps.companyId, companyId), eq(followUps.status, "scheduled")));
  },

  async resumeForCompany(companyId: string): Promise<void> {
    await db
      .update(followUps)
      .set({ status: "scheduled" })
      .where(and(eq(followUps.companyId, companyId), eq(followUps.status, "paused")));
  },

  /** Follow-ups due today or earlier (dashboard). */
  async dueToday() {
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    return db.query.followUps.findMany({
      where: and(eq(followUps.status, "scheduled"), lte(followUps.scheduledAt, endOfDay)),
      with: { company: true },
      orderBy: asc(followUps.scheduledAt),
    });
  },
};
