import { beforeEach, describe, expect, it, vi } from "vitest";

const createServerSupabaseClient = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient }));
import { GET } from "./route";

beforeEach(() => vi.clearAllMocks());
describe("invitation confirmation route", () => {
  it("verifies a valid invite and removes the token from the destination", async () => {
    const verifyOtp = vi.fn().mockResolvedValue({ error: null });
    createServerSupabaseClient.mockResolvedValue({ auth: { verifyOtp } });
    const response = await GET(new Request("https://app.example.test/auth/confirm?token_hash=opaque&type=invite&next=%2Ffr%2Factivation"));
    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: "opaque", type: "invite" });
    expect(response.headers.get("location")).toBe("https://app.example.test/fr/activation");
    expect(response.headers.get("location")).not.toContain("opaque");
  });
  it.each([
    "https://app.example.test/auth/confirm?type=invite&next=%2Ffr%2Factivation",
    "https://app.example.test/auth/confirm?token_hash=x&type=recovery&next=%2Ffr%2Factivation",
    "https://app.example.test/auth/confirm?token_hash=x&type=invite&next=https%3A%2F%2Fevil.test",
  ])("rejects malformed requests before verification", async (url) => {
    const response = await GET(new Request(url));
    expect(response.headers.get("location")).toBe("https://app.example.test/fr/invitation-invalide");
    expect(createServerSupabaseClient).not.toHaveBeenCalled();
  });
  it("maps invalid or expired tokens to the safe page", async () => {
    createServerSupabaseClient.mockResolvedValue({ auth: { verifyOtp: vi.fn().mockResolvedValue({ error: new Error("raw") }) } });
    const response = await GET(new Request("https://app.example.test/auth/confirm?token_hash=opaque&type=invite&next=%2Ffr%2Factivation"));
    expect(response.headers.get("location")).toBe("https://app.example.test/fr/invitation-invalide");
  });
});
