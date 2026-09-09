import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveApplicationContext } from "@/server/application-context";
import { validId } from "@/features/class-courses/structure";

export type ClassSummary = Readonly<{ id: string; name: string; active: boolean; schoolYearId: string; schoolYearLabel: string; schoolYearActive: boolean }>;
export type ClassListResult = Readonly<{ status: "ready"; classes: readonly ClassSummary[]; years: readonly { id: string; label: string }[] }> | Readonly<{ status: "unauthenticated" | "forbidden" | "access-unavailable" | "error" }>;
export type ClassDetail = ClassSummary & Readonly<{ connections: readonly { id: string; courseName: string; courseCode: string | null; active: boolean; weeklyPeriods: number }[]; eligibleCourses: readonly { id: string; name: string; code: string | null }[] }>;
export type ClassDetailResult = Readonly<{ status: "ready"; value: ClassDetail }> | Readonly<{ status: "unauthenticated" | "forbidden" | "access-unavailable" | "not-found" | "error" }>;

async function adminContext() {
  const access = await resolveApplicationContext();
  if (access.status === "unauthenticated") return { status: "unauthenticated" as const };
  if (access.status !== "ready") return { status: "access-unavailable" as const };
  if (access.context.role !== "ADMIN") return { status: "forbidden" as const };
  return { status: "ready" as const, schoolId: access.context.school.id, supabase: await createServerSupabaseClient() };
}

export async function listClasses(): Promise<ClassListResult> {
  try {
    const context = await adminContext(); if (context.status !== "ready") return context;
    const [classResult, yearResult] = await Promise.all([
      context.supabase.from("classes").select("id, name, is_active, school_year_id, school_years!classes_school_year_school_fk(label, active)").eq("school_id", context.schoolId).order("name"),
      context.supabase.from("school_years").select("id, label").eq("school_id", context.schoolId).eq("active", true).order("start_date", { ascending: false }),
    ]);
    if (classResult.error || yearResult.error || !classResult.data || !yearResult.data) return { status: "error" };
    return { status: "ready", years: yearResult.data, classes: classResult.data.map((row) => ({ id: row.id, name: row.name, active: row.is_active, schoolYearId: row.school_year_id, schoolYearLabel: row.school_years.label, schoolYearActive: row.school_years.active })) };
  } catch { return { status: "error" }; }
}

export async function getClassDetail(classId: string): Promise<ClassDetailResult> {
  if (!validId(classId)) return { status: "not-found" };
  try {
    const context = await adminContext(); if (context.status !== "ready") return context;
    const classResult = await context.supabase.from("classes").select("id, name, is_active, school_year_id, school_years!classes_school_year_school_fk(label, active)").eq("id", classId).eq("school_id", context.schoolId).maybeSingle();
    if (classResult.error) return { status: "error" }; if (!classResult.data) return { status: "not-found" };
    const [connections, courses] = await Promise.all([
      context.supabase.from("class_courses").select("id, is_active, weekly_periods, course_id, courses!class_courses_course_school_fk(name, code)").eq("class_id", classId).eq("school_id", context.schoolId).order("created_at"),
      context.supabase.from("courses").select("id, name, code").eq("school_id", context.schoolId).eq("is_active", true).order("name"),
    ]);
    if (connections.error || courses.error || !connections.data || !courses.data) return { status: "error" };
    const connected = new Set(connections.data.map((row) => row.course_id));
    return { status: "ready", value: { id: classResult.data.id, name: classResult.data.name, active: classResult.data.is_active, schoolYearId: classResult.data.school_year_id, schoolYearLabel: classResult.data.school_years.label, schoolYearActive: classResult.data.school_years.active, connections: connections.data.map((row) => ({ id: row.id, courseName: row.courses.name, courseCode: row.courses.code, active: row.is_active, weeklyPeriods: row.weekly_periods })), eligibleCourses: courses.data.filter((row) => !connected.has(row.id)) } };
  } catch { return { status: "error" }; }
}
