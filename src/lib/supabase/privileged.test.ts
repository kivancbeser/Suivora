import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createClient: vi.fn(), getSupabasePublicConfig: vi.fn(), getPrivilegedConfig: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));
vi.mock("@/lib/env/public", () => ({ getSupabasePublicConfig: mocks.getSupabasePublicConfig }));
vi.mock("@/lib/env/privileged", () => ({ getPrivilegedConfig: mocks.getPrivilegedConfig }));
import { createPrivilegedInvitationResources } from "./privileged";

describe("privileged Auth client", () => {
  it("uses no cookies and disables browser session behavior", () => {
    const client = { auth: { admin: {} } };
    mocks.getSupabasePublicConfig.mockReturnValue({ url: "https://project.example.test", publishableKey: "public" });
    mocks.getPrivilegedConfig.mockReturnValue({ secretKey: "server-secret", appOrigin: "https://app.example.test" });
    mocks.createClient.mockReturnValue(client);
    expect(createPrivilegedInvitationResources()).toEqual({ client, appOrigin: "https://app.example.test" });
    expect(mocks.createClient).toHaveBeenCalledWith("https://project.example.test", "server-secret", { auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false } });
  });
});
