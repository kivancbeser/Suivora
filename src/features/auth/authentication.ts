import { z } from "zod";
import { isLocale, type Locale } from "@/i18n/routing";

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "emailRequired")
    .email("emailInvalid")
    .transform((email) => email.toLowerCase()),
  password: z.string().min(1, "passwordRequired"),
  locale: z.string().refine(isLocale),
  returnTo: z.string().optional(),
});

export type SignInField = "email" | "password";
export type SignInErrorCode =
  | "credentialsInvalid"
  | "unexpected"
  | "emailRequired"
  | "emailInvalid"
  | "passwordRequired";

export type SignInState = Readonly<{
  error?: Extract<SignInErrorCode, "credentialsInvalid" | "unexpected">;
  fieldErrors?: Partial<Record<SignInField, SignInErrorCode>>;
}>;

export type PasswordAuthGateway = Readonly<{
  signInWithPassword(credentials: {
    email: string;
    password: string;
  }): Promise<{ error: unknown | null }>;
}>;

export type AuthSurface = "signIn" | "protected";

export function getAuthRedirect(
  surface: AuthSurface,
  isAuthenticated: boolean,
  locale: Locale,
): string | null {
  if (surface === "signIn" && isAuthenticated) {
    return `/${locale}/app`;
  }

  if (surface === "protected" && !isAuthenticated) {
    return `/${locale}/connexion`;
  }

  return null;
}

export async function endLocalSession(gateway: {
  signOut(options: { scope: "local" }): Promise<unknown>;
}): Promise<void> {
  try {
    await gateway.signOut({ scope: "local" });
  } catch {
    // Sign-out failures are intentionally not exposed to the browser.
  }
}

export function getSafeReturnPath(
  candidate: FormDataEntryValue | null | undefined,
  locale: Locale,
): `/${Locale}/app${string}` {
  const fallback = `/${locale}/app` as const;

  if (typeof candidate !== "string") {
    return fallback;
  }

  const prefix = `/${locale}/app`;
  const isApplicationPath =
    candidate === prefix ||
    candidate.startsWith(`${prefix}/`) ||
    candidate.startsWith(`${prefix}?`);

  if (
    !isApplicationPath ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    /[\r\n]/u.test(candidate)
  ) {
    return fallback;
  }

  return candidate as `/${Locale}/app${string}`;
}

function firstIssueCode(
  issues: z.core.$ZodIssue[],
  field: SignInField,
): SignInErrorCode | undefined {
  const issue = issues.find((candidate) => candidate.path[0] === field);
  return issue?.message as SignInErrorCode | undefined;
}

export async function authenticateWithPassword(
  gateway: PasswordAuthGateway,
  formData: FormData,
): Promise<
  | { ok: true; redirectTo: string }
  | { ok: false; state: SignInState }
> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    locale: formData.get("locale"),
    returnTo: formData.get("returnTo") ?? undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      state: {
        fieldErrors: {
          email: firstIssueCode(parsed.error.issues, "email"),
          password: firstIssueCode(parsed.error.issues, "password"),
        },
      },
    };
  }

  try {
    const { error } = await gateway.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      return { ok: false, state: { error: "credentialsInvalid" } };
    }

    return {
      ok: true,
      redirectTo: getSafeReturnPath(parsed.data.returnTo, parsed.data.locale),
    };
  } catch {
    return { ok: false, state: { error: "unexpected" } };
  }
}
