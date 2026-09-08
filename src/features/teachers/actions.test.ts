import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ revalidatePath: vi.fn(), redirect: vi.fn(), resolveApplicationContext: vi.fn(), createServerSupabaseClient: vi.fn(), inviteAndProvisionTeacher: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/server/application-context", () => ({ resolveApplicationContext: mocks.resolveApplicationContext }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: mocks.createServerSupabaseClient }));
vi.mock("./provisioning", () => ({ inviteAndProvisionTeacher: mocks.inviteAndProvisionTeacher }));
import { createTeacherPasswordAction, inviteTeacherAction, updateTeacherAction } from "./actions";
import { initialTeacherActionState } from "./teacher-management";

function form(entries: Record<string, string>) { const data = new FormData(); Object.entries(entries).forEach(([key, value]) => data.set(key, value)); return data; }
const admin = { status: "ready", context: { userId: "admin", role: "ADMIN", school: { id: "trusted-school", name: "École" } } };

beforeEach(() => { vi.clearAllMocks(); mocks.resolveApplicationContext.mockResolvedValue(admin); });

describe("teacher server actions", () => {
  it("rejects non-admin and invalid invitation input before privileged work", async () => {
    mocks.resolveApplicationContext.mockResolvedValueOnce({ ...admin, context: { ...admin.context, role: "TEACHER" } });
    expect(await inviteTeacherAction(initialTeacherActionState, form({ displayName: "Marie", email: "m@example.test" }))).toMatchObject({ message: "accessDenied" });
    expect(await inviteTeacherAction(initialTeacherActionState, form({ displayName: "", email: "bad" }))).toMatchObject({ status: "error" });
    expect(mocks.inviteAndProvisionTeacher).not.toHaveBeenCalled();
  });
  it("passes normalized input and trusted context, then revalidates success", async () => {
    const normalClient = { marker: "normal" };
    mocks.createServerSupabaseClient.mockResolvedValue(normalClient);
    mocks.inviteAndProvisionTeacher.mockResolvedValue("invitationSent");
    expect(await inviteTeacherAction(initialTeacherActionState, form({ displayName: " Marie ", email: " M@EXAMPLE.TEST " }))).toEqual({ status: "success", message: "invitationSent" });
    expect(mocks.inviteAndProvisionTeacher).toHaveBeenCalledWith({ adminUserId: "admin", displayName: "Marie", email: "m@example.test", schoolId: "trusted-school", supabase: normalClient });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/fr/app/enseignants");
  });
  it("updates only the target, validated name and active state through the RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ error: null });
    mocks.createServerSupabaseClient.mockResolvedValue({ rpc });
    const teacherId = "11111111-1111-4111-8111-111111111111";
    expect(await updateTeacherAction(initialTeacherActionState, form({ teacherId, displayName: " Marie ", active: "false", confirmation: "confirmed" }))).toEqual({ status: "success", message: "profileUpdated" });
    expect(rpc).toHaveBeenCalledWith("admin_update_teacher_profile", { target_user_id: teacherId, teacher_display_name: "Marie", teacher_is_active: false });
  });
  it("rejects role and school injection and cross-school-safe RPC errors", async () => {
    expect((await updateTeacherAction(initialTeacherActionState, form({ teacherId: "11111111-1111-4111-8111-111111111111", displayName: "Marie", active: "true", role: "ADMIN" }))).message).toBe("unexpectedFields");
    const rpc = vi.fn().mockResolvedValue({ error: new Error("foreign school") });
    mocks.createServerSupabaseClient.mockResolvedValue({ rpc });
    expect((await updateTeacherAction(initialTeacherActionState, form({ teacherId: "11111111-1111-4111-8111-111111111111", displayName: "Marie", active: "true" }))).message).toBe("notFound");
  });
  it("updates a password only for an authenticated active teacher", async () => {
    const auth = { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "teacher" } }, error: null }), updateUser: vi.fn().mockResolvedValue({ error: null }) };
    mocks.createServerSupabaseClient.mockResolvedValue({ auth });
    mocks.resolveApplicationContext.mockResolvedValue({ ...admin, context: { ...admin.context, role: "TEACHER" } });
    await createTeacherPasswordAction(initialTeacherActionState, form({ password: "secure-pass-1", confirmation: "secure-pass-1" }));
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "secure-pass-1" });
    expect(mocks.redirect).toHaveBeenCalledWith("/fr/app");
  });
  it("rejects unauthenticated and ADMIN activation before password update", async () => {
    const auth = { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }), updateUser: vi.fn() };
    mocks.createServerSupabaseClient.mockResolvedValue({ auth });
    expect((await createTeacherPasswordAction(initialTeacherActionState, form({ password: "secure-pass-1", confirmation: "secure-pass-1" }))).message).toBe("accessDenied");
    auth.getUser.mockResolvedValue({ data: { user: { id: "admin" } }, error: null });
    expect((await createTeacherPasswordAction(initialTeacherActionState, form({ password: "secure-pass-1", confirmation: "secure-pass-1" }))).message).toBe("accessDenied");
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
});
