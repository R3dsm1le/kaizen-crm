"use server";

import { assertAuthenticated } from "@/lib/auth";
import { SearchService, type SearchResult } from "@/services/search-service";

export async function searchAction(query: string): Promise<SearchResult[]> {
  await assertAuthenticated();
  return SearchService.search(query);
}
