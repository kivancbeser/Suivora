import { z } from "zod";

export type StudentField = "firstName" | "lastName" | "studentCode" | "classId" | "startsOn" | "transferDate" | "endDate" | "confirmation";
export type StudentMessage = "accessDenied" | "classUnavailable" | "closeComplete" | "confirmationRequired" | "duplicateCode" | "enrollmentUnavailable" | "invalidCode" | "invalidDate" | "invalidId" | "invalidName" | "nameRequired" | "nameTooLong" | "studentCreated" | "studentUnavailable" | "studentUpdated" | "transferComplete" | "unexpected" | "unexpectedFields";
export type StudentActionState = Readonly<{ status: "idle" | "error" | "success"; message?: StudentMessage; fieldErrors?: Partial<Record<StudentField, StudentMessage>> }>;
export const initialStudentActionState: StudentActionState = { status: "idle" };

const control = /[\u0000-\u001F\u007F]/u;
const name = z.string().trim().min(1,"nameRequired").max(100,"nameTooLong").refine((value)=>!control.test(value),"invalidName");
const code = z.string().trim().max(50,"invalidCode").refine((value)=>!control.test(value),"invalidCode");
const id = z.string().uuid("invalidId");
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/u,"invalidDate").refine((value)=>!Number.isNaN(Date.parse(`${value}T00:00:00Z`)),"invalidDate");

function parse<T extends z.ZodRawShape>(schema:z.ZodObject<T>,formData:FormData,allowed:readonly StudentField[]):Readonly<{ok:true;data:z.output<typeof schema>}>|Readonly<{ok:false;state:StudentActionState}>{
  const allowedSet=new Set<string>(allowed);
  if([...formData.keys()].some((key)=>!key.startsWith("$ACTION_")&&!allowedSet.has(key))||allowed.some((key)=>formData.getAll(key).length>1)) return {ok:false,state:{status:"error",message:"unexpectedFields"}};
  const result=schema.safeParse(Object.fromEntries(allowed.map((field)=>[field,formData.get(field)])));
  if(result.success)return {ok:true,data:result.data};
  const fieldErrors:Partial<Record<StudentField,StudentMessage>>={};
  for(const issue of result.error.issues){const field=issue.path[0];if(typeof field==="string"&&allowedSet.has(field))fieldErrors[field as StudentField]??=issue.message as StudentMessage;}
  return {ok:false,state:{status:"error",fieldErrors}};
}

export function parseCreateStudent(formData:FormData){return parse(z.object({firstName:name,lastName:name,studentCode:code,classId:id,startsOn:date}),formData,["firstName","lastName","studentCode","classId","startsOn"]);}
export function parseUpdateStudent(formData:FormData){return parse(z.object({firstName:name,lastName:name,studentCode:code}),formData,["firstName","lastName","studentCode"]);}
export function parseTransferStudent(formData:FormData){return parse(z.object({classId:id,transferDate:date,confirmation:z.literal("on",{error:"confirmationRequired"})}),formData,["classId","transferDate","confirmation"]);}
export function parseCloseEnrollment(formData:FormData){return parse(z.object({endDate:date,confirmation:z.literal("on",{error:"confirmationRequired"})}),formData,["endDate","confirmation"]);}
export function validStudentId(value:string){return id.safeParse(value).success;}
export function mapStudentError(error:unknown):StudentMessage{if(!error||typeof error!=="object")return "unexpected";const code=(error as {code?:unknown}).code;if(code==="42501")return "accessDenied";if(code==="23505")return "duplicateCode";if(code==="22023")return "invalidDate";if(code==="P0001")return "studentUnavailable";return "unexpected";}

