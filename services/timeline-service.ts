import { desc, eq } from "drizzle-orm";
import { db, timelineEvents, type TimelineEvent } from "@/db";
import type { TimelineEventType } from "@/types";

/**
 * Records and reads the activity history of a company.
 * Every meaningful action in the CRM flows through `record`.
 */
export const TimelineService = {
  async record(
    companyId: string,
    type: TimelineEventType,
    title: string,
    options?: { description?: string; metadata?: Record<string, unknown> }
  ): Promise<void> {
    await db.insert(timelineEvents).values({
      companyId,
      type,
      title,
      description: options?.description,
      metadata: options?.metadata,
    });
  },

  async list(companyId: string, limit = 100): Promise<TimelineEvent[]> {
    return db.query.timelineEvents.findMany({
      where: eq(timelineEvents.companyId, companyId),
      orderBy: desc(timelineEvents.createdAt),
      limit,
    });
  },
};
