import { beforeEach, describe, expect, it, vi } from "vitest";

const { resolveApplicationContext, createServerSupabaseClient } = vi.hoisted(() => ({ resolveApplicationContext: vi.fn(), createServerSupabaseClient: vi.fn() }));
vi.mock("@/server/application-context", () => ({ resolveApplicationContext }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient }));
import { listTeachers } from "./data";

const admin = { status: "ready", context: { userId: "admin", role: "ADMIN", school: { id: "school-a", name: "École" } } };

beforeEach(() => { vi.clearAllMocks(); resolveApplicationContext.mockResolvedValue(admin); });

describe("teacher list", () => {
  it("loads only same-school TEACHER rows and returns no email", async () => {
    const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn().mockResolvedValue({ data: [{ id: "teacher", display_name: "Marie Curie", active: true }], error: null }) };
    query.select.mockReturnValue(query); query.eq.mockReturnValue(query);
    createServerSupabaseClient.mockResolvedValue({ from: vi.fn(() => query) });
    expect(await listTeachers()).toEqual({ status: "ready", teachers: [{ id: "teacher", displayName: "Marie Curie", active: true }] });
    expect(query.eq).toHaveBeenCalledWith("school_id", "school-a");
    expect(query.eq).toHaveBeenCalledWith("role", "TEACHER");
    expect(query.select).toHaveBeenCalledWith("id, display_name, active");
  });
  it("rejects TEACHER, inactive and unauthenticated access before data use", async () => {
    resolveApplicationContext.mockResolvedValueOnce({ ...admin, context: { ...admin.context, role: "TEACHER" } });
    expect(await listTeachers()).toEqual({ status: "forbidden" });
    resolveApplicationContext.mockResolvedValueOnce({ status: "access-unavailable", reason: "profile-inactive" });
    expect(await listTeachers()).toEqual({ status: "access-unavailable" });
    resolveApplicationContext.mockResolvedValueOnce({ status: "unauthenticated" });
    expect(await listTeachers()).toEqual({ status: "unauthenticated" });
    expect(createServerSupabaseClient).not.toHaveBeenCalled();
  });
  it("returns a safe read error and filters impossible nameless teachers", async () => {
    const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn().mockResolvedValue({ data: [{ id: "x", display_name: null, active: true }], error: null }) };
    query.select.mockReturnValue(query); query.eq.mockReturnValue(query);
    createServerSupabaseClient.mockResolvedValue({ from: vi.fn(() => query) });
    expect(await listTeachers()).toEqual({ status: "ready", teachers: [] });
    query.order.mockResolvedValueOnce({ data: null, error: new Error("private") });
    expect(await listTeachers()).toEqual({ status: "error" });
  });
});
