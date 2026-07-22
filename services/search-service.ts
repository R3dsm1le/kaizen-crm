import { desc, ilike, or } from "drizzle-orm";
import { companies, contacts, db, messages, timelineEvents } from "@/db";

export interface SearchResult {
  type: "company" | "contact" | "message" | "activity";
  id: string;
  companyId: string;
  title: string;
  subtitle: string;
}

/** Global instant search across companies, contacts, emails and activity. */
export const SearchService = {
  async search(query: string, limit = 20): Promise<SearchResult[]> {
    const term = `%${query.trim()}%`;
    if (query.trim().length < 2) return [];

    const [companyRows, contactRows, messageRows, activityRows] = await Promise.all([
      db.query.companies.findMany({
        where: or(
          ilike(companies.name, term),
          ilike(companies.domain, term),
          ilike(companies.industry, term),
          ilike(companies.notes, term),
          ilike(companies.aiSummary, term)
        ),
        orderBy: desc(companies.updatedAt),
        limit,
      }),
      db.query.contacts.findMany({
        where: or(
          ilike(contacts.name, term),
          ilike(contacts.email, term),
          ilike(contacts.title, term)
        ),
        with: { company: true },
        limit,
      }),
      db.query.messages.findMany({
        where: or(ilike(messages.subject, term), ilike(messages.body, term)),
        with: { company: true },
        orderBy: desc(messages.createdAt),
        limit,
      }),
      db.query.timelineEvents.findMany({
        where: or(ilike(timelineEvents.title, term), ilike(timelineEvents.description, term)),
        with: { company: true },
        orderBy: desc(timelineEvents.createdAt),
        limit,
      }),
    ]);

    const results: SearchResult[] = [
      ...companyRows.map((c) => ({
        type: "company" as const,
        id: c.id,
        companyId: c.id,
        title: c.name,
        subtitle: [c.industry, c.domain].filter(Boolean).join(" · ") || "Company",
      })),
      ...contactRows.map((c) => ({
        type: "contact" as const,
        id: c.id,
        companyId: c.companyId,
        title: c.name,
        subtitle: [c.title, c.company.name].filter(Boolean).join(" · "),
      })),
      ...messageRows.map((m) => ({
        type: "message" as const,
        id: m.id,
        companyId: m.companyId,
        title: m.subject ?? "(no subject)",
        subtitle: `${m.company.name} · ${m.status}`,
      })),
      ...activityRows.map((e) => ({
        type: "activity" as const,
        id: e.id,
        companyId: e.companyId,
        title: e.title,
        subtitle: e.company.name,
      })),
    ];

    return results.slice(0, limit);
  },
};
