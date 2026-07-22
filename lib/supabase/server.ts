import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env, isSupabaseAuthConfigured } from "@/lib/env";

/**
 * Server-side Supabase client. Returns null when Supabase isn't configured,
 * in which case the app runs in open "local mode" without authentication.
 */
export async function createSupabaseServerClient() {
  if (!isSupabaseAuthConfigured) return null;

  const cookieStore = await cookies();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component — session refresh is handled by middleware.
        }
      },
    },
  });
}

export async function getUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
