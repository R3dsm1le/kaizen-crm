import { z } from "zod";
import { and, asc, isNull, eq } from "drizzle-orm";
import { companies, db, type Company } from "@/db";
import { createAIProvider } from "@/providers/ai";
import { fetchWebsiteText } from "@/lib/scrape";
import { emptyRunResult, type CompanyResearch, type RunResult } from "@/types";
import { CompanyService } from "./company-service";
import { LeadScoringService } from "./lead-scoring-service";
import { SettingsService } from "./settings-service";
import { TimelineService } from "./timeline-service";

const researchSchema = z.object({
  summary: z.string(),
  businessDescription: z.string(),
  digitalMaturity: z.enum(["low", "medium", "high"]),
  digitalMaturityReasoning: z.string(),
  operationalInefficiencies: z.array(z.string()),
  automationOpportunities: z.array(z.string()),
  remoteWorkOpportunities: z.array(z.string()),
  consultingServices: z.array(z.string()),
  leadScore: z.number(),
  scoreReasoning: z.string(),
}) satisfies z.ZodType<CompanyResearch>;

/**
 * Generates AI research for a company: summary, digital maturity,
 * inefficiencies, consulting opportunities and a lead score.
 */
export const CompanyResearchService = {
  /** Batch entry point used by the automation & cron. */
  async run(options?: { limit?: number }): Promise<RunResult> {
    const result = emptyRunResult();
    const pending = await db.query.companies.findMany({
      where: and(isNull(companies.researchedAt), eq(companies.stage, "lead_found")),
      orderBy: asc(companies.createdAt),
      limit: options?.limit ?? 10,
    });

    for (const company of pending) {
      result.processed++;
      try {
        await this.researchCompany(company.id);
        result.succeeded++;
      } catch (error) {
        result.failed++;
        result.errors.push(`${company.name}: ${error instanceof Error ? error.message : error}`);
      }
    }
    return result;
  },

  async researchCompany(companyId: string): Promise<Company> {
    const company = await db.query.companies.findFirst({ where: eq(companies.id, companyId) });
    if (!company) throw new Error("Company not found");

    const ai = createAIProvider(await SettingsService.get("ai"));
    const profile = await SettingsService.get("profile");

    let websiteText = "";
    if (company.website) {
      websiteText = await fetchWebsiteText(company.website).catch(() => "");
    }

    const research = await ai.generateObject(buildPrompt(company, websiteText, profile.services), researchSchema);
    const score = LeadScoringService.resolveScore(research);
    research.leadScore = score;

    const qualified = LeadScoringService.isQualified(score);
    const updated = await CompanyService.update(companyId, {
      aiSummary: research.summary,
      research,
      leadScore: score,
      researchedAt: new Date(),
      stage: qualified ? "qualified" : "research",
      stageChangedAt: new Date(),
    });

    await TimelineService.record(companyId, "research_generated", "AI research generated", {
      description: `Lead score ${score}/100 — ${qualified ? "qualified" : "needs review"}`,
      metadata: { leadScore: score },
    });
    return updated;
  },
};

function buildPrompt(company: Company, websiteText: string, consultantServices: string): string {
  return `You are a research analyst for a solo digital transformation consultancy.
Analyze this company as a potential consulting lead.

COMPANY
Name: ${company.name}
Website: ${company.website ?? "unknown"}
Industry: ${company.industry ?? "unknown"}
Location: ${[company.city, company.country].filter(Boolean).join(", ") || "unknown"}
Employees: ${company.employees ?? "unknown"}

${websiteText ? `WEBSITE CONTENT (extracted)\n${websiteText}` : "No website content available — reason from the company profile alone."}

${consultantServices ? `THE CONSULTANT OFFERS\n${consultantServices}` : ""}

Return JSON with exactly these fields:
- summary: 2-3 sentence executive summary of the company
- businessDescription: what the business does and who it serves
- digitalMaturity: "low" | "medium" | "high"
- digitalMaturityReasoning: 1-2 sentences of evidence
- operationalInefficiencies: 2-5 likely inefficiencies (specific to this business)
- automationOpportunities: 2-5 concrete automation opportunities
- remoteWorkOpportunities: 0-3 remote-work enablement opportunities
- consultingServices: 2-5 consulting services this company would plausibly buy
- leadScore: 0-100 (higher = better fit for digital transformation consulting; low digital maturity with real budget potential scores high)
- scoreReasoning: 1-2 sentences justifying the score

Be specific and grounded. Never invent facts that contradict the website content.`;
}
