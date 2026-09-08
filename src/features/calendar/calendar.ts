import { z } from "zod";

export const semesterNumbers = [1, 2] as const;
export type SemesterNumber = (typeof semesterNumbers)[number];

export type CalendarField = "label" | "startDate" | "endDate" | "semesterNumber";
export type CalendarErrorCode =
  | "accessDenied"
  | "dateInvalid"
  | "dateOrder"
  | "duplicateSemester"
  | "duplicateYear"
  | "labelRequired"
  | "labelTooLong"
  | "notFound"
  | "outsideYear"
  | "semesterChronology"
  | "semesterInvalid"
  | "unexpected"
  | "unexpectedFields"
  | "yearContainsTerms";

export type CalendarActionState = Readonly<{
  status: "idle" | "error" | "success";
  message?: CalendarErrorCode | "yearCreated" | "yearUpdated" | "semesterCreated" | "semesterUpdated";
  fieldErrors?: Partial<Record<CalendarField, CalendarErrorCode>>;
}>;

export const initialCalendarActionState: CalendarActionState = { status: "idle" };

export type Semester = Readonly<{
  id: string;
  semesterNumber: SemesterNumber;
  startDate: string;
  endDate: string;
}>;

export type SchoolYear = Readonly<{
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  semesters: readonly Semester[];
}>;

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/u;

export function isRealIsoDate(value: string): boolean {
  if (!isoDatePattern.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

const dateSchema = z.string().refine(isRealIsoDate, "dateInvalid");
const labelSchema = z.string().trim().min(1, "labelRequired").max(120, "labelTooLong");

const yearSchema = z
  .object({ label: labelSchema, startDate: dateSchema, endDate: dateSchema })
  .strict()
  .refine((value) => value.startDate < value.endDate, { path: ["endDate"], message: "dateOrder" });

const semesterSchema = z
  .object({
    semesterNumber: z.coerce.number().refine((value): value is SemesterNumber => value === 1 || value === 2, "semesterInvalid"),
    startDate: dateSchema,
    endDate: dateSchema,
  })
  .strict()
  .refine((value) => value.startDate < value.endDate, { path: ["endDate"], message: "dateOrder" });

function hasUnexpectedFields(formData: FormData, allowed: readonly string[]): boolean {
  const allowedSet = new Set(allowed);
  return (
    [...formData.keys()].some((key) => !key.startsWith("$ACTION_") && !allowedSet.has(key)) ||
    allowed.some((key) => formData.getAll(key).length > 1)
  );
}

function issueState(error: z.ZodError): CalendarActionState {
  const fieldErrors: Partial<Record<CalendarField, CalendarErrorCode>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (field === "label" || field === "startDate" || field === "endDate" || field === "semesterNumber") {
      fieldErrors[field] ??= issue.message as CalendarErrorCode;
    }
  }
  return { status: "error", fieldErrors };
}

export function parseSchoolYearForm(formData: FormData):
  | Readonly<{ ok: true; data: { label: string; startDate: string; endDate: string } }>
  | Readonly<{ ok: false; state: CalendarActionState }> {
  if (hasUnexpectedFields(formData, ["label", "startDate", "endDate"])) {
    return { ok: false, state: { status: "error", message: "unexpectedFields" } };
  }
  const parsed = yearSchema.safeParse({
    label: formData.get("label"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false, state: issueState(parsed.error) };
}

export function parseSemesterForm(formData: FormData):
  | Readonly<{ ok: true; data: { semesterNumber: SemesterNumber; startDate: string; endDate: string } }>
  | Readonly<{ ok: false; state: CalendarActionState }> {
  if (hasUnexpectedFields(formData, ["semesterNumber", "startDate", "endDate"])) {
    return { ok: false, state: { status: "error", message: "unexpectedFields" } };
  }
  const parsed = semesterSchema.safeParse({
    semesterNumber: formData.get("semesterNumber"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });
  return parsed.success ? { ok: true, data: parsed.data } : { ok: false, state: issueState(parsed.error) };
}

export function validateSemesterAgainstYear(
  semester: { semesterNumber: SemesterNumber; startDate: string; endDate: string },
  year: Pick<SchoolYear, "startDate" | "endDate" | "semesters">,
  currentSemesterId?: string,
): CalendarActionState | null {
  if (semester.startDate < year.startDate || semester.endDate > year.endDate) {
    return { status: "error", message: "outsideYear" };
  }
  const sibling = year.semesters.find((item) => item.id !== currentSemesterId);
  if (!sibling) return null;
  if (sibling.semesterNumber === semester.semesterNumber) {
    return { status: "error", message: "duplicateSemester" };
  }
  const invalidChronology = semester.semesterNumber === 1
    ? semester.endDate > sibling.startDate
    : sibling.endDate > semester.startDate;
  return invalidChronology ? { status: "error", message: "semesterChronology" } : null;
}

type DatabaseError = Readonly<{ code?: unknown; message?: unknown; details?: unknown; hint?: unknown }>;

export function mapCalendarDatabaseError(error: unknown): CalendarErrorCode {
  const candidate = error && typeof error === "object" ? error as DatabaseError : {};
  const code = typeof candidate.code === "string" ? candidate.code : "";
  const text = [candidate.message, candidate.details, candidate.hint].filter((value): value is string => typeof value === "string").join(" ");
  if (code === "42501") return "accessDenied";
  if (code === "23503") return "notFound";
  if (code === "23505" && text.includes("school_years_school_label_key")) return "duplicateYear";
  if (code === "23505" && text.includes("terms_school_year_semester_key")) return "duplicateSemester";
  if (text.includes("school_year_contains_terms")) return "yearContainsTerms";
  if (text.includes("terms_within_school_year_dates")) return "outsideYear";
  if (text.includes("terms_semester_chronology")) return "semesterChronology";
  if (text.includes("terms_semester_number_check")) return "semesterInvalid";
  if (text.includes("terms_date_order") || text.includes("school_years_date_order")) return "dateOrder";
  return "unexpected";
}

export function isSemesterNumber(value: number): value is SemesterNumber {
  return value === 1 || value === 2;
}
