import type { LeadDiscoverySettings } from "@/lib/settings-schema";
import { GoogleMapsLeadProvider } from "./google-maps";
import { WebsiteLeadProvider } from "./website";
import { ApolloLeadProvider } from "./apollo";
import type { LeadProvider } from "./types";

export type { LeadProvider, DiscoveredLead, DiscoveredContact, DiscoverOptions } from "./types";
export { parseLeadsCsv } from "./csv";

const factories: Record<string, (s: LeadDiscoverySettings) => LeadProvider> = {
  google_maps: (s) => new GoogleMapsLeadProvider(s),
  website: (s) => new WebsiteLeadProvider(s),
  apollo: (s) => new ApolloLeadProvider(s),
};

export function createLeadProvider(settings: LeadDiscoverySettings): LeadProvider {
  const factory = factories[settings.provider] ?? factories.google_maps;
  return factory(settings);
}
