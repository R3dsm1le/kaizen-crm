/**
 * Shared domain types. These are the vocabulary of the whole app —
 * the DB stores them as text, services and UI import them from here.
 */

export const STAGES = [
  "lead_found",
  "research",
  "qualified",
  "outreach_ready",
  "email_sent",
  "waiting",
  "replied",
  "meeting_scheduled",
  "proposal_sent",
  "won",
  "lost",
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_LABELS: Record<Stage, string> = {
  lead_found: "Lead Found",
  research: "Research",
  qualified: "Qualified",
  outreach_ready: "Outreach Ready",
  email_sent: "Email Sent",
  waiting: "Waiting",
  replied: "Replied",
  meeting_scheduled: "Meeting Scheduled",
  proposal_sent: "Proposal Sent",
  won: "Won",
  lost: "Lost",
};

/** Stages where automated outreach must stop. */
export const CLOSED_STAGES: Stage[] = ["replied", "meeting_scheduled", "proposal_sent", "won", "lost"];

export const TIMELINE_EVENT_TYPES = [
  "lead_imported",
  "research_generated",
  "lead_enriched",
  "email_generated",
  "email_edited",
  "email_sent",
  "reply_received",
  "meeting_scheduled",
  "proposal_sent",
  "stage_changed",
  "note_added",
  "follow_up_scheduled",
  "follow_up_sent",
  "contact_added",
] as const;

export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number];

export const LEAD_SOURCES = ["manual", "csv", "website", "google_maps", "clay", "apollo"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const MESSAGE_KINDS = [
  "cold_email",
  "linkedin_message",
  "follow_up_1",
  "follow_up_2",
  "follow_up_3",
] as const;
export type MessageKind = (typeof MESSAGE_KINDS)[number];

export const MESSAGE_KIND_LABELS: Record<MessageKind, string> = {
  cold_email: "Cold Email",
  linkedin_message: "LinkedIn Message",
  follow_up_1: "Follow Up #1",
  follow_up_2: "Follow Up #2",
  follow_up_3: "Follow Up #3",
};

export const MESSAGE_STATUSES = ["draft", "queued", "sent", "failed"] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export const AUTOMATION_KEYS = [
  "lead_discovery",
  "ai_research",
  "lead_enrichment",
  "email_sending",
  "reply_detection",
  "follow_ups",
] as const;
export type AutomationKey = (typeof AUTOMATION_KEYS)[number];

export const AUTOMATION_SCHEDULES = ["every_15_min", "hourly", "every_6_hours", "daily"] as const;
export type AutomationSchedule = (typeof AUTOMATION_SCHEDULES)[number];

export const SCHEDULE_LABELS: Record<AutomationSchedule, string> = {
  every_15_min: "Every 15 minutes",
  hourly: "Every hour",
  every_6_hours: "Every 6 hours",
  daily: "Once a day",
};

export const SCHEDULE_INTERVAL_MS: Record<AutomationSchedule, number> = {
  every_15_min: 15 * 60_000,
  hourly: 60 * 60_000,
  every_6_hours: 6 * 60 * 60_000,
  daily: 24 * 60 * 60_000,
};

/** Structured output of AI company research, stored as jsonb. */
export interface CompanyResearch {
  summary: string;
  businessDescription: string;
  digitalMaturity: "low" | "medium" | "high";
  digitalMaturityReasoning: string;
  operationalInefficiencies: string[];
  automationOpportunities: string[];
  remoteWorkOpportunities: string[];
  consultingServices: string[];
  leadScore: number; // 0-100
  scoreReasoning: string;
}

/** Result shape every service run() returns so jobs & UI stay uniform. */
export interface RunResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
}

export const emptyRunResult = (): RunResult => ({
  processed: 0,
  succeeded: 0,
  failed: 0,
  errors: [],
});
