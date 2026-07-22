import { Suspense } from "react";
import { CompanyService } from "@/services/company-service";
import { PageHeader } from "@/components/app/page-header";
import { CompaniesTable } from "@/features/companies/companies-table";
import { CsvImportDialog } from "@/features/companies/csv-import-dialog";
import { NewCompanyDialog } from "@/features/company/new-company-dialog";
import { CompanyPanelHost } from "@/features/company/company-panel-host";
import { PipelineToolbar } from "@/features/pipeline/pipeline-toolbar";
import { isDatabaseConfigured } from "@/lib/runtime-config";

export const dynamic = "force-dynamic";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; source?: string; qualified?: string }>;
}) {
  if (!isDatabaseConfigured()) return null; // layout renders the setup notice
  const params = await searchParams;
  const companies = await CompanyService.list({
    search: params.q,
    source: params.source,
    minScore: params.qualified === "1" ? 60 : undefined,
  });

  return (
    <div className="mx-auto max-w-6xl pb-16">
      <PageHeader
        title="Companies"
        description={`${companies.length} compan${companies.length === 1 ? "y" : "ies"}`}
        actions={
          <Suspense>
            <PipelineToolbar />
            <CsvImportDialog />
            <NewCompanyDialog />
          </Suspense>
        }
      />
      <Suspense>
        <CompaniesTable companies={companies} />
        <CompanyPanelHost />
      </Suspense>
    </div>
  );
}
