import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveApplicationContext } from "@/server/application-context";

export type CourseSummary = Readonly<{ id: string; name: string; code: string | null; active: boolean }>;
export type CourseListResult = Readonly<{ status: "ready"; courses: readonly CourseSummary[] }> | Readonly<{ status: "unauthenticated" | "forbidden" | "access-unavailable" | "error" }>;
export async function listCourses(): Promise<CourseListResult> {
  const access = await resolveApplicationContext();
  if (access.status === "unauthenticated") return { status: "unauthenticated" };
  if (access.status !== "ready") return { status: "access-unavailable" };
  if (access.context.role !== "ADMIN") return { status: "forbidden" };
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("courses").select("id, name, code, is_active").eq("school_id", access.context.school.id).order("name");
    if (error || !data) return { status: "error" };
    return { status: "ready", courses: data.map((row) => ({ id: row.id, name: row.name, code: row.code, active: row.is_active })) };
  } catch { return { status: "error" }; }
}
