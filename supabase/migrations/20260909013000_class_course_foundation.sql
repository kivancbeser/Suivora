-- Suivora shared classroom structure. ClassCourse is the school-year-specific
-- aggregate joining one class and one course. Teacher access remains deferred.

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete restrict,
  school_year_id uuid not null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint classes_name_check
    check (name = btrim(name) and char_length(name) between 1 and 120),
  constraint classes_school_year_school_fk
    foreign key (school_year_id, school_id)
    references public.school_years (id, school_id)
    on delete restrict,
  constraint classes_id_school_school_year_key
    unique (id, school_id, school_year_id)
);

create unique index classes_school_year_name_ci_key
  on public.classes (school_id, school_year_id, lower(name));
create index classes_school_id_idx on public.classes (school_id);
create index classes_school_year_id_idx on public.classes (school_year_id);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete restrict,
  name text not null,
  code text,
  is_active boolean not null default true,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint courses_name_check
    check (name = btrim(name) and char_length(name) between 1 and 120),
  constraint courses_code_check
    check (code is null or (code = btrim(code) and char_length(code) between 1 and 30)),
  constraint courses_id_school_key unique (id, school_id)
);

create unique index courses_school_name_ci_key
  on public.courses (school_id, lower(name));
create unique index courses_school_code_ci_key
  on public.courses (school_id, lower(code))
  where code is not null;
create index courses_school_id_idx on public.courses (school_id);

create table public.class_courses (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete restrict,
  school_year_id uuid not null,
  class_id uuid not null,
  course_id uuid not null,
  weekly_periods smallint not null,
  is_active boolean not null default true,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint class_courses_weekly_periods_check
    check (weekly_periods between 1 and 40),
  constraint class_courses_class_school_year_fk
    foreign key (class_id, school_id, school_year_id)
    references public.classes (id, school_id, school_year_id)
    on delete restrict,
  constraint class_courses_course_school_fk
    foreign key (course_id, school_id)
    references public.courses (id, school_id)
    on delete restrict,
  constraint class_courses_class_course_year_key
    unique (school_year_id, class_id, course_id)
);

create index class_courses_school_id_idx on public.class_courses (school_id);
create index class_courses_school_year_id_idx on public.class_courses (school_year_id);
create index class_courses_class_id_idx on public.class_courses (class_id);
create index class_courses_course_id_idx on public.class_courses (course_id);

create trigger classes_set_updated_at
before update on public.classes
for each row execute function public.set_updated_at();

create trigger courses_set_updated_at
before update on public.courses
for each row execute function public.set_updated_at();

create trigger class_courses_set_updated_at
before update on public.class_courses
for each row execute function public.set_updated_at();

alter table public.classes enable row level security;
alter table public.courses enable row level security;
alter table public.class_courses enable row level security;

revoke all on table public.classes from anon, authenticated;
revoke all on table public.courses from anon, authenticated;
revoke all on table public.class_courses from anon, authenticated;

grant select on table public.classes, public.courses, public.class_courses to authenticated;
grant insert (school_id, school_year_id, name, is_active)
  on table public.classes to authenticated;
grant update (school_year_id, name, is_active)
  on table public.classes to authenticated;
grant insert (school_id, name, code, is_active)
  on table public.courses to authenticated;
grant update (name, code, is_active)
  on table public.courses to authenticated;
grant insert (school_id, school_year_id, class_id, course_id, weekly_periods, is_active)
  on table public.class_courses to authenticated;
grant update (school_year_id, class_id, course_id, weekly_periods, is_active)
  on table public.class_courses to authenticated;

create policy classes_select_own_school_admin
on public.classes for select to authenticated
using (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
);
create policy classes_insert_own_school_admin
on public.classes for insert to authenticated
with check (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
);
create policy classes_update_own_school_admin
on public.classes for update to authenticated
using (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
)
with check (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
);

create policy courses_select_own_school_admin
on public.courses for select to authenticated
using (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
);
create policy courses_insert_own_school_admin
on public.courses for insert to authenticated
with check (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
);
create policy courses_update_own_school_admin
on public.courses for update to authenticated
using (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
)
with check (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
);

create policy class_courses_select_own_school_admin
on public.class_courses for select to authenticated
using (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
);
create policy class_courses_insert_own_school_admin
on public.class_courses for insert to authenticated
with check (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
);
create policy class_courses_update_own_school_admin
on public.class_courses for update to authenticated
using (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
)
with check (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
);

comment on table public.class_courses is
  'Central teaching aggregate joining one class and course for one school year.';
comment on column public.class_courses.weekly_periods is
  'Weekly lesson-period count, not a duration measured in clock hours.';
comment on constraint classes_school_year_school_fk on public.classes is
  'Prevents a class from referencing a school year owned by another school.';
comment on constraint class_courses_class_school_year_fk on public.class_courses is
  'Forces the ClassCourse school and school year to match its class.';
comment on constraint class_courses_course_school_fk on public.class_courses is
  'Forces the ClassCourse school to match its course.';
