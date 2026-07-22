import { Resend } from "resend";
import type { EmailSettings } from "@/lib/settings-schema";
import type { EmailProvider, OutgoingEmail, SendResult } from "./types";
import { EmailNotConfiguredError } from "./types";

export class ResendProvider implements EmailProvider {
  readonly name = "resend";
  private client: Resend | null;

  constructor(private settings: EmailSettings) {
    this.client = settings.resendApiKey ? new Resend(settings.resendApiKey) : null;
  }

  isConfigured(): boolean {
    return this.client !== null && Boolean(this.settings.fromEmail);
  }

  async send(email: OutgoingEmail): Promise<SendResult> {
    if (!this.client) throw new EmailNotConfiguredError();
    const fromEmail = email.fromEmail || this.settings.fromEmail;
    const fromName = email.fromName || this.settings.fromName;
    const { data, error } = await this.client.emails.send({
      from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
      replyTo: email.replyTo,
    });
    if (error) throw new Error(`Resend: ${error.message}`);
    return { providerMessageId: data?.id };
  }
}
