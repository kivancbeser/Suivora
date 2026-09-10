import { z } from "zod";
import { isLocale, type Locale } from "@/i18n/routing";

export const signUpSchema = z
  .object({
    displayName: z.string().trim().min(1, "displayNameRequired").max(120, "displayNameTooLong"),
    email: z
      .string()
      .trim()
      .min(1, "emailRequired")
      .email("emailInvalid")
      .transform((email) => email.toLowerCase()),
    password: z.string().min(6, "passwordTooShort"),
    passwordConfirmation: z.string().min(1, "passwordConfirmationRequired"),
    locale: z.string().refine(isLocale),
  })
  .refine((value) => value.password === value.passwordConfirmation, {
    message: "passwordMismatch",
    path: ["passwordConfirmation"],
  });

export type SignUpField =
  | "displayName"
  | "email"
  | "password"
  | "passwordConfirmation";
export type SignUpErrorCode =
  | "displayNameRequired"
  | "displayNameTooLong"
  | "emailRequired"
  | "emailInvalid"
  | "passwordTooShort"
  | "passwordConfirmationRequired"
  | "passwordMismatch"
  | "accountAlreadyExists"
  | "signupUnavailable"
  | "unexpected";

export type SignUpState = Readonly<{
  error?: Extract<SignUpErrorCode, "accountAlreadyExists" | "signupUnavailable" | "unexpected">;
  fieldErrors?: Partial<Record<SignUpField, SignUpErrorCode>>;
}>;

type AuthAdminGateway = Readonly<{
  createUser(input: Readonly<{
    email: string;
    password: string;
    email_confirm: true;
    user_metadata: Readonly<{ suivora_test_signup: true }>;
  }>): Promise<Readonly<{ data: { user: { id: string } | null }; error: unknown | null }>>;
  deleteUser(userId: string): Promise<unknown>;
}>;

type SignUpUserGateway = Readonly<{
  signInWithPassword(credentials: Readonly<{ email: string; password: string }>): Promise<{ error: unknown | null }>;
  claimTeacherProfile(displayName: string): Promise<{ error: unknown | null }>;
  signOut(): Promise<unknown>;
}>;

function firstIssueCode(
  issues: z.core.$ZodIssue[],
  field: SignUpField,
): SignUpErrorCode | undefined {
  return issues.find((issue) => issue.path[0] === field)?.message as SignUpErrorCode | undefined;
}

function isExistingAccountError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error.code === "email_exists" || error.code === "user_already_exists"),
  );
}

async function compensateCreatedUser(
  admin: AuthAdminGateway,
  user: SignUpUserGateway,
  userId: string,
): Promise<void> {
  await Promise.allSettled([user.signOut(), admin.deleteUser(userId)]);
}

export async function registerTestTeacher(
  gateways: Readonly<{ admin: AuthAdminGateway; user: SignUpUserGateway }>,
  formData: FormData,
): Promise<
  | { ok: true; redirectTo: `/${Locale}/app` }
  | { ok: false; state: SignUpState }
> {
  const parsed = signUpSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
    locale: formData.get("locale"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      state: {
        fieldErrors: {
          displayName: firstIssueCode(parsed.error.issues, "displayName"),
          email: firstIssueCode(parsed.error.issues, "email"),
          password: firstIssueCode(parsed.error.issues, "password"),
          passwordConfirmation: firstIssueCode(parsed.error.issues, "passwordConfirmation"),
        },
      },
    };
  }

  let createdUserId: string | undefined;

  try {
    const created = await gateways.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: { suivora_test_signup: true },
    });

    if (created.error || !created.data.user) {
      return {
        ok: false,
        state: { error: isExistingAccountError(created.error) ? "accountAlreadyExists" : "signupUnavailable" },
      };
    }

    const userId = created.data.user.id;
    createdUserId = userId;
    const signedIn = await gateways.user.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (signedIn.error) {
      await compensateCreatedUser(gateways.admin, gateways.user, userId);
      return { ok: false, state: { error: "signupUnavailable" } };
    }

    const claimed = await gateways.user.claimTeacherProfile(parsed.data.displayName);

    if (claimed.error) {
      await compensateCreatedUser(gateways.admin, gateways.user, userId);
      return { ok: false, state: { error: "signupUnavailable" } };
    }

    return { ok: true, redirectTo: `/${parsed.data.locale}/app` };
  } catch {
    if (createdUserId) {
      await compensateCreatedUser(gateways.admin, gateways.user, createdUserId);
    }
    return { ok: false, state: { error: "unexpected" } };
  }
}
