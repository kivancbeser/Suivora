import {z} from "zod";
export type ProgressionMessage="accessDenied"|"invalidFields"|"created"|"updated"|"unexpected";
export type ProgressionActionState=Readonly<{status:"idle"|"success"|"error";message?:ProgressionMessage}>;
export const initialProgressionState:ProgressionActionState={status:"idle"};
const clean=(max:number)=>z.string().trim().min(1).max(max).refine(v=>!/[\u0000-\u001f\u007f]/u.test(v));
export function parseOutcomeForm(data:FormData){const allowed=["courseId","code","title","description"];if([...data.keys()].some(k=>!k.startsWith("$ACTION_")&&!allowed.includes(k)))return{ok:false as const};const result=z.object({courseId:z.string().uuid(),code:z.string().trim().min(1).max(40).regex(/^[\p{L}\p{N}_.-]+$/u),title:clean(240),description:z.string().trim().max(4000)}).safeParse({courseId:data.get("courseId"),code:data.get("code"),title:data.get("title"),description:data.get("description")??""});return result.success?{ok:true as const,data:result.data}:{ok:false as const};}
