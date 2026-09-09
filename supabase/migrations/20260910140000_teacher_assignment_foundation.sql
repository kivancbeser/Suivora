-- Shared ClassCourse teacher assignments and assignment-scoped read access.

alter table public.user_profiles
  add constraint user_profiles_id_school_key unique (id, school_id);

alter table public.class_courses
  add constraint class_courses_id_school_key unique (id, school_id);

create table public.teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete restrict,
  class_course_id uuid not null,
  teacher_id uuid not null,
  weekly_periods smallint not null,
  is_active boolean not null default true,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint teacher_assignments_weekly_periods_check
    check (weekly_periods between 1 and 40),
  constraint teacher_assignments_class_course_school_fk
    foreign key (class_course_id, school_id)
    references public.class_courses (id, school_id)
    on delete restrict,
  constraint teacher_assignments_teacher_school_fk
    foreign key (teacher_id, school_id)
    references public.user_profiles (id, school_id)
    on delete restrict,
  constraint teacher_assignments_teacher_class_course_key
    unique (teacher_id, class_course_id)
);

create index teacher_assignments_school_id_idx
  on public.teacher_assignments (school_id);
create index teacher_assignments_class_course_active_idx
  on public.teacher_assignments (class_course_id, teacher_id)
  where is_active;
create index teacher_assignments_teacher_active_idx
  on public.teacher_assignments (teacher_id, class_course_id)
  where is_active;

create function public.validate_teacher_assignment()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  class_course_capacity smallint;
  class_course_active boolean;
  teacher_has_role boolean;
  teacher_is_active boolean;
  allocated_periods integer;
begin
  if tg_op = 'UPDATE' and (
    new.id is distinct from old.id
    or new.school_id is distinct from old.school_id
    or new.class_course_id is distinct from old.class_course_id
    or new.teacher_id is distinct from old.teacher_id
  ) then
    raise exception using errcode = '22023', message = 'teacher assignment relationship is immutable';
  end if;

  select class_course.weekly_periods, class_course.is_active
  into class_course_capacity, class_course_active
  from public.class_courses as class_course
  where class_course.id = new.class_course_id
    and class_course.school_id = new.school_id
  for update;

  if class_course_capacity is null then
    raise exception using errcode = '23503', message = 'teacher assignment parent rejected';
  end if;

  select profile.role = 'TEACHER'::public.app_role, profile.active
  into teacher_has_role, teacher_is_active
  from public.user_profiles as profile
  where profile.id = new.teacher_id
    and profile.school_id = new.school_id;

  if not coalesce(teacher_has_role, false)
     or ((tg_op = 'INSERT' or new.is_active) and not coalesce(teacher_is_active, false)) then
    raise exception using errcode = '22023', message = 'teacher assignment target rejected';
  end if;

  if new.is_active and not class_course_active then
    raise exception using errcode = '22023', message = 'teacher assignment target rejected';
  end if;

  if new.is_active then
    select coalesce(sum(assignment.weekly_periods), 0)
    into allocated_periods
    from public.teacher_assignments as assignment
    where assignment.class_course_id = new.class_course_id
      and assignment.school_id = new.school_id
      and assignment.is_active
      and assignment.id <> new.id;

    if allocated_periods + new.weekly_periods > class_course_capacity then
      raise exception using errcode = '22023', message = 'teacher assignment capacity exceeded';
    end if;
  end if;

  return new;
end;
$$;

create function public.protect_class_course_assignment_capacity()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  allocated_periods integer;
begin
  if new.weekly_periods is distinct from old.weekly_periods
     or (old.is_active and not new.is_active) then
    select coalesce(sum(assignment.weekly_periods), 0)
    into allocated_periods
    from public.teacher_assignments as assignment
    where assignment.class_course_id = new.id
      and assignment.school_id = new.school_id
      and assignment.is_active;

    if new.weekly_periods < allocated_periods then
      raise exception using errcode = '22023', message = 'class course assignment capacity rejected';
    end if;

    if old.is_active and not new.is_active and allocated_periods > 0 then
      raise exception using errcode = '22023', message = 'class course has active teacher assignments';
    end if;
  end if;

  return new;
end;
$$;

create trigger teacher_assignments_validate
before insert or update on public.teacher_assignments
for each row execute function public.validate_teacher_assignment();

create trigger teacher_assignments_set_updated_at
before update on public.teacher_assignments
for each row execute function public.set_updated_at();

create trigger class_courses_protect_assignment_capacity
before update of weekly_periods, is_active on public.class_courses
for each row execute function public.protect_class_course_assignment_capacity();

revoke all on function public.validate_teacher_assignment() from public, anon, authenticated;
revoke all on function public.protect_class_course_assignment_capacity() from public, anon, authenticated;

create function public.is_teacher_assigned(target_class_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(exists (
    select 1
    from public.user_profiles as profile
    join public.teacher_assignments as assignment
      on assignment.teacher_id = profile.id
     and assignment.school_id = profile.school_id
     and assignment.class_course_id = target_class_course_id
     and assignment.is_active
    join public.class_courses as class_course
      on class_course.id = assignment.class_course_id
     and class_course.school_id = assignment.school_id
     and class_course.is_active
    join public.classes as class
      on class.id = class_course.class_id
     and class.school_id = class_course.school_id
     and class.school_year_id = class_course.school_year_id
     and class.is_active
    join public.courses as course
      on course.id = class_course.course_id
     and course.school_id = class_course.school_id
     and course.is_active
    where profile.id = (select auth.uid())
      and profile.role = 'TEACHER'::public.app_role
      and profile.active
  ), false)
$$;

revoke all on function public.is_teacher_assigned(uuid) from public, anon;
grant execute on function public.is_teacher_assigned(uuid) to authenticated;

alter table public.teacher_assignments enable row level security;
revoke all on table public.teacher_assignments from anon, authenticated;
grant select on table public.teacher_assignments to authenticated;
grant insert (school_id, class_course_id, teacher_id, weekly_periods, is_active)
  on table public.teacher_assignments to authenticated;
grant update (weekly_periods, is_active)
  on table public.teacher_assignments to authenticated;

create policy teacher_assignments_select_admin
on public.teacher_assignments for select to authenticated
using (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
);

create policy teacher_assignments_select_own_active
on public.teacher_assignments for select to authenticated
using (
  teacher_id = (select auth.uid())
  and is_active
  and (select public.is_teacher_assigned(class_course_id))
);

create policy teacher_assignments_insert_admin
on public.teacher_assignments for insert to authenticated
with check (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
);

create policy teacher_assignments_update_admin
on public.teacher_assignments for update to authenticated
using (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
)
with check (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
);

create policy class_courses_select_assigned_teacher
on public.class_courses for select to authenticated
using ((select public.is_teacher_assigned(id)));

create policy classes_select_assigned_teacher
on public.classes for select to authenticated
using (
  exists (
    select 1
    from public.class_courses as class_course
    where class_course.class_id = classes.id
      and class_course.school_id = classes.school_id
      and (select public.is_teacher_assigned(class_course.id))
  )
);

create policy courses_select_assigned_teacher
on public.courses for select to authenticated
using (
  exists (
    select 1
    from public.class_courses as class_course
    where class_course.course_id = courses.id
      and class_course.school_id = courses.school_id
      and (select public.is_teacher_assigned(class_course.id))
  )
);

create policy enrollments_select_assigned_teacher
on public.enrollments for select to authenticated
using (
  exists (
    select 1
    from public.class_courses as class_course
    where class_course.class_id = enrollments.class_id
      and class_course.school_id = enrollments.school_id
      and class_course.school_year_id = enrollments.school_year_id
      and (select public.is_teacher_assigned(class_course.id))
  )
);

create policy students_select_assigned_teacher
on public.students for select to authenticated
using (
  exists (
    select 1
    from public.enrollments as enrollment
    join public.class_courses as class_course
      on class_course.class_id = enrollment.class_id
     and class_course.school_id = enrollment.school_id
     and class_course.school_year_id = enrollment.school_year_id
    where enrollment.student_id = students.id
      and enrollment.school_id = students.school_id
      and (select public.is_teacher_assigned(class_course.id))
  )
);

create function public.admin_create_teacher_assignment(
  target_teacher_id uuid,
  target_class_course_id uuid,
  assigned_weekly_periods smallint
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_school_id uuid;
  created_assignment_id uuid;
begin
  select profile.school_id
  into caller_school_id
  from public.user_profiles as profile
  where profile.id = auth.uid()
    and profile.role = 'ADMIN'::public.app_role
    and profile.active;

  if caller_school_id is null then
    raise exception using errcode = '42501', message = 'teacher assignment workflow rejected';
  end if;

  if target_teacher_id is null
     or target_class_course_id is null
     or assigned_weekly_periods is null
     or assigned_weekly_periods not between 1 and 40 then
    raise exception using errcode = '22023', message = 'teacher assignment input rejected';
  end if;

  if not exists (
    select 1 from public.user_profiles as profile
    where profile.id = target_teacher_id
      and profile.school_id = caller_school_id
      and profile.role = 'TEACHER'::public.app_role
      and profile.active
  ) or not exists (
    select 1 from public.class_courses as class_course
    where class_course.id = target_class_course_id
      and class_course.school_id = caller_school_id
      and class_course.is_active
  ) then
    raise exception using errcode = 'P0001', message = 'teacher assignment workflow rejected';
  end if;

  insert into public.teacher_assignments (
    school_id, class_course_id, teacher_id, weekly_periods, is_active
  ) values (
    caller_school_id, target_class_course_id, target_teacher_id, assigned_weekly_periods, true
  ) returning id into created_assignment_id;

  return created_assignment_id;
exception
  when check_violation or unique_violation or foreign_key_violation then
    raise exception using errcode = '22023', message = 'teacher assignment input rejected';
end;
$$;

create function public.admin_update_teacher_assignment(
  target_assignment_id uuid,
  assigned_weekly_periods smallint,
  assignment_is_active boolean
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_school_id uuid;
  affected_rows integer;
begin
  select profile.school_id
  into caller_school_id
  from public.user_profiles as profile
  where profile.id = auth.uid()
    and profile.role = 'ADMIN'::public.app_role
    and profile.active;

  if caller_school_id is null then
    raise exception using errcode = '42501', message = 'teacher assignment workflow rejected';
  end if;

  if target_assignment_id is null
     or assigned_weekly_periods is null
     or assignment_is_active is null
     or assigned_weekly_periods not between 1 and 40 then
    raise exception using errcode = '22023', message = 'teacher assignment input rejected';
  end if;

  update public.teacher_assignments as assignment
  set weekly_periods = assigned_weekly_periods,
      is_active = assignment_is_active
  where assignment.id = target_assignment_id
    and assignment.school_id = caller_school_id;

  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception using errcode = 'P0001', message = 'teacher assignment workflow rejected';
  end if;
exception
  when check_violation or foreign_key_violation then
    raise exception using errcode = '22023', message = 'teacher assignment input rejected';
end;
$$;

revoke all on function public.admin_create_teacher_assignment(uuid, uuid, smallint) from public, anon;
revoke all on function public.admin_update_teacher_assignment(uuid, smallint, boolean) from public, anon;
grant execute on function public.admin_create_teacher_assignment(uuid, uuid, smallint) to authenticated;
grant execute on function public.admin_update_teacher_assignment(uuid, smallint, boolean) to authenticated;

comment on table public.teacher_assignments is
  'School-scoped teacher access to one shared ClassCourse; inactive rows preserve lifecycle history.';
comment on function public.is_teacher_assigned(uuid) is
  'Checks active teacher profile, assignment, ClassCourse, class, and course without trusting JWT metadata.';
comment on function public.validate_teacher_assignment() is
  'Serializes assignment changes on the ClassCourse row and enforces teacher eligibility and active capacity.';
