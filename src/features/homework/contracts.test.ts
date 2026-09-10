import { describe, expect, it } from "vitest";

import { parseHomeworkForm, parseStatusForm } from "./contracts";

const termId = "00000000-0000-4000-8000-000000000001";

function homeworkForm(overrides: Record<string, string> = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    termId,
    title: "Lecture",
    description: "",
    assignedOn: "2040-09-01",
    dueOn: "2040-09-01",
    ...overrides,
  })) {
    form.set(key, value);
  }
  return form;
}

describe("homework form contracts", () => {
  it("accepts a same-day assignment and due date", () => {
    expect(parseHomeworkForm(homeworkForm())).toMatchObject({
      ok: true,
      data: { assignedOn: "2040-09-01", dueOn: "2040-09-01" },
    });
  });

  it("rejects inverted dates", () => {
    expect(
      parseHomeworkForm(homeworkForm({ dueOn: "2040-08-31" })),
    ).toEqual({ ok: false, message: "invalidDate" });
  });

  it("rejects hidden-field injection", () => {
    const form = homeworkForm();
    form.set("schoolId", "injected");
    expect(parseHomeworkForm(form)).toEqual({
      ok: false,
      message: "invalidFields",
    });
  });

  it("rejects blank and control-character titles", () => {
    expect(parseHomeworkForm(homeworkForm({ title: "  " }))).toEqual({
      ok: false,
      message: "invalidTitle",
    });
    expect(parseHomeworkForm(homeworkForm({ title: "Bad\nTitle" }))).toEqual({
      ok: false,
      message: "invalidTitle",
    });
  });

  it("accepts all explicit status shapes", () => {
    const form = new FormData();
    form.set("state-0", "SUBMITTED_ON_TIME");
    form.set("submitted-0", "2040-09-01");
    form.set("state-1", "SUBMITTED_LATE");
    form.set("submitted-1", "2040-09-02");
    form.set("state-2", "NOT_SUBMITTED");
    form.set("submitted-2", "");
    expect(parseStatusForm(form, 3)).toEqual({
      ok: true,
      values: [
        { index: 0, state: "SUBMITTED_ON_TIME", submittedOn: "2040-09-01" },
        { index: 1, state: "SUBMITTED_LATE", submittedOn: "2040-09-02" },
        { index: 2, state: "NOT_SUBMITTED", submittedOn: null },
      ],
    });
  });

  it("omits unrecorded students while preserving their index", () => {
    const form = new FormData();
    form.set("state-0", "");
    form.set("submitted-0", "");
    form.set("state-1", "NOT_SUBMITTED");
    form.set("submitted-1", "");
    expect(parseStatusForm(form, 2)).toEqual({
      ok: true,
      values: [{ index: 1, state: "NOT_SUBMITTED", submittedOn: null }],
    });
  });

  it("rejects inconsistent submission dates and unknown states", () => {
    const missing = new FormData();
    missing.set("state-0", "SUBMITTED_LATE");
    missing.set("submitted-0", "");
    expect(parseStatusForm(missing, 1)).toEqual({
      ok: false,
      message: "invalidState",
    });

    const unknown = new FormData();
    unknown.set("state-0", "EXCUSED");
    unknown.set("submitted-0", "");
    expect(parseStatusForm(unknown, 1)).toEqual({
      ok: false,
      message: "invalidState",
    });
  });
});
