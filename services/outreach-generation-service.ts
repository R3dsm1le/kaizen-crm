import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { companies, db, messages, type Message } from "@/db";
import { createAIProvider } from "@/providers/ai";
import type { ProfileSettings } from "@/lib/settings-schema";
import { emptyRunResult, type CompanyResearch, type RunResult } from "@/types";
import { CompanyService } from "./company-service";
import { ContactService } from "./contact-service";
import { SettingsService } from "./settings-service";
import { TimelineService } from "./timeline-service";

const outreachSchema = z.object({
  coldEmailSubject: z.string(),
  coldEmailBody: z.string(),
  linkedinMessage: z.string(),
  followUp1: z.string(),
  followUp2: z.string(),
  followUp3: z.string(),
});

/**
 * Generates the full outreach pack for a company: cold email, LinkedIn
 * message and three follow-ups. Everything is stored as editable drafts.
 */
export const OutreachGenerationService = {
  /** Batch entry point: generate outreach for qualified companies without drafts. */
  async run(options?: { limit?: number }): Promise<RunResult> {
    const result = emptyRunResult();
    const qualified = await db.query.companies.findMany({
      where: eq(companies.stage, "qualified"),
      limit: options?.limit ?? 10,
    });

    for (const company of qualified) {
      result.processed++;
      try {
        await this.generateForCompany(company.id);
        result.succeeded++;
      } catch (error) {
        result.failed++;
        result.errors.push(`${company.name}: ${error instanceof Error ? error.message : error}`);
      }
    }
    return result;
  },

  async generateForCompany(companyId: string): Promise<Message[]> {
    const company = await db.query.companies.findFirst({ where: eq(companies.id, companyId) });
    if (!company) throw new Error("Company not found");

    const ai = createAIProvider(await SettingsService.get("ai"));
    const profile = await SettingsService.get("profile");
    const contact = await ContactService.primaryContact(companyId);

    const pack = await ai.generateObject(
      buildPrompt(company.name, company.research, contact?.name ?? null, profile),
      outreachSchema,
      { temperature: 0.8 }
    );

    // Regenerating replaces previous unsent drafts, never sent messages.
    await db
      .delete(messages)
      .where(and(eq(messages.companyId, companyId), eq(messages.status, "draft")));

    const drafts = [
      { kind: "cold_email", channel: "email", subject: pack.coldEmailSubject, body: pack.coldEmailBody },
      { kind: "linkedin_message", channel: "linkedin", subject: null, body: pack.linkedinMessage },
      { kind: "follow_up_1", channel: "email", subject: `Re: ${pack.coldEmailSubject}`, body: pack.followUp1 },
      { kind: "follow_up_2", channel: "email", subject: `Re: ${pack.coldEmailSubject}`, body: pack.followUp2 },
      { kind: "follow_up_3", channel: "email", subject: `Re: ${pack.coldEmailSubject}`, body: pack.followUp3 },
    ] as const;

    const created = await db
      .insert(messages)
      .values(
        drafts.map((d) => ({
          companyId,
          contactId: contact?.id,
          channel: d.channel,
          kind: d.kind,
          subject: d.subject,
          body: d.body,
          toEmail: contact?.email ?? null,
        }))
      )
      .returning();

    if (company.stage === "qualified" || company.stage === "research" || company.stage === "lead_found") {
      await CompanyService.moveStage(companyId, "outreach_ready");
    }

    await TimelineService.record(companyId, "email_generated", "Outreach generated", {
      description: "Cold email, LinkedIn message and 3 follow-ups drafted",
    });
    return created;
  },
};

function buildPrompt(
  companyName: string,
  research: CompanyResearch | null,
  contactName: string | null,
  profile: ProfileSettings
): string {
  return `You write concise, human outreach for a solo digital transformation consultant.

CONSULTANT
Name: ${profile.name || "the consultant"}
Company: ${profile.companyName || "an independent consultancy"}
Value proposition: ${profile.valueProposition || "helps businesses modernize operations with pragmatic digital tools and automation"}
Services: ${profile.services || "process automation, digital strategy, remote-work enablement"}
${profile.meetingLink ? `Meeting link: ${profile.meetingLink}` : ""}

TARGET COMPANY: ${companyName}
${contactName ? `CONTACT: ${contactName}` : "CONTACT: unknown — write without a first name, e.g. 'Hi there,'"}
${
  research
    ? `RESEARCH
Summary: ${research.summary}
Inefficiencies: ${research.operationalInefficiencies.join("; ")}
Automation opportunities: ${research.automationOpportunities.join("; ")}
Suggested services: ${research.consultingServices.join("; ")}`
    : "No research available — keep the email curious and generic to their industry."
}

Write JSON with:
- coldEmailSubject: short, no clickbait, lowercase feel (max 8 words)
- coldEmailBody: 90-130 words. Personal, specific to their business, one concrete observation, one clear low-friction CTA. No buzzwords, no "I hope this finds you well". Sign with the consultant's name.
- linkedinMessage: max 60 words, casual connection request note
- followUp1: 40-70 words, sent ~3 days later, adds one new angle
- followUp2: 40-70 words, sent ~1 week later, shares a concrete idea or mini-audit offer
- followUp3: 30-50 words, polite breakup email leaving the door open

Plain text only. No placeholders like [Name] — use what you know or omit.`;
}
