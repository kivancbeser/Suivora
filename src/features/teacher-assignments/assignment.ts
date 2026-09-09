import { z } from "zod";

export type AssignmentField="teacherId"|"weeklyPeriods"|"confirmation";
export type AssignmentMessage="accessDenied"|"assignmentCreated"|"assignmentUpdated"|"capacityExceeded"|"confirmationRequired"|"duplicateAssignment"|"invalidId"|"invalidPeriods"|"targetUnavailable"|"unexpected"|"unexpectedFields";
export type AssignmentActionState=Readonly<{status:"idle"|"error"|"success";message?:AssignmentMessage;fieldErrors?:Partial<Record<AssignmentField,AssignmentMessage>>}>;
export const initialAssignmentActionState:AssignmentActionState={status:"idle"};
const id=z.string().uuid("invalidId");
const periods=z.coerce.number({error:"invalidPeriods"}).int("invalidPeriods").min(1,"invalidPeriods").max(40,"invalidPeriods");
function parse<T extends z.ZodRawShape>(schema:z.ZodObject<T>,data:FormData,allowed:readonly AssignmentField[]){const set=new Set<string>(allowed);if([...data.keys()].some(k=>!k.startsWith("$ACTION_")&&!set.has(k))||allowed.some(k=>data.getAll(k).length>1))return{ok:false as const,state:{status:"error" as const,message:"unexpectedFields" as const}};const result=schema.safeParse(Object.fromEntries(allowed.map(k=>[k,data.get(k)])));if(result.success)return{ok:true as const,data:result.data};const fieldErrors:Partial<Record<AssignmentField,AssignmentMessage>>={};for(const issue of result.error.issues){const field=issue.path[0];if(typeof field==="string"&&set.has(field))fieldErrors[field as AssignmentField]??=issue.message as AssignmentMessage;}return{ok:false as const,state:{status:"error" as const,fieldErrors}};}
export function parseCreateAssignment(data:FormData){return parse(z.object({teacherId:id,weeklyPeriods:periods}),data,["teacherId","weeklyPeriods"]);}
export function parseUpdateAssignment(data:FormData,active:boolean){return parse(z.object({weeklyPeriods:periods,...(!active?{confirmation:z.literal("on",{error:"confirmationRequired"})}:{})}),data,active?["weeklyPeriods"]:["weeklyPeriods","confirmation"]);}
export function validAssignmentId(value:string){return id.safeParse(value).success;}
export function mapAssignmentError(error:unknown):AssignmentMessage{if(!error||typeof error!=="object")return"unexpected";const value=error as{code?:unknown;message?:unknown};if(value.code==="42501")return"accessDenied";if(value.code==="23505")return"duplicateAssignment";if(value.code==="P0001")return"targetUnavailable";if(value.code==="22023"&&typeof value.message==="string"&&value.message.includes("capacity"))return"capacityExceeded";if(value.code==="22023")return"targetUnavailable";return"unexpected";}
