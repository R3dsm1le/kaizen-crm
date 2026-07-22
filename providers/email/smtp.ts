import nodemailer, { type Transporter } from "nodemailer";
import type { EmailSettings } from "@/lib/settings-schema";
import type { EmailProvider, OutgoingEmail, SendResult } from "./types";
import { EmailNotConfiguredError } from "./types";

export class SmtpProvider implements EmailProvider {
  readonly name = "smtp";
  private transporter: Transporter | null = null;

  constructor(private settings: EmailSettings) {
    if (settings.smtpHost && settings.smtpUser) {
      this.transporter = nodemailer.createTransport({
        host: settings.smtpHost,
        port: settings.smtpPort,
        secure: settings.smtpSecure || settings.smtpPort === 465,
        auth: { user: settings.smtpUser, pass: settings.smtpPassword },
      });
    }
  }

  isConfigured(): boolean {
    return this.transporter !== null;
  }

  async send(email: OutgoingEmail): Promise<SendResult> {
    if (!this.transporter) throw new EmailNotConfiguredError();
    const fromEmail = email.fromEmail || this.settings.fromEmail || this.settings.smtpUser;
    const fromName = email.fromName || this.settings.fromName;
    const info = await this.transporter.sendMail({
      from: fromName ? `"${fromName}" <${fromEmail}>` : fromEmail,
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
      replyTo: email.replyTo,
    });
    return { providerMessageId: info.messageId ?? undefined };
  }
}
