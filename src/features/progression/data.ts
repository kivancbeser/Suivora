import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveApplicationContext } from "@/server/application-context";

export type ProgressionClass = Readonly<{ id: string; courseId: string; className: string; courseName: string; courseCode: string | null; schoolYear: string }>;
export type OutcomeRevision = Readonly<{ id: string; number: number; title: string; linkedClasses: readonly string[]; usedAsEvidence: boolean }>;
export type Outcome = Readonly<{ id: string; courseId: string; courseName: string; code: string; title: string; revision: number; revisionId: string; active: boolean; revisions: readonly OutcomeRevision[] }>;
export type ProgressionRow = Readonly<{ studentId: string; studentName: string; outcomeCode: string; outcomeTitle: string; percentage: number | null; quizCount: number; elementCount: number; state: "NO_DATA" | "INSUFFICIENT_DATA" | "SUFFICIENT_DATA" | "INCONSISTENT_DATA"; band: string | null }>;

type OutcomeRow = Readonly<{ id: string; course_id: string; code: string; is_active: boolean }>;
type RevisionRow = Readonly<{ id: string; learning_outcome_id: string; revision_number: number; title: string }>;
type LinkRow = Readonly<{ id: string; outcome_revision_id: string; class_course_id: string; is_active: boolean }>;
type EvidenceRow = Readonly<{ class_course_outcome_id: string }>;

export function buildOutcomeCatalog(rows: readonly OutcomeRow[], revisions: readonly RevisionRow[], links: readonly LinkRow[], evidence: readonly EvidenceRow[], courseNames: ReadonlyMap<string, string>, classNames: ReadonlyMap<string, string>): readonly Outcome[] {
  const evidenceLinks = new Set(evidence.map((row) => row.class_course_outcome_id));
  return rows.map((row) => {
    const history = revisions.filter((revision) => revision.learning_outcome_id === row.id).sort((left, right) => right.revision_number - left.revision_number).map((revision) => {
      const revisionLinks = links.filter((link) => link.outcome_revision_id === revision.id && link.is_active);
      return { id: revision.id, number: revision.revision_number, title: revision.title, linkedClasses: revisionLinks.flatMap((link) => classNames.has(link.class_course_id) ? [classNames.get(link.class_course_id)!] : []), usedAsEvidence: revisionLinks.some((link) => evidenceLinks.has(link.id)) };
    });
    const latest = history[0];
    const courseName = courseNames.get(row.course_id);
    if (!courseName) throw new Error("Outcome course relationship unavailable");
    return { id: row.id, courseId: row.course_id, courseName, code: row.code, title: latest?.title ?? row.code, revision: latest?.number ?? 0, revisionId: latest?.id ?? "", active: row.is_active, revisions: history };
  });
}

async function base() { const access = await resolveApplicationContext(); if (access.status !== "ready") return access; return { status: "ready" as const, context: access.context, client: await createServerSupabaseClient() }; }

export async function listProgression() {
  try {
    const ctx = await base(); if (ctx.status !== "ready") return ctx;
    const [classes, courses] = await Promise.all([
      ctx.client.from("class_courses").select("id, course_id, classes!class_courses_class_school_year_fk(name, school_years!classes_school_year_school_fk(label)), courses!class_courses_course_school_fk(name, code)").eq("is_active", true).order("created_at"),
      ctx.client.from("courses").select("id,name").eq("is_active", true).order("name"),
    ]);
    if (classes.error || courses.error || !classes.data || !courses.data) return { status: "error" as const };
    const mappedClasses: ProgressionClass[] = classes.data.map((row) => ({ id: row.id, courseId: row.course_id, className: row.classes.name, courseName: row.courses.name, courseCode: row.courses.code, schoolYear: row.classes.school_years.label }));
    if (ctx.context.role !== "ADMIN") return { status: "ready" as const, role: ctx.context.role, classes: mappedClasses, courses: courses.data, outcomes: [] as readonly Outcome[] };
    const [outcomes, revisions, links, evidence] = await Promise.all([
      ctx.client.from("learning_outcomes").select("id,course_id,code,is_active").order("created_at"),
      ctx.client.from("learning_outcome_revisions").select("id,learning_outcome_id,revision_number,title").order("revision_number", { ascending: false }),
      ctx.client.from("class_course_outcomes").select("id,outcome_revision_id,class_course_id,is_active"),
      ctx.client.from("assessment_element_outcomes").select("class_course_outcome_id").eq("is_active", true),
    ]);
    if (outcomes.error || revisions.error || links.error || evidence.error || !outcomes.data || !revisions.data || !links.data || !evidence.data) return { status: "error" as const };
    const courseNames = new Map(courses.data.map((course) => [course.id, course.name]));
    const classNames = new Map(mappedClasses.map((item) => [item.id, `${item.className} — ${item.courseName}`]));
    return { status: "ready" as const, role: ctx.context.role, classes: mappedClasses, courses: courses.data, outcomes: buildOutcomeCatalog(outcomes.data, revisions.data, links.data, evidence.data, courseNames, classNames) };
  } catch { return { status: "error" as const }; }
}

export async function getProgressionDetail(classCourseId: string, studentId?: string) { if (!zid(classCourseId) || (studentId && !zid(studentId))) return { status: "not-found" as const }; try { const ctx = await base(); if (ctx.status !== "ready") return ctx; const detail = await ctx.client.from("class_courses").select("id,class_id,classes!class_courses_class_school_year_fk(name,school_years!classes_school_year_school_fk(label)),courses!class_courses_course_school_fk(name,code)").eq("id", classCourseId).maybeSingle(); if (detail.error) return { status: "error" as const }; if (!detail.data) return { status: "not-found" as const }; const roster = await ctx.client.from("enrollments").select("student_id,students!enrollments_student_school_fk(first_name,last_name)").eq("class_id", detail.data.class_id); if (roster.error || !roster.data) return { status: "error" as const }; const progression = await ctx.client.rpc("learning_outcome_progression", { target_class_course_id: classCourseId, target_student_id: studentId ?? undefined }); if (progression.error || !progression.data) return { status: "error" as const }; const names = new Map(roster.data.map((row) => [row.student_id, `${row.students.first_name} ${row.students.last_name}`])); return { status: "ready" as const, value: { id: detail.data.id, className: detail.data.classes.name, courseName: detail.data.courses.name, courseCode: detail.data.courses.code, schoolYear: detail.data.classes.school_years.label, students: roster.data.map((row) => ({ id: row.student_id, name: names.get(row.student_id)! })), rows: progression.data.map((row) => ({ studentId: row.student_id, studentName: names.get(row.student_id) ?? "", outcomeCode: row.outcome_code, outcomeTitle: row.outcome_title, percentage: row.percentage === null ? null : Number(row.percentage), quizCount: Number(row.contributing_quiz_count), elementCount: Number(row.contributing_element_count), state: row.evidence_state, band: row.performance_band })) } }; } catch { return { status: "error" as const }; } }
function zid(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value); }
