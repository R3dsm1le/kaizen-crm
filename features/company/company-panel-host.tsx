"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { getCompanyAction } from "@/app/actions/companies";
import type { CompanyWithRelations } from "@/services/company-service";
import { CompanyPanel } from "./company-panel";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Opens the company side panel whenever `?company=<id>` is present.
 * Used on every page so cards, search results and dashboard rows all
 * open in place — the user never navigates away.
 */
export function CompanyPanelHost() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const companyId = searchParams.get("company");

  const [company, setCompany] = React.useState<CompanyWithRelations | null>(null);
  const [loading, setLoading] = React.useState(false);

  const refresh = React.useCallback(async () => {
    if (!companyId) return;
    const data = await getCompanyAction(companyId);
    setCompany(data);
  }, [companyId]);

  React.useEffect(() => {
    if (!companyId) {
      setCompany(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    getCompanyAction(companyId)
      .then((data) => {
        if (!cancelled) setCompany(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const close = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("company");
    router.push(params.size ? `${pathname}?${params}` : pathname, { scroll: false });
  };

  return (
    <Sheet open={Boolean(companyId)} onOpenChange={(open) => !open && close()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
        {loading && !company ? (
          <div className="space-y-4 p-6">
            <SheetTitle className="sr-only">Loading company</SheetTitle>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-72" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : company ? (
          <CompanyPanel company={company} onChanged={refresh} onClose={close} />
        ) : (
          <div className="p-6">
            <SheetTitle className="sr-only">Company not found</SheetTitle>
            <p className="text-sm text-muted-foreground">Company not found.</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
