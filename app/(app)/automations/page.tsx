import { AutomationService } from "@/services/automation-service";
import { PageHeader } from "@/components/app/page-header";
import { AutomationCard, type AutomationCardData } from "@/features/automations/automation-card";
import { isDatabaseConfigured } from "@/lib/runtime-config";

export const dynamic = "force-dynamic";

export default async function AutomationsPage() {
  if (!isDatabaseConfigured()) return null; // layout renders the setup notice
  const automations = await AutomationService.list();

  const cards: AutomationCardData[] = automations.map((a) => ({
    key: a.key,
    name: a.name,
    description: a.description,
    enabled: a.enabled,
    paused: a.paused,
    schedule: a.schedule,
    dailyLimit: a.dailyLimit,
    lastRunAt: a.lastRunAt,
    nextRunAt: a.nextRunAt,
    successRate: a.successRate,
    itemsProcessedToday: a.itemsProcessedToday,
    lastDurationMs: a.recentRuns[0]?.durationMs ?? null,
    recentErrors: a.recentRuns
      .filter((r) => r.error)
      .slice(0, 3)
      .map((r) => ({ at: r.startedAt, message: r.error! })),
  }));

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <PageHeader
        title="Automations"
        description="Your back office. Enable what you need — everything can also run manually."
      />
      <div className="space-y-3 px-4 md:px-8">
        {cards.map((card) => (
          <AutomationCard key={card.key} automation={card} />
        ))}
      </div>
    </div>
  );
}
