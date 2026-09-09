import { describe,expect,it } from "vitest";
import { mapStudentError,parseCloseEnrollment,parseCreateStudent,parseTransferStudent,parseUpdateStudent,validStudentId } from "./student-workflows";
function form(entries:Record<string,string>){const data=new FormData();for(const[key,value]of Object.entries(entries))data.set(key,value);return data;}
describe("student workflow validation",()=>{
  it("normalizes valid identity input",()=>{const result=parseCreateStudent(form({firstName:" Ada ",lastName:" Martin ",studentCode:" A-1 ",classId:"11111111-1111-4111-8111-111111111111",startsOn:"2026-09-14"}));expect(result).toMatchObject({ok:true,data:{firstName:"Ada",lastName:"Martin",studentCode:"A-1"}});});
  it("rejects unexpected tenant authority",()=>{expect(parseCreateStudent(form({firstName:"Ada",lastName:"Martin",studentCode:"",classId:"11111111-1111-4111-8111-111111111111",startsOn:"2026-09-14",schoolId:"foreign"}))).toMatchObject({ok:false,state:{message:"unexpectedFields"}});});
  it("rejects invalid names, codes, identifiers and dates",()=>{expect(parseCreateStudent(form({firstName:" ",lastName:"Martin",studentCode:"",classId:"bad",startsOn:"tomorrow"}))).toMatchObject({ok:false});expect(parseUpdateStudent(form({firstName:"Ada",lastName:"Martin",studentCode:"x".repeat(51)}))).toMatchObject({ok:false});});
  it("requires explicit transfer confirmation",()=>{expect(parseTransferStudent(form({classId:"11111111-1111-4111-8111-111111111111",transferDate:"2026-10-01",confirmation:""}))).toMatchObject({ok:false,state:{fieldErrors:{confirmation:"confirmationRequired"}}});});
  it("accepts confirmed transfer and close dates",()=>{expect(parseTransferStudent(form({classId:"11111111-1111-4111-8111-111111111111",transferDate:"2026-10-01",confirmation:"on"}))).toMatchObject({ok:true});expect(parseCloseEnrollment(form({endDate:"2026-10-01",confirmation:"on"}))).toMatchObject({ok:true});});
  it("validates opaque route identifiers",()=>{expect(validStudentId("11111111-1111-4111-8111-111111111111")).toBe(true);expect(validStudentId("visible-name")).toBe(false);});
  it("maps provider failures to stable codes only",()=>{expect(mapStudentError({code:"42501",message:"sensitive"})).toBe("accessDenied");expect(mapStudentError({code:"P0001",message:"foreign"})).toBe("studentUnavailable");expect(mapStudentError(new Error("raw"))).toBe("unexpected");});
});

