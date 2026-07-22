import { Suspense } from "react";
import Link from "next/link";
import { desc, eq, isNotNull } from "drizzle-orm";
import { db, messages } from "@/db";
import { PageHeader } from "@/components/app/page-header";
import { OutreachList, type OutreachRow } from "@/features/outreach/outreach-list";
import { CompanyPanelHost } from "@/features/company/company-panel-host";
import { cn } from "@/lib/utils";
import { isDatabaseConfigured } from "@/lib/runtime-config";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "drafts", label: "Drafts" },
  { key: "queued", label: "Queued" },
  { key: "sent", label: "Sent" },
  { key: "replied", label: "Replied" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default async function OutreachPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  if (!isDatabaseConfigured()) return null; // layout renders the setup notice
  const params = await searchParams;
  const tab: TabKey = (TABS.find((t) => t.key === params.tab)?.key ?? "drafts") as TabKey;

  const where =
    tab === "drafts"
      ? eq(messages.status, "draft")
      : tab === "queued"
        ? eq(messages.status, "queued")
        : tab === "sent"
          ? eq(messages.status, "sent")
          : isNotNull(messages.repliedAt);

  const rows = await db.query.messages.findMany({
    where,
    with: { company: true },
    orderBy: desc(messages.createdAt),
    limit: 200,
  });

  const outreachRows: OutreachRow[] = rows.map((m) => ({
    id: m.id,
    companyId: m.companyId,
    companyName: m.company.name,
    kind: m.kind,
    channel: m.channel,
    subject: m.subject,
    body: m.body,
    status: m.status,
    toEmail: m.toEmail,
    sentAt: m.sentAt,
    repliedAt: m.repliedAt,
    createdAt: m.createdAt,
    error: m.error,
  }));

  return (
    <div className="mx-auto max-w-4xl pb-16">
      <PageHeader title="Outreach" description="Every message, from draft to reply." />
      <div className="flex gap-1 overflow-x-auto px-4 pb-4 md:px-8">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/outreach?tab=${t.key}`}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              tab === t.key
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>
      <Suspense>
        <OutreachList rows={outreachRows} />
        <CompanyPanelHost />
      </Suspense>
    </div>
  );
}
