import { describe, expect, it } from "vitest";
import { isRealIsoDate, mapCalendarDatabaseError, parseSchoolYearForm, parseSemesterForm, validateSemesterAgainstYear } from "./calendar";

function form(entries: Record<string, string>): FormData {
  const value = new FormData();
  for (const [key, entry] of Object.entries(entries)) value.set(key, entry);
  return value;
}

describe("calendar validation", () => {
  it("accepts only real ISO calendar dates", () => {
    expect(isRealIsoDate("2028-02-29")).toBe(true);
    expect(isRealIsoDate("2027-02-29")).toBe(false);
    expect(isRealIsoDate("01/09/2026")).toBe(false);
  });

  it("trims a valid school-year label", () => {
    expect(parseSchoolYearForm(form({ label: "  2026–2027  ", startDate: "2026-09-01", endDate: "2027-06-30" }))).toEqual({
      ok: true, data: { label: "2026–2027", startDate: "2026-09-01", endDate: "2027-06-30" },
    });
  });

  it.each([
    [{ label: "   ", startDate: "2026-09-01", endDate: "2027-06-30" }, "label", "labelRequired"],
    [{ label: "A", startDate: "2026-02-30", endDate: "2027-06-30" }, "startDate", "dateInvalid"],
    [{ label: "A", startDate: "2026-09-01", endDate: "2026-09-01" }, "endDate", "dateOrder"],
    [{ label: "A", startDate: "2027-09-01", endDate: "2026-09-01" }, "endDate", "dateOrder"],
  ])("rejects invalid school-year input", (input, field, code) => {
    const result = parseSchoolYearForm(form(input));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.state.fieldErrors?.[field as "label" | "startDate" | "endDate"]).toBe(code);
  });

  it("rejects browser-supplied ownership and unexpected fields", () => {
    expect(parseSchoolYearForm(form({ label: "A", startDate: "2026-09-01", endDate: "2027-06-30", schoolId: "forged" }))).toEqual({
      ok: false, state: { status: "error", message: "unexpectedFields" },
    });
  });

  it("accepts only Semester 1 or Semester 2 with an ordered range", () => {
    expect(parseSemesterForm(form({ semesterNumber: "1", startDate: "2026-09-01", endDate: "2027-01-31" })).ok).toBe(true);
    const invalidNumber = parseSemesterForm(form({ semesterNumber: "3", startDate: "2026-09-01", endDate: "2027-01-31" }));
    expect(invalidNumber.ok).toBe(false);
    const reversed = parseSemesterForm(form({ semesterNumber: "2", startDate: "2027-06-30", endDate: "2027-01-31" }));
    expect(reversed.ok).toBe(false);
  });

  const year = {
    startDate: "2026-09-01", endDate: "2027-06-30",
    semesters: [{ id: "s1", semesterNumber: 1 as const, startDate: "2026-09-01", endDate: "2027-01-31" }],
  };

  it("rejects semesters outside their parent year", () => {
    expect(validateSemesterAgainstYear({ semesterNumber: 2, startDate: "2027-02-01", endDate: "2027-07-01" }, year)?.message).toBe("outsideYear");
  });

  it("rejects duplicate and overlapping semesters", () => {
    expect(validateSemesterAgainstYear({ semesterNumber: 1, startDate: "2026-10-01", endDate: "2027-01-01" }, year)?.message).toBe("duplicateSemester");
    expect(validateSemesterAgainstYear({ semesterNumber: 2, startDate: "2027-01-30", endDate: "2027-06-30" }, year)?.message).toBe("semesterChronology");
  });

  it("allows back-to-back semesters and ignores the current row on update", () => {
    expect(validateSemesterAgainstYear({ semesterNumber: 2, startDate: "2027-01-31", endDate: "2027-06-30" }, year)).toBeNull();
    expect(validateSemesterAgainstYear({ semesterNumber: 1, startDate: "2026-09-02", endDate: "2027-01-30" }, year, "s1")).toBeNull();
  });
});
describe("safe database error mapping", () => {
  it.each([
    ["42501", "", "accessDenied"], ["23503", "", "notFound"],
    ["23505", "school_years_school_label_key", "duplicateYear"],
    ["23505", "terms_school_year_semester_key", "duplicateSemester"],
    ["23514", "school_year_contains_terms", "yearContainsTerms"],
    ["23514", "terms_within_school_year_dates", "outsideYear"],
    ["23514", "terms_semester_chronology", "semesterChronology"],
    ["23514", "terms_date_order", "dateOrder"],
    ["99999", "internal detail", "unexpected"],
  ])("maps provider failures to stable browser-safe codes", (code, message, expected) => {
    expect(mapCalendarDatabaseError({ code, message })).toBe(expected);
  });
});
