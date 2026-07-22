import { ImapFlow } from "imapflow";
import type { EmailSettings } from "@/lib/settings-schema";
import type { InboxMessage, InboxProvider } from "./types";

/**
 * Polls an IMAP inbox for recent messages. Works with any free mailbox
 * that exposes IMAP (Gmail app passwords, Fastmail, Zoho, ...).
 */
export class ImapInboxProvider implements InboxProvider {
  readonly name = "imap";

  constructor(private settings: EmailSettings) {}

  isConfigured(): boolean {
    return Boolean(this.settings.imapHost && this.settings.imapUser && this.settings.imapPassword);
  }

  async fetchMessagesSince(since: Date): Promise<InboxMessage[]> {
    const client = new ImapFlow({
      host: this.settings.imapHost,
      port: this.settings.imapPort,
      secure: true,
      auth: { user: this.settings.imapUser, pass: this.settings.imapPassword },
      logger: false,
    });

    const messages: InboxMessage[] = [];
    await client.connect();
    try {
      const lock = await client.getMailboxLock("INBOX");
      try {
        for await (const msg of client.fetch({ since }, { envelope: true })) {
          const from = msg.envelope?.from?.[0]?.address ?? "";
          if (!from) continue;
          messages.push({
            from: from.toLowerCase(),
            subject: msg.envelope?.subject ?? "",
            date: msg.envelope?.date ?? new Date(),
            snippet: "",
          });
        }
      } finally {
        lock.release();
      }
    } finally {
      await client.logout().catch(() => {});
    }
    return messages;
  }
}
