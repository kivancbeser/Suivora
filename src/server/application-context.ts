import "server-only";

import { cache } from "react";
import { resolveApplicationContextFromGateway } from "@/features/application/application-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";

async function resolveApplicationContextUncached() {
  const supabase = await createServerSupabaseClient();

  return resolveApplicationContextFromGateway({
    async getAuthenticatedUser() {
      const { data, error } = await supabase.auth.getUser();
      return { data: data.user ? { id: data.user.id } : null, error };
    },
    async getProfile(userId) {
      return supabase
        .from("user_profiles")
        .select("id, school_id, role, active")
        .eq("id", userId)
        .maybeSingle();
    },
    async getSchool(schoolId) {
      return supabase.from("schools").select("id, name").eq("id", schoolId).maybeSingle();
    },
  });
}

export const resolveApplicationContext = cache(resolveApplicationContextUncached);
