import { z } from "zod";

const displayName = z.string().trim().min(1, "displayNameRequired").max(120, "displayNameTooLong")
  .refine((value) => !/[\u0000-\u001F\u007F]/u.test(value), "displayNameInvalid");

const email = z.string().trim().min(1, "emailRequired").max(254, "emailTooLong")
  .email("emailInvalid").transform((value) => value.toLowerCase());

const exactForm = <T extends z.ZodRawShape>(shape: T) => z.strictObject(shape);

export const invitationSchema = exactForm({ displayName, email });
export const testTeacherSchema = exactForm({
  displayName,
  email,
  password: z.string().min(12, "passwordTooShort").max(1024, "passwordTooLong"),
  confirmation: z.string().max(1024, "passwordTooLong"),
}).superRefine((value, context) => {
  if (value.password !== value.confirmation) {
    context.addIssue({ code: "custom", path: ["confirmation"], message: "passwordMismatch" });
  }
});
export const teacherUpdateSchema = exactForm({
  teacherId: z.string().uuid("notFound"),
  displayName,
  active: z.enum(["true", "false"]).transform((value) => value === "true"),
  confirmation: z.enum(["confirmed"]).optional(),
}).superRefine((value, context) => {
  if (!value.active && value.confirmation !== "confirmed") {
    context.addIssue({ code: "custom", path: ["confirmation"], message: "confirmationRequired" });
  }
});

export const passwordSchema = exactForm({
  password: z.string().min(12, "passwordTooShort").max(1024, "passwordTooLong"),
  confirmation: z.string().max(1024, "passwordTooLong"),
}).superRefine((value, context) => {
  if (value.password !== value.confirmation) {
    context.addIssue({ code: "custom", path: ["confirmation"], message: "passwordMismatch" });
  }
});

export type TeacherField = "displayName" | "email" | "confirmation" | "password";
export type TeacherResultCode =
  | "accessDenied" | "configurationUnavailable" | "displayNameInvalid" | "displayNameRequired"
  | "displayNameTooLong" | "emailInvalid" | "emailRequired" | "emailTooLong"
  | "invitationFailed" | "invitationSent" | "manualIntervention" | "notFound"
  | "profileUpdated" | "retryableFailure" | "unexpectedFields" | "unexpected"
  | "confirmationRequired" | "passwordMismatch" | "passwordTooLong" | "passwordTooShort"
  | "testUserCreated" | "userAlreadyExists";

export type TeacherActionState = Readonly<{
  status: "idle" | "success" | "error";
  message?: TeacherResultCode;
  fieldErrors?: Partial<Record<TeacherField, TeacherResultCode>>;
}>;

export const initialTeacherActionState: TeacherActionState = { status: "idle" };

export function parseForm<T>(schema: z.ZodType<T>, formData: FormData):
  | Readonly<{ ok: true; data: T }>
  | Readonly<{ ok: false; state: TeacherActionState }> {
  const supplied = Object.fromEntries(formData.entries());
  const result = schema.safeParse(supplied);
  if (result.success) return { ok: true, data: result.data };
  const fieldErrors: Partial<Record<TeacherField, TeacherResultCode>> = {};
  let message: TeacherResultCode | undefined;
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (field === "displayName" || field === "email" || field === "confirmation" || field === "password") {
      fieldErrors[field] ??= issue.message as TeacherResultCode;
    } else {
      message = "unexpectedFields";
    }
  }
  return { ok: false, state: { status: "error", message, fieldErrors } };
}

export function isDuplicateInvitationError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const status = "status" in error ? error.status : undefined;
  const code = "code" in error ? error.code : undefined;
  return status === 422 || code === "email_exists" || code === "user_already_exists";
}
