import { Suspense } from "react";
import { CompanyService } from "@/services/company-service";
import { PageHeader } from "@/components/app/page-header";
import { KanbanBoard } from "@/features/pipeline/kanban-board";
import { PipelineToolbar } from "@/features/pipeline/pipeline-toolbar";
import { NewCompanyDialog } from "@/features/company/new-company-dialog";
import { CompanyPanelHost } from "@/features/company/company-panel-host";
import { isDatabaseConfigured } from "@/lib/runtime-config";

export const dynamic = "force-dynamic";

export default async function PipelinePage({
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
    <div className="flex h-full flex-col">
      <PageHeader
        title="Pipeline"
        description={`${companies.length} lead${companies.length === 1 ? "" : "s"}`}
        actions={
          <Suspense>
            <PipelineToolbar />
            <NewCompanyDialog />
          </Suspense>
        }
      />
      <div className="min-h-0 flex-1">
        <Suspense>
          <KanbanBoard companies={companies} />
        </Suspense>
      </div>
      <Suspense>
        <CompanyPanelHost />
      </Suspense>
    </div>
  );
}
