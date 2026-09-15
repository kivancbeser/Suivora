import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createServerSupabaseClient: vi.fn(), resolveApplicationContext: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: mocks.createServerSupabaseClient }));
vi.mock("@/server/application-context", () => ({ resolveApplicationContext: mocks.resolveApplicationContext }));

import { listProgression } from "./data";

function query(result: { data: unknown; error: unknown }) {
  const value = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    then: (resolve: (result: { data: unknown; error: unknown }) => unknown) => Promise.resolve(result).then(resolve),
  };
  value.select.mockReturnValue(value);
  value.eq.mockReturnValue(value);
  value.order.mockReturnValue(value);
  return value;
}

const ready = (role: "ADMIN" | "TEACHER") => ({ status: "ready", context: { role, userId: "user", school: { id: "school", name: "School" } } });
const classes = [{ id: "class-course", course_id: "course", classes: { name: "Classe A", school_years: { label: "2026–2027" } }, courses: { name: "Français", code: "FRA" } }];
const courses = [{ id: "course", name: "Français" }];

beforeEach(() => vi.clearAllMocks());

describe("listProgression", () => {
  it("returns the assignment-scoped class list to a TEACHER without loading ADMIN catalog tables", async () => {
    mocks.resolveApplicationContext.mockResolvedValue(ready("TEACHER"));
    const from = vi.fn()
      .mockReturnValueOnce(query({ data: classes, error: null }))
      .mockReturnValueOnce(query({ data: courses, error: null }));
    mocks.createServerSupabaseClient.mockResolvedValue({ from });
    await expect(listProgression()).resolves.toMatchObject({ status: "ready", role: "TEACHER", classes: [{ id: "class-course" }], outcomes: [] });
    expect(from).toHaveBeenCalledTimes(2);
  });

  it("accepts absent optional links and evidence after catalog reload", async () => {
    mocks.resolveApplicationContext.mockResolvedValue(ready("ADMIN"));
    const results = [
      { data: classes, error: null },
      { data: courses, error: null },
      { data: [{ id: "outcome", course_id: "course", code: "SYN-FRA-COMP-01", is_active: true }], error: null },
      { data: [{ id: "revision", learning_outcome_id: "outcome", revision_number: 1, title: "Compréhension synthétique" }], error: null },
      { data: [], error: null },
      { data: [], error: null },
    ];
    mocks.createServerSupabaseClient.mockResolvedValue({ from: vi.fn(() => query(results.shift()!)) });
    await expect(listProgression()).resolves.toMatchObject({ status: "ready", outcomes: [{ revision: 1, revisions: [{ linkedClasses: [], usedAsEvidence: false }] }] });
  });

  it("preserves a safe error state for a genuine catalog query failure", async () => {
    mocks.resolveApplicationContext.mockResolvedValue(ready("ADMIN"));
    const results = [
      { data: classes, error: null },
      { data: courses, error: null },
      { data: null, error: { message: "private backend detail" } },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
    ];
    mocks.createServerSupabaseClient.mockResolvedValue({ from: vi.fn(() => query(results.shift()!)) });
    await expect(listProgression()).resolves.toEqual({ status: "error" });
  });
});
