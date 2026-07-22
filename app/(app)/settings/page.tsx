import { SettingsService } from "@/services/settings-service";
import { PageHeader } from "@/components/app/page-header";
import { SettingsForms } from "@/features/settings/settings-forms";
import { isDatabaseConfigured } from "@/lib/runtime-config";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (!isDatabaseConfigured()) return null; // layout renders the setup notice
  const settings = await SettingsService.getAll();

  return (
    <div className="mx-auto max-w-3xl pb-16">
      <PageHeader
        title="Settings"
        description="Every integration is optional — the CRM works without any of them."
      />
      <div className="px-4 md:px-8">
        <SettingsForms settings={settings} />
      </div>
    </div>
  );
}
