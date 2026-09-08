import "server-only";

import { resolveApplicationContext } from "@/server/application-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type TeacherSummary = Readonly<{ id: string; displayName: string; active: boolean }>;
export type TeacherListResult =
  | Readonly<{ status: "ready"; teachers: readonly TeacherSummary[] }>
  | Readonly<{ status: "unauthenticated" | "forbidden" | "access-unavailable" | "error" }>;

export async function listTeachers(): Promise<TeacherListResult> {
  const access = await resolveApplicationContext();
  if (access.status === "unauthenticated") return { status: "unauthenticated" };
  if (access.status !== "ready") return { status: "access-unavailable" };
  if (access.context.role !== "ADMIN") return { status: "forbidden" };
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("user_profiles")
      .select("id, display_name, active")
      .eq("school_id", access.context.school.id)
      .eq("role", "TEACHER")
      .order("display_name", { ascending: true });
    if (error || !data) return { status: "error" };
    return {
      status: "ready",
      teachers: data.flatMap((row) => row.display_name
        ? [{ id: row.id, displayName: row.display_name, active: row.active }]
        : []),
    };
  } catch {
    return { status: "error" };
  }
}
