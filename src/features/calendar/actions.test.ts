import { beforeEach, describe, expect, it, vi } from "vitest";

const { revalidatePath, resolveApplicationContext, createServerSupabaseClient } = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  resolveApplicationContext: vi.fn(),
  createServerSupabaseClient: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath }));
vi.mock("@/server/application-context", () => ({ resolveApplicationContext }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient }));

import { createSchoolYearAction, createSemesterAction, updateSchoolYearAction, updateSemesterAction } from "./actions";
import { initialCalendarActionState } from "./calendar";

function form(entries: Record<string, string>): FormData {
  const value = new FormData();
  for (const [key, entry] of Object.entries(entries)) value.set(key, entry);
  return value;
}

const adminAccess = {
  status: "ready",
  context: { userId: "user", role: "ADMIN", school: { id: "trusted-school", name: "École" } },
};

beforeEach(() => {
  vi.clearAllMocks();
  resolveApplicationContext.mockResolvedValue(adminAccess);
});

describe("calendar server actions", () => {
  it("creates a year using only the trusted server school", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    createServerSupabaseClient.mockResolvedValue({ from: vi.fn(() => ({ insert })) });
    const result = await createSchoolYearAction(initialCalendarActionState, form({ label: " 2026–2027 ", startDate: "2026-09-01", endDate: "2027-06-30" }));
    expect(result).toEqual({ status: "success", message: "yearCreated" });
    expect(insert).toHaveBeenCalledWith({ school_id: "trusted-school", label: "2026–2027", start_date: "2026-09-01", end_date: "2027-06-30" });
    expect(revalidatePath).toHaveBeenCalledWith("/fr/app/annees-scolaires");
  });

  it("rejects a submitted schoolId before opening a database client", async () => {
    const result = await createSchoolYearAction(initialCalendarActionState, form({ label: "A", startDate: "2026-09-01", endDate: "2027-06-30", schoolId: "foreign" }));
    expect(result).toEqual({ status: "error", message: "unexpectedFields" });
    expect(createServerSupabaseClient).not.toHaveBeenCalled();
  });

  it("rejects non-admin and unavailable profiles inside the action", async () => {
    resolveApplicationContext.mockResolvedValueOnce({ ...adminAccess, context: { ...adminAccess.context, role: "TEACHER" } });
    expect(await createSchoolYearAction(initialCalendarActionState, form({ label: "A", startDate: "2026-09-01", endDate: "2027-06-30" }))).toEqual({ status: "error", message: "accessDenied" });
    resolveApplicationContext.mockResolvedValueOnce({ status: "access-unavailable", reason: "profile-inactive" });
    expect(await createSchoolYearAction(initialCalendarActionState, form({ label: "A", startDate: "2026-09-01", endDate: "2027-06-30" }))).toEqual({ status: "error", message: "accessDenied" });
  });

  it("maps duplicate provider details without exposing them", async () => {
    const insert = vi.fn().mockResolvedValue({ error: { code: "23505", message: "school_years_school_label_key internal" } });
    createServerSupabaseClient.mockResolvedValue({ from: vi.fn(() => ({ insert })) });
    expect(await createSchoolYearAction(initialCalendarActionState, form({ label: "A", startDate: "2026-09-01", endDate: "2027-06-30" }))).toEqual({ status: "error", message: "duplicateYear" });
  });

  it("creates a valid semester after resolving its owned parent", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: "11111111-1111-4111-8111-111111111111", label: "A", start_date: "2026-09-01", end_date: "2027-06-30", terms: [] }, error: null });
    const yearQuery = { select: vi.fn(), eq: vi.fn(), maybeSingle };
    yearQuery.select.mockReturnValue(yearQuery); yearQuery.eq.mockReturnValue(yearQuery);
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn((table: string) => table === "school_years" ? yearQuery : { insert });
    createServerSupabaseClient.mockResolvedValue({ from });
    const result = await createSemesterAction("11111111-1111-4111-8111-111111111111", initialCalendarActionState, form({ semesterNumber: "1", startDate: "2026-09-01", endDate: "2027-01-31" }));
    expect(result).toEqual({ status: "success", message: "semesterCreated" });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ school_id: "trusted-school", semester_number: 1 }));
  });

  it("creates Semester 2 through the same strict domain contract", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: "11111111-1111-4111-8111-111111111111", label: "A", start_date: "2026-09-01", end_date: "2027-06-30", terms: [{ id: "semester-one", semester_number: 1, start_date: "2026-09-01", end_date: "2027-01-31" }] }, error: null });
    const yearQuery = { select: vi.fn(), eq: vi.fn(), maybeSingle };
    yearQuery.select.mockReturnValue(yearQuery); yearQuery.eq.mockReturnValue(yearQuery);
    const insert = vi.fn().mockResolvedValue({ error: null });
    createServerSupabaseClient.mockResolvedValue({ from: vi.fn((table: string) => table === "school_years" ? yearQuery : { insert }) });
    const result = await createSemesterAction("11111111-1111-4111-8111-111111111111", initialCalendarActionState, form({ semesterNumber: "2", startDate: "2027-01-31", endDate: "2027-06-30" }));
    expect(result).toEqual({ status: "success", message: "semesterCreated" });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ semester_number: 2 }));
  });

  it("collapses a foreign or missing parent to the same safe result", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const yearQuery = { select: vi.fn(), eq: vi.fn(), maybeSingle };
    yearQuery.select.mockReturnValue(yearQuery); yearQuery.eq.mockReturnValue(yearQuery);
    createServerSupabaseClient.mockResolvedValue({ from: vi.fn(() => yearQuery) });
    expect(await createSemesterAction("11111111-1111-4111-8111-111111111111", initialCalendarActionState, form({ semesterNumber: "1", startDate: "2026-09-01", endDate: "2027-01-31" }))).toEqual({ status: "error", message: "notFound" });
  });

  it("updates only an owned year and maps a boundary race safely", async () => {
    const maybeSingle = vi.fn().mockResolvedValueOnce({ data: { id: "year" }, error: null });
    const query = { update: vi.fn(), eq: vi.fn(), select: vi.fn(), maybeSingle };
    query.update.mockReturnValue(query); query.eq.mockReturnValue(query); query.select.mockReturnValue(query);
    createServerSupabaseClient.mockResolvedValue({ from: vi.fn(() => query) });
    const yearId = "11111111-1111-4111-8111-111111111111";
    expect(await updateSchoolYearAction(yearId, initialCalendarActionState, form({ label: "A", startDate: "2026-09-01", endDate: "2027-06-30" }))).toEqual({ status: "success", message: "yearUpdated" });
    expect(query.eq).toHaveBeenCalledWith("school_id", "trusted-school");

    maybeSingle.mockResolvedValueOnce({ data: null, error: { code: "23514", message: "calendar integrity violation" } });
    expect(await updateSchoolYearAction(yearId, initialCalendarActionState, form({ label: "A", startDate: "2026-09-01", endDate: "2027-06-30" }))).toEqual({ status: "error", message: "yearContainsTerms" });
  });

  it("updates only semester dates and rejects a tampered semester number", async () => {
    const semesterId = "22222222-2222-4222-8222-222222222222";
    const existing = { id: semesterId, school_year_id: "11111111-1111-4111-8111-111111111111", semester_number: 1, start_date: "2026-09-01", end_date: "2027-01-31" };
    const termMaybeSingle = vi.fn().mockResolvedValueOnce({ data: existing, error: null });
    const termQuery = { select: vi.fn(), eq: vi.fn(), maybeSingle: termMaybeSingle, update: vi.fn() };
    termQuery.select.mockReturnValue(termQuery); termQuery.eq.mockReturnValue(termQuery); termQuery.update.mockReturnValue(termQuery);
    const yearMaybeSingle = vi.fn().mockResolvedValue({ data: { id: existing.school_year_id, label: "A", start_date: "2026-09-01", end_date: "2027-06-30", terms: [existing] }, error: null });
    const yearQuery = { select: vi.fn(), eq: vi.fn(), maybeSingle: yearMaybeSingle };
    yearQuery.select.mockReturnValue(yearQuery); yearQuery.eq.mockReturnValue(yearQuery);
    createServerSupabaseClient.mockResolvedValue({ from: vi.fn((table: string) => table === "terms" ? termQuery : yearQuery) });

    expect(await updateSemesterAction(semesterId, initialCalendarActionState, form({ semesterNumber: "2", startDate: "2026-09-01", endDate: "2027-01-31" }))).toEqual({ status: "error", message: "unexpectedFields" });
    expect(termQuery.update).not.toHaveBeenCalled();

    termMaybeSingle.mockResolvedValueOnce({ data: existing, error: null }).mockResolvedValueOnce({ data: { id: semesterId }, error: null });
    expect(await updateSemesterAction(semesterId, initialCalendarActionState, form({ semesterNumber: "1", startDate: "2026-09-02", endDate: "2027-01-30" }))).toEqual({ status: "success", message: "semesterUpdated" });
    expect(termQuery.update).toHaveBeenCalledWith({ start_date: "2026-09-02", end_date: "2027-01-30" });
  });

  it("returns a generic safe result when the provider throws", async () => {
    createServerSupabaseClient.mockResolvedValue({ from: vi.fn(() => ({ insert: vi.fn().mockRejectedValue(new Error("sensitive")) })) });
    expect(await createSchoolYearAction(initialCalendarActionState, form({ label: "A", startDate: "2026-09-01", endDate: "2027-06-30" }))).toEqual({ status: "error", message: "unexpected" });
  });
});
