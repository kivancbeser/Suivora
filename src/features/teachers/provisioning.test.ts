import { beforeEach, describe, expect, it, vi } from "vitest";

const { createPrivilegedInvitationResources } = vi.hoisted(() => ({ createPrivilegedInvitationResources: vi.fn() }));
vi.mock("@/lib/supabase/privileged", () => ({ createPrivilegedInvitationResources }));
import { createAndProvisionTestTeacher, inviteAndProvisionTeacher } from "./provisioning";
import { PrivilegedEnvironmentError } from "@/lib/env/privileged";

const invitedId = "11111111-1111-4111-8111-111111111111";

function normalClient(rpcError: unknown = null, profile: unknown = null) {
  const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn().mockResolvedValue({ data: profile, error: null }) };
  query.select.mockReturnValue(query); query.eq.mockReturnValue(query);
  return { rpc: vi.fn().mockResolvedValue({ error: rpcError }), from: vi.fn(() => query), query };
}

function privileged(inviteError: unknown = null, cleanupError: unknown = null) {
  const inviteUserByEmail = vi.fn().mockResolvedValue({ data: { user: inviteError ? null : { id: invitedId } }, error: inviteError });
  const createUser = vi.fn().mockResolvedValue({ data: { user: inviteError ? null : { id: invitedId } }, error: inviteError });
  const deleteUser = vi.fn().mockResolvedValue({ error: cleanupError });
  createPrivilegedInvitationResources.mockReturnValue({ appOrigin: "https://app.example.test", client: { auth: { admin: { createUser, inviteUserByEmail, deleteUser } } } });
  return { createUser, inviteUserByEmail, deleteUser };
}

function input(client: ReturnType<typeof normalClient>, adminUserId = "admin") {
  return { adminUserId, displayName: "Marie Curie", email: "marie@example.test", schoolId: "school-a", supabase: client as never };
}

beforeEach(() => vi.clearAllMocks());

describe("invitation provisioning compensation", () => {
  it("invites with the controlled redirect then provisions through the normal client", async () => {
    const elevated = privileged(); const normal = normalClient();
    expect(await inviteAndProvisionTeacher(input(normal))).toBe("invitationSent");
    expect(elevated.inviteUserByEmail).toHaveBeenCalledWith("marie@example.test", { redirectTo: "https://app.example.test/auth/confirm?next=/fr/activation" });
    expect(normal.rpc).toHaveBeenCalledWith("admin_provision_teacher_profile", { target_user_id: invitedId, teacher_display_name: "Marie Curie" });
    expect(elevated.deleteUser).not.toHaveBeenCalled();
  });
  it("never deletes when invitation reports an existing user", async () => {
    const elevated = privileged({ status: 422 }); const normal = normalClient();
    expect(await inviteAndProvisionTeacher(input(normal))).toBe("invitationFailed");
    expect(normal.rpc).not.toHaveBeenCalled(); expect(elevated.deleteUser).not.toHaveBeenCalled();
  });
  it("reconciles a valid profile after an ambiguous RPC failure", async () => {
    const elevated = privileged(); const normal = normalClient(new Error("ambiguous"), { id: invitedId, school_id: "school-a", role: "TEACHER", display_name: "Marie Curie" });
    expect(await inviteAndProvisionTeacher(input(normal))).toBe("invitationSent");
    expect(elevated.deleteUser).not.toHaveBeenCalled();
    expect(normal.query.eq).toHaveBeenCalledWith("school_id", "school-a");
    expect(normal.query.eq).toHaveBeenCalledWith("role", "TEACHER");
  });
  it("cleans up only the newly returned user and returns a retryable state", async () => {
    const elevated = privileged(); const normal = normalClient(new Error("failed"));
    expect(await inviteAndProvisionTeacher(input(normal))).toBe("retryableFailure");
    expect(elevated.deleteUser).toHaveBeenCalledWith(invitedId);
  });
  it("returns manual intervention when cleanup fails or targets the ADMIN", async () => {
    const elevated = privileged(null, new Error("cleanup"));
    expect(await inviteAndProvisionTeacher(input(normalClient(new Error("failed"))))).toBe("manualIntervention");
    expect(elevated.deleteUser).toHaveBeenCalledWith(invitedId);
    const second = privileged();
    expect(await inviteAndProvisionTeacher(input(normalClient(new Error("failed")), invitedId))).toBe("manualIntervention");
    expect(second.deleteUser).not.toHaveBeenCalled();
  });
  it("maps unavailable configuration separately without exposing details", async () => {
    createPrivilegedInvitationResources.mockImplementation(() => { throw new PrivilegedEnvironmentError(); });
    expect(await inviteAndProvisionTeacher(input(normalClient()))).toBe("configurationUnavailable");
  });
  it("maps an unexpected pre-invitation failure safely", async () => {
    createPrivilegedInvitationResources.mockImplementation(() => { throw new Error("secret-value"); });
    expect(await inviteAndProvisionTeacher(input(normalClient()))).toBe("invitationFailed");
  });
});

describe("temporary test-teacher provisioning", () => {
  it("creates a confirmed Auth user and provisions its TEACHER profile", async () => {
    const elevated = privileged(); const normal = normalClient();
    expect(await createAndProvisionTestTeacher({ ...input(normal), password: "temporary-pass-1" })).toBe("testUserCreated");
    expect(elevated.createUser).toHaveBeenCalledWith({ email: "marie@example.test", password: "temporary-pass-1", email_confirm: true });
    expect(normal.rpc).toHaveBeenCalledWith("admin_provision_teacher_profile", { target_user_id: invitedId, teacher_display_name: "Marie Curie" });
    expect(elevated.deleteUser).not.toHaveBeenCalled();
  });

  it("does not provision or clean up an existing Auth user", async () => {
    const elevated = privileged({ code: "email_exists" }); const normal = normalClient();
    expect(await createAndProvisionTestTeacher({ ...input(normal), password: "temporary-pass-1" })).toBe("userAlreadyExists");
    expect(normal.rpc).not.toHaveBeenCalled();
    expect(elevated.deleteUser).not.toHaveBeenCalled();
  });

  it("removes only the newly created Auth user when profile provisioning fails", async () => {
    const elevated = privileged(); const normal = normalClient(new Error("profile failure"));
    expect(await createAndProvisionTestTeacher({ ...input(normal), password: "temporary-pass-1" })).toBe("retryableFailure");
    expect(elevated.deleteUser).toHaveBeenCalledWith(invitedId);
  });
});
