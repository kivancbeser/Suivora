import"server-only";
import{createServerSupabaseClient}from"@/lib/supabase/server";
import{resolveApplicationContext}from"@/server/application-context";
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
export async function getDetailedAssessment(classCourseId:string,quizId:string){
  if(!uuid.test(classCourseId)||!uuid.test(quizId))return{status:"not-found"as const};
  try{
    const access=await resolveApplicationContext();if(access.status!=="ready")return access;
    const client=await createServerSupabaseClient();
    const quiz=await client.from("quizzes").select("id,title,slot,quiz_date,assessment_mode,is_finalized,class_courses!quizzes_class_course_school_fk(id,class_id,classes!class_courses_class_school_year_fk(name),courses!class_courses_course_school_fk(name))").eq("id",quizId).eq("class_course_id",classCourseId).maybeSingle();
    if(quiz.error)return{status:"error"as const};if(!quiz.data||quiz.data.assessment_mode!=="OUTCOME_DETAILED")return{status:"not-found"as const};
    const elements=await client.from("assessment_elements").select("id,position,title,max_points,assessment_element_outcomes(id,class_course_outcome_id,allocation_weight,is_active)").eq("quiz_id",quizId).order("position");
    const uses=await client.from("class_course_outcomes").select("id,is_active,outcome_revision_id").eq("class_course_id",classCourseId).eq("is_active",true);
    const revisionIds=uses.data?.map(x=>x.outcome_revision_id)??[];
    const revisions=revisionIds.length?await client.from("learning_outcome_revisions").select("id,revision_number,title,learning_outcomes!outcome_revisions_outcome_school_fk(code,is_active)").in("id",revisionIds):{data:[],error:null};
    const roster=await client.from("enrollments").select("student_id,students!enrollments_student_school_fk(first_name,last_name)").eq("class_id",quiz.data.class_courses.class_id).lte("starts_on",quiz.data.quiz_date).or(`ends_on.is.null,ends_on.gte.${quiz.data.quiz_date}`);
    const scores=await client.from("student_element_scores").select("assessment_element_id,student_id,score");
    const finalScores=await client.from("quiz_scores").select("student_id,score").eq("quiz_id",quizId);
    if(elements.error||uses.error||revisions.error||roster.error||scores.error||finalScores.error||!elements.data||!uses.data||!revisions.data||!roster.data||!scores.data||!finalScores.data)return{status:"error"as const};
    const revisionMap=new Map(revisions.data.map(r=>[r.id,r]));
    return{status:"ready"as const,role:access.context.role,value:{id:quiz.data.id,title:quiz.data.title,slot:quiz.data.slot,date:quiz.data.quiz_date,finalized:quiz.data.is_finalized,classCourseId,className:quiz.data.class_courses.classes.name,courseName:quiz.data.class_courses.courses.name,elements:elements.data.map(e=>({id:e.id,position:e.position,title:e.title,maxPoints:Number(e.max_points),links:e.assessment_element_outcomes.map(l=>({id:l.id,useId:l.class_course_outcome_id,weight:Number(l.allocation_weight),active:l.is_active}))})),outcomes:uses.data.flatMap(u=>{const r=revisionMap.get(u.outcome_revision_id);return r?[{id:u.id,revisionId:u.outcome_revision_id,revision:r.revision_number,title:r.title,code:r.learning_outcomes.code,active:r.learning_outcomes.is_active}]:[]}),students:roster.data.map(s=>({id:s.student_id,name:`${s.students.first_name} ${s.students.last_name}`,scores:Object.fromEntries(scores.data.filter(x=>x.student_id===s.student_id).map(x=>[x.assessment_element_id,Number(x.score)])),finalScore:finalScores.data.find(x=>x.student_id===s.student_id)?.score??null}))}};
  }catch{return{status:"error"as const};}
}
