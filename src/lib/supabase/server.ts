import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "@/lib/env/public";

function isReadOnlyCookieStoreError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.startsWith("Cookies can only be modified in a Server Action")
  );
}

export async function createServerSupabaseClient(): Promise<SupabaseClient> {
  const configuration = getSupabasePublicConfig();
  const cookieStore = await cookies();

  return createServerClient(configuration.url, configuration.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          if (!isReadOnlyCookieStoreError(error)) {
            throw error;
          }

          // Server Components can read but cannot write cookies. A future auth
          // proxy will refresh sessions and persist cookies before rendering.
        }
      },
    },
  });
}
