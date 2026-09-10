-- School-scoped quiz slots and audited score entry for a shared ClassCourse.

create type public.quiz_slot as enum ('C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8');

alter table public.terms
  add constraint terms_id_school_year_school_key unique (id, school_year_id, school_id);

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete restrict,
  school_year_id uuid not null,
  term_id uuid not null,
  class_course_id uuid not null,
  slot public.quiz_slot not null,
  title text not null,
  quiz_date date not null,
  max_score numeric(5,2) not null default 100,
  is_active boolean not null default true,
  created_by uuid not null,
  updated_by uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint quizzes_title_check check (
    title = btrim(title) and char_length(title) between 1 and 160 and title !~ '[[:cntrl:]]'
  ),
  constraint quizzes_max_score_check check (max_score = 100.00),
  constraint quizzes_term_school_year_school_fk foreign key (term_id, school_year_id, school_id)
    references public.terms (id, school_year_id, school_id) on delete restrict,
  constraint quizzes_class_course_school_fk foreign key (class_course_id, school_id)
    references public.class_courses (id, school_id) on delete restrict,
  constraint quizzes_created_by_school_fk foreign key (created_by, school_id)
    references public.user_profiles (id, school_id) on delete restrict,
  constraint quizzes_updated_by_school_fk foreign key (updated_by, school_id)
    references public.user_profiles (id, school_id) on delete restrict,
  constraint quizzes_class_course_slot_key unique (class_course_id, slot),
  constraint quizzes_id_school_key unique (id, school_id)
);

create index quizzes_class_course_date_idx on public.quizzes (class_course_id, quiz_date, slot);
create index quizzes_school_year_term_idx on public.quizzes (school_id, school_year_id, term_id);

create table public.quiz_scores (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete restrict,
  quiz_id uuid not null,
  student_id uuid not null,
  score numeric(5,2) not null,
  created_by uuid not null,
  updated_by uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint quiz_scores_score_check check (
    score between 0 and 100 and score = trunc(score, 2)
  ),
  constraint quiz_scores_quiz_school_fk foreign key (quiz_id, school_id)
    references public.quizzes (id, school_id) on delete restrict,
  constraint quiz_scores_student_school_fk foreign key (student_id, school_id)
    references public.students (id, school_id) on delete restrict,
  constraint quiz_scores_created_by_school_fk foreign key (created_by, school_id)
    references public.user_profiles (id, school_id) on delete restrict,
  constraint quiz_scores_updated_by_school_fk foreign key (updated_by, school_id)
    references public.user_profiles (id, school_id) on delete restrict,
  constraint quiz_scores_quiz_student_key unique (quiz_id, student_id)
);

create index quiz_scores_student_idx on public.quiz_scores (student_id, quiz_id);

create function public.validate_quiz_integrity()
returns trigger language plpgsql volatile security definer set search_path = '' as $$
declare
  parent_term public.terms%rowtype;
  parent_course public.class_courses%rowtype;
begin
  if tg_op = 'UPDATE' and (
    new.school_id <> old.school_id or new.school_year_id <> old.school_year_id
    or new.term_id <> old.term_id or new.class_course_id <> old.class_course_id
    or new.slot <> old.slot or new.created_by <> old.created_by
  ) then
    raise exception using errcode = '22023', message = 'quiz relationship is immutable';
  end if;

  select * into parent_term from public.terms
  where id = new.term_id and school_id = new.school_id and school_year_id = new.school_year_id
  for key share;
  select * into parent_course from public.class_courses
  where id = new.class_course_id and school_id = new.school_id
  for key share;

  if parent_term.id is null or parent_course.id is null
     or parent_course.school_year_id <> new.school_year_id
     or not parent_course.is_active
     or new.quiz_date not between parent_term.start_date and parent_term.end_date
     or (parent_term.semester_number = 1 and new.slot not in ('C1','C2','C3','C4'))
     or (parent_term.semester_number = 2 and new.slot not in ('C5','C6','C7','C8')) then
    raise exception using errcode = '22023', message = 'quiz input rejected';
  end if;

  if tg_op = 'UPDATE' and new.quiz_date <> old.quiz_date and exists (
    select 1 from public.quiz_scores as quiz_score
    where quiz_score.quiz_id = new.id and not exists (
      select 1 from public.enrollments as enrollment
      where enrollment.student_id = quiz_score.student_id
        and enrollment.school_id = new.school_id
        and enrollment.school_year_id = new.school_year_id
        and enrollment.class_id = parent_course.class_id
        and new.quiz_date between enrollment.starts_on and coalesce(enrollment.ends_on, new.quiz_date)
    )
  ) then
    raise exception using errcode = '22023', message = 'quiz date would invalidate an entered score';
  end if;
  return new;
end;
$$;

create function public.validate_quiz_score_integrity()
returns trigger language plpgsql volatile security definer set search_path = '' as $$
declare
  target_quiz public.quizzes%rowtype;
  target_class_id uuid;
begin
  if tg_op = 'UPDATE' and (
    new.school_id <> old.school_id or new.quiz_id <> old.quiz_id
    or new.student_id <> old.student_id or new.created_by <> old.created_by
  ) then
    raise exception using errcode = '22023', message = 'quiz score relationship is immutable';
  end if;

  select * into target_quiz from public.quizzes
  where id = new.quiz_id and school_id = new.school_id and is_active
  for key share;
  select class_id into target_class_id from public.class_courses
  where id = target_quiz.class_course_id and school_id = new.school_id;

  if target_quiz.id is null or not exists (
    select 1 from public.students as student
    join public.enrollments as enrollment
      on enrollment.student_id = student.id and enrollment.school_id = student.school_id
    where student.id = new.student_id and student.school_id = new.school_id and student.is_active
      and enrollment.school_year_id = target_quiz.school_year_id
      and enrollment.class_id = target_class_id
      and target_quiz.quiz_date between enrollment.starts_on
        and coalesce(enrollment.ends_on, target_quiz.quiz_date)
  ) then
    raise exception using errcode = '22023', message = 'quiz score input rejected';
  end if;
  return new;
end;
$$;

create trigger quizzes_validate before insert or update on public.quizzes
for each row execute function public.validate_quiz_integrity();
create trigger quizzes_set_updated_at before update on public.quizzes
for each row execute function public.set_updated_at();
create trigger quiz_scores_validate before insert or update on public.quiz_scores
for each row execute function public.validate_quiz_score_integrity();
create trigger quiz_scores_set_updated_at before update on public.quiz_scores
for each row execute function public.set_updated_at();

alter table public.quizzes enable row level security;
alter table public.quiz_scores enable row level security;
revoke all on table public.quizzes, public.quiz_scores from anon, authenticated;
grant select on table public.quizzes, public.quiz_scores to authenticated;

create policy quizzes_select_authorized on public.quizzes for select to authenticated using (
  school_id = (select public.current_school_id())
  and ((select public.is_school_admin(school_id)) or (select public.is_teacher_assigned(class_course_id)))
);
create policy quiz_scores_select_authorized on public.quiz_scores for select to authenticated using (
  school_id = (select public.current_school_id()) and exists (
    select 1 from public.quizzes as quiz where quiz.id = quiz_id
      and ((select public.is_school_admin(school_id)) or (select public.is_teacher_assigned(quiz.class_course_id)))
  )
);

create function public.create_quiz(
  target_class_course_id uuid, target_term_id uuid, target_slot public.quiz_slot,
  quiz_title text, target_quiz_date date
) returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare caller_school_id uuid; caller_role public.app_role; created_id uuid;
begin
  select school_id, role into caller_school_id, caller_role from public.user_profiles
  where id = auth.uid() and active;
  if caller_school_id is null or not (
    caller_role = 'ADMIN' or public.is_teacher_assigned(target_class_course_id)
  ) then raise exception using errcode='42501', message='quiz workflow rejected'; end if;
  insert into public.quizzes(school_id,school_year_id,term_id,class_course_id,slot,title,quiz_date,created_by,updated_by)
  select caller_school_id, class_course.school_year_id, target_term_id, class_course.id,
    target_slot, quiz_title, target_quiz_date, auth.uid(), auth.uid()
  from public.class_courses as class_course
  where class_course.id=target_class_course_id and class_course.school_id=caller_school_id
  returning id into created_id;
  if created_id is null then raise exception using errcode='P0001', message='quiz workflow rejected'; end if;
  return created_id;
exception when check_violation or unique_violation or foreign_key_violation then
  raise exception using errcode='22023', message='quiz input rejected';
end; $$;

create function public.update_quiz(
  target_quiz_id uuid, quiz_title text, target_quiz_date date, quiz_is_active boolean
) returns void language plpgsql volatile security definer set search_path = '' as $$
declare caller_school_id uuid; caller_role public.app_role; target_course uuid; affected integer;
begin
  select school_id, role into caller_school_id, caller_role from public.user_profiles
  where id=auth.uid() and active;
  select class_course_id into target_course from public.quizzes
  where id=target_quiz_id and school_id=caller_school_id;
  if target_course is null or not (caller_role='ADMIN' or public.is_teacher_assigned(target_course)) then
    raise exception using errcode='42501', message='quiz workflow rejected';
  end if;
  update public.quizzes set title=quiz_title, quiz_date=target_quiz_date,
    is_active=quiz_is_active, updated_by=auth.uid()
  where id=target_quiz_id and school_id=caller_school_id;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception using errcode='P0001', message='quiz workflow rejected'; end if;
exception when check_violation or foreign_key_violation then
  raise exception using errcode='22023', message='quiz input rejected';
end; $$;

create function public.save_quiz_scores(
  target_quiz_id uuid, target_student_ids uuid[], entered_scores numeric[]
) returns integer language plpgsql volatile security definer set search_path = '' as $$
declare caller_school_id uuid; caller_role public.app_role; target_course uuid; item record; saved integer:=0;
begin
  select school_id, role into caller_school_id, caller_role from public.user_profiles
  where id=auth.uid() and active;
  select class_course_id into target_course from public.quizzes
  where id=target_quiz_id and school_id=caller_school_id and is_active for update;
  if target_course is null or not (caller_role='ADMIN' or public.is_teacher_assigned(target_course)) then
    raise exception using errcode='42501', message='quiz score workflow rejected';
  end if;
  if target_student_ids is null or entered_scores is null
    or cardinality(target_student_ids)<>cardinality(entered_scores)
    or cardinality(target_student_ids)<>cardinality(array(select distinct unnest(target_student_ids))) then
    raise exception using errcode='22023', message='quiz score input rejected';
  end if;
  for item in select student_id, score from unnest(target_student_ids,entered_scores) as entry(student_id,score) loop
    if item.student_id is null or item.score is null or item.score<0 or item.score>100 or item.score<>trunc(item.score,2) then
      raise exception using errcode='22023', message='quiz score input rejected';
    end if;
    insert into public.quiz_scores(school_id,quiz_id,student_id,score,created_by,updated_by)
    values(caller_school_id,target_quiz_id,item.student_id,item.score,auth.uid(),auth.uid())
    on conflict (quiz_id,student_id) do update set score=excluded.score,updated_by=auth.uid();
    saved:=saved+1;
  end loop;
  return saved;
exception when check_violation or unique_violation or foreign_key_violation then
  raise exception using errcode='22023', message='quiz score input rejected';
end; $$;

revoke all on function public.validate_quiz_integrity(), public.validate_quiz_score_integrity() from public,anon,authenticated;
revoke all on function public.create_quiz(uuid,uuid,public.quiz_slot,text,date) from public,anon;
revoke all on function public.update_quiz(uuid,text,date,boolean) from public,anon;
revoke all on function public.save_quiz_scores(uuid,uuid[],numeric[]) from public,anon;
grant execute on function public.create_quiz(uuid,uuid,public.quiz_slot,text,date) to authenticated;
grant execute on function public.update_quiz(uuid,text,date,boolean) to authenticated;
grant execute on function public.save_quiz_scores(uuid,uuid[],numeric[]) to authenticated;

comment on table public.quizzes is 'One audited C1-C8 quiz slot per shared ClassCourse.';
comment on table public.quiz_scores is 'Audited entered quiz scores; absence of a row means not entered and zero is a real score.';
