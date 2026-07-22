import { createLeadProvider, parseLeadsCsv, type DiscoveredLead } from "@/providers/leads";
import { normalizeDomain } from "@/lib/utils";
import { emptyRunResult, type RunResult } from "@/types";
import { CompanyService } from "./company-service";
import { ContactService } from "./contact-service";
import { SettingsService } from "./settings-service";

/**
 * Finds new leads through the configured provider and imports them,
 * deduplicating by website domain (falling back to exact name).
 * Called identically by the Automation Center, the cron job and the UI.
 */
export const LeadDiscoveryService = {
  async run(options?: { limit?: number }): Promise<RunResult> {
    const result = emptyRunResult();
    const settings = await SettingsService.get("leadDiscovery");
    const provider = createLeadProvider(settings);

    if (!provider.isConfigured()) {
      result.errors.push(
        `Lead provider "${provider.name}" is not configured. Set it up in Settings → Lead Discovery.`
      );
      return result;
    }

    const leads = await provider.discover({ limit: options?.limit ?? 25 });
    return this.importLeads(leads);
  },

  /** Import from a CSV upload. Shares the exact same import path. */
  async importCsv(csvContent: string): Promise<RunResult> {
    const { leads, errors } = parseLeadsCsv(csvContent);
    const result = await this.importLeads(leads);
    result.errors.unshift(...errors);
    return result;
  },

  async importLeads(leads: DiscoveredLead[]): Promise<RunResult> {
    const result = emptyRunResult();

    for (const lead of leads) {
      result.processed++;
      try {
        const domain = normalizeDomain(lead.website);
        const existing = domain
          ? await CompanyService.findByDomain(domain)
          : await CompanyService.findByName(lead.name);
        if (existing) continue; // duplicate — skip silently

        const company = await CompanyService.create({
          name: lead.name,
          website: lead.website,
          domain,
          industry: lead.industry,
          country: lead.country,
          city: lead.city,
          employees: lead.employees,
          linkedinUrl: lead.linkedinUrl,
          source: lead.source,
        });

        for (const contact of lead.contacts ?? []) {
          await ContactService.create({
            companyId: company.id,
            name: contact.name,
            title: contact.title,
            email: contact.email,
            phone: contact.phone,
            linkedinUrl: contact.linkedinUrl,
          });
        }
        result.succeeded++;
      } catch (error) {
        result.failed++;
        result.errors.push(`${lead.name}: ${error instanceof Error ? error.message : error}`);
      }
    }
    return result;
  },
};
