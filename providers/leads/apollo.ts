import type { LeadDiscoverySettings } from "@/lib/settings-schema";
import type { DiscoveredLead, DiscoverOptions, LeadProvider } from "./types";

interface ApolloOrganization {
  name?: string;
  website_url?: string;
  industry?: string;
  city?: string;
  country?: string;
  estimated_num_employees?: number;
  linkedin_url?: string;
  phone?: string;
}

/**
 * Optional Apollo.io adapter (free tier available). Searches organizations
 * matching the configured query/location.
 */
export class ApolloLeadProvider implements LeadProvider {
  readonly name = "apollo";

  constructor(private settings: LeadDiscoverySettings) {}

  isConfigured(): boolean {
    return Boolean(this.settings.apolloApiKey);
  }

  async discover(options: DiscoverOptions): Promise<DiscoveredLead[]> {
    const response = await fetch("https://api.apollo.io/api/v1/mixed_companies/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": this.settings.apolloApiKey,
      },
      body: JSON.stringify({
        q_organization_keyword_tags: this.settings.searchQuery
          ? [this.settings.searchQuery]
          : undefined,
        organization_locations: this.settings.searchLocation
          ? [this.settings.searchLocation]
          : undefined,
        per_page: Math.min(options.limit, 25),
        page: 1,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Apollo API ${response.status}: ${body.slice(0, 200)}`);
    }

    const data = (await response.json()) as { organizations?: ApolloOrganization[] };
    return (data.organizations ?? [])
      .filter((o) => o.name)
      .map((o) => ({
        name: o.name!,
        website: o.website_url,
        industry: o.industry,
        city: o.city,
        country: o.country,
        employees: o.estimated_num_employees ? String(o.estimated_num_employees) : undefined,
        linkedinUrl: o.linkedin_url,
        phone: o.phone,
        source: "apollo" as const,
      }));
  }
}
