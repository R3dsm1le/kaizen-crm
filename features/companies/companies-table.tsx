"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import type { Company } from "@/db";
import { STAGE_LABELS, type Stage } from "@/types";
import { formatRelative } from "@/lib/utils";

const STAGE_VARIANT: Partial<Record<Stage, "success" | "destructive" | "brand" | "warning">> = {
  won: "success",
  lost: "destructive",
  replied: "brand",
  meeting_scheduled: "brand",
  proposal_sent: "warning",
};

export function CompaniesTable({ companies }: { companies: Company[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const open = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("company", id);
    router.push(`?${params}`, { scroll: false });
  };

  if (companies.length === 0) {
    return (
      <div className="px-8 py-16 text-center text-sm text-muted-foreground">
        No companies yet. Add a lead, import a CSV or run Lead Discovery.
      </div>
    );
  }

  return (
    <div className="px-8">
      <table className="w-full border-separate border-spacing-0 text-[13px]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            <th className="border-b py-2 pr-4 font-medium">Company</th>
            <th className="border-b py-2 pr-4 font-medium">Stage</th>
            <th className="border-b py-2 pr-4 font-medium">Score</th>
            <th className="border-b py-2 pr-4 font-medium">Industry</th>
            <th className="border-b py-2 pr-4 font-medium">Location</th>
            <th className="border-b py-2 pr-4 font-medium">Source</th>
            <th className="border-b py-2 font-medium">Added</th>
          </tr>
        </thead>
        <tbody>
          {companies.map((company) => (
            <tr
              key={company.id}
              onClick={() => open(company.id)}
              className="cursor-pointer transition-colors hover:bg-accent/60"
            >
              <td className="border-b py-2.5 pr-4">
                <span className="font-medium">{company.name}</span>
                {company.domain && (
                  <span className="ml-2 text-xs text-muted-foreground">{company.domain}</span>
                )}
              </td>
              <td className="border-b py-2.5 pr-4">
                <Badge variant={STAGE_VARIANT[company.stage as Stage] ?? "default"}>
                  {STAGE_LABELS[company.stage as Stage] ?? company.stage}
                </Badge>
              </td>
              <td className="border-b py-2.5 pr-4 tabular-nums">
                {company.leadScore !== null ? (
                  <span className={company.leadScore >= 60 ? "font-medium text-success" : ""}>
                    {company.leadScore}
                  </span>
                ) : (
                  <span className="text-muted-foreground/50">—</span>
                )}
              </td>
              <td className="border-b py-2.5 pr-4 text-muted-foreground">
                {company.industry ?? "—"}
              </td>
              <td className="border-b py-2.5 pr-4 text-muted-foreground">
                {[company.city, company.country].filter(Boolean).join(", ") || "—"}
              </td>
              <td className="border-b py-2.5 pr-4 text-muted-foreground">
                {company.source.replace("_", " ")}
              </td>
              <td className="border-b py-2.5 text-muted-foreground">
                {formatRelative(company.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
