import { Sidebar } from "@/components/app/sidebar";
import { GlobalSearchProvider } from "@/components/app/global-search";
import { SetupNotice } from "@/components/app/setup-notice";
import { isDatabaseConfigured } from "@/lib/runtime-config";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  if (!isDatabaseConfigured()) {
    return <SetupNotice />;
  }

  return (
    <GlobalSearchProvider>
      <div className="flex h-svh overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </GlobalSearchProvider>
  );
}
