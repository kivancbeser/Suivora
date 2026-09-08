import { describe, expect, it } from "vitest";
import { parsePrivilegedEnvironment, PrivilegedEnvironmentError, type PrivilegedEnvironment } from "./privileged";

const validSecret = `sb_secret_${"a".repeat(24)}`;

describe("privileged environment", () => {
  it("accepts a server secret and normalizes an origin trailing slash", () => {
    expect(parsePrivilegedEnvironment({ SUPABASE_SECRET_KEY: validSecret, APP_URL: "https://app.example.test/" }))
      .toEqual({ secretKey: validSecret, appOrigin: "https://app.example.test" });
  });

  const invalidCases: Array<[PrivilegedEnvironment, string]> = [
    [{ APP_URL: "https://app.example.test" }, "missing secret"],
    [{ SUPABASE_SECRET_KEY: "publishable", APP_URL: "https://app.example.test" }, "malformed secret"],
    [{ SUPABASE_SECRET_KEY: validSecret }, "missing origin"],
    [{ SUPABASE_SECRET_KEY: validSecret, APP_URL: "not-a-url" }, "invalid origin"],
    [{ SUPABASE_SECRET_KEY: validSecret, APP_URL: "https://user:pass@app.example.test" }, "credentials"],
    [{ SUPABASE_SECRET_KEY: validSecret, APP_URL: "https://app.example.test/path" }, "path"],
    [{ SUPABASE_SECRET_KEY: validSecret, APP_URL: "https://app.example.test?q=secret" }, "query"],
    [{ SUPABASE_SECRET_KEY: validSecret, APP_URL: "https://app.example.test/#token" }, "fragment"],
  ];

  it.each(invalidCases)("rejects invalid configuration without disclosing supplied values: %s", (environment) => {
    expect(() => parsePrivilegedEnvironment(environment)).toThrow(PrivilegedEnvironmentError);
    try { parsePrivilegedEnvironment(environment); } catch (error) {
      expect(String(error)).not.toContain("publishable");
      expect(String(error)).not.toContain("user:pass");
      expect(String(error)).not.toContain("q=secret");
    }
  });
});
