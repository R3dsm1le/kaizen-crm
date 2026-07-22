"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FilterIcon, SearchIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LEAD_SOURCES } from "@/types";

/** Search + filters synced to the URL, so views are shareable and refresh-safe. */
export function PipelineToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [search, setSearch] = React.useState(searchParams.get("q") ?? "");

  const setParam = React.useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.replace(params.size ? `${pathname}?${params}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // Debounced search → URL
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (search !== (searchParams.get("q") ?? "")) setParam("q", search || null);
    }, 250);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // "/" focuses search (keyboard-first)
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, [contenteditable], select")) return;
      if (e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const source = searchParams.get("source");
  const qualifiedOnly = searchParams.get("qualified") === "1";
  const hasFilters = Boolean(source || qualifiedOnly);

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <SearchIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…  /"
          className="h-8 w-52 pl-8"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <XIcon className="size-3.5" />
          </button>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={hasFilters ? "secondary" : "outline"} size="sm">
            <FilterIcon /> Filter
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuCheckboxItem
            checked={qualifiedOnly}
            onCheckedChange={(checked) => setParam("qualified", checked ? "1" : null)}
          >
            Qualified only (60+)
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Source</DropdownMenuLabel>
          {LEAD_SOURCES.map((s) => (
            <DropdownMenuCheckboxItem
              key={s}
              checked={source === s}
              onCheckedChange={(checked) => setParam("source", checked ? s : null)}
            >
              {s.replace("_", " ")}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
