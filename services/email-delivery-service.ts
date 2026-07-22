import { and, asc, eq } from "drizzle-orm";
import { db, messages, followUps, type Message } from "@/db";
import { createEmailProvider } from "@/providers/email";
import { emptyRunResult, type RunResult } from "@/types";
import { CompanyService } from "./company-service";
import { SettingsService } from "./settings-service";
import { TimelineService } from "./timeline-service";

const FOLLOW_UP_DELAY_DAYS = 3;

/**
 * Sends outreach emails through the configured provider (SMTP or Resend),
 * updates message state, advances the pipeline and schedules follow-up #1.
 */
export const EmailDeliveryService = {
  /** Batch entry point: send everything the user queued. */
  async run(options?: { limit?: number }): Promise<RunResult> {
    const result = emptyRunResult();
    const queued = await db.query.messages.findMany({
      where: eq(messages.status, "queued"),
      orderBy: asc(messages.createdAt),
      limit: options?.limit ?? 20,
    });

    for (const message of queued) {
      result.processed++;
      try {
        await this.sendMessage(message.id);
        result.succeeded++;
      } catch (error) {
        result.failed++;
        result.errors.push(
          `${message.subject ?? message.kind}: ${error instanceof Error ? error.message : error}`
        );
      }
    }
    return result;
  },

  async sendMessage(messageId: string): Promise<Message> {
    const message = await db.query.messages.findFirst({
      where: eq(messages.id, messageId),
      with: { company: true, contact: true },
    });
    if (!message) throw new Error("Message not found");
    if (message.status === "sent") throw new Error("Message already sent");
    if (message.channel !== "email") throw new Error("Only email messages can be sent");

    const to = message.toEmail || message.contact?.email;
    if (!to) throw new Error("No recipient email — add a contact with an email first");

    const emailSettings = await SettingsService.get("email");
    const provider = createEmailProvider(emailSettings);
    if (!provider.isConfigured()) {
      throw new Error("No email provider configured. Add SMTP or Resend credentials in Settings.");
    }

    try {
      const { providerMessageId } = await provider.send({
        to,
        subject: message.subject ?? "(no subject)",
        text: message.body,
      });

      const [sent] = await db
        .update(messages)
        .set({ status: "sent", sentAt: new Date(), toEmail: to, providerMessageId, error: null })
        .where(eq(messages.id, messageId))
        .returning();

      await TimelineService.record(
        message.companyId,
        message.kind.startsWith("follow_up") ? "follow_up_sent" : "email_sent",
        `Email sent: ${message.subject ?? message.kind}`,
        { description: `To ${to} via ${provider.name}` }
      );

      if (message.kind === "cold_email") {
        await CompanyService.moveStage(message.companyId, "email_sent");
        await this.scheduleFirstFollowUp(message.companyId);
      }
      return sent;
    } catch (error) {
      await db
        .update(messages)
        .set({ status: "failed", error: error instanceof Error ? error.message : String(error) })
        .where(eq(messages.id, messageId));
      throw error;
    }
  },

  async queueMessage(messageId: string): Promise<void> {
    await db.update(messages).set({ status: "queued" }).where(eq(messages.id, messageId));
  },

  async scheduleFirstFollowUp(companyId: string): Promise<void> {
    const existing = await db.query.followUps.findFirst({
      where: and(eq(followUps.companyId, companyId), eq(followUps.status, "scheduled")),
    });
    if (existing) return;

    const scheduledAt = new Date(Date.now() + FOLLOW_UP_DELAY_DAYS * 24 * 60 * 60 * 1000);
    await db.insert(followUps).values({ companyId, attempt: 1, scheduledAt });
    await TimelineService.record(companyId, "follow_up_scheduled", "Follow-up #1 scheduled", {
      description: `Due ${scheduledAt.toLocaleDateString()}`,
    });
  },
};
