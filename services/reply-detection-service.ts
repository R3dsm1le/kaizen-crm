import { and, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { db, messages } from "@/db";
import { createInboxProvider } from "@/providers/email";
import { emptyRunResult, type RunResult } from "@/types";
import { CompanyService } from "./company-service";
import { SettingsService } from "./settings-service";
import { TimelineService } from "./timeline-service";

/**
 * Polls the configured IMAP inbox and matches incoming senders against
 * contacts we've emailed. On a match: mark the message replied, move the
 * company to "Replied" and cancel any scheduled follow-ups.
 */
export const ReplyDetectionService = {
  async run(): Promise<RunResult> {
    const result = emptyRunResult();
    const emailSettings = await SettingsService.get("email");
    const inbox = createInboxProvider(emailSettings);

    if (!inbox.isConfigured()) {
      result.errors.push("Reply detection needs IMAP credentials in Settings → Email.");
      return result;
    }

    const state = await SettingsService.getState<{ lastCheckedAt?: string }>("replyDetection");
    const since = state?.lastCheckedAt
      ? new Date(state.lastCheckedAt)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const inboxMessages = await inbox.fetchMessagesSince(since);
    await SettingsService.setState("replyDetection", { lastCheckedAt: new Date().toISOString() });
    if (!inboxMessages.length) return result;

    // Contacts we've actually emailed and are still waiting on.
    const awaiting = await db.query.messages.findMany({
      where: and(eq(messages.status, "sent"), isNull(messages.repliedAt), isNotNull(messages.toEmail)),
    });
    const byEmail = new Map<string, typeof awaiting>();
    for (const m of awaiting) {
      const key = m.toEmail!.toLowerCase();
      byEmail.set(key, [...(byEmail.get(key) ?? []), m]);
    }

    for (const incoming of inboxMessages) {
      const matches = byEmail.get(incoming.from);
      if (!matches?.length) continue;
      result.processed++;

      try {
        const companyIds = [...new Set(matches.map((m) => m.companyId))];
        await db
          .update(messages)
          .set({ repliedAt: incoming.date })
          .where(inArray(messages.id, matches.map((m) => m.id)));

        for (const companyId of companyIds) {
          await CompanyService.moveStage(companyId, "replied"); // also cancels follow-ups
          await TimelineService.record(companyId, "reply_received", "Reply received", {
            description: `From ${incoming.from} — "${incoming.subject}"`,
          });
        }
        byEmail.delete(incoming.from);
        result.succeeded++;
      } catch (error) {
        result.failed++;
        result.errors.push(`${incoming.from}: ${error instanceof Error ? error.message : error}`);
      }
    }
    return result;
  },

  /** Manual "they replied" action from the UI — same effects, no inbox needed. */
  async markReplied(companyId: string): Promise<void> {
    await db
      .update(messages)
      .set({ repliedAt: new Date() })
      .where(and(eq(messages.companyId, companyId), eq(messages.status, "sent"), isNull(messages.repliedAt)));
    await CompanyService.moveStage(companyId, "replied");
    await TimelineService.record(companyId, "reply_received", "Reply received", {
      description: "Marked manually",
    });
  },
};
