"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ClockIcon, SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { queueMessageAction, sendMessageAction } from "@/app/actions/outreach";
import { MESSAGE_KIND_LABELS, type MessageKind } from "@/types";
import { formatRelative, truncate } from "@/lib/utils";

export interface OutreachRow {
  id: string;
  companyId: string;
  companyName: string;
  kind: string;
  channel: string;
  subject: string | null;
  body: string;
  status: string;
  toEmail: string | null;
  sentAt: Date | null;
  repliedAt: Date | null;
  createdAt: Date;
  error: string | null;
}

export function OutreachList({ rows }: { rows: OutreachRow[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const openCompany = (companyId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("company", companyId);
    router.push(`?${params}`, { scroll: false });
  };

  const run = async (id: string, fn: () => Promise<unknown>, message: string) => {
    setBusyId(id);
    try {
      await fn();
      toast.success(message);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  if (rows.length === 0) {
    return (
      <div className="px-8 py-16 text-center text-sm text-muted-foreground">
        Nothing here. Generate outreach from a company panel to create drafts.
      </div>
    );
  }

  return (
    <div className="space-y-1.5 px-4 md:px-8">
      {rows.map((row) => (
        <div
          key={row.id}
          onClick={() => openCompany(row.companyId)}
          className="group flex cursor-pointer items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/50"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium">{row.companyName}</span>
              <Badge variant="outline">
                {MESSAGE_KIND_LABELS[row.kind as MessageKind] ?? row.kind}
              </Badge>
              {row.repliedAt && <Badge variant="success">replied</Badge>}
              {row.status === "failed" && <Badge variant="destructive">failed</Badge>}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {row.subject ? `${row.subject} — ` : ""}
              {truncate(row.body.replace(/\s+/g, " "), 110)}
            </p>
            {row.error && <p className="mt-0.5 text-xs text-destructive">{row.error}</p>}
          </div>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {row.sentAt ? formatRelative(row.sentAt) : formatRelative(row.createdAt)}
          </span>
          {row.status === "draft" && row.channel === "email" && (
            <div
              className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="sm"
                variant="outline"
                disabled={busyId === row.id}
                onClick={() => run(row.id, () => queueMessageAction(row.id), "Queued for sending")}
              >
                <ClockIcon /> Queue
              </Button>
              <Button
                size="sm"
                disabled={busyId === row.id}
                onClick={() => run(row.id, () => sendMessageAction(row.id), "Email sent")}
              >
                <SendIcon /> {busyId === row.id ? "Sending…" : "Send"}
              </Button>
            </div>
          )}
          {row.status === "queued" && (
            <div
              className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="sm"
                disabled={busyId === row.id}
                onClick={() => run(row.id, () => sendMessageAction(row.id), "Email sent")}
              >
                <SendIcon /> {busyId === row.id ? "Sending…" : "Send now"}
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
