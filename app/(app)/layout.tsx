import { Sidebar } from "@/components/app/sidebar";
import { MobileHeader, MobileTabBar } from "@/components/app/mobile-nav";
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
      <div className="flex h-svh flex-col overflow-hidden md:flex-row">
        <Sidebar />
        <MobileHeader />
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        <MobileTabBar />
      </div>
    </GlobalSearchProvider>
  );
}
