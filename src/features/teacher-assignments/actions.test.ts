import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  revalidatePath: vi.fn(),
  resolveApplicationContext: vi.fn(),
  createServerSupabaseClient: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("@/server/application-context", () => ({ resolveApplicationContext: mocks.resolveApplicationContext }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: mocks.createServerSupabaseClient }));

import { createAssignmentAction, updateAssignmentAction } from "./actions";
import { initialAssignmentActionState } from "./assignment";

const classId = "11111111-1111-4111-8111-111111111111";
const classCourseId = "22222222-2222-4222-8222-222222222222";
const teacherId = "33333333-3333-4333-8333-333333333333";
const assignmentId = "44444444-4444-4444-8444-444444444444";
const admin = { status: "ready", context: { userId: "admin", role: "ADMIN", school: { id: "trusted-school", name: "School" } } };

function form(entries: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

function ownedTarget(data: { id: string } | null = { id: classCourseId }) {
  const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data, error: null }) };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  return query;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.resolveApplicationContext.mockResolvedValue(admin);
});

describe("teacher assignment Server Actions", () => {
  it("creates through the protected RPC after trusted-school target resolution", async () => {
    const query = ownedTarget();
    const rpc = vi.fn().mockResolvedValue({ data: assignmentId, error: null });
    mocks.createServerSupabaseClient.mockResolvedValue({ from: vi.fn(() => query), rpc });
    expect(await createAssignmentAction(classId, classCourseId, initialAssignmentActionState, form({ teacherId, weeklyPeriods: "4" }))).toEqual({ status: "success", message: "assignmentCreated" });
    expect(query.eq).toHaveBeenCalledWith("school_id", "trusted-school");
    expect(rpc).toHaveBeenCalledWith("admin_create_teacher_assignment", { target_teacher_id: teacherId, target_class_course_id: classCourseId, assigned_weekly_periods: 4 });
    expect(mocks.revalidatePath).toHaveBeenCalledWith(`/tr/app/classes/${classId}`);
  });

  it("rejects injected authority fields before opening a client", async () => {
    const result = await createAssignmentAction(classId, classCourseId, initialAssignmentActionState, form({ teacherId, weeklyPeriods: "4", schoolId: "foreign" }));
    expect(result).toEqual({ status: "error", message: "unexpectedFields" });
    expect(mocks.createServerSupabaseClient).not.toHaveBeenCalled();
  });

  it("rejects TEACHER callers inside the mutation", async () => {
    mocks.resolveApplicationContext.mockResolvedValue({ ...admin, context: { ...admin.context, role: "TEACHER" } });
    expect(await createAssignmentAction(classId, classCourseId, initialAssignmentActionState, form({ teacherId, weeklyPeriods: "4" }))).toEqual({ status: "error", message: "accessDenied" });
  });

  it("collapses missing and cross-school targets to one safe result", async () => {
    mocks.createServerSupabaseClient.mockResolvedValue({ from: vi.fn(() => ownedTarget(null)), rpc: vi.fn() });
    expect(await createAssignmentAction(classId, classCourseId, initialAssignmentActionState, form({ teacherId, weeklyPeriods: "4" }))).toEqual({ status: "error", message: "targetUnavailable" });
  });

  it("requires confirmation before deactivation", async () => {
    const result = await updateAssignmentAction(classId, assignmentId, false, initialAssignmentActionState, form({ weeklyPeriods: "4" }));
    expect(result).toMatchObject({ status: "error", fieldErrors: { confirmation: "confirmationRequired" } });
    expect(mocks.createServerSupabaseClient).not.toHaveBeenCalled();
  });

  it("updates lifecycle through exact RPC arguments and hides backend detail", async () => {
    const query = ownedTarget({ id: assignmentId });
    const rpc = vi.fn().mockResolvedValueOnce({ error: null }).mockResolvedValueOnce({ error: { code: "22023", message: "capacity internal detail" } });
    mocks.createServerSupabaseClient.mockResolvedValue({ from: vi.fn(() => query), rpc });
    expect(await updateAssignmentAction(classId, assignmentId, false, initialAssignmentActionState, form({ weeklyPeriods: "4", confirmation: "on" }))).toEqual({ status: "success", message: "assignmentUpdated" });
    expect(rpc).toHaveBeenCalledWith("admin_update_teacher_assignment", { target_assignment_id: assignmentId, assigned_weekly_periods: 4, assignment_is_active: false });
    expect(await updateAssignmentAction(classId, assignmentId, true, initialAssignmentActionState, form({ weeklyPeriods: "4" }))).toEqual({ status: "error", message: "capacityExceeded" });
  });
});
