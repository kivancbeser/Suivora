import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("privileged import boundary", () => {
  it("keeps the privileged client out of client components and browser factories", () => {
    const root = process.cwd();
    for (const file of [
      "src/features/teachers/teacher-forms.tsx",
      "src/features/teachers/password-form.tsx",
      "src/lib/supabase/browser.ts",
    ]) {
      expect(readFileSync(join(root, file), "utf8")).not.toContain("supabase/privileged");
      expect(readFileSync(join(root, file), "utf8")).not.toContain("SUPABASE_SECRET_KEY");
    }
    expect(readFileSync(join(root, "src/lib/supabase/privileged.ts"), "utf8")).toContain('import "server-only"');
  });
});
