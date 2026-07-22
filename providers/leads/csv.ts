import Papa from "papaparse";
import type { DiscoveredLead } from "./types";

/**
 * Parses a CSV export into leads. Column names are matched loosely so
 * exports from LinkedIn, Apollo, Clay or a hand-made sheet all work.
 * Not a scheduled provider — used by the manual import flow.
 */
export function parseLeadsCsv(csvContent: string): { leads: DiscoveredLead[]; errors: string[] } {
  const result = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/[\s_-]+/g, ""),
  });

  const errors = result.errors.slice(0, 5).map((e) => `Row ${e.row}: ${e.message}`);
  const leads: DiscoveredLead[] = [];

  for (const row of result.data) {
    const name = pick(row, ["company", "companyname", "name", "organization", "account"]);
    if (!name) continue;
    const contactName = pick(row, ["contact", "contactname", "fullname", "person"]);
    leads.push({
      name,
      website: pick(row, ["website", "domain", "url", "companywebsite", "websiteurl"]),
      industry: pick(row, ["industry", "sector", "vertical"]),
      country: pick(row, ["country"]),
      city: pick(row, ["city", "location", "town"]),
      employees: pick(row, ["employees", "employeecount", "size", "companysize", "headcount"]),
      linkedinUrl: pick(row, ["linkedin", "linkedinurl", "companylinkedin"]),
      phone: pick(row, ["phone", "phonenumber", "telephone"]),
      contacts: contactName
        ? [
            {
              name: contactName,
              title: pick(row, ["title", "jobtitle", "position", "role"]),
              email: pick(row, ["email", "emailaddress", "contactemail"]),
              phone: pick(row, ["contactphone", "mobile"]),
              linkedinUrl: pick(row, ["contactlinkedin", "personlinkedin"]),
            },
          ]
        : undefined,
      source: "csv",
    });
  }

  return { leads, errors };
}

function pick(row: Record<string, string>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = row[key]?.trim();
    if (value) return value;
  }
  return undefined;
}
