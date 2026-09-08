import { describe, expect, it } from "vitest";
import { parseInvitationConfirmation } from "./invitation-confirmation";

describe("invitation confirmation input", () => {
  it("accepts only bounded invite tokens and the exact activation destination", () => {
    expect(parseInvitationConfirmation(new URLSearchParams({ token_hash: "opaque-token", type: "invite", next: "/fr/activation" })).success).toBe(true);
  });
  it.each([
    "",
    "token_hash=x&type=recovery&next=%2Ffr%2Factivation",
    "token_hash=x&type=invite&next=https%3A%2F%2Fevil.test",
    "token_hash=x&type=invite&next=%2F%2Fevil.test",
    "token_hash=x&type=invite&next=%2Ftr%2Factivation",
    `token_hash=${"x".repeat(2049)}&type=invite&next=%2Ffr%2Factivation`,
  ])("rejects unsafe or incomplete input", (input) => {
    expect(parseInvitationConfirmation(new URLSearchParams(input)).success).toBe(false);
  });
});
