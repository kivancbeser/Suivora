import { z } from "zod";

export const quizSlots = ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8"] as const;
export type QuizSlot = (typeof quizSlots)[number];
export type GradingMessage =
  | "accessDenied" | "invalidFields" | "invalidTitle" | "invalidDate"
  | "invalidScore" | "duplicateQuiz" | "unavailable" | "unexpected"
  | "quizCreated" | "quizUpdated" | "scoresSaved";
export type GradingActionState = Readonly<{
  status: "idle" | "success" | "error";
  message?: GradingMessage;
}>;
export const initialGradingActionState: GradingActionState = { status: "idle" };

const id = z.string().uuid();
const title = z.string().trim().min(1).max(160).refine((value) => !/[\u0000-\u001f\u007f]/u.test(value));
const date = z.iso.date();

function exact(formData: FormData, allowed: readonly string[]): boolean {
  return [...formData.keys()].filter((key) => !key.startsWith("$ACTION_")).every((key) => allowed.includes(key));
}

export function parseQuizForm(formData: FormData) {
  const allowed = ["termId", "slot", "title", "quizDate", "isActive"];
  if (!exact(formData, allowed)) return { ok: false as const, message: "invalidFields" as const };
  const result = z.object({ termId: id, slot: z.enum(quizSlots), title, quizDate: date }).safeParse({
    termId: formData.get("termId"), slot: formData.get("slot"),
    title: formData.get("title"), quizDate: formData.get("quizDate"),
  });
  if (!result.success) {
    const field = result.error.issues[0]?.path[0];
    return { ok: false as const, message: field === "title" ? "invalidTitle" as const : field === "quizDate" ? "invalidDate" as const : "invalidFields" as const };
  }
  return { ok: true as const, data: { ...result.data, isActive: !formData.has("isActive") || formData.getAll("isActive").includes("true") } };
}

export function parseScoreForm(formData: FormData, studentCount: number) {
  const allowed = Array.from({ length: studentCount }, (_, index) => `score-${index}`);
  if (!exact(formData, allowed)) return { ok: false as const, message: "invalidFields" as const };
  const values: (number | null)[] = [];
  for (const key of allowed) {
    const raw = formData.get(key);
    if (typeof raw !== "string") return { ok: false as const, message: "invalidFields" as const };
    if (raw.trim() === "") { values.push(null); continue; }
    if (!/^\d{1,3}(?:[.,]\d{1,2})?$/u.test(raw.trim())) return { ok: false as const, message: "invalidScore" as const };
    const value = Number(raw.replace(",", "."));
    if (value < 0 || value > 100) return { ok: false as const, message: "invalidScore" as const };
    values.push(value);
  }
  return { ok: true as const, values };
}
