"use client";

import { SparklesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CompanyWithRelations } from "@/services/company-service";

const MATURITY_VARIANT = { low: "warning", medium: "default", high: "success" } as const;

export function ResearchSection({ company }: { company: CompanyWithRelations }) {
  const research = company.research;

  if (!research && !company.aiSummary) {
    return (
      <section className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          AI Research
        </h3>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <SparklesIcon className="size-4" />
          No research yet — hit “Generate Research” above.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          AI Research
        </h3>
        {research && (
          <Badge variant={MATURITY_VARIANT[research.digitalMaturity]}>
            {research.digitalMaturity} digital maturity
          </Badge>
        )}
      </div>

      <p className="text-sm leading-relaxed">{company.aiSummary ?? research?.summary}</p>

      {research && (
        <div className="space-y-4">
          {research.businessDescription && (
            <ResearchList title="What they do" items={[research.businessDescription]} />
          )}
          <ResearchList title="Operational inefficiencies" items={research.operationalInefficiencies} />
          <ResearchList title="Automation opportunities" items={research.automationOpportunities} />
          <ResearchList title="Remote work opportunities" items={research.remoteWorkOpportunities} />
          <ResearchList title="Consulting opportunities" items={research.consultingServices} highlight />
          {research.scoreReasoning && (
            <p className="rounded-md bg-muted/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">Score {research.leadScore}/100.</span>{" "}
              {research.scoreReasoning}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function ResearchList({
  title,
  items,
  highlight,
}: {
  title: string;
  items: string[];
  highlight?: boolean;
}) {
  if (!items?.length) return null;
  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-medium text-muted-foreground">{title}</h4>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-[13px] leading-relaxed">
            <span className={highlight ? "text-brand" : "text-muted-foreground/60"}>•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
