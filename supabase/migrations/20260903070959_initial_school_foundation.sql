-- Suivora initial tenant and academic-calendar foundation.
--
-- Reversal order, if a future corrective migration needs to remove this
-- foundation: terms, school_years, user_profiles, schools, set_updated_at,
-- then app_role. Applied migrations must never be rewritten.

create type public.app_role as enum ('ADMIN', 'TEACHER');

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = statement_timestamp();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

create table public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) > 0),
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp()
);

create table public.user_profiles (
  id uuid primary key references auth.users (id) on delete restrict,
  school_id uuid not null references public.schools (id) on delete restrict,
  role public.app_role not null,
  active boolean not null default true,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp()
);

create index user_profiles_school_id_idx
  on public.user_profiles (school_id);

create table public.school_years (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete restrict,
  label text not null check (char_length(btrim(label)) > 0),
  start_date date not null,
  end_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint school_years_date_order check (start_date < end_date),
  constraint school_years_school_label_key unique (school_id, label),
  constraint school_years_id_school_id_key unique (id, school_id)
);

create index school_years_school_id_idx
  on public.school_years (school_id);

create table public.terms (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete restrict,
  school_year_id uuid not null,
  semester_number smallint not null,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint terms_semester_number_check check (semester_number in (1, 2)),
  constraint terms_date_order check (start_date <= end_date),
  constraint terms_school_year_semester_key
    unique (school_year_id, semester_number),
  constraint terms_school_year_school_fk
    foreign key (school_year_id, school_id)
    references public.school_years (id, school_id)
    on delete restrict
);

create index terms_school_id_idx
  on public.terms (school_id);

create index terms_school_year_id_idx
  on public.terms (school_year_id);

create trigger schools_set_updated_at
before update on public.schools
for each row execute function public.set_updated_at();

create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

create trigger school_years_set_updated_at
before update on public.school_years
for each row execute function public.set_updated_at();

create trigger terms_set_updated_at
before update on public.terms
for each row execute function public.set_updated_at();

alter table public.schools enable row level security;
alter table public.user_profiles enable row level security;
alter table public.school_years enable row level security;
alter table public.terms enable row level security;

revoke all on table public.schools from anon, authenticated;
revoke all on table public.user_profiles from anon, authenticated;
revoke all on table public.school_years from anon, authenticated;
revoke all on table public.terms from anon, authenticated;

comment on type public.app_role is
  'Active Suivora application roles. Student and parent accounts are deferred.';
comment on table public.user_profiles is
  'One school-scoped application profile for an authenticated user.';
comment on constraint terms_school_year_school_fk on public.terms is
  'Prevents a term from referencing a school year owned by another school.';
