"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalSearch } from "./global-search";
import { navItemsFor } from "./nav-items";

/** Desktop sidebar. Hidden on phones — see MobileNav. */
export function Sidebar({ resultsOnly = false }: { resultsOnly?: boolean }) {
  const pathname = usePathname();
  const { open } = useGlobalSearch();
  const items = navItemsFor(resultsOnly);

  return (
    <aside className="hidden h-svh w-52 shrink-0 flex-col border-r bg-sidebar md:flex">
      <div className="flex items-center gap-2 px-4 pb-4 pt-5">
        <div className="flex size-6 items-center justify-center rounded-md bg-brand text-[13px] font-semibold text-brand-foreground">
          改
        </div>
        <span className="text-sm font-semibold tracking-tight">Kaizen</span>
      </div>

      <button
        onClick={open}
        className="mx-3 mb-4 flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-xs text-muted-foreground shadow-xs transition-colors hover:bg-accent cursor-pointer"
      >
        <SearchIcon className="size-3.5" />
        Search
        <kbd className="ml-auto rounded border bg-muted px-1 font-mono text-[10px]">⌘K</kbd>
      </button>

      <nav className="flex flex-col gap-0.5 px-3">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                active
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              )}
            >
              <item.icon className="size-4" strokeWidth={active ? 2.2 : 1.8} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-4 py-4">
        <p className="text-[11px] leading-relaxed text-muted-foreground/70">
          Everything is visible.
          <br />
          Nothing is complicated.
        </p>
      </div>
    </aside>
  );
}
