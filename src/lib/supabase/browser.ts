import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/env/public";

let browserClient: SupabaseClient | undefined;

export function createBrowserSupabaseClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const configuration = getSupabasePublicConfig();
  browserClient = createBrowserClient(
    configuration.url,
    configuration.publishableKey,
  );

  return browserClient;
}
