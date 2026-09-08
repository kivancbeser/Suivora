import { z } from "zod";

export const invitationDestination = "/fr/activation" as const;

const confirmationSchema = z.strictObject({
  token_hash: z.string().min(1).max(2048),
  type: z.literal("invite"),
  next: z.literal(invitationDestination),
});

export function parseInvitationConfirmation(searchParams: URLSearchParams) {
  return confirmationSchema.safeParse({
    token_hash: searchParams.get("token_hash"),
    type: searchParams.get("type"),
    next: searchParams.get("next"),
  });
}
