-- Temporary test-only self-signup boundary for the current single-school phase.
-- Remove this function before introducing multi-school onboarding or a public pilot.

create function public.claim_test_teacher_profile(
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
  target_school_id uuid;
  school_count bigint;
  normalized_display_name text := btrim(teacher_display_name);
begin
  if caller_id is null
    or normalized_display_name is null
    or char_length(normalized_display_name) not between 1 and 120 then
    raise exception using
      errcode = '22023',
      message = 'test teacher signup rejected';
  end if;

  if not exists (
    select 1
    from auth.users as target_user
    where target_user.id = caller_id
      and coalesce(
        (target_user.raw_user_meta_data ->> 'suivora_test_signup')::boolean,
        false
      )
  ) then
    raise exception using
      errcode = '42501',
      message = 'test teacher signup rejected';
  end if;

  select count(*)
  into school_count
  from public.schools;

  select school.id
  into target_school_id
  from public.schools as school
  limit 1;

  if school_count <> 1 or target_school_id is null then
    raise exception using
      errcode = 'P0001',
      message = 'test teacher signup unavailable';
  end if;

  insert into public.user_profiles (id, school_id, role, active, display_name)
  values (
    caller_id,
    target_school_id,
    'TEACHER'::public.app_role,
    true,
    normalized_display_name
  );
exception
  when unique_violation or foreign_key_violation or invalid_text_representation then
    raise exception using
      errcode = 'P0001',
      message = 'test teacher signup rejected';
end
$$;

revoke all on function public.claim_test_teacher_profile(text)
  from public, anon;

grant execute on function public.claim_test_teacher_profile(text)
  to authenticated;

comment on function public.claim_test_teacher_profile(text) is
  'Temporary test-only self-signup: assigns a server-marked Auth identity as an active TEACHER when exactly one school exists.';
