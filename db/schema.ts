import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import type { CompanyResearch } from "@/types";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id"),
    name: text("name").notNull(),
    domain: text("domain"),
    website: text("website"),
    industry: text("industry"),
    country: text("country"),
    city: text("city"),
    employees: text("employees"),
    linkedinUrl: text("linkedin_url"),
    source: text("source").notNull().default("manual"),
    stage: text("stage").notNull().default("lead_found"),
    stageChangedAt: timestamp("stage_changed_at", { withTimezone: true }).notNull().defaultNow(),
    leadScore: integer("lead_score"),
    tags: jsonb("tags").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    notes: text("notes"),
    aiSummary: text("ai_summary"),
    research: jsonb("research").$type<CompanyResearch>(),
    researchedAt: timestamp("researched_at", { withTimezone: true }),
    enrichedAt: timestamp("enriched_at", { withTimezone: true }),
    nextAction: text("next_action"),
    nextActionAt: timestamp("next_action_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("companies_domain_unique").on(t.domain),
    index("companies_stage_idx").on(t.stage),
    index("companies_created_idx").on(t.createdAt),
  ]
);

export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    title: text("title"),
    email: text("email"),
    phone: text("phone"),
    linkedinUrl: text("linkedin_url"),
    isDecisionMaker: boolean("is_decision_maker").notNull().default(false),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [index("contacts_company_idx").on(t.companyId)]
);

export const timelineEvents = pgTable(
  "timeline_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("timeline_company_created_idx").on(t.companyId, t.createdAt)]
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
    channel: text("channel").notNull().default("email"),
    kind: text("kind").notNull(),
    subject: text("subject"),
    body: text("body").notNull(),
    status: text("status").notNull().default("draft"),
    toEmail: text("to_email"),
    providerMessageId: text("provider_message_id"),
    error: text("error"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    openedAt: timestamp("opened_at", { withTimezone: true }),
    clickedAt: timestamp("clicked_at", { withTimezone: true }),
    repliedAt: timestamp("replied_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("messages_company_idx").on(t.companyId),
    index("messages_status_idx").on(t.status),
  ]
);

export const followUps = pgTable(
  "follow_ups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    messageId: uuid("message_id").references(() => messages.id, { onDelete: "set null" }),
    attempt: integer("attempt").notNull().default(1),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    status: text("status").notNull().default("scheduled"), // scheduled | sent | cancelled | paused
    ...timestamps,
  },
  (t) => [
    index("follow_ups_company_idx").on(t.companyId),
    index("follow_ups_due_idx").on(t.status, t.scheduledAt),
  ]
);

export const automations = pgTable("automations", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  enabled: boolean("enabled").notNull().default(false),
  paused: boolean("paused").notNull().default(false),
  schedule: text("schedule").notNull().default("daily"),
  dailyLimit: integer("daily_limit").notNull().default(25),
  settings: jsonb("settings").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  ...timestamps,
});

export const automationRuns = pgTable(
  "automation_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    automationKey: text("automation_key").notNull(),
    trigger: text("trigger").notNull().default("manual"), // manual | scheduled
    status: text("status").notNull().default("running"), // running | success | partial | error
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    durationMs: integer("duration_ms"),
    itemsProcessed: integer("items_processed").notNull().default(0),
    itemsSucceeded: integer("items_succeeded").notNull().default(0),
    itemsFailed: integer("items_failed").notNull().default(0),
    error: text("error"),
  },
  (t) => [index("automation_runs_key_started_idx").on(t.automationKey, t.startedAt)]
);

/** Simple key/value store for app settings (provider config, profile, timezone). */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ---- Relations ----

export const companiesRelations = relations(companies, ({ many }) => ({
  contacts: many(contacts),
  timelineEvents: many(timelineEvents),
  messages: many(messages),
  followUps: many(followUps),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  company: one(companies, { fields: [contacts.companyId], references: [companies.id] }),
}));

export const timelineEventsRelations = relations(timelineEvents, ({ one }) => ({
  company: one(companies, { fields: [timelineEvents.companyId], references: [companies.id] }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  company: one(companies, { fields: [messages.companyId], references: [companies.id] }),
  contact: one(contacts, { fields: [messages.contactId], references: [contacts.id] }),
}));

export const followUpsRelations = relations(followUps, ({ one }) => ({
  company: one(companies, { fields: [followUps.companyId], references: [companies.id] }),
  message: one(messages, { fields: [followUps.messageId], references: [messages.id] }),
}));

// ---- Inferred row types ----

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type TimelineEvent = typeof timelineEvents.$inferSelect;
export type NewTimelineEvent = typeof timelineEvents.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type FollowUp = typeof followUps.$inferSelect;
export type Automation = typeof automations.$inferSelect;
export type AutomationRun = typeof automationRuns.$inferSelect;
