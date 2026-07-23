"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalSearch } from "./global-search";
import { navItemsFor } from "./nav-items";

/**
 * Bottom tab bar for phones (and the Android app). Shows the same
 * destinations as the sidebar plus a search tab; hidden on desktop.
 */
export function MobileNav({ resultsOnly = false }: { resultsOnly?: boolean }) {
  const pathname = usePathname();
  const { open } = useGlobalSearch();
  const items = navItemsFor(resultsOnly);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-14 items-stretch border-t bg-card/95 backdrop-blur md:hidden">
      {items.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
              active ? "text-brand" : "text-muted-foreground"
            )}
          >
            <item.icon className="size-5" strokeWidth={active ? 2.3 : 1.8} />
            {item.label}
          </Link>
        );
      })}
      <button
        onClick={open}
        className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground cursor-pointer"
      >
        <SearchIcon className="size-5" strokeWidth={1.8} />
        Search
      </button>
    </nav>
  );
}
