import { z } from "zod";

/**
 * Typed settings groups stored in the `settings` table (one row per group).
 * Shared by the Settings UI, the SettingsService and provider factories.
 * Every field is optional — the app must work with nothing configured.
 */

export const aiSettingsSchema = z.object({
  provider: z.enum(["gemini"]).default("gemini"),
  geminiApiKey: z.string().default(""),
  model: z.string().default("gemini-2.5-flash"),
});

export const emailSettingsSchema = z.object({
  provider: z.enum(["smtp", "resend"]).default("smtp"),
  fromName: z.string().default(""),
  fromEmail: z.string().default(""),
  resendApiKey: z.string().default(""),
  smtpHost: z.string().default(""),
  smtpPort: z.coerce.number().default(587),
  smtpUser: z.string().default(""),
  smtpPassword: z.string().default(""),
  smtpSecure: z.boolean().default(false),
  // IMAP inbox used by reply detection (works with Gmail app passwords)
  imapHost: z.string().default(""),
  imapPort: z.coerce.number().default(993),
  imapUser: z.string().default(""),
  imapPassword: z.string().default(""),
});

export const leadDiscoverySettingsSchema = z.object({
  provider: z.enum(["google_maps", "website", "apollo"]).default("google_maps"),
  googleMapsApiKey: z.string().default(""),
  searchQuery: z.string().default(""),
  searchLocation: z.string().default(""),
  websiteUrls: z.string().default(""), // one URL per line
  apolloApiKey: z.string().default(""),
  clayApiKey: z.string().default(""),
});

export const profileSettingsSchema = z.object({
  name: z.string().default(""),
  companyName: z.string().default(""),
  title: z.string().default("Digital Transformation Consultant"),
  timezone: z.string().default("UTC"),
  valueProposition: z.string().default(""),
  services: z.string().default(""),
  meetingLink: z.string().default(""),
});

export const analyticsSettingsSchema = z.object({
  posthogKey: z.string().default(""),
  posthogHost: z.string().default("https://us.i.posthog.com"),
});

export type AISettings = z.infer<typeof aiSettingsSchema>;
export type EmailSettings = z.infer<typeof emailSettingsSchema>;
export type LeadDiscoverySettings = z.infer<typeof leadDiscoverySettingsSchema>;
export type ProfileSettings = z.infer<typeof profileSettingsSchema>;
export type AnalyticsSettings = z.infer<typeof analyticsSettingsSchema>;

export const SETTINGS_SCHEMAS = {
  ai: aiSettingsSchema,
  email: emailSettingsSchema,
  leadDiscovery: leadDiscoverySettingsSchema,
  profile: profileSettingsSchema,
  analytics: analyticsSettingsSchema,
} as const;

export type SettingsKey = keyof typeof SETTINGS_SCHEMAS;

export interface AllSettings {
  ai: AISettings;
  email: EmailSettings;
  leadDiscovery: LeadDiscoverySettings;
  profile: ProfileSettings;
  analytics: AnalyticsSettings;
}
