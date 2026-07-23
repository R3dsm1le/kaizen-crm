import { Sidebar } from "@/components/app/sidebar";
import { MobileNav } from "@/components/app/mobile-nav";
import { GlobalSearchProvider } from "@/components/app/global-search";
import { SetupNotice } from "@/components/app/setup-notice";
import { isDatabaseConfigured } from "@/lib/runtime-config";
import { isMobileShell } from "@/lib/shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isDatabaseConfigured()) {
    return <SetupNotice />;
  }

  const resultsOnly = await isMobileShell();

  return (
    <GlobalSearchProvider>
      <div className="flex h-svh overflow-hidden">
        <Sidebar resultsOnly={resultsOnly} />
        <main className="flex-1 overflow-y-auto pb-14 md:pb-0">{children}</main>
      </div>
      <MobileNav resultsOnly={resultsOnly} />
    </GlobalSearchProvider>
  );
}
