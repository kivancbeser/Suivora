-- Shared ClassCourse homework tracking with derived consecutive-attention projection.

create type public.homework_state as enum (
  'SUBMITTED_ON_TIME',
  'SUBMITTED_LATE',
  'NOT_SUBMITTED'
);

create table public.homework_assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete restrict,
  school_year_id uuid not null,
  term_id uuid not null,
  class_course_id uuid not null,
  title text not null,
  description text,
  assigned_on date not null,
  due_on date not null,
  is_active boolean not null default true,
  created_by uuid not null,
  updated_by uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint homework_assignments_title_check check (
    title = btrim(title) and char_length(title) between 1 and 160
    and title !~ '[[:cntrl:]]'
  ),
  constraint homework_assignments_description_check check (
    description is null or (
      description = btrim(description) and char_length(description) between 1 and 4000
      and description !~ '[[:cntrl:]]'
    )
  ),
  constraint homework_assignments_dates_check check (assigned_on <= due_on),
  constraint homework_assignments_term_school_year_school_fk
    foreign key (term_id, school_year_id, school_id)
    references public.terms (id, school_year_id, school_id) on delete restrict,
  constraint homework_assignments_class_course_school_fk
    foreign key (class_course_id, school_id)
    references public.class_courses (id, school_id) on delete restrict,
  constraint homework_assignments_created_by_school_fk
    foreign key (created_by, school_id)
    references public.user_profiles (id, school_id) on delete restrict,
  constraint homework_assignments_updated_by_school_fk
    foreign key (updated_by, school_id)
    references public.user_profiles (id, school_id) on delete restrict,
  constraint homework_assignments_id_school_key unique (id, school_id)
);

create index homework_assignments_course_due_idx
  on public.homework_assignments (class_course_id, due_on, assigned_on, id);
create index homework_assignments_term_idx
  on public.homework_assignments (school_id, school_year_id, term_id);

create table public.homework_student_statuses (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete restrict,
  homework_assignment_id uuid not null,
  student_id uuid not null,
  state public.homework_state not null,
  submitted_on date,
  created_by uuid not null,
  updated_by uuid not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint homework_status_submission_check check (
    (state = 'NOT_SUBMITTED' and submitted_on is null)
    or (state in ('SUBMITTED_ON_TIME', 'SUBMITTED_LATE') and submitted_on is not null)
  ),
  constraint homework_status_assignment_school_fk
    foreign key (homework_assignment_id, school_id)
    references public.homework_assignments (id, school_id) on delete restrict,
  constraint homework_status_student_school_fk
    foreign key (student_id, school_id)
    references public.students (id, school_id) on delete restrict,
  constraint homework_status_created_by_school_fk
    foreign key (created_by, school_id)
    references public.user_profiles (id, school_id) on delete restrict,
  constraint homework_status_updated_by_school_fk
    foreign key (updated_by, school_id)
    references public.user_profiles (id, school_id) on delete restrict,
  constraint homework_status_assignment_student_key
    unique (homework_assignment_id, student_id)
);

create index homework_status_student_idx
  on public.homework_student_statuses (student_id, homework_assignment_id);

create function public.validate_homework_assignment_integrity()
returns trigger language plpgsql volatile security definer set search_path = '' as $$
declare
  target_term public.terms%rowtype;
  target_course public.class_courses%rowtype;
begin
  if tg_op = 'UPDATE' and (
    new.school_id <> old.school_id or new.school_year_id <> old.school_year_id
    or new.term_id <> old.term_id or new.class_course_id <> old.class_course_id
    or new.created_by <> old.created_by
  ) then
    raise exception using errcode = '22023', message = 'homework relationship is immutable';
  end if;

  select * into target_term from public.terms
  where id = new.term_id and school_id = new.school_id
    and school_year_id = new.school_year_id for key share;
  select * into target_course from public.class_courses
  where id = new.class_course_id and school_id = new.school_id for key share;

  if target_term.id is null or target_course.id is null
    or target_course.school_year_id <> new.school_year_id
    or not target_course.is_active
    or new.assigned_on not between target_term.start_date and target_term.end_date
    or new.due_on not between target_term.start_date and target_term.end_date then
    raise exception using errcode = '22023', message = 'homework input rejected';
  end if;

  if tg_op = 'UPDATE' and new.due_on <> old.due_on and exists (
    select 1 from public.homework_student_statuses as status
    where status.homework_assignment_id = new.id and not exists (
      select 1 from public.enrollments as enrollment
      where enrollment.student_id = status.student_id
        and enrollment.school_id = new.school_id
        and enrollment.school_year_id = new.school_year_id
        and enrollment.class_id = target_course.class_id
        and new.due_on between enrollment.starts_on
          and coalesce(enrollment.ends_on, new.due_on)
    )
  ) then
    raise exception using errcode = '22023', message = 'homework date would invalidate a recorded status';
  end if;

  return new;
end;
$$;

create function public.validate_homework_status_integrity()
returns trigger language plpgsql volatile security definer set search_path = '' as $$
declare
  target_homework public.homework_assignments%rowtype;
  target_class_id uuid;
begin
  if tg_op = 'UPDATE' and (
    new.school_id <> old.school_id
    or new.homework_assignment_id <> old.homework_assignment_id
    or new.student_id <> old.student_id or new.created_by <> old.created_by
  ) then
    raise exception using errcode = '22023', message = 'homework status relationship is immutable';
  end if;

  select * into target_homework from public.homework_assignments
  where id = new.homework_assignment_id and school_id = new.school_id and is_active
  for key share;
  select class_id into target_class_id from public.class_courses
  where id = target_homework.class_course_id and school_id = new.school_id;

  if target_homework.id is null or not exists (
    select 1 from public.students as student
    join public.enrollments as enrollment
      on enrollment.student_id = student.id and enrollment.school_id = student.school_id
    where student.id = new.student_id and student.school_id = new.school_id
      and student.is_active
      and enrollment.school_year_id = target_homework.school_year_id
      and enrollment.class_id = target_class_id
      and target_homework.due_on between enrollment.starts_on
        and coalesce(enrollment.ends_on, target_homework.due_on)
  ) or (new.state = 'SUBMITTED_ON_TIME' and new.submitted_on > target_homework.due_on)
    or (new.state = 'SUBMITTED_LATE' and new.submitted_on <= target_homework.due_on) then
    raise exception using errcode = '22023', message = 'homework status input rejected';
  end if;

  return new;
end;
$$;

create trigger homework_assignments_validate
before insert or update on public.homework_assignments
for each row execute function public.validate_homework_assignment_integrity();
create trigger homework_assignments_set_updated_at
before update on public.homework_assignments
for each row execute function public.set_updated_at();
create trigger homework_statuses_validate
before insert or update on public.homework_student_statuses
for each row execute function public.validate_homework_status_integrity();
create trigger homework_statuses_set_updated_at
before update on public.homework_student_statuses
for each row execute function public.set_updated_at();

alter table public.homework_assignments enable row level security;
alter table public.homework_student_statuses enable row level security;
revoke all on table public.homework_assignments, public.homework_student_statuses
from anon, authenticated;
grant select on table public.homework_assignments, public.homework_student_statuses
to authenticated;

create policy homework_assignments_select_authorized
on public.homework_assignments for select to authenticated using (
  school_id = (select public.current_school_id()) and (
    (select public.is_school_admin(school_id))
    or (select public.is_teacher_assigned(class_course_id))
  )
);
create policy homework_statuses_select_authorized
on public.homework_student_statuses for select to authenticated using (
  school_id = (select public.current_school_id()) and exists (
    select 1 from public.homework_assignments as homework
    where homework.id = homework_assignment_id and (
      (select public.is_school_admin(school_id))
      or (select public.is_teacher_assigned(homework.class_course_id))
    )
  )
);

create function public.create_homework_assignment(
  target_class_course_id uuid,
  target_term_id uuid,
  homework_title text,
  homework_description text,
  target_assigned_on date,
  target_due_on date
) returns uuid language plpgsql volatile security definer set search_path = '' as $$
declare
  caller_school_id uuid;
  caller_role public.app_role;
  created_id uuid;
begin
  select school_id, role into caller_school_id, caller_role
  from public.user_profiles where id = auth.uid() and active;
  if caller_school_id is null or not (
    caller_role = 'ADMIN' or public.is_teacher_assigned(target_class_course_id)
  ) then
    raise exception using errcode = '42501', message = 'homework workflow rejected';
  end if;

  insert into public.homework_assignments (
    school_id, school_year_id, term_id, class_course_id, title, description,
    assigned_on, due_on, created_by, updated_by
  )
  select caller_school_id, class_course.school_year_id, target_term_id,
    class_course.id, homework_title, nullif(homework_description, ''),
    target_assigned_on, target_due_on, auth.uid(), auth.uid()
  from public.class_courses as class_course
  where class_course.id = target_class_course_id
    and class_course.school_id = caller_school_id and class_course.is_active
  returning id into created_id;

  if created_id is null then
    raise exception using errcode = 'P0001', message = 'homework workflow rejected';
  end if;
  return created_id;
exception when check_violation or foreign_key_violation then
  raise exception using errcode = '22023', message = 'homework input rejected';
end;
$$;

create function public.update_homework_assignment(
  target_homework_id uuid,
  homework_title text,
  homework_description text,
  target_assigned_on date,
  target_due_on date,
  homework_is_active boolean
) returns void language plpgsql volatile security definer set search_path = '' as $$
declare
  caller_school_id uuid;
  caller_role public.app_role;
  target_course uuid;
  affected integer;
begin
  select school_id, role into caller_school_id, caller_role
  from public.user_profiles where id = auth.uid() and active;
  select class_course_id into target_course from public.homework_assignments
  where id = target_homework_id and school_id = caller_school_id;
  if target_course is null or not (
    caller_role = 'ADMIN' or public.is_teacher_assigned(target_course)
  ) then
    raise exception using errcode = '42501', message = 'homework workflow rejected';
  end if;

  update public.homework_assignments set
    title = homework_title,
    description = nullif(homework_description, ''),
    assigned_on = target_assigned_on,
    due_on = target_due_on,
    is_active = homework_is_active,
    updated_by = auth.uid()
  where id = target_homework_id and school_id = caller_school_id;
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception using errcode = 'P0001', message = 'homework workflow rejected';
  end if;
exception when check_violation or foreign_key_violation then
  raise exception using errcode = '22023', message = 'homework input rejected';
end;
$$;

create function public.save_homework_statuses(
  target_homework_id uuid,
  target_student_ids uuid[],
  target_states public.homework_state[],
  target_submitted_on date[]
) returns integer language plpgsql volatile security definer set search_path = '' as $$
declare
  caller_school_id uuid;
  caller_role public.app_role;
  target_course uuid;
  item record;
  saved integer := 0;
begin
  select school_id, role into caller_school_id, caller_role
  from public.user_profiles where id = auth.uid() and active;
  select class_course_id into target_course from public.homework_assignments
  where id = target_homework_id and school_id = caller_school_id and is_active
  for update;
  if target_course is null or not (
    caller_role = 'ADMIN' or public.is_teacher_assigned(target_course)
  ) then
    raise exception using errcode = '42501', message = 'homework status workflow rejected';
  end if;
  if target_student_ids is null or target_states is null or target_submitted_on is null
    or cardinality(target_student_ids) <> cardinality(target_states)
    or cardinality(target_student_ids) <> cardinality(target_submitted_on)
    or cardinality(target_student_ids) < 1
    or cardinality(target_student_ids) <>
      cardinality(array(select distinct unnest(target_student_ids))) then
    raise exception using errcode = '22023', message = 'homework status input rejected';
  end if;

  for item in
    select student_id, state, submitted_on
    from unnest(target_student_ids, target_states, target_submitted_on)
      as entry(student_id, state, submitted_on)
  loop
    if item.student_id is null or item.state is null then
      raise exception using errcode = '22023', message = 'homework status input rejected';
    end if;
    insert into public.homework_student_statuses (
      school_id, homework_assignment_id, student_id, state, submitted_on,
      created_by, updated_by
    ) values (
      caller_school_id, target_homework_id, item.student_id, item.state,
      item.submitted_on, auth.uid(), auth.uid()
    ) on conflict (homework_assignment_id, student_id) do update set
      state = excluded.state,
      submitted_on = excluded.submitted_on,
      updated_by = auth.uid();
    saved := saved + 1;
  end loop;
  return saved;
exception when check_violation or unique_violation or foreign_key_violation then
  raise exception using errcode = '22023', message = 'homework status input rejected';
end;
$$;

create function public.current_homework_streak(
  target_class_course_id uuid,
  target_student_id uuid,
  as_of_date date default current_date
) returns integer language sql stable security definer set search_path = '' as $$
  with ordered as (
    select status.state,
      row_number() over (
        order by homework.due_on desc, homework.assigned_on desc, homework.id desc
      ) as position
    from public.homework_assignments as homework
    left join public.homework_student_statuses as status
      on status.homework_assignment_id = homework.id
      and status.student_id = target_student_id
    join public.class_courses as class_course
      on class_course.id = homework.class_course_id
      and class_course.school_id = homework.school_id
    where homework.class_course_id = target_class_course_id
      and homework.is_active and homework.due_on <= as_of_date
      and exists (
        select 1 from public.enrollments as enrollment
        where enrollment.student_id = target_student_id
          and enrollment.school_id = homework.school_id
          and enrollment.school_year_id = homework.school_year_id
          and enrollment.class_id = class_course.class_id
          and homework.due_on between enrollment.starts_on
            and coalesce(enrollment.ends_on, homework.due_on)
      )
  )
  select count(*)::integer from ordered
  where state = 'NOT_SUBMITTED'
    and position < coalesce((
      select min(position) from ordered where state is distinct from 'NOT_SUBMITTED'
    ), 2147483647);
$$;

create function public.list_homework_attention(as_of_date date default current_date)
returns table (
  class_course_id uuid,
  student_id uuid,
  student_first_name text,
  student_last_name text,
  current_streak integer
) language sql stable security definer set search_path = '' as $$
  select distinct homework.class_course_id, student.id, student.first_name,
    student.last_name,
    public.current_homework_streak(homework.class_course_id, student.id, as_of_date)
  from public.homework_assignments as homework
  join public.class_courses as class_course
    on class_course.id = homework.class_course_id and class_course.school_id = homework.school_id
  join public.enrollments as enrollment
    on enrollment.school_id = homework.school_id
    and enrollment.school_year_id = homework.school_year_id
    and enrollment.class_id = class_course.class_id
    and homework.due_on between enrollment.starts_on and coalesce(enrollment.ends_on, homework.due_on)
  join public.students as student
    on student.id = enrollment.student_id and student.school_id = enrollment.school_id
  where homework.school_id = public.current_school_id()
    and homework.is_active and homework.due_on <= as_of_date and student.is_active
    and (
      public.is_school_admin(homework.school_id)
      or public.is_teacher_assigned(homework.class_course_id)
    )
    and public.current_homework_streak(homework.class_course_id, student.id, as_of_date) >= 3;
$$;

revoke all on function public.validate_homework_assignment_integrity(),
  public.validate_homework_status_integrity(),
  public.current_homework_streak(uuid, uuid, date)
from public, anon, authenticated;
revoke all on function public.create_homework_assignment(uuid, uuid, text, text, date, date),
  public.update_homework_assignment(uuid, text, text, date, date, boolean),
  public.save_homework_statuses(uuid, uuid[], public.homework_state[], date[]),
  public.list_homework_attention(date)
from public, anon;
grant execute on function public.create_homework_assignment(uuid, uuid, text, text, date, date),
  public.update_homework_assignment(uuid, text, text, date, date, boolean),
  public.save_homework_statuses(uuid, uuid[], public.homework_state[], date[]),
  public.list_homework_attention(date)
to authenticated;

comment on table public.homework_assignments is
  'Audited shared homework assignments for one school-year ClassCourse.';
comment on table public.homework_student_statuses is
  'Current audited explicit homework state; absence of a row means not recorded.';
comment on function public.list_homework_attention(date) is
  'Authorized derived projection for current consecutive non-submission streaks of at least three.';
