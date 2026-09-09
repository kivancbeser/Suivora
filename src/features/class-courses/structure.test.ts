import { describe, expect, it } from "vitest";
import { mapStructureError, parseClassCreate, parseConnectionCreate, parseCourse, parseNameEdit, parsePeriodsEdit, validId } from "./structure";

const id = "11111111-1111-4111-8111-111111111111";
function form(values: Record<string,string>) { const data=new FormData(); Object.entries(values).forEach(([key,value])=>data.set(key,value)); return data; }
describe("academic structure validation",()=>{
  it("trims valid class names",()=>expect(parseClassCreate(form({name:"  Prépa A  ",schoolYearId:id}))).toMatchObject({ok:true,data:{name:"Prépa A",schoolYearId:id}}));
  it("requires a name",()=>expect(parseNameEdit(form({name:"  "}))).toMatchObject({ok:false,state:{fieldErrors:{name:"nameRequired"}}}));
  it("rejects overlong names",()=>expect(parseNameEdit(form({name:"x".repeat(121)}))).toMatchObject({ok:false,state:{fieldErrors:{name:"nameTooLong"}}}));
  it("rejects control characters",()=>expect(parseNameEdit(form({name:"Class\u0001"}))).toMatchObject({ok:false,state:{fieldErrors:{name:"invalidName"}}}));
  it("requires a school year",()=>expect(parseClassCreate(form({name:"Class"}))).toMatchObject({ok:false,state:{fieldErrors:{schoolYearId:"yearRequired"}}}));
  it("rejects invalid school year ids",()=>expect(parseClassCreate(form({name:"Class",schoolYearId:"bad"}))).toMatchObject({ok:false,state:{fieldErrors:{schoolYearId:"invalidId"}}}));
  it("rejects school injection",()=>expect(parseClassCreate(form({name:"Class",schoolYearId:id,school_id:id}))).toMatchObject({ok:false,state:{message:"unexpectedFields"}}));
  it("accepts and trims course names",()=>expect(parseCourse(form({name:"  Français ",code:"FR"}))).toMatchObject({ok:true,data:{name:"Français",code:"FR"}}));
  it("normalizes empty codes to null",()=>expect(parseCourse(form({name:"Maths",code:""}))).toMatchObject({ok:true,data:{code:null}}));
  it("rejects untrimmed codes",()=>expect(parseCourse(form({name:"Maths",code:" M"}))).toMatchObject({ok:false,state:{fieldErrors:{code:"invalidCode"}}}));
  it("rejects long codes",()=>expect(parseCourse(form({name:"Maths",code:"x".repeat(31)}))).toMatchObject({ok:false,state:{fieldErrors:{code:"invalidCode"}}}));
  it("rejects active-state manipulation",()=>expect(parseCourse(form({name:"Maths",code:"",is_active:"false"}))).toMatchObject({ok:false,state:{message:"unexpectedFields"}}));
  it.each(["1","40"])("accepts weekly boundary %s",value=>expect(parseConnectionCreate(form({courseId:id,weeklyPeriods:value}))).toMatchObject({ok:true}));
  it.each(["0","-1","1.5","41"])("rejects invalid periods %s",value=>expect(parsePeriodsEdit(form({weeklyPeriods:value}))).toMatchObject({ok:false,state:{fieldErrors:{weeklyPeriods:"invalidPeriods"}}}));
  it("rejects relationship reassignment fields",()=>expect(parsePeriodsEdit(form({weeklyPeriods:"2",courseId:id}))).toMatchObject({ok:false,state:{message:"unexpectedFields"}}));
  it("validates route identifiers",()=>{expect(validId(id)).toBe(true);expect(validId("not-an-id")).toBe(false)});
  it("maps conflicts without exposing constraint text",()=>expect(mapStructureError({code:"23505",message:"secret constraint"},"duplicateClass")).toBe("duplicateClass"));
  it("maps inaccessible references safely",()=>expect(mapStructureError({code:"23503"},"duplicateClass")).toBe("notFound"));
});
