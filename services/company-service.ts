import {
  and,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  isNotNull,
  lte,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
import {
  companies,
  contacts,
  db,
  followUps,
  messages,
  timelineEvents,
  type Company,
  type NewCompany,
} from "@/db";
import { CLOSED_STAGES, STAGE_LABELS, STAGES, type Stage } from "@/types";
import { normalizeDomain } from "@/lib/utils";
import { TimelineService } from "./timeline-service";

export interface CompanyFilters {
  search?: string;
  stage?: Stage;
  source?: string;
  minScore?: number;
}

export type CompanyWithRelations = Company & {
  contacts: (typeof contacts.$inferSelect)[];
  messages: (typeof messages.$inferSelect)[];
  timelineEvents: (typeof timelineEvents.$inferSelect)[];
  followUps: (typeof followUps.$inferSelect)[];
};

/** Core CRUD and pipeline operations for companies (leads). */
export const CompanyService = {
  async list(filters: CompanyFilters = {}): Promise<Company[]> {
    const conditions = [];
    if (filters.search) {
      const term = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(companies.name, term),
          ilike(companies.domain, term),
          ilike(companies.industry, term)
        )
      );
    }
    if (filters.stage) conditions.push(eq(companies.stage, filters.stage));
    if (filters.source) conditions.push(eq(companies.source, filters.source));
    if (filters.minScore !== undefined) conditions.push(gte(companies.leadScore, filters.minScore));

    return db.query.companies.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      orderBy: desc(companies.createdAt),
    });
  },

  async get(id: string): Promise<CompanyWithRelations | null> {
    const company = await db.query.companies.findFirst({
      where: eq(companies.id, id),
      with: {
        contacts: { orderBy: desc(contacts.isDecisionMaker) },
        messages: { orderBy: desc(messages.createdAt) },
        timelineEvents: { orderBy: desc(timelineEvents.createdAt), limit: 100 },
        followUps: { orderBy: desc(followUps.scheduledAt) },
      },
    });
    return company ?? null;
  },

  async create(input: NewCompany): Promise<Company> {
    const domain = input.domain ?? normalizeDomain(input.website);
    const [company] = await db
      .insert(companies)
      .values({ ...input, domain })
      .returning();
    await TimelineService.record(company.id, "lead_imported", "Lead added", {
      description: `Added from ${company.source}`,
    });
    return company;
  },

  async update(id: string, input: Partial<NewCompany>): Promise<Company> {
    if (input.website && !input.domain) input.domain = normalizeDomain(input.website);
    const [company] = await db.update(companies).set(input).where(eq(companies.id, id)).returning();
    return company;
  },

  async remove(id: string): Promise<void> {
    await db.delete(companies).where(eq(companies.id, id));
  },

  async addNote(id: string, note: string): Promise<void> {
    const company = await db.query.companies.findFirst({ where: eq(companies.id, id) });
    if (!company) throw new Error("Company not found");
    const notes = company.notes ? `${company.notes}\n\n${note}` : note;
    await db.update(companies).set({ notes }).where(eq(companies.id, id));
    await TimelineService.record(id, "note_added", "Note added", { description: note });
  },

  async moveStage(id: string, stage: Stage): Promise<Company> {
    const [company] = await db
      .update(companies)
      .set({ stage, stageChangedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();

    await TimelineService.record(id, "stage_changed", `Moved to ${STAGE_LABELS[stage]}`);

    // A closed conversation must never receive automated follow-ups.
    if (CLOSED_STAGES.includes(stage)) {
      await db
        .update(followUps)
        .set({ status: "cancelled" })
        .where(and(eq(followUps.companyId, id), eq(followUps.status, "scheduled")));
    }
    return company;
  },

  /** Companies that don't have a row yet for the given domain. */
  async findByDomain(domain: string): Promise<Company | null> {
    const company = await db.query.companies.findFirst({ where: eq(companies.domain, domain) });
    return company ?? null;
  },

  async findByName(name: string): Promise<Company | null> {
    const company = await db.query.companies.findFirst({ where: ilike(companies.name, name) });
    return company ?? null;
  },

  async pipelineCounts(): Promise<Record<Stage, number>> {
    const rows = await db
      .select({ stage: companies.stage, total: count() })
      .from(companies)
      .groupBy(companies.stage);
    const counts = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<Stage, number>;
    for (const row of rows) {
      if (row.stage in counts) counts[row.stage as Stage] = row.total;
    }
    return counts;
  },

  async kpis() {
    const [totals] = await db
      .select({
        totalLeads: count(),
        qualified: count(sql`case when ${companies.leadScore} >= 60 then 1 end`),
        won: count(sql`case when ${companies.stage} = 'won' then 1 end`),
        meetings: count(sql`case when ${companies.stage} = 'meeting_scheduled' then 1 end`),
      })
      .from(companies);

    const [messageTotals] = await db
      .select({
        emailsSent: count(sql`case when ${messages.status} = 'sent' then 1 end`),
        replies: count(sql`case when ${messages.repliedAt} is not null then 1 end`),
      })
      .from(messages);

    return {
      totalLeads: totals.totalLeads,
      qualifiedLeads: totals.qualified,
      emailsSent: messageTotals.emailsSent,
      replies: messageTotals.replies,
      meetings: totals.meetings,
      wonDeals: totals.won,
    };
  },

  async recent(limit = 5): Promise<Company[]> {
    return db.query.companies.findMany({ orderBy: desc(companies.createdAt), limit });
  },

  /** Companies whose next action is due today or overdue. */
  async dueToday(): Promise<Company[]> {
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    return db.query.companies.findMany({
      where: and(
        isNotNull(companies.nextActionAt),
        lte(companies.nextActionAt, endOfDay),
        notInArray(companies.stage, ["won", "lost"])
      ),
      orderBy: companies.nextActionAt,
    });
  },

  async findManyByIds(ids: string[]): Promise<Company[]> {
    if (!ids.length) return [];
    return db.query.companies.findMany({ where: inArray(companies.id, ids) });
  },
};
