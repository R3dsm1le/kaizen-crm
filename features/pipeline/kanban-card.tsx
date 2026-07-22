"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import type { Company } from "@/db";
import { formatRelative } from "@/lib/utils";

export function KanbanCard({ company, overlay }: { company: Company; overlay?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const open = () => {
    if (overlay) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("company", company.id);
    router.push(`?${params}`, { scroll: false });
  };

  return (
    <button
      onClick={open}
      className="w-full cursor-pointer rounded-lg border bg-card p-3 text-left shadow-xs transition-shadow hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-[13px] font-medium leading-tight">{company.name}</p>
        {company.leadScore !== null && (
          <Badge variant={company.leadScore >= 60 ? "success" : "default"} className="shrink-0">
            {company.leadScore}
          </Badge>
        )}
      </div>
      <p className="mt-1 truncate text-xs text-muted-foreground">
        {[company.industry, company.city ?? company.country].filter(Boolean).join(" · ") ||
          company.domain ||
          "—"}
      </p>
      <p className="mt-1.5 text-[11px] text-muted-foreground/60">
        {formatRelative(company.stageChangedAt)}
      </p>
    </button>
  );
}
