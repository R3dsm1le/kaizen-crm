import type { LeadDiscoverySettings } from "@/lib/settings-schema";
import type { DiscoveredLead, DiscoverOptions, LeadProvider } from "./types";

/**
 * Turns a plain list of company website URLs (Settings → Lead Discovery)
 * into leads by fetching each homepage and reading its metadata.
 * Zero API keys required — the simplest possible free provider.
 */
export class WebsiteLeadProvider implements LeadProvider {
  readonly name = "website";

  constructor(private settings: LeadDiscoverySettings) {}

  isConfigured(): boolean {
    return this.urls().length > 0;
  }

  private urls(): string[] {
    return this.settings.websiteUrls
      .split(/\r?\n/)
      .map((u) => u.trim())
      .filter(Boolean);
  }

  async discover(options: DiscoverOptions): Promise<DiscoveredLead[]> {
    const leads: DiscoveredLead[] = [];
    for (const url of this.urls().slice(0, options.limit)) {
      try {
        leads.push(await this.scrape(url));
      } catch {
        // Unreachable site — fall back to the domain as a name.
        const domain = safeHostname(url);
        if (domain) leads.push({ name: domain, website: url, source: "website" });
      }
    }
    return leads;
  }

  private async scrape(url: string): Promise<DiscoveredLead> {
    const fullUrl = url.includes("://") ? url : `https://${url}`;
    const response = await fetch(fullUrl, {
      signal: AbortSignal.timeout(10_000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; KaizenCRM/1.0)" },
    });
    const html = await response.text();
    const title =
      matchMeta(html, "og:site_name") ??
      matchTag(html, "title")?.split(/[|–—-]/)[0]?.trim() ??
      safeHostname(fullUrl) ??
      fullUrl;
    return { name: title, website: fullUrl, source: "website" };
  }
}

function matchTag(html: string, tag: string): string | undefined {
  const match = html.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i"));
  return match?.[1]?.trim() || undefined;
}

function matchMeta(html: string, property: string): string | undefined {
  const match =
    html.match(
      new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, "i")
    ) ??
    html.match(
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, "i")
    );
  return match?.[1]?.trim() || undefined;
}

function safeHostname(url: string): string | undefined {
  try {
    return new URL(url.includes("://") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}
