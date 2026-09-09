import { z } from "zod";

export type StructureField = "name" | "schoolYearId" | "code" | "courseId" | "weeklyPeriods";
export type StructureMessage =
  | "accessDenied" | "classCreated" | "classUpdated" | "connectionCreated" | "connectionUpdated"
  | "courseCreated" | "courseUpdated" | "duplicateClass" | "duplicateCode" | "duplicateConnection"
  | "duplicateCourse" | "inactiveClass" | "inactiveCourse" | "inactiveYear" | "invalidCode"
  | "invalidId" | "invalidName" | "invalidPeriods" | "nameRequired" | "nameTooLong"
  | "notFound" | "unexpected" | "unexpectedFields" | "yearRequired";
export type StructureActionState = Readonly<{
  status: "idle" | "error" | "success";
  message?: StructureMessage;
  fieldErrors?: Partial<Record<StructureField, StructureMessage>>;
}>;
export const initialStructureActionState: StructureActionState = { status: "idle" };

const controlCharacters = /[\u0000-\u001F\u007F]/u;
const nameSchema = z.string().trim().min(1, "nameRequired").max(120, "nameTooLong").refine((value) => !controlCharacters.test(value), "invalidName");
const idSchema = z.string().uuid("invalidId");
const yearSchema = z.preprocess((value) => value === null ? "" : value, z.string().min(1, "yearRequired").uuid("invalidId"));
const codeSchema = z.string().max(30, "invalidCode").refine((value) => value === value.trim() && !controlCharacters.test(value), "invalidCode");

function parse<T extends z.ZodRawShape>(schema: z.ZodObject<T>, formData: FormData, allowed: readonly StructureField[]):
  | Readonly<{ ok: true; data: z.output<typeof schema> }>
  | Readonly<{ ok: false; state: StructureActionState }> {
  const allowedSet = new Set<string>(allowed);
  if ([...formData.keys()].some((key) => !key.startsWith("$ACTION_") && !allowedSet.has(key)) || allowed.some((key) => formData.getAll(key).length > 1)) {
    return { ok: false, state: { status: "error", message: "unexpectedFields" } };
  }
  const values = Object.fromEntries(allowed.map((field) => [field, formData.get(field)]));
  const result = schema.safeParse(values);
  if (result.success) return { ok: true, data: result.data };
  const fieldErrors: Partial<Record<StructureField, StructureMessage>> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && allowedSet.has(field)) fieldErrors[field as StructureField] ??= issue.message as StructureMessage;
  }
  return { ok: false, state: { status: "error", fieldErrors } };
}

export function parseClassCreate(formData: FormData) {
  return parse(z.object({ name: nameSchema, schoolYearId: yearSchema }), formData, ["name", "schoolYearId"]);
}
export function parseNameEdit(formData: FormData) {
  return parse(z.object({ name: nameSchema }), formData, ["name"]);
}
export function parseCourse(formData: FormData) {
  const parsed = parse(z.object({ name: nameSchema, code: codeSchema }), formData, ["name", "code"]);
  if (!parsed.ok) return parsed;
  return { ok: true as const, data: { name: parsed.data.name, code: parsed.data.code || null } };
}
export function parseConnectionCreate(formData: FormData) {
  return parse(z.object({ courseId: idSchema, weeklyPeriods: z.coerce.number().int("invalidPeriods").min(1, "invalidPeriods").max(40, "invalidPeriods") }), formData, ["courseId", "weeklyPeriods"]);
}
export function parsePeriodsEdit(formData: FormData) {
  return parse(z.object({ weeklyPeriods: z.coerce.number().int("invalidPeriods").min(1, "invalidPeriods").max(40, "invalidPeriods") }), formData, ["weeklyPeriods"]);
}
export function validId(value: string): boolean { return idSchema.safeParse(value).success; }

export function mapStructureError(error: unknown, duplicate: StructureMessage): StructureMessage {
  if (!error || typeof error !== "object") return "unexpected";
  const candidate = error as { code?: unknown };
  if (candidate.code === "23505") return duplicate;
  if (candidate.code === "23503") return "notFound";
  if (candidate.code === "42501") return "accessDenied";
  return "unexpected";
}
