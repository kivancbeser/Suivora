import "server-only";

import { resolveApplicationContext } from "@/server/application-context";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSemesterNumber, type SchoolYear, type SemesterNumber } from "./calendar";

export type CalendarListResult =
  | Readonly<{ status: "ready"; years: readonly SchoolYear[] }>
  | Readonly<{ status: "unauthenticated" | "forbidden" | "access-unavailable" | "error" }>;

export async function listSchoolYearsWithSemesters(): Promise<CalendarListResult> {
  const access = await resolveApplicationContext();
  if (access.status === "unauthenticated") return { status: "unauthenticated" };
  if (access.status !== "ready") return { status: "access-unavailable" };
  if (access.context.role !== "ADMIN") return { status: "forbidden" };

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("school_years")
      .select("id, label, start_date, end_date, terms(id, semester_number, start_date, end_date)")
      .eq("school_id", access.context.school.id)
      .order("start_date", { ascending: false });

    if (error || !data) return { status: "error" };

    const years: SchoolYear[] = [];
    for (const row of data) {
      const semesters = row.terms
        .filter((term): term is typeof term & { semester_number: SemesterNumber } => isSemesterNumber(term.semester_number))
        .map((term) => ({
          id: term.id,
          semesterNumber: term.semester_number,
          startDate: term.start_date,
          endDate: term.end_date,
        }))
        .sort((left, right) => left.semesterNumber - right.semesterNumber);
      years.push({
        id: row.id,
        label: row.label,
        startDate: row.start_date,
        endDate: row.end_date,
        semesters,
      });
    }
    return { status: "ready", years };
  } catch {
    return { status: "error" };
  }
}
