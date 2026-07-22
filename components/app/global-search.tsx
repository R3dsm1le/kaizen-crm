"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2Icon, UserIcon, MailIcon, ActivityIcon } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchAction } from "@/app/actions/search";
import type { SearchResult } from "@/services/search-service";

const SearchContext = React.createContext<{ open: () => void }>({ open: () => {} });

export function useGlobalSearch() {
  return React.useContext(SearchContext);
}

const TYPE_META = {
  company: { icon: Building2Icon, heading: "Companies" },
  contact: { icon: UserIcon, heading: "Contacts" },
  message: { icon: MailIcon, heading: "Emails" },
  activity: { icon: ActivityIcon, heading: "Activity" },
} as const;

export function GlobalSearchProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        setResults(await searchAction(query));
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  const select = (result: SearchResult) => {
    setIsOpen(false);
    setQuery("");
    router.push(`/companies?company=${result.companyId}`);
  };

  const grouped = Object.entries(TYPE_META)
    .map(([type, meta]) => ({
      type,
      meta,
      items: results.filter((r) => r.type === type),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <SearchContext.Provider value={{ open: () => setIsOpen(true) }}>
      {children}
      <CommandDialog open={isOpen} onOpenChange={setIsOpen}>
        <CommandInput
          placeholder="Search companies, contacts, emails, activity…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.trim().length >= 2 && !loading && <CommandEmpty>No results.</CommandEmpty>}
          {query.trim().length < 2 && (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Type at least two characters to search everything.
            </p>
          )}
          {grouped.map((group) => (
            <CommandGroup key={group.type} heading={group.meta.heading}>
              {group.items.map((result) => (
                <CommandItem
                  key={`${result.type}-${result.id}`}
                  value={`${result.type}-${result.id}`}
                  onSelect={() => select(result)}
                >
                  <group.meta.icon />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate">{result.title}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {result.subtitle}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </SearchContext.Provider>
  );
}
