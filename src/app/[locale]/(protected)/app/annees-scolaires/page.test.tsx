import { beforeEach, describe, expect, it, vi } from "vitest";

const { listSchoolYearsWithSemesters, notFound, redirect } = vi.hoisted(() => ({
  listSchoolYearsWithSemesters: vi.fn(),
  notFound: vi.fn(() => { throw new Error("NOT_FOUND"); }),
  redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }),
}));
vi.mock("next/navigation", () => ({ notFound, redirect }));
vi.mock("next-intl/server", () => ({ getTranslations: vi.fn(async () => (key: string) => key) }));
vi.mock("@/features/calendar/data", () => ({ listSchoolYearsWithSemesters }));
vi.mock("@/features/calendar/calendar-page", () => ({ CalendarPage: () => null }));

import SchoolYearsPage from "./page";

beforeEach(() => vi.clearAllMocks());

describe("school-years route authorization", () => {
  it("renders for ADMIN-ready data", async () => {
    listSchoolYearsWithSemesters.mockResolvedValue({ status: "ready", years: [] });
    await expect(SchoolYearsPage({ params: Promise.resolve({ locale: "fr" }) })).resolves.toBeTruthy();
    expect(notFound).not.toHaveBeenCalled();
  });

  it("rejects TEACHER access server-side", async () => {
    listSchoolYearsWithSemesters.mockResolvedValue({ status: "forbidden" });
    await expect(SchoolYearsPage({ params: Promise.resolve({ locale: "fr" }) })).rejects.toThrow("NOT_FOUND");
  });

  it("redirects unauthenticated access and preserves the safe unavailable shell", async () => {
    listSchoolYearsWithSemesters.mockResolvedValueOnce({ status: "unauthenticated" });
    await expect(SchoolYearsPage({ params: Promise.resolve({ locale: "fr" }) })).rejects.toThrow("REDIRECT:/fr/connexion");
    listSchoolYearsWithSemesters.mockResolvedValueOnce({ status: "access-unavailable" });
    await expect(SchoolYearsPage({ params: Promise.resolve({ locale: "fr" }) })).resolves.toBeNull();
  });
});
