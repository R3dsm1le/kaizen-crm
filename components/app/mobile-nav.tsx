"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalSearch } from "./global-search";
import { navItemsFor } from "./nav-items";

/** Top bar on phones: brand + global search. Hidden on desktop. */
export function MobileHeader() {
  const { open } = useGlobalSearch();

  return (
    <header className="flex shrink-0 items-center justify-between border-b bg-sidebar px-4 py-2.5 pt-[calc(0.625rem+env(safe-area-inset-top))] md:hidden">
      <div className="flex items-center gap-2">
        <div className="flex size-6 items-center justify-center rounded-md bg-brand text-[13px] font-semibold text-brand-foreground">
          改
        </div>
        <span className="text-sm font-semibold tracking-tight">Kaizen</span>
      </div>
      <button
        onClick={open}
        aria-label="Search"
        className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent"
      >
        <SearchIcon className="size-[18px]" />
      </button>
    </header>
  );
}

/**
 * Bottom tab bar on phones. Results-only clients (the Android app) see
 * fewer tabs — configuration surfaces are hidden.
 */
export function MobileTabBar({ resultsOnly = false }: { resultsOnly?: boolean }) {
  const pathname = usePathname();
  const items = navItemsFor(resultsOnly);

  return (
    <nav
      className="grid shrink-0 border-t bg-sidebar pb-[env(safe-area-inset-bottom)] md:hidden"
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-w-0 flex-col items-center gap-1 px-0.5 py-2 text-[10px] font-medium transition-colors",
              active ? "text-foreground" : "text-muted-foreground"
            )}
          >
            <item.icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
            <span className="max-w-full truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
