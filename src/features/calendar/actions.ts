"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  mapCalendarDatabaseError,
  parseSchoolYearForm,
  parseSemesterForm,
  validateSemesterAgainstYear,
  type CalendarActionState,
  type SchoolYear,
} from "./calendar";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveApplicationContext } from "@/server/application-context";

const idSchema = z.string().uuid();
const calendarPath = "/fr/app/annees-scolaires";

async function getAdminMutationContext(): Promise<
  | Readonly<{ ok: true; schoolId: string; supabase: Awaited<ReturnType<typeof createServerSupabaseClient>> }>
  | Readonly<{ ok: false; state: CalendarActionState }>
> {
  const access = await resolveApplicationContext();
  if (access.status !== "ready" || access.context.role !== "ADMIN") {
    return { ok: false, state: { status: "error", message: "accessDenied" } };
  }
  try {
    return { ok: true, schoolId: access.context.school.id, supabase: await createServerSupabaseClient() };
  } catch {
    return { ok: false, state: { status: "error", message: "unexpected" } };
  }
}

async function loadOwnedYear(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  schoolId: string,
  yearId: string,
): Promise<
  | Readonly<{ status: "ready"; year: SchoolYear }>
  | Readonly<{ status: "not-found" }>
  | Readonly<{ status: "error" }>
> {
  const { data, error } = await supabase
    .from("school_years")
    .select("id, label, start_date, end_date, terms(id, semester_number, start_date, end_date)")
    .eq("id", yearId)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (error) return { status: "error" };
  if (!data) return { status: "not-found" };
  const semesters = data.terms
    .filter((term): term is typeof term & { semester_number: 1 | 2 } => term.semester_number === 1 || term.semester_number === 2)
    .map((term) => ({ id: term.id, semesterNumber: term.semester_number, startDate: term.start_date, endDate: term.end_date }));
  return { status: "ready", year: { id: data.id, label: data.label, startDate: data.start_date, endDate: data.end_date, semesters } };
}

function safeFailure(
  error: unknown,
  operationFallbacks: Readonly<Partial<Record<string, CalendarActionState["message"]>>> = {},
): CalendarActionState {
  const mapped = mapCalendarDatabaseError(error);
  const code = error && typeof error === "object" && "code" in error && typeof error.code === "string" ? error.code : "";
  return { status: "error", message: mapped === "unexpected" ? operationFallbacks[code] ?? "unexpected" : mapped };
}

export async function createSchoolYearAction(
  _previous: CalendarActionState,
  formData: FormData,
): Promise<CalendarActionState> {
  const parsed = parseSchoolYearForm(formData);
  if (!parsed.ok) return parsed.state;
  const context = await getAdminMutationContext();
  if (!context.ok) return context.state;
  try {
    const { error } = await context.supabase.from("school_years").insert({
      school_id: context.schoolId,
      label: parsed.data.label,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
    });
    if (error) return safeFailure(error, { "23505": "duplicateYear", "23514": "dateOrder" });
    revalidatePath(calendarPath);
    return { status: "success", message: "yearCreated" };
  } catch {
    return { status: "error", message: "unexpected" };
  }
}

export async function updateSchoolYearAction(
  yearId: string,
  _previous: CalendarActionState,
  formData: FormData,
): Promise<CalendarActionState> {
  if (!idSchema.safeParse(yearId).success) return { status: "error", message: "notFound" };
  const parsed = parseSchoolYearForm(formData);
  if (!parsed.ok) return parsed.state;
  const context = await getAdminMutationContext();
  if (!context.ok) return context.state;
  try {
    const { data, error } = await context.supabase
      .from("school_years")
      .update({ label: parsed.data.label, start_date: parsed.data.startDate, end_date: parsed.data.endDate })
      .eq("id", yearId)
      .eq("school_id", context.schoolId)
      .select("id")
      .maybeSingle();
    if (error) return safeFailure(error, { "23505": "duplicateYear", "23514": "yearContainsTerms" });
    if (!data) return { status: "error", message: "notFound" };
    revalidatePath(calendarPath);
    return { status: "success", message: "yearUpdated" };
  } catch {
    return { status: "error", message: "unexpected" };
  }
}

export async function createSemesterAction(
  yearId: string,
  _previous: CalendarActionState,
  formData: FormData,
): Promise<CalendarActionState> {
  if (!idSchema.safeParse(yearId).success) return { status: "error", message: "notFound" };
  const parsed = parseSemesterForm(formData);
  if (!parsed.ok) return parsed.state;
  const context = await getAdminMutationContext();
  if (!context.ok) return context.state;
  try {
    const yearResult = await loadOwnedYear(context.supabase, context.schoolId, yearId);
    if (yearResult.status === "error") return { status: "error", message: "unexpected" };
    if (yearResult.status === "not-found") return { status: "error", message: "notFound" };
    const year = yearResult.year;
    const conflict = validateSemesterAgainstYear(parsed.data, year);
    if (conflict) return conflict;
    const { error } = await context.supabase.from("terms").insert({
      school_id: context.schoolId,
      school_year_id: year.id,
      semester_number: parsed.data.semesterNumber,
      start_date: parsed.data.startDate,
      end_date: parsed.data.endDate,
    });
    if (error) return safeFailure(error, { "23505": "duplicateSemester", "23514": "semesterChronology" });
    revalidatePath(calendarPath);
    return { status: "success", message: "semesterCreated" };
  } catch {
    return { status: "error", message: "unexpected" };
  }
}

export async function updateSemesterAction(
  semesterId: string,
  _previous: CalendarActionState,
  formData: FormData,
): Promise<CalendarActionState> {
  if (!idSchema.safeParse(semesterId).success) return { status: "error", message: "notFound" };
  const parsed = parseSemesterForm(formData);
  if (!parsed.ok) return parsed.state;
  const context = await getAdminMutationContext();
  if (!context.ok) return context.state;
  try {
    const { data: existing, error: existingError } = await context.supabase
      .from("terms")
      .select("id, school_year_id, semester_number, start_date, end_date")
      .eq("id", semesterId)
      .eq("school_id", context.schoolId)
      .maybeSingle();
    if (existingError || !existing) return { status: "error", message: "notFound" };
    if (parsed.data.semesterNumber !== existing.semester_number) {
      return { status: "error", message: "unexpectedFields" };
    }
    const yearResult = await loadOwnedYear(context.supabase, context.schoolId, existing.school_year_id);
    if (yearResult.status === "error") return { status: "error", message: "unexpected" };
    if (yearResult.status === "not-found") return { status: "error", message: "notFound" };
    const conflict = validateSemesterAgainstYear(parsed.data, yearResult.year, semesterId);
    if (conflict) return conflict;
    const { data, error } = await context.supabase
      .from("terms")
      .update({ start_date: parsed.data.startDate, end_date: parsed.data.endDate })
      .eq("id", semesterId)
      .eq("school_id", context.schoolId)
      .select("id")
      .maybeSingle();
    if (error) return safeFailure(error, { "23505": "duplicateSemester", "23514": "semesterChronology" });
    if (!data) return { status: "error", message: "notFound" };
    revalidatePath(calendarPath);
    return { status: "success", message: "semesterUpdated" };
  } catch {
    return { status: "error", message: "unexpected" };
  }
}
