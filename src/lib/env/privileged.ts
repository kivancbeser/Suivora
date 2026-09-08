import "server-only";

import { z } from "zod";

const secretSchema = z
  .string()
  .trim()
  .regex(/^sb_secret_[A-Za-z0-9._-]{20,}$/u);

const originSchema = z.string().trim().transform((value, context) => {
  try {
    const url = new URL(value);
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      context.addIssue({ code: "custom", message: "invalid-origin" });
      return z.NEVER;
    }
    return url.origin;
  } catch {
    context.addIssue({ code: "custom", message: "invalid-origin" });
    return z.NEVER;
  }
});

export type PrivilegedEnvironment = Readonly<{
  SUPABASE_SECRET_KEY?: unknown;
  APP_URL?: unknown;
}>;

export type PrivilegedConfig = Readonly<{
  secretKey: string;
  appOrigin: string;
}>;

export class PrivilegedEnvironmentError extends Error {
  constructor() {
    super("Privileged teacher invitation configuration is unavailable.");
    this.name = "PrivilegedEnvironmentError";
  }
}

export function parsePrivilegedEnvironment(environment: PrivilegedEnvironment): PrivilegedConfig {
  const secret = secretSchema.safeParse(environment.SUPABASE_SECRET_KEY);
  const origin = originSchema.safeParse(environment.APP_URL);
  if (!secret.success || !origin.success) throw new PrivilegedEnvironmentError();
  return Object.freeze({ secretKey: secret.data, appOrigin: origin.data });
}

export function getPrivilegedConfig(): PrivilegedConfig {
  return parsePrivilegedEnvironment({
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    APP_URL: process.env.APP_URL,
  });
}
