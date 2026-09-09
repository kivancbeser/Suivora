import { describe, expect, it } from "vitest";
import {
  mapAssignmentError,
  parseCreateAssignment,
  parseUpdateAssignment,
  validAssignmentId,
} from "./assignment";

const teacherId = "11111111-1111-4111-8111-111111111111";

function form(entries: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

describe("teacher assignment validation", () => {
  it("accepts a valid assignment and coerces its periods", () => {
    expect(parseCreateAssignment(form({ teacherId, weeklyPeriods: "4" }))).toEqual({
      ok: true,
      data: { teacherId, weeklyPeriods: 4 },
    });
  });

  it.each(["0", "41", "1.5", "not-a-number"])("rejects invalid periods: %s", (weeklyPeriods) => {
    const result = parseCreateAssignment(form({ teacherId, weeklyPeriods }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.state.fieldErrors?.weeklyPeriods).toBe("invalidPeriods");
  });

  it("rejects unexpected and duplicate fields", () => {
    const unexpected = parseCreateAssignment(form({ teacherId, weeklyPeriods: "4", schoolId: teacherId }));
    expect(unexpected).toEqual({ ok: false, state: { status: "error", message: "unexpectedFields" } });
    const duplicate = form({ teacherId, weeklyPeriods: "4" });
    duplicate.append("teacherId", teacherId);
    expect(parseCreateAssignment(duplicate)).toEqual({ ok: false, state: { status: "error", message: "unexpectedFields" } });
  });

  it("requires explicit confirmation only for deactivation", () => {
    const missing = parseUpdateAssignment(form({ weeklyPeriods: "3" }), false);
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.state.fieldErrors?.confirmation).toBe("confirmationRequired");
    expect(parseUpdateAssignment(form({ weeklyPeriods: "3", confirmation: "on" }), false).ok).toBe(true);
    expect(parseUpdateAssignment(form({ weeklyPeriods: "3" }), true).ok).toBe(true);
  });

  it("validates route identifiers and maps database errors safely", () => {
    expect(validAssignmentId(teacherId)).toBe(true);
    expect(validAssignmentId("internal-id")).toBe(false);
    expect(mapAssignmentError({ code: "42501" })).toBe("accessDenied");
    expect(mapAssignmentError({ code: "23505" })).toBe("duplicateAssignment");
    expect(mapAssignmentError({ code: "22023", message: "assignment capacity exceeded" })).toBe("capacityExceeded");
    expect(mapAssignmentError({ code: "22023", message: "inactive teacher" })).toBe("targetUnavailable");
    expect(mapAssignmentError(new Error("secret provider detail"))).toBe("unexpected");
  });
});
