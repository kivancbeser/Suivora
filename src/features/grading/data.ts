import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveApplicationContext } from "@/server/application-context";
import { calculateSemesterSuggestion, getPerformanceBand } from "./calculations";
import type { QuizSlot } from "./contracts";

export type GradingClass = Readonly<{id:string;className:string;courseName:string;courseCode:string|null;schoolYear:string}>;
export type GradingTerm = Readonly<{id:string;semesterNumber:1|2;startDate:string;endDate:string}>;
export type GradingQuiz = Readonly<{id:string;termId:string;slot:QuizSlot;title:string;quizDate:string;isActive:boolean}>;
export type GradingStudent = Readonly<{id:string;name:string;scores:Readonly<Record<string,number>>;semesterAverages:readonly (number|null)[];bands:readonly (ReturnType<typeof getPerformanceBand>|null)[]}>;
export type GradingDetail = GradingClass & Readonly<{terms:readonly GradingTerm[];quizzes:readonly GradingQuiz[];students:readonly GradingStudent[]}>;
type Failure=Readonly<{status:"unauthenticated"|"access-unavailable"|"error"|"not-found"}>;

async function context(){const access=await resolveApplicationContext();if(access.status==="unauthenticated")return{status:"unauthenticated"as const};if(access.status!=="ready")return{status:"access-unavailable"as const};return{status:"ready"as const,supabase:await createServerSupabaseClient()};}
const classSelect="id, class_id, school_year_id, classes!class_courses_class_school_year_fk(name, school_years!classes_school_year_school_fk(label)), courses!class_courses_course_school_fk(name, code)" as const;
function mapClass(row:{id:string;class_id:string;classes:{name:string;school_years:{label:string}};courses:{name:string;code:string|null}}):GradingClass{return{id:row.id,className:row.classes.name,courseName:row.courses.name,courseCode:row.courses.code,schoolYear:row.classes.school_years.label};}

export async function listGradingClasses():Promise<Readonly<{status:"ready";classes:readonly GradingClass[]}>|Failure>{
  try{const ctx=await context();if(ctx.status!=="ready")return ctx;const result=await ctx.supabase.from("class_courses").select(classSelect).eq("is_active",true).order("created_at");if(result.error||!result.data)return{status:"error"};return{status:"ready",classes:result.data.map(mapClass)};}catch{return{status:"error"};}
}

export async function getGradingDetail(classCourseId:string):Promise<Readonly<{status:"ready";value:GradingDetail}>|Failure>{
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(classCourseId))return{status:"not-found"};
  try{const ctx=await context();if(ctx.status!=="ready")return ctx;
    const classResult=await ctx.supabase.from("class_courses").select(classSelect).eq("id",classCourseId).eq("is_active",true).maybeSingle();
    if(classResult.error)return{status:"error"};if(!classResult.data)return{status:"not-found"};
    const [termResult,quizResult,enrollmentResult]=await Promise.all([
      ctx.supabase.from("terms").select("id, semester_number, start_date, end_date").eq("school_year_id",classResult.data.school_year_id).order("semester_number"),
      ctx.supabase.from("quizzes").select("id, term_id, slot, title, quiz_date, is_active").eq("class_course_id",classCourseId).order("slot"),
      ctx.supabase.from("enrollments").select("students!enrollments_student_school_fk(id, first_name, last_name)").eq("class_id",classResult.data.class_id).is("ends_on",null).order("created_at"),
    ]);
    if(termResult.error||quizResult.error||enrollmentResult.error||!termResult.data||!quizResult.data||!enrollmentResult.data)return{status:"error"};
    const quizzes:GradingQuiz[]=quizResult.data.map(q=>({id:q.id,termId:q.term_id,slot:q.slot,title:q.title,quizDate:q.quiz_date,isActive:q.is_active}));
    const studentIds=enrollmentResult.data.map(e=>e.students.id);const scoreResult=studentIds.length===0||quizzes.length===0?{data:[],error:null}:await ctx.supabase.from("quiz_scores").select("quiz_id, student_id, score").in("student_id",studentIds).in("quiz_id",quizzes.map(q=>q.id));
    if(scoreResult.error||!scoreResult.data)return{status:"error"};
    const terms:GradingTerm[]=termResult.data.filter(t=>t.semester_number===1||t.semester_number===2).map(t=>({id:t.id,semesterNumber:t.semester_number as 1|2,startDate:t.start_date,endDate:t.end_date}));
    const students=enrollmentResult.data.map(e=>{const scores=Object.fromEntries(scoreResult.data.filter(s=>s.student_id===e.students.id).map(s=>[s.quiz_id,s.score]));const averages=terms.map(term=>{const slots=term.semesterNumber===1?["C1","C2","C3","C4"]:["C5","C6","C7","C8"];return calculateSemesterSuggestion(slots.map(slot=>{const quiz=quizzes.find(q=>q.slot===slot);return quiz&&scores[quiz.id]!==undefined?scores[quiz.id]:null;}));});return{id:e.students.id,name:`${e.students.first_name} ${e.students.last_name}`,scores,semesterAverages:averages,bands:averages.map(a=>a===null?null:getPerformanceBand(a))};});
    return{status:"ready",value:{...mapClass(classResult.data),terms,quizzes,students}};
  }catch{return{status:"error"};}
}
