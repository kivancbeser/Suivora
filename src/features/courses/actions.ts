"use server";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveApplicationContext } from "@/server/application-context";
import { mapStructureError, parseCourse, validId, type StructureActionState, type StructureMessage } from "@/features/class-courses/structure";

const paths = ["/fr/app/matieres", "/tr/app/matieres", "/fr/app/classes", "/tr/app/classes"] as const;
function refresh() { paths.forEach((path) => revalidatePath(path)); }
async function context() { const access = await resolveApplicationContext(); if (access.status !== "ready" || access.context.role !== "ADMIN") return null; return { schoolId: access.context.school.id, supabase: await createServerSupabaseClient() }; }
function duplicate(error: unknown): StructureMessage { const text = error && typeof error === "object" && "message" in error && typeof error.message === "string" ? error.message : ""; return text.includes("code_ci") ? "duplicateCode" : "duplicateCourse"; }

export async function createCourseAction(_: StructureActionState, formData: FormData): Promise<StructureActionState> {
  const parsed = parseCourse(formData); if (!parsed.ok) return parsed.state;
  try { const ctx = await context(); if (!ctx) return { status: "error", message: "accessDenied" }; const result = await ctx.supabase.from("courses").insert({ school_id: ctx.schoolId, name: parsed.data.name, code: parsed.data.code, is_active: true }); if (result.error) return { status: "error", message: mapStructureError(result.error, duplicate(result.error)) }; refresh(); return { status: "success", message: "courseCreated" }; } catch { return { status: "error", message: "unexpected" }; }
}
export async function updateCourseAction(courseId: string, _: StructureActionState, formData: FormData): Promise<StructureActionState> {
  if (!validId(courseId)) return { status: "error", message: "notFound" }; const parsed = parseCourse(formData); if (!parsed.ok) return parsed.state;
  try { const ctx = await context(); if (!ctx) return { status: "error", message: "accessDenied" }; const result = await ctx.supabase.from("courses").update({ name: parsed.data.name, code: parsed.data.code }).eq("id", courseId).eq("school_id", ctx.schoolId).select("id").maybeSingle(); if (result.error) return { status: "error", message: mapStructureError(result.error, duplicate(result.error)) }; if (!result.data) return { status: "error", message: "notFound" }; refresh(); return { status: "success", message: "courseUpdated" }; } catch { return { status: "error", message: "unexpected" }; }
}
