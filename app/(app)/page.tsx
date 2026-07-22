import Link from "next/link";
import { eq } from "drizzle-orm";
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  MailIcon,
  ReplyIcon,
  TrendingUpIcon,
  TrophyIcon,
  UsersIcon,
} from "lucide-react";
import { companies, db } from "@/db";
import { CompanyService } from "@/services/company-service";
import { FollowUpService } from "@/services/follow-up-service";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STAGE_LABELS, STAGES, type Stage } from "@/types";
import { formatRelative } from "@/lib/utils";
import { isDatabaseConfigured } from "@/lib/runtime-config";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!isDatabaseConfigured()) return null; // layout renders the setup notice

  const [kpis, pipelineCounts, recentLeads, dueTasks, dueFollowUps, meetings] = await Promise.all([
    CompanyService.kpis(),
    CompanyService.pipelineCounts(),
    CompanyService.recent(6),
    CompanyService.dueToday(),
    FollowUpService.dueToday(),
    db.query.companies.findMany({ where: eq(companies.stage, "meeting_scheduled"), limit: 5 }),
  ]);

  const kpiItems = [
    { label: "Total Leads", value: kpis.totalLeads, icon: UsersIcon },
    { label: "Qualified", value: kpis.qualifiedLeads, icon: CheckCircle2Icon },
    { label: "Emails Sent", value: kpis.emailsSent, icon: MailIcon },
    { label: "Replies", value: kpis.replies, icon: ReplyIcon },
    { label: "Meetings", value: kpis.meetings, icon: CalendarIcon },
    { label: "Won", value: kpis.wonDeals, icon: TrophyIcon },
  ];

  const activeStages = STAGES.filter((s) => pipelineCounts[s] > 0);
  const hasAnything = kpis.totalLeads > 0;

  return (
    <div className="mx-auto max-w-5xl pb-16">
      <PageHeader title="Today" description="What should I do today?" />

      <div className="space-y-8 px-4 md:px-8">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {kpiItems.map((item) => (
            <Card key={item.label} className="shadow-none">
              <CardContent className="p-4">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <item.icon className="size-3.5" />
                  <span className="text-[11px] font-medium">{item.label}</span>
                </div>
                <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight">
                  {item.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Today's work */}
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClockIcon className="size-4 text-muted-foreground" />
                Today
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {dueTasks.length === 0 && dueFollowUps.length === 0 && meetings.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nothing due today. Enjoy the calm — or import some leads.
                </p>
              )}
              {meetings.map((company) => (
                <DashboardRow
                  key={`m-${company.id}`}
                  href={`/companies?company=${company.id}`}
                  title={company.name}
                  subtitle="Meeting scheduled"
                  badge={<Badge variant="brand">Meeting</Badge>}
                />
              ))}
              {dueTasks.map((company) => (
                <DashboardRow
                  key={`t-${company.id}`}
                  href={`/companies?company=${company.id}`}
                  title={company.name}
                  subtitle={company.nextAction ?? "Next action due"}
                  badge={<Badge variant="warning">Task</Badge>}
                />
              ))}
              {dueFollowUps.map((followUp) => (
                <DashboardRow
                  key={`f-${followUp.id}`}
                  href={`/companies?company=${followUp.companyId}`}
                  title={followUp.company.name}
                  subtitle={`Follow-up #${followUp.attempt} due ${formatRelative(followUp.scheduledAt)}`}
                  badge={<Badge>Follow up</Badge>}
                />
              ))}
            </CardContent>
          </Card>

          {/* Recent leads */}
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUpIcon className="size-4 text-muted-foreground" />
                Recent Leads
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {recentLeads.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No leads yet. Add one manually or run Lead Discovery.
                </p>
              )}
              {recentLeads.map((company) => (
                <DashboardRow
                  key={company.id}
                  href={`/companies?company=${company.id}`}
                  title={company.name}
                  subtitle={[company.industry, formatRelative(company.createdAt)]
                    .filter(Boolean)
                    .join(" · ")}
                  badge={
                    company.leadScore !== null ? (
                      <Badge variant={company.leadScore >= 60 ? "success" : "default"}>
                        {company.leadScore}
                      </Badge>
                    ) : undefined
                  }
                />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Pipeline summary */}
        <Card className="shadow-none">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Pipeline</CardTitle>
            <Link
              href="/pipeline"
              className="flex items-center gap-1 text-xs font-medium text-brand hover:underline"
            >
              Open board <ArrowRightIcon className="size-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {!hasAnything ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Your pipeline is empty.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {activeStages.map((stage) => (
                  <Link
                    key={stage}
                    href={`/pipeline?stage=${stage}`}
                    className="flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors hover:bg-accent"
                  >
                    <span className="text-[13px] text-muted-foreground">
                      {STAGE_LABELS[stage as Stage]}
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      {pipelineCounts[stage]}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardRow({
  href,
  title,
  subtitle,
  badge,
}: {
  href: string;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent"
    >
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {badge}
    </Link>
  );
}
