"use client";

import {
  ActivityIcon,
  ArrowRightLeftIcon,
  CalendarIcon,
  FileTextIcon,
  ImportIcon,
  MailIcon,
  PencilIcon,
  ReplyIcon,
  SparklesIcon,
  StickyNoteIcon,
  UserPlusIcon,
} from "lucide-react";
import type { TimelineEvent } from "@/db";
import type { TimelineEventType } from "@/types";
import { formatRelative } from "@/lib/utils";

const EVENT_ICONS: Record<TimelineEventType, typeof ActivityIcon> = {
  lead_imported: ImportIcon,
  research_generated: SparklesIcon,
  lead_enriched: SparklesIcon,
  email_generated: PencilIcon,
  email_edited: PencilIcon,
  email_sent: MailIcon,
  reply_received: ReplyIcon,
  meeting_scheduled: CalendarIcon,
  proposal_sent: FileTextIcon,
  stage_changed: ArrowRightLeftIcon,
  note_added: StickyNoteIcon,
  follow_up_scheduled: CalendarIcon,
  follow_up_sent: MailIcon,
  contact_added: UserPlusIcon,
};

export function TimelineSection({ events }: { events: TimelineEvent[] }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Timeline
      </h3>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <ol className="relative space-y-0 border-l pl-4">
          {events.map((event) => {
            const Icon = EVENT_ICONS[event.type as TimelineEventType] ?? ActivityIcon;
            return (
              <li key={event.id} className="relative pb-4 last:pb-0">
                <span className="absolute -left-[23px] flex size-4 items-center justify-center rounded-full border bg-card">
                  <Icon className="size-2.5 text-muted-foreground" />
                </span>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[13px] font-medium">{event.title}</p>
                  <time className="shrink-0 text-[11px] text-muted-foreground">
                    {formatRelative(event.createdAt)}
                  </time>
                </div>
                {event.description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {event.description}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
