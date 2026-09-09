-- School-owned student identities and immutable historical class enrollments.
-- Teacher access remains denied until assignment-scoped authorization exists.

create extension if not exists btree_gist with schema extensions;

create table public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete restrict,
  first_name text not null,
  last_name text not null,
  student_code text,
  is_active boolean not null default true,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint students_first_name_check check (
    first_name = btrim(first_name)
    and char_length(first_name) between 1 and 100
    and first_name !~ '[[:cntrl:]]'
  ),
  constraint students_last_name_check check (
    last_name = btrim(last_name)
    and char_length(last_name) between 1 and 100
    and last_name !~ '[[:cntrl:]]'
  ),
  constraint students_student_code_check check (
    student_code is null
    or (
      student_code = btrim(student_code)
      and char_length(student_code) between 1 and 50
      and student_code !~ '[[:cntrl:]]'
    )
  ),
  constraint students_id_school_key unique (id, school_id)
);

create unique index students_school_student_code_ci_key
  on public.students (school_id, lower(student_code))
  where student_code is not null;
create index students_school_name_idx
  on public.students (school_id, last_name, first_name, id);
create index students_school_active_name_idx
  on public.students (school_id, last_name, first_name, id)
  where is_active;

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete restrict,
  school_year_id uuid not null,
  student_id uuid not null,
  class_id uuid not null,
  starts_on date not null,
  ends_on date,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint enrollments_date_order_check
    check (ends_on is null or starts_on <= ends_on),
  constraint enrollments_school_year_school_fk
    foreign key (school_year_id, school_id)
    references public.school_years (id, school_id)
    on delete restrict,
  constraint enrollments_student_school_fk
    foreign key (student_id, school_id)
    references public.students (id, school_id)
    on delete restrict,
  constraint enrollments_class_school_year_fk
    foreign key (class_id, school_id, school_year_id)
    references public.classes (id, school_id, school_year_id)
    on delete restrict,
  constraint enrollments_student_year_no_overlap
    exclude using gist (
      student_id with =,
      school_year_id with =,
      daterange(starts_on, ends_on, '[]') with &&
    )
);

create index enrollments_student_year_idx
  on public.enrollments (student_id, school_year_id, starts_on);
create index enrollments_current_student_year_idx
  on public.enrollments (student_id, school_year_id)
  where ends_on is null;
create index enrollments_class_roster_idx
  on public.enrollments (class_id, starts_on, ends_on, student_id);
create index enrollments_school_year_roster_idx
  on public.enrollments (school_id, school_year_id, class_id, student_id);

create function public.validate_enrollment_school_year_dates()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  year_start date;
  year_end date;
begin
  select school_year.start_date, school_year.end_date
  into year_start, year_end
  from public.school_years as school_year
  where school_year.id = new.school_year_id
    and school_year.school_id = new.school_id
  for key share;

  if year_start is null
     or new.starts_on < year_start
     or new.starts_on > year_end
     or (new.ends_on is not null and new.ends_on > year_end) then
    raise check_violation using
      constraint = 'enrollments_school_year_dates_check',
      message = 'Enrollment dates must remain within the school year.';
  end if;

  return new;
end;
$$;

revoke all on function public.validate_enrollment_school_year_dates() from public, anon, authenticated;

create trigger students_set_updated_at
before update on public.students
for each row execute function public.set_updated_at();

create trigger enrollments_validate_school_year_dates
before insert or update on public.enrollments
for each row execute function public.validate_enrollment_school_year_dates();

create trigger enrollments_set_updated_at
before update on public.enrollments
for each row execute function public.set_updated_at();

alter table public.students enable row level security;
alter table public.enrollments enable row level security;

revoke all on table public.students from anon, authenticated;
revoke all on table public.enrollments from anon, authenticated;

grant select on table public.students, public.enrollments to authenticated;
grant insert (school_id, first_name, last_name, student_code, is_active)
  on table public.students to authenticated;
grant update (first_name, last_name, student_code, is_active)
  on table public.students to authenticated;
grant insert (school_id, school_year_id, student_id, class_id, starts_on, ends_on)
  on table public.enrollments to authenticated;
grant update (ends_on) on table public.enrollments to authenticated;

create policy students_select_own_school_admin
on public.students for select to authenticated
using (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
);
create policy students_insert_own_school_admin
on public.students for insert to authenticated
with check (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
);
create policy students_update_own_school_admin
on public.students for update to authenticated
using (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
)
with check (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
);

create policy enrollments_select_own_school_admin
on public.enrollments for select to authenticated
using (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
);
create policy enrollments_insert_own_school_admin
on public.enrollments for insert to authenticated
with check (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
);
create policy enrollments_update_own_school_admin
on public.enrollments for update to authenticated
using (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
)
with check (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
);

comment on table public.students is
  'Minimal school-owned student identity; names are stored as entered and no account is implied.';
comment on table public.enrollments is
  'Immutable historical class membership with inclusive dates; null ends_on means current/open.';
comment on constraint enrollments_student_year_no_overlap on public.enrollments is
  'Prevents inclusive enrollment ranges for one student from overlapping within a school year.';
comment on function public.validate_enrollment_school_year_dates() is
  'Ensures enrollment dates remain inside the locked same-school school-year boundary.';
