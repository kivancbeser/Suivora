-- Suivora school-scoped authorization foundation.
--
-- These helpers bypass user_profiles RLS only to expose the current active
-- user's school and role predicates. Without SECURITY DEFINER, the
-- user_profiles SELECT policy would recurse while trying to authorize itself.
-- They return no unrelated profile data and use an empty search_path.

create function public.current_school_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select profile.school_id
  from public.user_profiles as profile
  where profile.id = (select auth.uid())
    and profile.active
  limit 1
$$;

create function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select profile.role
  from public.user_profiles as profile
  where profile.id = (select auth.uid())
    and profile.active
  limit 1
$$;

create function public.is_school_admin(target_school_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    exists (
      select 1
      from public.user_profiles as profile
      where profile.id = (select auth.uid())
        and profile.school_id = target_school_id
        and profile.role = 'ADMIN'::public.app_role
        and profile.active
    ),
    false
  )
$$;

revoke all on function public.current_school_id() from public, anon;
revoke all on function public.current_app_role() from public, anon;
revoke all on function public.is_school_admin(uuid) from public, anon;

grant execute on function public.current_school_id() to authenticated;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_school_admin(uuid) to authenticated;

grant select on table public.schools to authenticated;
grant select on table public.user_profiles to authenticated;
grant select on table public.school_years to authenticated;
grant select on table public.terms to authenticated;

grant insert (school_id, label, start_date, end_date, active)
  on table public.school_years to authenticated;
grant update (label, start_date, end_date, active)
  on table public.school_years to authenticated;

grant insert (school_id, school_year_id, semester_number, start_date, end_date)
  on table public.terms to authenticated;
grant update (school_year_id, semester_number, start_date, end_date)
  on table public.terms to authenticated;

create policy schools_select_own
on public.schools
for select
to authenticated
using (id = (select public.current_school_id()));

create policy user_profiles_select_self_or_school_admin
on public.user_profiles
for select
to authenticated
using (
  (
    id = (select auth.uid())
    and active
    and school_id = (select public.current_school_id())
  )
  or (select public.is_school_admin(school_id))
);

create policy school_years_select_own_school
on public.school_years
for select
to authenticated
using (school_id = (select public.current_school_id()));

create policy school_years_insert_own_school_admin
on public.school_years
for insert
to authenticated
with check (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
);

create policy school_years_update_own_school_admin
on public.school_years
for update
to authenticated
using (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
)
with check (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
);

create policy terms_select_own_school
on public.terms
for select
to authenticated
using (school_id = (select public.current_school_id()));

create policy terms_insert_own_school_admin
on public.terms
for insert
to authenticated
with check (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
);

create policy terms_update_own_school_admin
on public.terms
for update
to authenticated
using (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
)
with check (
  school_id = (select public.current_school_id())
  and (select public.is_school_admin(school_id))
);

comment on function public.current_school_id() is
  'Returns the active authenticated profile school ID without recursive RLS evaluation.';
comment on function public.current_app_role() is
  'Returns the active authenticated profile application role without using JWT metadata.';
comment on function public.is_school_admin(uuid) is
  'Checks active ADMIN membership for one school without recursive profile RLS evaluation.';
