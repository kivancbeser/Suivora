import { describe, expect, it, vi } from "vitest";
import {
  getUnauthenticatedApplicationRedirect,
  resolveApplicationContextFromGateway,
  type ApplicationContextGateway,
} from "./application-context";

const user = { id: "00000000-0000-4000-8000-000000000001" };
const profile = {
  id: user.id,
  school_id: "00000000-0000-4000-8000-000000000002",
  role: "ADMIN",
  active: true,
};
const school = { id: profile.school_id, name: "École Démonstration" };

function gateway(
  overrides: Partial<ApplicationContextGateway> = {},
): ApplicationContextGateway {
  return {
    getAuthenticatedUser: vi.fn().mockResolvedValue({ data: user, error: null }),
    getProfile: vi.fn().mockResolvedValue({ data: profile, error: null }),
    getSchool: vi.fn().mockResolvedValue({ data: school, error: null }),
    ...overrides,
  };
}

describe("application context resolution", () => {
  it("resolves an authenticated active administrator through profile and school", async () => {
    const source = gateway();
    const result = await resolveApplicationContextFromGateway(source);

    expect(result).toEqual({
      status: "ready",
      context: { userId: user.id, role: "ADMIN", school },
    });
    expect(source.getProfile).toHaveBeenCalledWith(user.id);
    expect(source.getSchool).toHaveBeenCalledWith(profile.school_id);
  });

  it("returns unauthenticated without querying application data", async () => {
    const source = gateway({
      getAuthenticatedUser: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    const result = await resolveApplicationContextFromGateway(source);

    expect(result).toEqual({ status: "unauthenticated" });
    expect(source.getProfile).not.toHaveBeenCalled();
    expect(getUnauthenticatedApplicationRedirect(result, "fr")).toBe("/fr/connexion");
  });

  it("handles a missing profile without querying a school", async () => {
    const source = gateway({
      getProfile: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    expect(await resolveApplicationContextFromGateway(source)).toEqual({
      status: "access-unavailable",
      reason: "profile-missing",
    });
    expect(source.getSchool).not.toHaveBeenCalled();
  });

  it("rejects an inactive profile", async () => {
    const source = gateway({
      getProfile: vi.fn().mockResolvedValue({
        data: { ...profile, active: false },
        error: null,
      }),
    });
    expect(await resolveApplicationContextFromGateway(source)).toEqual({
      status: "access-unavailable",
      reason: "profile-inactive",
    });
  });

  it("handles a missing or inaccessible school", async () => {
    const source = gateway({
      getSchool: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    expect(await resolveApplicationContextFromGateway(source)).toEqual({
      status: "access-unavailable",
      reason: "school-missing",
    });
  });

  it("maps query failures and thrown infrastructure errors to a safe state", async () => {
    const queryFailure = gateway({
      getProfile: vi.fn().mockResolvedValue({ data: null, error: new Error("private") }),
    });
    const thrownFailure = gateway({
      getAuthenticatedUser: vi.fn().mockRejectedValue(new Error("private")),
    });

    expect(await resolveApplicationContextFromGateway(queryFailure)).toEqual({
      status: "access-unavailable",
      reason: "unexpected",
    });
    expect(await resolveApplicationContextFromGateway(thrownFailure)).toEqual({
      status: "access-unavailable",
      reason: "unexpected",
    });
  });

  it("rejects unsupported roles", async () => {
    const source = gateway({
      getProfile: vi.fn().mockResolvedValue({
        data: { ...profile, role: "PARENT" },
        error: null,
      }),
    });
    expect(await resolveApplicationContextFromGateway(source)).toEqual({
      status: "access-unavailable",
      reason: "unsupported-role",
    });
  });
});
