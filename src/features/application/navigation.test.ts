import { describe, expect, it } from "vitest";
import {
  canRoleAccessModule,
  getNavigationForRole,
  getNavigationKeyForSlug,
} from "./navigation";

describe("role-aware navigation contract", () => {
  it("exposes only the administrator navigation", () => {
    const keys = getNavigationForRole("ADMIN").map((item) => item.key);
    expect(keys).toEqual([
      "home",
      "schoolYears",
      "teachers",
      "classes",
      "students",
      "subjects",
      "quizzesAndGrades",
      "settings",
    ]);
  });

  it("exposes the teacher navigation without administrator links", () => {
    const keys = getNavigationForRole("TEACHER").map((item) => item.key);
    expect(keys).toEqual([
      "today",
      "myClasses",
      "students",
      "quizzesAndGrades",
      "homework",
      "progression",
      "studentFollowUp",
      "reports",
    ]);
    expect(keys).not.toEqual(expect.arrayContaining(["schoolYears", "teachers", "settings"]));
  });

  it("rejects manual teacher access to an administrator-only module", () => {
    expect(canRoleAccessModule("TEACHER", "enseignants")).toBe(false);
    expect(canRoleAccessModule("ADMIN", "enseignants")).toBe(true);
    expect(getNavigationKeyForSlug("enseignants")).toBe("teachers");
  });
});
