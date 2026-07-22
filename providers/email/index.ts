import type { EmailSettings } from "@/lib/settings-schema";
import { SmtpProvider } from "./smtp";
import { ResendProvider } from "./resend";
import { ImapInboxProvider } from "./imap";
import type { EmailProvider, InboxProvider } from "./types";

export type { EmailProvider, InboxProvider, OutgoingEmail, InboxMessage, SendResult } from "./types";
export { EmailNotConfiguredError } from "./types";

export function createEmailProvider(settings: EmailSettings): EmailProvider {
  return settings.provider === "resend" ? new ResendProvider(settings) : new SmtpProvider(settings);
}

export function createInboxProvider(settings: EmailSettings): InboxProvider {
  return new ImapInboxProvider(settings);
}
