import { z } from "zod";
import { and, asc, eq, isNull, isNotNull, or } from "drizzle-orm";
import { companies, db } from "@/db";
import { createAIProvider } from "@/providers/ai";
import { fetchWebsiteText } from "@/lib/scrape";
import { emptyRunResult, type RunResult } from "@/types";
import { CompanyService } from "./company-service";
import { SettingsService } from "./settings-service";
import { TimelineService } from "./timeline-service";

const enrichmentSchema = z.object({
  industry: z.string().nullable(),
  country: z.string().nullable(),
  city: z.string().nullable(),
  employees: z.string().nullable(),
  linkedinUrl: z.string().nullable(),
});

/**
 * Fills in missing firmographic fields (industry, location, size, LinkedIn)
 * from the company's website using AI. Only touches empty fields.
 */
export const LeadEnrichmentService = {
  async run(options?: { limit?: number }): Promise<RunResult> {
    const result = emptyRunResult();
    const pending = await db.query.companies.findMany({
      where: and(
        isNull(companies.enrichedAt),
        isNotNull(companies.website),
        or(isNull(companies.industry), isNull(companies.country), isNull(companies.employees))
      ),
      orderBy: asc(companies.createdAt),
      limit: options?.limit ?? 10,
    });

    for (const company of pending) {
      result.processed++;
      try {
        await this.enrichCompany(company.id);
        result.succeeded++;
      } catch (error) {
        result.failed++;
        result.errors.push(`${company.name}: ${error instanceof Error ? error.message : error}`);
      }
    }
    return result;
  },

  async enrichCompany(companyId: string): Promise<void> {
    const company = await db.query.companies.findFirst({ where: eq(companies.id, companyId) });
    if (!company) throw new Error("Company not found");
    if (!company.website) throw new Error("Company has no website to enrich from");

    const ai = createAIProvider(await SettingsService.get("ai"));
    const websiteText = await fetchWebsiteText(company.website).catch(() => "");

    const enriched = await ai.generateObject(
      `Extract firmographic data for the company "${company.name}" from its website content.
Return JSON: { industry, country, city, employees, linkedinUrl } — use null when the content doesn't reveal a field. "employees" is a range like "1-10", "11-50", "51-200".

WEBSITE CONTENT
${websiteText || "(none available — return nulls unless the company name itself is conclusive)"}`,
      enrichmentSchema
    );

    const updates: Record<string, unknown> = { enrichedAt: new Date() };
    const filled: string[] = [];
    for (const field of ["industry", "country", "city", "employees", "linkedinUrl"] as const) {
      if (!company[field] && enriched[field]) {
        updates[field] = enriched[field];
        filled.push(field);
      }
    }

    await CompanyService.update(companyId, updates);
    if (filled.length) {
      await TimelineService.record(companyId, "lead_enriched", "Lead enriched", {
        description: `Filled: ${filled.join(", ")}`,
      });
    }
  },
};
