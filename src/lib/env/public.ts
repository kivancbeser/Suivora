import { z } from "zod";

const publicSupabaseEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string({ error: "NEXT_PUBLIC_SUPABASE_URL is required." })
    .min(1, "NEXT_PUBLIC_SUPABASE_URL is required.")
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL.")
    .refine(
      (value) => value.startsWith("https://") || value.startsWith("http://"),
      "NEXT_PUBLIC_SUPABASE_URL must use HTTP or HTTPS.",
    ),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string({ error: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required." })
    .trim()
    .min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required."),
});

export type PublicSupabaseEnvironment = Readonly<{
  NEXT_PUBLIC_SUPABASE_URL?: unknown;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: unknown;
}>;

export type SupabasePublicConfig = Readonly<{
  url: string;
  publishableKey: string;
}>;

export class PublicEnvironmentError extends Error {
  constructor(messages: readonly string[]) {
    super(`Invalid public Supabase configuration: ${messages.join(" ")}`);
    this.name = "PublicEnvironmentError";
  }
}

export function parseSupabasePublicEnvironment(
  environment: PublicSupabaseEnvironment,
): SupabasePublicConfig {
  const result = publicSupabaseEnvironmentSchema.safeParse(environment);

  if (!result.success) {
    throw new PublicEnvironmentError(
      result.error.issues.map((issue) => issue.message),
    );
  }

  return Object.freeze({
    url: result.data.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: result.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}

export function getSupabasePublicConfig(): SupabasePublicConfig {
  return parseSupabasePublicEnvironment({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
