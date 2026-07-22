"use client";

import { saveSettingsAction } from "@/app/actions/settings";
import type { AllSettings } from "@/lib/settings-schema";
import { SettingsSection } from "./settings-section";

/** All settings groups. Every integration is optional — leave blank to skip. */
export function SettingsForms({ settings }: { settings: AllSettings }) {
  return (
    <div className="space-y-4">
      <SettingsSection
        title="Profile"
        description="Used to personalize AI research and outreach."
        defaultValues={settings.profile}
        onSave={(values) => saveSettingsAction("profile", values)}
        fields={[
          { name: "name", label: "Your name" },
          { name: "companyName", label: "Consultancy name" },
          { name: "title", label: "Title" },
          {
            name: "timezone",
            label: "Timezone",
            placeholder: "Europe/Madrid",
            description: "IANA timezone used for schedules and dates.",
          },
          {
            name: "valueProposition",
            label: "Value proposition",
            type: "textarea",
            placeholder: "I help small businesses modernize their operations…",
          },
          {
            name: "services",
            label: "Services you offer",
            type: "textarea",
            placeholder: "Process automation, digital strategy, CRM implementation…",
          },
          {
            name: "meetingLink",
            label: "Meeting link",
            placeholder: "https://cal.com/you/intro",
            colSpan: 2,
          },
        ]}
      />

      <SettingsSection
        title="AI"
        description="Powers research, enrichment, scoring and outreach generation. Free tier available at aistudio.google.com."
        defaultValues={settings.ai}
        onSave={(values) => saveSettingsAction("ai", values)}
        fields={[
          {
            name: "provider",
            label: "Provider",
            type: "select",
            options: [{ value: "gemini", label: "Google Gemini" }],
          },
          { name: "model", label: "Model", placeholder: "gemini-2.5-flash" },
          {
            name: "geminiApiKey",
            label: "Gemini API key",
            type: "password",
            colSpan: 2,
            description: "Also read from the GEMINI_API_KEY environment variable when empty.",
          },
        ]}
      />

      <SettingsSection
        title="Email"
        description="Sending works with any SMTP mailbox or Resend. Reply detection needs IMAP (e.g. a Gmail app password)."
        defaultValues={settings.email}
        onSave={(values) => saveSettingsAction("email", values)}
        fields={[
          {
            name: "provider",
            label: "Send with",
            type: "select",
            options: [
              { value: "smtp", label: "SMTP" },
              { value: "resend", label: "Resend" },
            ],
          },
          { name: "fromName", label: "From name" },
          { name: "fromEmail", label: "From email", placeholder: "you@yourdomain.com" },
          { name: "resendApiKey", label: "Resend API key", type: "password" },
          { name: "smtpHost", label: "SMTP host", placeholder: "smtp.gmail.com" },
          { name: "smtpPort", label: "SMTP port", type: "number" },
          { name: "smtpUser", label: "SMTP user" },
          { name: "smtpPassword", label: "SMTP password", type: "password" },
          { name: "imapHost", label: "IMAP host", placeholder: "imap.gmail.com" },
          { name: "imapPort", label: "IMAP port", type: "number" },
          { name: "imapUser", label: "IMAP user" },
          { name: "imapPassword", label: "IMAP password", type: "password" },
        ]}
      />

      <SettingsSection
        title="Lead Discovery"
        description="Where new leads come from. Google Places has a generous free monthly credit."
        defaultValues={settings.leadDiscovery}
        onSave={(values) => saveSettingsAction("leadDiscovery", values)}
        fields={[
          {
            name: "provider",
            label: "Source",
            type: "select",
            options: [
              { value: "google_maps", label: "Google Maps" },
              { value: "website", label: "Website list" },
              { value: "apollo", label: "Apollo (optional)" },
            ],
          },
          { name: "googleMapsApiKey", label: "Google Maps API key", type: "password" },
          { name: "searchQuery", label: "Search query", placeholder: "family-run manufacturers" },
          { name: "searchLocation", label: "Location", placeholder: "Valencia, Spain" },
          {
            name: "websiteUrls",
            label: "Website list",
            type: "textarea",
            placeholder: "acme.com\nexample.org",
            description: "One URL per line — used by the Website source.",
          },
          { name: "apolloApiKey", label: "Apollo API key", type: "password" },
          { name: "clayApiKey", label: "Clay API key", type: "password" },
        ]}
      />

      <SettingsSection
        title="Analytics"
        description="Optional PostHog product analytics."
        defaultValues={settings.analytics}
        onSave={(values) => saveSettingsAction("analytics", values)}
        fields={[
          { name: "posthogKey", label: "PostHog key", type: "password" },
          { name: "posthogHost", label: "PostHog host" },
        ]}
      />
    </div>
  );
}
