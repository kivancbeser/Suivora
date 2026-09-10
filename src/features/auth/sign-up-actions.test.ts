import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createPrivilegedInvitationResources: vi.fn(),
  createServerSupabaseClient: vi.fn(),
  redirect: vi.fn(),
  registerTestTeacher: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/supabase/privileged", () => ({
  createPrivilegedInvitationResources: mocks.createPrivilegedInvitationResources,
}));
vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: mocks.createServerSupabaseClient,
}));
vi.mock("./sign-up", () => ({ registerTestTeacher: mocks.registerTestTeacher }));

import { signUpAction } from "./sign-up-actions";

beforeEach(() => vi.clearAllMocks());

describe("signUpAction", () => {
  it("returns a safe error when privileged configuration is unavailable", async () => {
    mocks.createPrivilegedInvitationResources.mockImplementation(() => {
      throw new Error("private configuration detail");
    });

    await expect(signUpAction({}, new FormData())).resolves.toEqual({ error: "unexpected" });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects only after successful registration", async () => {
    mocks.createPrivilegedInvitationResources.mockReturnValue({ client: { auth: { admin: {} } } });
    mocks.createServerSupabaseClient.mockResolvedValue({ auth: {} });
    mocks.registerTestTeacher.mockResolvedValue({ ok: true, redirectTo: "/tr/app" });

    await signUpAction({}, new FormData());
    expect(mocks.redirect).toHaveBeenCalledWith("/tr/app");
  });
});
