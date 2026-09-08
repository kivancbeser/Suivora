import { beforeEach, describe, expect, it, vi } from "vitest";

const { resolveApplicationContext, createServerSupabaseClient } = vi.hoisted(() => ({
  resolveApplicationContext: vi.fn(),
  createServerSupabaseClient: vi.fn(),
}));
vi.mock("@/server/application-context", () => ({ resolveApplicationContext }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient }));

import { listSchoolYearsWithSemesters } from "./data";

beforeEach(() => vi.clearAllMocks());

describe("calendar listing boundary", () => {
  it("requires ADMIN before opening the database client", async () => {
    resolveApplicationContext.mockResolvedValue({ status: "ready", context: { role: "TEACHER", school: { id: "school" } } });
    expect(await listSchoolYearsWithSemesters()).toEqual({ status: "forbidden" });
    expect(createServerSupabaseClient).not.toHaveBeenCalled();
  });

  it("preserves unauthenticated and unavailable access states", async () => {
    resolveApplicationContext.mockResolvedValueOnce({ status: "unauthenticated" });
    expect(await listSchoolYearsWithSemesters()).toEqual({ status: "unauthenticated" });
    resolveApplicationContext.mockResolvedValueOnce({ status: "access-unavailable", reason: "profile-inactive" });
    expect(await listSchoolYearsWithSemesters()).toEqual({ status: "access-unavailable" });
  });

  it("scopes the list to the trusted school and orders semester summaries", async () => {
    resolveApplicationContext.mockResolvedValue({ status: "ready", context: { role: "ADMIN", school: { id: "trusted-school" } } });
    const order = vi.fn().mockResolvedValue({ data: [{
      id: "year", label: "2026–2027", start_date: "2026-09-01", end_date: "2027-06-30",
      terms: [
        { id: "s2", semester_number: 2, start_date: "2027-01-31", end_date: "2027-06-30" },
        { id: "s1", semester_number: 1, start_date: "2026-09-01", end_date: "2027-01-31" },
      ],
    }], error: null });
    const query = { select: vi.fn(), eq: vi.fn(), order };
    query.select.mockReturnValue(query); query.eq.mockReturnValue(query);
    createServerSupabaseClient.mockResolvedValue({ from: vi.fn(() => query) });
    const result = await listSchoolYearsWithSemesters();
    expect(query.eq).toHaveBeenCalledWith("school_id", "trusted-school");
    expect(result.status).toBe("ready");
    if (result.status === "ready") expect(result.years[0].semesters.map((semester) => semester.semesterNumber)).toEqual([1, 2]);
  });

  it("returns a safe state for provider and thrown read failures", async () => {
    resolveApplicationContext.mockResolvedValue({ status: "ready", context: { role: "ADMIN", school: { id: "school" } } });
    const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn().mockResolvedValue({ data: null, error: { message: "raw" } }) };
    query.select.mockReturnValue(query); query.eq.mockReturnValue(query);
    createServerSupabaseClient.mockResolvedValueOnce({ from: vi.fn(() => query) });
    expect(await listSchoolYearsWithSemesters()).toEqual({ status: "error" });
    createServerSupabaseClient.mockRejectedValueOnce(new Error("raw"));
    expect(await listSchoolYearsWithSemesters()).toEqual({ status: "error" });
  });
});
