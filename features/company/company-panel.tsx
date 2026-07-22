"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  CalendarPlusIcon,
  ExternalLinkIcon,
  LinkIcon,
  ReplyIcon,
  SendIcon,
  SparklesIcon,
  Trash2Icon,
  WandSparklesIcon,
} from "lucide-react";
import { SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteCompanyAction,
  markRepliedAction,
  moveStageAction,
  scheduleFollowUpAction,
} from "@/app/actions/companies";
import { generateOutreachAction, generateResearchAction, sendMessageAction } from "@/app/actions/outreach";
import type { CompanyWithRelations } from "@/services/company-service";
import { STAGE_LABELS, STAGES, type Stage } from "@/types";
import { DetailsSection } from "./details-section";
import { ContactsSection } from "./contacts-section";
import { ResearchSection } from "./research-section";
import { MessagesSection } from "./messages-section";
import { TimelineSection } from "./timeline-section";
import { NotesSection } from "./notes-section";

export function CompanyPanel({
  company,
  onChanged,
  onClose,
}: {
  company: CompanyWithRelations;
  onChanged: () => Promise<void>;
  onClose: () => void;
}) {
  const [pending, setPending] = React.useState<string | null>(null);

  const act = async (name: string, fn: () => Promise<unknown>, successMessage?: string) => {
    setPending(name);
    try {
      await fn();
      await onChanged();
      if (successMessage) toast.success(successMessage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setPending(null);
    }
  };

  const coldEmail = company.messages.find((m) => m.kind === "cold_email" && m.status === "draft");

  const scheduleFollowUp = () => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    void act(
      "follow_up",
      () => scheduleFollowUpAction(company.id, date.toISOString()),
      "Follow-up scheduled for 3 days from now"
    );
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="space-y-3 border-b p-6 pb-4">
        <div className="flex items-start justify-between gap-3 pr-8">
          <div className="min-w-0 space-y-1">
            <SheetTitle className="truncate text-lg font-semibold tracking-tight">
              {company.name}
            </SheetTitle>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {company.website && (
                <a
                  href={company.website.includes("://") ? company.website : `https://${company.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  {company.domain ?? company.website} <ExternalLinkIcon className="size-3" />
                </a>
              )}
              {company.linkedinUrl && (
                <a
                  href={company.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  <LinkIcon className="size-3" /> LinkedIn
                </a>
              )}
              {company.leadScore !== null && (
                <Badge variant={company.leadScore >= 60 ? "success" : "default"}>
                  Score {company.leadScore}
                </Badge>
              )}
              {company.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <Select
            value={company.stage}
            onValueChange={(stage) =>
              act("stage", () => moveStageAction(company.id, stage as Stage))
            }
          >
            <SelectTrigger className="w-40 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGES.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {STAGE_LABELS[stage]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-1.5">
          <Button
            size="sm"
            variant="outline"
            disabled={pending !== null}
            onClick={() =>
              act("research", () => generateResearchAction(company.id), "Research generated")
            }
          >
            <SparklesIcon />
            {pending === "research" ? "Researching…" : "Generate Research"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending !== null}
            onClick={() =>
              act("outreach", () => generateOutreachAction(company.id), "Outreach drafted")
            }
          >
            <WandSparklesIcon />
            {pending === "outreach" ? "Writing…" : "Generate Outreach"}
          </Button>
          {coldEmail && (
            <Button
              size="sm"
              variant="outline"
              disabled={pending !== null}
              onClick={() => act("send", () => sendMessageAction(coldEmail.id), "Email sent")}
            >
              <SendIcon />
              {pending === "send" ? "Sending…" : "Send Email"}
            </Button>
          )}
          <Button size="sm" variant="outline" disabled={pending !== null} onClick={scheduleFollowUp}>
            <CalendarPlusIcon />
            Schedule Follow Up
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending !== null}
            onClick={() => act("replied", () => markRepliedAction(company.id), "Marked as replied")}
          >
            <ReplyIcon />
            Mark Replied
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            className="ml-auto text-muted-foreground hover:text-destructive"
            disabled={pending !== null}
            onClick={() => {
              if (!window.confirm(`Delete ${company.name}? This removes all its history.`)) return;
              void act("delete", async () => {
                await deleteCompanyAction(company.id);
                onClose();
              });
            }}
          >
            <Trash2Icon />
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        <ResearchSection company={company} />
        <Separator />
        <MessagesSection company={company} onChanged={onChanged} />
        <Separator />
        <DetailsSection company={company} onChanged={onChanged} />
        <Separator />
        <ContactsSection company={company} onChanged={onChanged} />
        <Separator />
        <NotesSection company={company} onChanged={onChanged} />
        <Separator />
        <TimelineSection events={company.timelineEvents} />
      </div>
    </div>
  );
}
