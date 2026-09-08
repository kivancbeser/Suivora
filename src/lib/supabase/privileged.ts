import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/env/public";
import { getPrivilegedConfig } from "@/lib/env/privileged";
import type { Database } from "@/types/database.generated";

export function createPrivilegedInvitationResources(): Readonly<{
  client: SupabaseClient<Database>;
  appOrigin: string;
}> {
  const publicConfig = getSupabasePublicConfig();
  const privilegedConfig = getPrivilegedConfig();
  const client = createClient<Database>(publicConfig.url, privilegedConfig.secretKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });
  return { client, appOrigin: privilegedConfig.appOrigin };
}
