import type { LeadSource } from "@/types";

export interface DiscoveredContact {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
}

export interface DiscoveredLead {
  name: string;
  website?: string;
  industry?: string;
  country?: string;
  city?: string;
  employees?: string;
  linkedinUrl?: string;
  phone?: string;
  contacts?: DiscoveredContact[];
  source: LeadSource;
}

export interface DiscoverOptions {
  limit: number;
}

/**
 * Abstraction over any lead source. New sources (Clay, Apollo, custom
 * scrapers) plug in here without touching the CRM.
 */
export interface LeadProvider {
  readonly name: string;
  isConfigured(): boolean;
  discover(options: DiscoverOptions): Promise<DiscoveredLead[]>;
}
