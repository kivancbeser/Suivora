import { describe, expect, it } from "vitest";
import { invitationSchema, parseForm, passwordSchema, teacherUpdateSchema } from "./teacher-management";

function form(entries: Record<string, string>) { const data = new FormData(); Object.entries(entries).forEach(([key, value]) => data.set(key, value)); return data; }

describe("teacher management validation", () => {
  it("normalizes an invitation without accepting tenant or role fields", () => {
    expect(parseForm(invitationSchema, form({ displayName: "  Marie Curie  ", email: " MARIE@EXAMPLE.TEST " })))
      .toEqual({ ok: true, data: { displayName: "Marie Curie", email: "marie@example.test" } });
    expect(parseForm(invitationSchema, form({ displayName: "Marie", email: "m@example.test", schoolId: "foreign", role: "ADMIN" }))).toMatchObject({ ok: false, state: { message: "unexpectedFields" } });
  });

  it.each([
    [{ displayName: "", email: "m@example.test" }, "displayNameRequired"],
    [{ displayName: "x".repeat(121), email: "m@example.test" }, "displayNameTooLong"],
    [{ displayName: "Marie\nCurie", email: "m@example.test" }, "displayNameInvalid"],
    [{ displayName: "Marie", email: "invalid" }, "emailInvalid"],
    [{ displayName: "Marie", email: `${"a".repeat(250)}@x.fr` }, "emailTooLong"],
  ])("rejects invalid invitation input", (entries, expected) => {
    expect(JSON.stringify(parseForm(invitationSchema, form(entries)))).toContain(expected);
  });

  it("requires explicit deactivation confirmation", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(JSON.stringify(parseForm(teacherUpdateSchema, form({ teacherId: id, displayName: "Marie", active: "false" })))).toContain("confirmationRequired");
    expect(parseForm(teacherUpdateSchema, form({ teacherId: id, displayName: "Marie", active: "false", confirmation: "confirmed" })).ok).toBe(true);
  });

  it("requires matching passwords of at least twelve characters", () => {
    expect(JSON.stringify(parseForm(passwordSchema, form({ password: "short", confirmation: "short" })))).toContain("passwordTooShort");
    expect(JSON.stringify(parseForm(passwordSchema, form({ password: "long-enough-1", confirmation: "long-enough-2" })))).toContain("passwordMismatch");
    expect(parseForm(passwordSchema, form({ password: "long-enough-1", confirmation: "long-enough-1" })).ok).toBe(true);
  });
});
