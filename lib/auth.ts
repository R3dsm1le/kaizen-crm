import { getUser } from "@/lib/supabase/server";
import { isSupabaseAuthConfigured } from "@/lib/env";

/**
 * Guards server actions. When Supabase auth is configured, a valid session
 * is required; otherwise the app runs in open local mode.
 */
export async function assertAuthenticated(): Promise<void> {
  if (!isSupabaseAuthConfigured) return;
  const user = await getUser();
  if (!user) throw new Error("Not authenticated");
}
