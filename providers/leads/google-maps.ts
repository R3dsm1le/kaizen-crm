import type { LeadDiscoverySettings } from "@/lib/settings-schema";
import type { DiscoveredLead, DiscoverOptions, LeadProvider } from "./types";

interface PlacesResult {
  displayName?: { text?: string };
  websiteUri?: string;
  formattedAddress?: string;
  internationalPhoneNumber?: string;
  primaryTypeDisplayName?: { text?: string };
}

/**
 * Discovers local businesses via the Google Places API (Text Search).
 * The free monthly credit comfortably covers a solo consultant's volume.
 */
export class GoogleMapsLeadProvider implements LeadProvider {
  readonly name = "google_maps";

  constructor(private settings: LeadDiscoverySettings) {}

  isConfigured(): boolean {
    return Boolean(this.settings.googleMapsApiKey && this.settings.searchQuery);
  }

  async discover(options: DiscoverOptions): Promise<DiscoveredLead[]> {
    const query = [this.settings.searchQuery, this.settings.searchLocation]
      .filter(Boolean)
      .join(" in ");

    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.settings.googleMapsApiKey,
        "X-Goog-FieldMask":
          "places.displayName,places.websiteUri,places.formattedAddress,places.internationalPhoneNumber,places.primaryTypeDisplayName",
      },
      body: JSON.stringify({ textQuery: query, pageSize: Math.min(options.limit, 20) }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Google Places API ${response.status}: ${body.slice(0, 200)}`);
    }

    const data = (await response.json()) as { places?: PlacesResult[] };
    return (data.places ?? [])
      .filter((p) => p.displayName?.text)
      .map((p) => ({
        name: p.displayName!.text!,
        website: p.websiteUri,
        industry: p.primaryTypeDisplayName?.text,
        city: this.settings.searchLocation || extractCity(p.formattedAddress),
        phone: p.internationalPhoneNumber,
        source: "google_maps" as const,
      }));
  }
}

function extractCity(address?: string): string | undefined {
  if (!address) return undefined;
  const parts = address.split(",").map((p) => p.trim());
  return parts.length >= 2 ? parts[parts.length - 2]?.replace(/\d+/g, "").trim() : undefined;
}
