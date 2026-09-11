-- Course-owned learning outcomes, immutable revisions and detailed assessment evidence.

create type public.quiz_assessment_mode as enum ('QUICK_TOTAL', 'OUTCOME_DETAILED');
create type public.progression_evidence_state as enum ('NO_DATA', 'INSUFFICIENT_DATA', 'SUFFICIENT_DATA', 'INCONSISTENT_DATA');

alter table public.quizzes
  add column assessment_mode public.quiz_assessment_mode not null default 'QUICK_TOTAL',
  add column is_finalized boolean not null default false;

create table public.learning_outcomes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  course_id uuid not null,
  code text not null,
  is_active boolean not null default true,
  created_by uuid not null,
  updated_by uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint learning_outcomes_course_school_fk foreign key(course_id,school_id) references public.courses(id,school_id) on delete restrict,
  constraint learning_outcomes_created_by_school_fk foreign key(created_by,school_id) references public.user_profiles(id,school_id) on delete restrict,
  constraint learning_outcomes_updated_by_school_fk foreign key(updated_by,school_id) references public.user_profiles(id,school_id) on delete restrict,
  constraint learning_outcomes_code_check check(code=btrim(code) and char_length(code) between 1 and 40 and code ~ '^[[:alnum:]_.-]+$'),
  constraint learning_outcomes_course_code_key unique(course_id,code),
  constraint learning_outcomes_id_school_key unique(id,school_id)
);

create table public.learning_outcome_revisions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete restrict,
  learning_outcome_id uuid not null,
  revision_number integer not null check(revision_number>0),
  title text not null,
  description text not null default '',
  created_by uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  constraint outcome_revisions_outcome_school_fk foreign key(learning_outcome_id,school_id) references public.learning_outcomes(id,school_id) on delete restrict,
  constraint outcome_revisions_created_by_school_fk foreign key(created_by,school_id) references public.user_profiles(id,school_id) on delete restrict,
  constraint outcome_revisions_title_check check(title=btrim(title) and char_length(title) between 1 and 240 and title !~ '[[:cntrl:]]'),
  constraint outcome_revisions_description_check check(char_length(description)<=4000 and description !~ '[[:cntrl:]]'),
  constraint outcome_revisions_number_key unique(learning_outcome_id,revision_number),
  constraint outcome_revisions_id_school_key unique(id,school_id)
);

create table public.class_course_outcomes (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete restrict,
  class_course_id uuid not null, outcome_revision_id uuid not null, is_active boolean not null default true,
  created_by uuid not null, updated_by uuid not null, created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp(),
  foreign key(class_course_id,school_id) references public.class_courses(id,school_id) on delete restrict,
  foreign key(outcome_revision_id,school_id) references public.learning_outcome_revisions(id,school_id) on delete restrict,
  foreign key(created_by,school_id) references public.user_profiles(id,school_id) on delete restrict,
  foreign key(updated_by,school_id) references public.user_profiles(id,school_id) on delete restrict,
  unique(class_course_id,outcome_revision_id), unique(id,school_id)
);

create table public.assessment_elements (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete restrict,
  quiz_id uuid not null, position integer not null check(position between 1 and 100), title text not null,
  max_points numeric(5,2) not null check(max_points>0 and max_points<=100 and max_points=trunc(max_points,2)),
  created_by uuid not null, updated_by uuid not null, created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp(),
  foreign key(quiz_id,school_id) references public.quizzes(id,school_id) on delete restrict,
  foreign key(created_by,school_id) references public.user_profiles(id,school_id) on delete restrict,
  foreign key(updated_by,school_id) references public.user_profiles(id,school_id) on delete restrict,
  check(title=btrim(title) and char_length(title) between 1 and 160 and title !~ '[[:cntrl:]]'), unique(quiz_id,position), unique(id,school_id)
);

create table public.assessment_element_outcomes (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete restrict,
  assessment_element_id uuid not null, class_course_outcome_id uuid not null,
  allocation_weight numeric(5,2) not null check(allocation_weight>0 and allocation_weight<=100 and allocation_weight=trunc(allocation_weight,2)),
  is_active boolean not null default true, created_by uuid not null, updated_by uuid not null,
  created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp(),
  foreign key(assessment_element_id,school_id) references public.assessment_elements(id,school_id) on delete restrict,
  foreign key(class_course_outcome_id,school_id) references public.class_course_outcomes(id,school_id) on delete restrict,
  foreign key(created_by,school_id) references public.user_profiles(id,school_id) on delete restrict,
  foreign key(updated_by,school_id) references public.user_profiles(id,school_id) on delete restrict,
  unique(assessment_element_id,class_course_outcome_id), unique(id,school_id)
);

create table public.student_element_scores (
  id uuid primary key default gen_random_uuid(), school_id uuid not null references public.schools(id) on delete restrict,
  assessment_element_id uuid not null, student_id uuid not null, score numeric(5,2) not null check(score>=0 and score=trunc(score,2)),
  created_by uuid not null, updated_by uuid not null, created_at timestamptz not null default statement_timestamp(), updated_at timestamptz not null default statement_timestamp(),
  foreign key(assessment_element_id,school_id) references public.assessment_elements(id,school_id) on delete restrict,
  foreign key(student_id,school_id) references public.students(id,school_id) on delete restrict,
  foreign key(created_by,school_id) references public.user_profiles(id,school_id) on delete restrict,
  foreign key(updated_by,school_id) references public.user_profiles(id,school_id) on delete restrict,
  unique(assessment_element_id,student_id)
);

create index learning_outcomes_course_idx on public.learning_outcomes(course_id,is_active);
create index class_course_outcomes_course_idx on public.class_course_outcomes(class_course_id,is_active);
create index assessment_elements_quiz_idx on public.assessment_elements(quiz_id,position);
create index student_element_scores_student_idx on public.student_element_scores(student_id,assessment_element_id);

create function public.validate_outcome_structure() returns trigger language plpgsql security definer set search_path='' as $$
declare quiz_row public.quizzes%rowtype; element_course uuid; outcome_course uuid; points numeric;
begin
  if tg_table_name='assessment_elements' then
    select * into quiz_row from public.quizzes where id=new.quiz_id and school_id=new.school_id for key share;
    if quiz_row.id is null or quiz_row.assessment_mode<>'OUTCOME_DETAILED' then raise exception using errcode='22023',message='detailed assessment required'; end if;
  elsif tg_table_name='assessment_element_outcomes' then
    select q.class_course_id into element_course from public.assessment_elements e join public.quizzes q on q.id=e.quiz_id and q.school_id=e.school_id where e.id=new.assessment_element_id and e.school_id=new.school_id;
    select cco.class_course_id into outcome_course from public.class_course_outcomes cco join public.learning_outcome_revisions r on r.id=cco.outcome_revision_id join public.learning_outcomes o on o.id=r.learning_outcome_id where cco.id=new.class_course_outcome_id and cco.school_id=new.school_id and cco.is_active and o.is_active;
    if element_course is null or outcome_course is distinct from element_course then raise exception using errcode='22023',message='outcome link rejected'; end if;
  else
    select e.max_points into points from public.assessment_elements e join public.quizzes q on q.id=e.quiz_id join public.class_courses cc on cc.id=q.class_course_id
    where e.id=new.assessment_element_id and e.school_id=new.school_id and exists(select 1 from public.students s join public.enrollments en on en.student_id=s.id and en.school_id=s.school_id where s.id=new.student_id and s.school_id=new.school_id and s.is_active and en.class_id=cc.class_id and en.school_year_id=q.school_year_id and q.quiz_date between en.starts_on and coalesce(en.ends_on,q.quiz_date));
    if points is null or new.score>points then raise exception using errcode='22023',message='element score rejected'; end if;
  end if;
  return new;
end $$;

create trigger assessment_elements_validate before insert or update on public.assessment_elements for each row execute function public.validate_outcome_structure();
create trigger assessment_element_outcomes_validate before insert or update on public.assessment_element_outcomes for each row execute function public.validate_outcome_structure();
create trigger student_element_scores_validate before insert or update on public.student_element_scores for each row execute function public.validate_outcome_structure();
create trigger learning_outcomes_updated before update on public.learning_outcomes for each row execute function public.set_updated_at();
create trigger class_course_outcomes_updated before update on public.class_course_outcomes for each row execute function public.set_updated_at();
create trigger assessment_elements_updated before update on public.assessment_elements for each row execute function public.set_updated_at();
create trigger assessment_element_outcomes_updated before update on public.assessment_element_outcomes for each row execute function public.set_updated_at();
create trigger student_element_scores_updated before update on public.student_element_scores for each row execute function public.set_updated_at();

alter table public.learning_outcomes enable row level security; alter table public.learning_outcome_revisions enable row level security;
alter table public.class_course_outcomes enable row level security; alter table public.assessment_elements enable row level security;
alter table public.assessment_element_outcomes enable row level security; alter table public.student_element_scores enable row level security;
revoke all on public.learning_outcomes,public.learning_outcome_revisions,public.class_course_outcomes,public.assessment_elements,public.assessment_element_outcomes,public.student_element_scores from anon,authenticated;
grant select on public.learning_outcomes,public.learning_outcome_revisions,public.class_course_outcomes,public.assessment_elements,public.assessment_element_outcomes,public.student_element_scores to authenticated;

create policy outcomes_read on public.learning_outcomes for select to authenticated using(learning_outcomes.school_id=(select public.current_school_id()) and ((select public.is_school_admin(learning_outcomes.school_id)) or exists(select 1 from public.class_course_outcomes c where c.school_id=learning_outcomes.school_id and c.is_active and c.outcome_revision_id in(select r.id from public.learning_outcome_revisions r where r.learning_outcome_id=learning_outcomes.id) and (select public.is_teacher_assigned(c.class_course_id)))));
create policy revisions_read on public.learning_outcome_revisions for select to authenticated using(learning_outcome_revisions.school_id=(select public.current_school_id()) and ((select public.is_school_admin(learning_outcome_revisions.school_id)) or exists(select 1 from public.class_course_outcomes c where c.outcome_revision_id=learning_outcome_revisions.id and c.is_active and (select public.is_teacher_assigned(c.class_course_id)))));
create policy class_course_outcomes_read on public.class_course_outcomes for select to authenticated using(class_course_outcomes.school_id=(select public.current_school_id()) and ((select public.is_school_admin(class_course_outcomes.school_id)) or (select public.is_teacher_assigned(class_course_outcomes.class_course_id))));
create policy elements_read on public.assessment_elements for select to authenticated using(assessment_elements.school_id=(select public.current_school_id()) and exists(select 1 from public.quizzes q where q.id=assessment_elements.quiz_id and ((select public.is_school_admin(assessment_elements.school_id)) or (select public.is_teacher_assigned(q.class_course_id)))));
create policy element_outcomes_read on public.assessment_element_outcomes for select to authenticated using(assessment_element_outcomes.school_id=(select public.current_school_id()) and exists(select 1 from public.assessment_elements e join public.quizzes q on q.id=e.quiz_id where e.id=assessment_element_outcomes.assessment_element_id and ((select public.is_school_admin(assessment_element_outcomes.school_id)) or (select public.is_teacher_assigned(q.class_course_id)))));
create policy element_scores_read on public.student_element_scores for select to authenticated using(student_element_scores.school_id=(select public.current_school_id()) and exists(select 1 from public.assessment_elements e join public.quizzes q on q.id=e.quiz_id where e.id=student_element_scores.assessment_element_id and ((select public.is_school_admin(student_element_scores.school_id)) or (select public.is_teacher_assigned(q.class_course_id)))));

create function public.create_learning_outcome(target_course_id uuid,outcome_code text,outcome_title text,outcome_description text default '') returns uuid language plpgsql security definer set search_path='' as $$
declare sid uuid; oid uuid;
begin select school_id into sid from public.user_profiles where id=auth.uid() and active and role='ADMIN'; if sid is null then raise exception using errcode='42501',message='outcome workflow rejected'; end if;
insert into public.learning_outcomes(school_id,course_id,code,created_by,updated_by) select sid,id,outcome_code,auth.uid(),auth.uid() from public.courses where id=target_course_id and school_id=sid returning id into oid;
if oid is null then raise exception using errcode='22023',message='outcome input rejected'; end if;
insert into public.learning_outcome_revisions(school_id,learning_outcome_id,revision_number,title,description,created_by) values(sid,oid,1,outcome_title,outcome_description,auth.uid()); return oid;
exception when check_violation or unique_violation or foreign_key_violation then raise exception using errcode='22023',message='outcome input rejected'; end $$;

create function public.publish_learning_outcome_revision(target_outcome_id uuid,outcome_title text,outcome_description text default '') returns uuid language plpgsql security definer set search_path='' as $$
declare sid uuid; rid uuid; next_revision integer;
begin select school_id into sid from public.user_profiles where id=auth.uid() and active and role='ADMIN'; perform 1 from public.learning_outcomes where id=target_outcome_id and school_id=sid for update; if not found then raise exception using errcode='42501',message='outcome workflow rejected'; end if;
select coalesce(max(revision_number),0)+1 into next_revision from public.learning_outcome_revisions where learning_outcome_id=target_outcome_id;
insert into public.learning_outcome_revisions(school_id,learning_outcome_id,revision_number,title,description,created_by) values(sid,target_outcome_id,next_revision,outcome_title,outcome_description,auth.uid()) returning id into rid; return rid;
exception when check_violation or foreign_key_violation then raise exception using errcode='22023',message='outcome input rejected'; end $$;

create function public.set_learning_outcome_active(target_outcome_id uuid,target_active boolean) returns void language plpgsql security definer set search_path='' as $$
declare sid uuid; n integer; begin select school_id into sid from public.user_profiles where id=auth.uid() and active and role='ADMIN'; update public.learning_outcomes set is_active=target_active,updated_by=auth.uid() where id=target_outcome_id and school_id=sid; get diagnostics n=row_count; if n<>1 then raise exception using errcode='42501',message='outcome workflow rejected'; end if; end $$;

create function public.assign_outcome_revision(target_class_course_id uuid,target_revision_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare sid uuid; cid uuid; rid uuid; result uuid; begin select school_id into sid from public.user_profiles where id=auth.uid() and active and role='ADMIN';
select cc.course_id into cid from public.class_courses cc where cc.id=target_class_course_id and cc.school_id=sid and cc.is_active;
select r.id into rid from public.learning_outcome_revisions r join public.learning_outcomes o on o.id=r.learning_outcome_id where r.id=target_revision_id and r.school_id=sid and o.course_id=cid and o.is_active;
if cid is null or rid is null then raise exception using errcode='22023',message='outcome assignment rejected'; end if;
insert into public.class_course_outcomes(school_id,class_course_id,outcome_revision_id,created_by,updated_by) values(sid,target_class_course_id,rid,auth.uid(),auth.uid()) on conflict(class_course_id,outcome_revision_id) do update set is_active=true,updated_by=auth.uid() returning id into result; return result; end $$;

create function public.upsert_assessment_element(target_quiz_id uuid,target_element_id uuid,element_position integer,element_title text,element_max_points numeric) returns uuid language plpgsql security definer set search_path='' as $$
declare sid uuid; ccid uuid; eid uuid; begin select school_id into sid from public.user_profiles where id=auth.uid() and active; select class_course_id into ccid from public.quizzes where id=target_quiz_id and school_id=sid and assessment_mode='OUTCOME_DETAILED' and not is_finalized for update;
if ccid is null or not(public.is_school_admin(sid) or public.is_teacher_assigned(ccid)) then raise exception using errcode='42501',message='element workflow rejected'; end if;
if target_element_id is null then insert into public.assessment_elements(school_id,quiz_id,position,title,max_points,created_by,updated_by) values(sid,target_quiz_id,element_position,element_title,element_max_points,auth.uid(),auth.uid()) returning id into eid;
else update public.assessment_elements set position=element_position,title=element_title,max_points=element_max_points,updated_by=auth.uid() where id=target_element_id and quiz_id=target_quiz_id returning id into eid; end if;
if eid is null then raise exception using errcode='22023',message='element input rejected'; end if; return eid;
exception when check_violation or unique_violation or foreign_key_violation then raise exception using errcode='22023',message='element input rejected'; end $$;

create function public.set_element_outcome_link(target_element_id uuid,target_class_course_outcome_id uuid,target_weight numeric,target_active boolean default true) returns uuid language plpgsql security definer set search_path='' as $$
declare sid uuid; ccid uuid; lid uuid; begin select school_id into sid from public.user_profiles where id=auth.uid() and active; select q.class_course_id into ccid from public.assessment_elements e join public.quizzes q on q.id=e.quiz_id where e.id=target_element_id and e.school_id=sid and not q.is_finalized;
if ccid is null or not(public.is_school_admin(sid) or public.is_teacher_assigned(ccid)) then raise exception using errcode='42501',message='link workflow rejected'; end if;
insert into public.assessment_element_outcomes(school_id,assessment_element_id,class_course_outcome_id,allocation_weight,is_active,created_by,updated_by) values(sid,target_element_id,target_class_course_outcome_id,target_weight,target_active,auth.uid(),auth.uid()) on conflict(assessment_element_id,class_course_outcome_id) do update set allocation_weight=excluded.allocation_weight,is_active=excluded.is_active,updated_by=auth.uid() returning id into lid; return lid;
exception when check_violation or foreign_key_violation then raise exception using errcode='22023',message='link input rejected'; end $$;

create function public.save_student_element_scores(target_quiz_id uuid,target_student_id uuid,target_element_ids uuid[],entered_scores numeric[]) returns integer language plpgsql security definer set search_path='' as $$
declare sid uuid; ccid uuid; item record; n integer:=0; begin select school_id into sid from public.user_profiles where id=auth.uid() and active; select class_course_id into ccid from public.quizzes where id=target_quiz_id and school_id=sid and assessment_mode='OUTCOME_DETAILED' and not is_finalized for update;
if ccid is null or cardinality(target_element_ids)<>cardinality(entered_scores) or not(public.is_school_admin(sid) or public.is_teacher_assigned(ccid)) then raise exception using errcode='42501',message='element score workflow rejected'; end if;
for item in select element_id,score from unnest(target_element_ids,entered_scores) x(element_id,score) loop insert into public.student_element_scores(school_id,assessment_element_id,student_id,score,created_by,updated_by) select sid,e.id,target_student_id,item.score,auth.uid(),auth.uid() from public.assessment_elements e where e.id=item.element_id and e.quiz_id=target_quiz_id on conflict(assessment_element_id,student_id) do update set score=excluded.score,updated_by=auth.uid(); if not found then raise exception using errcode='22023',message='element score input rejected'; end if; n:=n+1; end loop; return n;
exception when check_violation or unique_violation or foreign_key_violation then raise exception using errcode='22023',message='element score input rejected'; end $$;

create function public.configure_detailed_quiz(target_quiz_id uuid,target_finalized boolean default false) returns void language plpgsql security definer set search_path='' as $$
declare sid uuid; ccid uuid; total numeric; invalid_count integer;
begin select school_id into sid from public.user_profiles where id=auth.uid() and active; select class_course_id into ccid from public.quizzes where id=target_quiz_id and school_id=sid for update;
if ccid is null or not(public.is_school_admin(sid) or public.is_teacher_assigned(ccid)) then raise exception using errcode='42501',message='quiz configuration rejected'; end if;
if exists(select 1 from public.quizzes q join public.quiz_scores qs on qs.quiz_id=q.id where q.id=target_quiz_id and q.assessment_mode='QUICK_TOTAL') then raise exception using errcode='22023',message='existing quick total cannot become detailed'; end if;
if target_finalized then
  select coalesce(sum(max_points),0) into total from public.assessment_elements where quiz_id=target_quiz_id;
  select count(*) into invalid_count from public.assessment_elements e where e.quiz_id=target_quiz_id and (select coalesce(sum(allocation_weight),0) from public.assessment_element_outcomes l where l.assessment_element_id=e.id and l.is_active)<>100;
  if total<>100 or invalid_count<>0 or exists(select 1 from public.quiz_scores qs where qs.quiz_id=target_quiz_id and ((select count(*) from public.assessment_elements e where e.quiz_id=target_quiz_id)<>(select count(*) from public.student_element_scores ses join public.assessment_elements e on e.id=ses.assessment_element_id where e.quiz_id=target_quiz_id and ses.student_id=qs.student_id) or qs.score<>(select coalesce(sum(ses.score),0) from public.student_element_scores ses join public.assessment_elements e on e.id=ses.assessment_element_id where e.quiz_id=target_quiz_id and ses.student_id=qs.student_id))) then raise exception using errcode='22023',message='detailed quiz is incomplete or inconsistent'; end if;
  update public.quizzes set assessment_mode='OUTCOME_DETAILED',is_finalized=true,updated_by=auth.uid() where id=target_quiz_id;
else update public.quizzes set assessment_mode='OUTCOME_DETAILED',is_finalized=false,updated_by=auth.uid() where id=target_quiz_id; end if; end $$;

create function public.learning_outcome_progression(target_class_course_id uuid,target_student_id uuid default null)
returns table(student_id uuid,outcome_id uuid,outcome_code text,outcome_title text,percentage numeric,contributing_quiz_count bigint,contributing_element_count bigint,evidence_state public.progression_evidence_state,performance_band text)
language sql stable security invoker set search_path='' as $$
with authorized as(select cc.id,cc.class_id,cc.school_year_id from public.class_courses cc where cc.id=target_class_course_id and cc.school_id=public.current_school_id() and (public.is_school_admin(cc.school_id) or public.is_teacher_assigned(cc.id))),
eligible_students as(select distinct e.student_id from authorized a join public.enrollments e on e.class_id=a.class_id and e.school_year_id=a.school_year_id and e.school_id=public.current_school_id() where target_student_id is null or e.student_id=target_student_id),
outcomes as(select cco.id,lo.id outcome_id,lo.code,r.title from public.class_course_outcomes cco join public.learning_outcome_revisions r on r.id=cco.outcome_revision_id join public.learning_outcomes lo on lo.id=r.learning_outcome_id where cco.class_course_id=target_class_course_id),
quiz_checks as(select q.id quiz_id,es.student_id,sum(ae.max_points) max_total,count(ae.id) element_total,count(ses.assessment_element_id) scored_total,sum(ses.score) score_total,qs.score final_score,bool_and(coalesce(w.weight_total,0)=100) weights_ok from authorized a join public.quizzes q on q.class_course_id=a.id and q.assessment_mode='OUTCOME_DETAILED' and q.is_active and q.is_finalized join eligible_students es on exists(select 1 from public.enrollments en where en.student_id=es.student_id and en.class_id=a.class_id and q.quiz_date between en.starts_on and coalesce(en.ends_on,q.quiz_date)) left join public.quiz_scores qs on qs.quiz_id=q.id and qs.student_id=es.student_id left join public.assessment_elements ae on ae.quiz_id=q.id left join public.student_element_scores ses on ses.assessment_element_id=ae.id and ses.student_id=es.student_id left join lateral(select sum(l.allocation_weight) weight_total from public.assessment_element_outcomes l where l.assessment_element_id=ae.id and l.is_active) w on true group by q.id,es.student_id,qs.score),
evidence as(select es.student_id,o.outcome_id,o.code,o.title,q.id quiz_id,ae.id element_id,ses.score,ae.max_points,l.allocation_weight from eligible_students es cross join outcomes o join public.assessment_element_outcomes l on l.class_course_outcome_id=o.id and l.is_active join public.assessment_elements ae on ae.id=l.assessment_element_id join public.quizzes q on q.id=ae.quiz_id join public.student_element_scores ses on ses.assessment_element_id=ae.id and ses.student_id=es.student_id join quiz_checks qc on qc.quiz_id=q.id and qc.student_id=es.student_id and qc.max_total=100 and qc.element_total=qc.scored_total and qc.score_total=qc.final_score and qc.weights_ok),
agg as(select es.student_id,o.outcome_id,o.code,o.title,round(100*sum(e.score*e.allocation_weight)/nullif(sum(e.max_points*e.allocation_weight),0),2) pct,count(distinct e.quiz_id) quizzes,count(distinct e.element_id) elements from eligible_students es cross join outcomes o left join evidence e on e.student_id=es.student_id and e.outcome_id=o.outcome_id group by es.student_id,o.outcome_id,o.code,o.title)
select student_id,outcome_id,code,title,pct,quizzes,elements,case when quizzes=0 and exists(select 1 from quiz_checks qc where qc.student_id=agg.student_id and (qc.max_total<>100 or qc.element_total<>qc.scored_total or qc.score_total is distinct from qc.final_score or not qc.weights_ok)) then 'INCONSISTENT_DATA'::public.progression_evidence_state when quizzes=0 then 'NO_DATA'::public.progression_evidence_state when quizzes=1 then 'INSUFFICIENT_DATA'::public.progression_evidence_state else 'SUFFICIENT_DATA'::public.progression_evidence_state end,case when quizzes<2 then null when pct>=85 then 'EXCELLENT' when pct>=70 then 'GOOD' when pct>=50 then 'AVERAGE' else 'NEEDS_REINFORCEMENT' end from agg;
$$;

revoke all on function public.validate_outcome_structure() from public,anon,authenticated;
revoke all on function public.create_learning_outcome(uuid,text,text,text),public.publish_learning_outcome_revision(uuid,text,text),public.set_learning_outcome_active(uuid,boolean),public.assign_outcome_revision(uuid,uuid),public.upsert_assessment_element(uuid,uuid,integer,text,numeric),public.set_element_outcome_link(uuid,uuid,numeric,boolean),public.save_student_element_scores(uuid,uuid,uuid[],numeric[]),public.configure_detailed_quiz(uuid,boolean) from public,anon;
revoke all on function public.learning_outcome_progression(uuid,uuid) from public,anon;
grant execute on function public.create_learning_outcome(uuid,text,text,text),public.publish_learning_outcome_revision(uuid,text,text),public.set_learning_outcome_active(uuid,boolean),public.assign_outcome_revision(uuid,uuid),public.upsert_assessment_element(uuid,uuid,integer,text,numeric),public.set_element_outcome_link(uuid,uuid,numeric,boolean),public.save_student_element_scores(uuid,uuid,uuid[],numeric[]),public.configure_detailed_quiz(uuid,boolean),public.learning_outcome_progression(uuid,uuid) to authenticated;

comment on table public.learning_outcomes is 'Stable Course-owned outcome identities; titles live in immutable revisions.';
comment on function public.learning_outcome_progression(uuid,uuid) is 'Dynamic outcome evidence; one quiz is insufficient and two are required for a performance band.';
