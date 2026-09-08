import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/env/public";
import type { Database } from "@/types/database.generated";

let browserClient: SupabaseClient<Database> | undefined;

export function createBrowserSupabaseClient(): SupabaseClient<Database> {
  if (browserClient) {
    return browserClient;
  }

  const configuration = getSupabasePublicConfig();
  browserClient = createBrowserClient<Database>(
    configuration.url,
    configuration.publishableKey,
  );

  return browserClient;
}
