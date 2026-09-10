"use server";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveApplicationContext } from "@/server/application-context";
import { parseQuizForm, parseScoreForm, type GradingActionState } from "./contracts";

function refresh(id:string){for(const locale of ["fr","tr"] as const){revalidatePath(`/${locale}/app/quiz-et-notes`);revalidatePath(`/${locale}/app/quiz-et-notes/${id}`);}}
async function context(){const access=await resolveApplicationContext();if(access.status!=="ready")return null;try{return{supabase:await createServerSupabaseClient()};}catch{return null;}}
function failure(error:{code?:string}|null,fallback:GradingActionState["message"]="unexpected"):GradingActionState{if(error?.code==="23505")return{status:"error",message:"duplicateQuiz"};if(error?.code==="22023"||error?.code==="23514")return{status:"error",message:"invalidFields"};if(error?.code==="42501")return{status:"error",message:"accessDenied"};return{status:"error",message:fallback};}

export async function createQuizAction(classCourseId:string,_:GradingActionState,formData:FormData):Promise<GradingActionState>{
  const parsed=parseQuizForm(formData);if(!parsed.ok)return{status:"error",message:parsed.message};const ctx=await context();if(!ctx)return{status:"error",message:"accessDenied"};
  try{const result=await ctx.supabase.rpc("create_quiz",{target_class_course_id:classCourseId,target_term_id:parsed.data.termId,target_slot:parsed.data.slot,quiz_title:parsed.data.title,target_quiz_date:parsed.data.quizDate});if(result.error)return failure(result.error);refresh(classCourseId);return{status:"success",message:"quizCreated"};}catch{return{status:"error",message:"unexpected"};}
}
export async function updateQuizAction(classCourseId:string,quizId:string,_:GradingActionState,formData:FormData):Promise<GradingActionState>{
  const parsed=parseQuizForm(formData);if(!parsed.ok)return{status:"error",message:parsed.message};const ctx=await context();if(!ctx)return{status:"error",message:"accessDenied"};
  try{const result=await ctx.supabase.rpc("update_quiz",{target_quiz_id:quizId,quiz_title:parsed.data.title,target_quiz_date:parsed.data.quizDate,quiz_is_active:parsed.data.isActive});if(result.error)return failure(result.error);refresh(classCourseId);return{status:"success",message:"quizUpdated"};}catch{return{status:"error",message:"unexpected"};}
}
export async function saveScoresAction(classCourseId:string,quizId:string,_:GradingActionState,formData:FormData):Promise<GradingActionState>{
  const ctx=await context();if(!ctx)return{status:"error",message:"accessDenied"};
  try{const quiz=await ctx.supabase.from("quizzes").select("id, quiz_date, class_courses!quizzes_class_course_school_fk(class_id)").eq("id",quizId).eq("class_course_id",classCourseId).maybeSingle();if(quiz.error||!quiz.data)return{status:"error",message:"unavailable"};
    const roster=await ctx.supabase.from("enrollments").select("student_id").eq("class_id",quiz.data.class_courses.class_id).lte("starts_on",quiz.data.quiz_date).or(`ends_on.is.null,ends_on.gte.${quiz.data.quiz_date}`).order("created_at");if(roster.error||!roster.data)return{status:"error",message:"unavailable"};
    const parsed=parseScoreForm(formData,roster.data.length);if(!parsed.ok)return{status:"error",message:parsed.message};const entered=parsed.values.map((score,index)=>({score,index})).filter((item):item is {score:number;index:number}=>item.score!==null);
    const result=await ctx.supabase.rpc("save_quiz_scores",{target_quiz_id:quizId,target_student_ids:entered.map(item=>roster.data[item.index]!.student_id),entered_scores:entered.map(item=>item.score)});if(result.error)return failure(result.error,"invalidScore");refresh(classCourseId);return{status:"success",message:"scoresSaved"};
  }catch{return{status:"error",message:"unexpected"};}
}
