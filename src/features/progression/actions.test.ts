import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createServerSupabaseClient: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
  resolveApplicationContext: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: mocks.createServerSupabaseClient }));
vi.mock("@/server/application-context", () => ({ resolveApplicationContext: mocks.resolveApplicationContext }));

import { createOutcomeAction } from "./actions";
import { initialProgressionState } from "./contracts";

const courseId = "11111111-1111-4111-8111-111111111111";
const admin = { status: "ready", context: { role: "ADMIN", school: { id: "school", name: "School" }, userId: "admin" } };

function validForm() {
  const data = new FormData();
  data.set("courseId", courseId);
  data.set("code", "SYN-FRA-COMP-01");
  data.set("title", "Compréhension synthétique");
  data.set("description", "");
  return data;
}

function client(existing: { id: string } | null, rpcError: { code: string; message: string } | null = null, laterExisting?: { id: string } | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: existing, error: null });
  if (laterExisting !== undefined) maybeSingle.mockResolvedValueOnce({ data: existing, error: null }).mockResolvedValueOnce({ data: laterExisting, error: null });
  const query = { select: vi.fn(), eq: vi.fn(), maybeSingle };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  return { from: vi.fn(() => query), rpc: vi.fn().mockResolvedValue({ data: null, error: rpcError }) };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.resolveApplicationContext.mockResolvedValue(admin);
});

describe("createOutcomeAction", () => {
  it("creates through the protected RPC then redirects to a canonical confirmed GET", async () => {
    const supabase = client(null);
    mocks.createServerSupabaseClient.mockResolvedValue(supabase);
    await createOutcomeAction("fr", initialProgressionState, validForm());
    expect(supabase.rpc).toHaveBeenCalledWith("create_learning_outcome", expect.objectContaining({ target_course_id: courseId, outcome_code: "SYN-FRA-COMP-01" }));
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/fr/app/progression");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/tr/app/progression");
    expect(mocks.redirect).toHaveBeenCalledWith("/fr/app/progression?created=1");
  });

  it("rejects a known duplicate without invoking the RPC", async () => {
    const supabase = client({ id: "existing" });
    mocks.createServerSupabaseClient.mockResolvedValue(supabase);
    await expect(createOutcomeAction("tr", initialProgressionState, validForm())).resolves.toEqual({ status: "error", message: "duplicateOutcome" });
    expect(supabase.rpc).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("enforces ADMIN authorization in the action", async () => {
    mocks.resolveApplicationContext.mockResolvedValue({ ...admin, context: { ...admin.context, role: "TEACHER" } });
    await expect(createOutcomeAction("fr", initialProgressionState, validForm())).resolves.toEqual({ status: "error", message: "accessDenied" });
    expect(mocks.createServerSupabaseClient).not.toHaveBeenCalled();
  });

  it("never exposes a raw provider error", async () => {
    const supabase = client(null, { code: "P0001", message: "private provider detail" });
    mocks.createServerSupabaseClient.mockResolvedValue(supabase);
    await expect(createOutcomeAction("fr", initialProgressionState, validForm())).resolves.toEqual({ status: "error", message: "unexpected" });
  });

  it("distinguishes a duplicate race from another rejected input without leaking details", async () => {
    const raced = client(null, { code: "22023", message: "private duplicate detail" }, { id: "created-concurrently" });
    mocks.createServerSupabaseClient.mockResolvedValue(raced);
    await expect(createOutcomeAction("fr", initialProgressionState, validForm())).resolves.toEqual({ status: "error", message: "duplicateOutcome" });

    const invalid = client(null, { code: "22023", message: "private validation detail" }, null);
    mocks.createServerSupabaseClient.mockResolvedValue(invalid);
    await expect(createOutcomeAction("fr", initialProgressionState, validForm())).resolves.toEqual({ status: "error", message: "invalidFields" });
  });
});
