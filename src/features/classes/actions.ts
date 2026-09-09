"use server";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveApplicationContext } from "@/server/application-context";
import { mapStructureError, parseClassCreate, parseNameEdit, validId, type StructureActionState } from "@/features/class-courses/structure";

const paths = ["/fr/app/classes", "/tr/app/classes"] as const;
function refresh(classId?: string) { paths.forEach((path) => { revalidatePath(path); if (classId) revalidatePath(`${path}/${classId}`); }); }
async function context() { const access = await resolveApplicationContext(); if (access.status !== "ready" || access.context.role !== "ADMIN") return null; return { schoolId: access.context.school.id, supabase: await createServerSupabaseClient() }; }

export async function createClassAction(_: StructureActionState, formData: FormData): Promise<StructureActionState> {
  const parsed = parseClassCreate(formData); if (!parsed.ok) return parsed.state;
  try {
    const ctx = await context(); if (!ctx) return { status: "error", message: "accessDenied" };
    const year = await ctx.supabase.from("school_years").select("id, active").eq("id", parsed.data.schoolYearId).eq("school_id", ctx.schoolId).maybeSingle();
    if (year.error || !year.data) return { status: "error", message: "notFound" };
    if (!year.data.active) return { status: "error", message: "inactiveYear" };
    const result = await ctx.supabase.from("classes").insert({ school_id: ctx.schoolId, school_year_id: year.data.id, name: parsed.data.name, is_active: true });
    if (result.error) return { status: "error", message: mapStructureError(result.error, "duplicateClass") };
    refresh(); return { status: "success", message: "classCreated" };
  } catch { return { status: "error", message: "unexpected" }; }
}

export async function updateClassAction(classId: string, _: StructureActionState, formData: FormData): Promise<StructureActionState> {
  if (!validId(classId)) return { status: "error", message: "notFound" };
  const parsed = parseNameEdit(formData); if (!parsed.ok) return parsed.state;
  try {
    const ctx = await context(); if (!ctx) return { status: "error", message: "accessDenied" };
    const result = await ctx.supabase.from("classes").update({ name: parsed.data.name }).eq("id", classId).eq("school_id", ctx.schoolId).select("id").maybeSingle();
    if (result.error) return { status: "error", message: mapStructureError(result.error, "duplicateClass") };
    if (!result.data) return { status: "error", message: "notFound" };
    refresh(classId); return { status: "success", message: "classUpdated" };
  } catch { return { status: "error", message: "unexpected" }; }
}
