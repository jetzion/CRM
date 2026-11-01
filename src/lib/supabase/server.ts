import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { env } from "@/lib/env";

/** Supabase client bound to the current request's auth cookies. */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // Server Components cannot set cookies; the proxy refreshes the session instead.
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {}
      },
    },
  });
}

/**
 * Returns a Supabase client and the signed-in user's id, redirecting to /login if signed out.
 * Calls connection() first: per-user pages render at request time and read the clock (token expiry, due dates).
 */
export async function requireUser() {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data) redirect("/login");
  return { supabase, userId: data.claims.sub };
}
