-- Establish the local-only teacher profile provisioning boundary.
-- Auth invitations remain a future, server-only application concern.

alter table public.user_profiles
  add column display_name text;

alter table public.user_profiles
  add constraint user_profiles_display_name_check
  check (
    (display_name is null and role = 'ADMIN'::public.app_role)
    or (
      display_name is not null
      and display_name = btrim(display_name)
      and char_length(display_name) between 1 and 120
    )
  );

create function public.admin_provision_teacher_profile(
  target_user_id uuid,
  teacher_display_name text
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_school_id uuid;
  normalized_display_name text := btrim(teacher_display_name);
begin
  if normalized_display_name is null
    or char_length(normalized_display_name) not between 1 and 120 then
    raise exception using
      errcode = '22023',
      message = 'teacher profile input rejected';
  end if;

  select profile.school_id
  into caller_school_id
  from public.user_profiles as profile
  where profile.id = caller_id
    and profile.role = 'ADMIN'::public.app_role
    and profile.active;

  if caller_school_id is null or target_user_id is null or target_user_id = caller_id then
    raise exception using
      errcode = '42501',
      message = 'teacher profile operation rejected';
  end if;

  if not exists (
    select 1
    from auth.users as target_user
    where target_user.id = target_user_id
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'teacher profile operation rejected';
  end if;

  insert into public.user_profiles (id, school_id, role, active, display_name)
  values (
    target_user_id,
    caller_school_id,
    'TEACHER'::public.app_role,
    true,
    normalized_display_name
  );
exception
  when unique_violation or foreign_key_violation then
    raise exception using
      errcode = 'P0001',
      message = 'teacher profile operation rejected';
end
$$;

create function public.admin_update_teacher_profile(
  target_user_id uuid,
  teacher_display_name text,
  teacher_is_active boolean
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_school_id uuid;
  normalized_display_name text := btrim(teacher_display_name);
begin
  if normalized_display_name is null
    or char_length(normalized_display_name) not between 1 and 120
    or teacher_is_active is null then
    raise exception using
      errcode = '22023',
      message = 'teacher profile input rejected';
  end if;

  select profile.school_id
  into caller_school_id
  from public.user_profiles as profile
  where profile.id = auth.uid()
    and profile.role = 'ADMIN'::public.app_role
    and profile.active;

  if caller_school_id is null then
    raise exception using
      errcode = '42501',
      message = 'teacher profile operation rejected';
  end if;

  update public.user_profiles as target
  set display_name = normalized_display_name,
      active = teacher_is_active
  where target.id = target_user_id
    and target.school_id = caller_school_id
    and target.role = 'TEACHER'::public.app_role;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'teacher profile operation rejected';
  end if;
end
$$;

revoke all on function public.admin_provision_teacher_profile(uuid, text)
  from public, anon;
revoke all on function public.admin_update_teacher_profile(uuid, text, boolean)
  from public, anon;

grant execute on function public.admin_provision_teacher_profile(uuid, text)
  to authenticated;
grant execute on function public.admin_update_teacher_profile(uuid, text, boolean)
  to authenticated;

comment on column public.user_profiles.display_name is
  'Required normalized display name for TEACHER profiles; nullable only for legacy ADMIN profiles.';
comment on function public.admin_provision_teacher_profile(uuid, text) is
  'Creates one active same-school TEACHER profile for an existing Auth identity after active ADMIN authorization.';
comment on function public.admin_update_teacher_profile(uuid, text, boolean) is
  'Allows an active same-school ADMIN to rename, activate, or deactivate only a TEACHER profile.';
