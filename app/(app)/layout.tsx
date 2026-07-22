import { Sidebar } from "@/components/app/sidebar";
import { GlobalSearchProvider } from "@/components/app/global-search";
import { SetupNotice } from "@/components/app/setup-notice";
import { isDatabaseConfigured } from "@/lib/runtime-config";
import { ensureMigrated } from "@/db/migrate";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isDatabaseConfigured()) {
    return <SetupNotice />;
  }

  // Creates/updates tables on first load when the database came from env
  // vars (no setup route involved). No-op once the schema is current.
  await ensureMigrated();

  return (
    <GlobalSearchProvider>
      <div className="flex h-svh overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </GlobalSearchProvider>
  );
}
