export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  html?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
}

export interface SendResult {
  providerMessageId?: string;
}

/** Abstraction over any transactional email vendor. */
export interface EmailProvider {
  readonly name: string;
  isConfigured(): boolean;
  send(email: OutgoingEmail): Promise<SendResult>;
}

export interface InboxMessage {
  from: string;
  subject: string;
  date: Date;
  snippet: string;
}

/** Abstraction over an inbox that can be polled for replies. */
export interface InboxProvider {
  readonly name: string;
  isConfigured(): boolean;
  fetchMessagesSince(since: Date): Promise<InboxMessage[]>;
}

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("No email provider is configured. Add SMTP or Resend credentials in Settings → Email.");
    this.name = "EmailNotConfiguredError";
  }
}
