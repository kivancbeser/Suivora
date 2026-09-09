"use server";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveApplicationContext } from "@/server/application-context";
import { mapStructureError, parseConnectionCreate, parsePeriodsEdit, validId, type StructureActionState } from "./structure";

function refresh(classId: string) { for (const locale of ["fr", "tr"] as const) { revalidatePath(`/${locale}/app/classes`); revalidatePath(`/${locale}/app/classes/${classId}`); } }
async function context() { const access = await resolveApplicationContext(); if (access.status !== "ready" || access.context.role !== "ADMIN") return null; return { schoolId: access.context.school.id, supabase: await createServerSupabaseClient() }; }

export async function connectCourseAction(classId: string, _: StructureActionState, formData: FormData): Promise<StructureActionState> {
  if (!validId(classId)) return { status: "error", message: "notFound" }; const parsed = parseConnectionCreate(formData); if (!parsed.ok) return parsed.state;
  try {
    const ctx = await context(); if (!ctx) return { status: "error", message: "accessDenied" };
    const [classResult, courseResult] = await Promise.all([
      ctx.supabase.from("classes").select("id, school_year_id, is_active").eq("id", classId).eq("school_id", ctx.schoolId).maybeSingle(),
      ctx.supabase.from("courses").select("id, is_active").eq("id", parsed.data.courseId).eq("school_id", ctx.schoolId).maybeSingle(),
    ]);
    if (classResult.error || courseResult.error || !classResult.data || !courseResult.data) return { status: "error", message: "notFound" };
    if (!classResult.data.is_active) return { status: "error", message: "inactiveClass" }; if (!courseResult.data.is_active) return { status: "error", message: "inactiveCourse" };
    const result = await ctx.supabase.from("class_courses").insert({ school_id: ctx.schoolId, school_year_id: classResult.data.school_year_id, class_id: classResult.data.id, course_id: courseResult.data.id, weekly_periods: parsed.data.weeklyPeriods, is_active: true });
    if (result.error) return { status: "error", message: mapStructureError(result.error, "duplicateConnection") };
    refresh(classId); return { status: "success", message: "connectionCreated" };
  } catch { return { status: "error", message: "unexpected" }; }
}
export async function updatePeriodsAction(classId: string, connectionId: string, _: StructureActionState, formData: FormData): Promise<StructureActionState> {
  if (!validId(classId) || !validId(connectionId)) return { status: "error", message: "notFound" }; const parsed = parsePeriodsEdit(formData); if (!parsed.ok) return parsed.state;
  try { const ctx = await context(); if (!ctx) return { status: "error", message: "accessDenied" }; const result = await ctx.supabase.from("class_courses").update({ weekly_periods: parsed.data.weeklyPeriods }).eq("id", connectionId).eq("class_id", classId).eq("school_id", ctx.schoolId).select("id").maybeSingle(); if (result.error) return { status: "error", message: mapStructureError(result.error, "unexpected") }; if (!result.data) return { status: "error", message: "notFound" }; refresh(classId); return { status: "success", message: "connectionUpdated" }; } catch { return { status: "error", message: "unexpected" }; }
}
