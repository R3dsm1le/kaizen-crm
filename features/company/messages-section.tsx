"use client";

import * as React from "react";
import { toast } from "sonner";
import { CheckIcon, ChevronDownIcon, ChevronRightIcon, SendIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { deleteMessageAction, sendMessageAction, updateMessageAction } from "@/app/actions/outreach";
import type { CompanyWithRelations } from "@/services/company-service";
import { MESSAGE_KIND_LABELS, type MessageKind, type MessageStatus } from "@/types";
import { cn, formatRelative } from "@/lib/utils";

const STATUS_VARIANT: Record<MessageStatus, "default" | "brand" | "success" | "destructive"> = {
  draft: "default",
  queued: "brand",
  sent: "success",
  failed: "destructive",
};

export function MessagesSection({
  company,
  onChanged,
}: {
  company: CompanyWithRelations;
  onChanged: () => Promise<void>;
}) {
  if (company.messages.length === 0) {
    return (
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Outreach
        </h3>
        <p className="text-sm text-muted-foreground">
          No messages yet — “Generate Outreach” drafts a cold email, a LinkedIn message and three
          follow-ups.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Outreach
      </h3>
      <div className="space-y-2">
        {company.messages.map((message) => (
          <MessageCard key={message.id} message={message} onChanged={onChanged} />
        ))}
      </div>
    </section>
  );
}

function MessageCard({
  message,
  onChanged,
}: {
  message: CompanyWithRelations["messages"][number];
  onChanged: () => Promise<void>;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [subject, setSubject] = React.useState(message.subject ?? "");
  const [body, setBody] = React.useState(message.body);
  const [toEmail, setToEmail] = React.useState(message.toEmail ?? "");
  const [busy, setBusy] = React.useState(false);

  const editable = message.status !== "sent";
  const dirty = subject !== (message.subject ?? "") || body !== message.body || toEmail !== (message.toEmail ?? "");

  const save = async () => {
    setBusy(true);
    try {
      await updateMessageAction(message.id, { subject, body, toEmail });
      await onChanged();
      toast.success("Draft saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    setBusy(true);
    try {
      if (dirty) await updateMessageAction(message.id, { subject, body, toEmail });
      await sendMessageAction(message.id);
      await onChanged();
      toast.success("Email sent");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left cursor-pointer"
      >
        {expanded ? (
          <ChevronDownIcon className="size-3.5 text-muted-foreground" />
        ) : (
          <ChevronRightIcon className="size-3.5 text-muted-foreground" />
        )}
        <span className="text-[13px] font-medium">
          {MESSAGE_KIND_LABELS[message.kind as MessageKind] ?? message.kind}
        </span>
        <Badge variant={STATUS_VARIANT[message.status as MessageStatus]}>{message.status}</Badge>
        {message.repliedAt && <Badge variant="success">replied</Badge>}
        <span className="ml-auto text-[11px] text-muted-foreground">
          {message.sentAt ? `sent ${formatRelative(message.sentAt)}` : formatRelative(message.createdAt)}
        </span>
      </button>

      {expanded && (
        <div className="space-y-2 border-t p-3">
          {message.error && (
            <p className="rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
              {message.error}
            </p>
          )}
          {message.channel === "email" && (
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                placeholder="recipient@company.com"
                disabled={!editable}
                className="text-xs"
              />
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                disabled={!editable}
                className="text-xs"
              />
            </div>
          )}
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={!editable}
            className={cn("min-h-36 text-[13px] leading-relaxed", !editable && "opacity-80")}
          />
          {editable && (
            <div className="flex items-center gap-1.5">
              {dirty && (
                <Button size="sm" variant="secondary" onClick={save} disabled={busy}>
                  <CheckIcon /> Save
                </Button>
              )}
              {message.channel === "email" && (
                <Button size="sm" onClick={send} disabled={busy}>
                  <SendIcon /> {busy ? "Sending…" : "Send now"}
                </Button>
              )}
              <Button
                size="icon-sm"
                variant="ghost"
                className="ml-auto text-muted-foreground hover:text-destructive"
                disabled={busy}
                onClick={() => void deleteMessageAction(message.id).then(onChanged)}
              >
                <Trash2Icon className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
