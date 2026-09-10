import { describe, expect, it } from "vitest";
import { parseQuizForm, parseScoreForm } from "./contracts";

describe("grading form contracts", () => {
  it("rejects hidden-field injection", () => {
    const form = new FormData(); form.set("termId","00000000-0000-4000-8000-000000000001"); form.set("slot","C1"); form.set("title","Quiz"); form.set("quizDate","2040-10-01"); form.set("schoolId","injected");
    expect(parseQuizForm(form)).toEqual({ ok: false, message: "invalidFields" });
  });
  it("accepts zero and distinguishes a missing score", () => {
    const form = new FormData(); form.set("score-0","0"); form.set("score-1","");
    expect(parseScoreForm(form,2)).toEqual({ ok:true, values:[0,null] });
  });
  it("accepts localized decimal input and rejects excess precision", () => {
    const valid = new FormData(); valid.set("score-0","84,99");
    expect(parseScoreForm(valid,1)).toEqual({ok:true,values:[84.99]});
    const invalid = new FormData(); invalid.set("score-0","84.999");
    expect(parseScoreForm(invalid,1)).toEqual({ok:false,message:"invalidScore"});
  });
});
