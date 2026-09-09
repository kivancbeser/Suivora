-- Transactional ADMIN-only student workflows. These functions are the only
-- application boundary for dependent student/enrollment mutations.

create function public.admin_create_student_with_enrollment(
  student_first_name text,
  student_last_name text,
  student_code text,
  target_class_id uuid,
  enrollment_starts_on date
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_school_id uuid;
  target_school_year_id uuid;
  normalized_first_name text := btrim(student_first_name);
  normalized_last_name text := btrim(student_last_name);
  normalized_student_code text := nullif(btrim(student_code), '');
  created_student_id uuid;
begin
  select profile.school_id
  into caller_school_id
  from public.user_profiles as profile
  where profile.id = auth.uid()
    and profile.role = 'ADMIN'::public.app_role
    and profile.active;

  if caller_school_id is null then
    raise exception using errcode = '42501', message = 'student workflow rejected';
  end if;

  if normalized_first_name is null
     or char_length(normalized_first_name) not between 1 and 100
     or normalized_first_name ~ '[[:cntrl:]]'
     or normalized_last_name is null
     or char_length(normalized_last_name) not between 1 and 100
     or normalized_last_name ~ '[[:cntrl:]]'
     or (normalized_student_code is not null and (
       char_length(normalized_student_code) not between 1 and 50
       or normalized_student_code ~ '[[:cntrl:]]'
     ))
     or target_class_id is null
     or enrollment_starts_on is null then
    raise exception using errcode = '22023', message = 'student workflow input rejected';
  end if;

  select selected_class.school_year_id
  into target_school_year_id
  from public.classes as selected_class
  join public.school_years as selected_year
    on selected_year.id = selected_class.school_year_id
   and selected_year.school_id = selected_class.school_id
  where selected_class.id = target_class_id
    and selected_class.school_id = caller_school_id
    and selected_class.is_active
    and selected_year.active
  for share of selected_class, selected_year;

  if target_school_year_id is null then
    raise exception using errcode = 'P0001', message = 'student workflow rejected';
  end if;

  insert into public.students (school_id, first_name, last_name, student_code, is_active)
  values (caller_school_id, normalized_first_name, normalized_last_name, normalized_student_code, true)
  returning id into created_student_id;

  insert into public.enrollments (
    school_id, school_year_id, student_id, class_id, starts_on, ends_on
  ) values (
    caller_school_id, target_school_year_id, created_student_id, target_class_id,
    enrollment_starts_on, null
  );

  return created_student_id;
exception
  when check_violation or unique_violation or foreign_key_violation
    or exclusion_violation or not_null_violation then
    raise exception using errcode = '22023', message = 'student workflow input rejected';
end;
$$;

create function public.admin_update_student(
  target_student_id uuid,
  student_first_name text,
  student_last_name text,
  student_code text,
  student_is_active boolean
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_school_id uuid;
  normalized_first_name text := btrim(student_first_name);
  normalized_last_name text := btrim(student_last_name);
  normalized_student_code text := nullif(btrim(student_code), '');
begin
  select profile.school_id
  into caller_school_id
  from public.user_profiles as profile
  where profile.id = auth.uid()
    and profile.role = 'ADMIN'::public.app_role
    and profile.active;

  if caller_school_id is null then
    raise exception using errcode = '42501', message = 'student workflow rejected';
  end if;

  if target_student_id is null
     or normalized_first_name is null
     or char_length(normalized_first_name) not between 1 and 100
     or normalized_first_name ~ '[[:cntrl:]]'
     or normalized_last_name is null
     or char_length(normalized_last_name) not between 1 and 100
     or normalized_last_name ~ '[[:cntrl:]]'
     or student_is_active is null
     or (normalized_student_code is not null and (
       char_length(normalized_student_code) not between 1 and 50
       or normalized_student_code ~ '[[:cntrl:]]'
     )) then
    raise exception using errcode = '22023', message = 'student workflow input rejected';
  end if;

  perform 1
  from public.students as target
  where target.id = target_student_id
    and target.school_id = caller_school_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'student workflow rejected';
  end if;

  if not student_is_active and exists (
    select 1 from public.enrollments as enrollment
    where enrollment.student_id = target_student_id
      and enrollment.school_id = caller_school_id
      and enrollment.ends_on is null
  ) then
    raise exception using errcode = 'P0001', message = 'student workflow rejected';
  end if;

  update public.students
  set first_name = normalized_first_name,
      last_name = normalized_last_name,
      student_code = normalized_student_code,
      is_active = student_is_active
  where id = target_student_id
    and school_id = caller_school_id;
exception
  when check_violation or unique_violation or not_null_violation then
    raise exception using errcode = '22023', message = 'student workflow input rejected';
end;
$$;

create function public.admin_transfer_student(
  target_student_id uuid,
  target_class_id uuid,
  transfer_date date
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_school_id uuid;
  target_school_year_id uuid;
  current_enrollment_id uuid;
  current_class_id uuid;
  current_starts_on date;
  created_enrollment_id uuid;
begin
  select profile.school_id
  into caller_school_id
  from public.user_profiles as profile
  where profile.id = auth.uid()
    and profile.role = 'ADMIN'::public.app_role
    and profile.active;

  if caller_school_id is null then
    raise exception using errcode = '42501', message = 'student workflow rejected';
  end if;

  if target_student_id is null or target_class_id is null or transfer_date is null then
    raise exception using errcode = '22023', message = 'student workflow input rejected';
  end if;

  perform 1
  from public.students as target
  where target.id = target_student_id
    and target.school_id = caller_school_id
    and target.is_active
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'student workflow rejected';
  end if;

  select selected_class.school_year_id
  into target_school_year_id
  from public.classes as selected_class
  join public.school_years as selected_year
    on selected_year.id = selected_class.school_year_id
   and selected_year.school_id = selected_class.school_id
  where selected_class.id = target_class_id
    and selected_class.school_id = caller_school_id
    and selected_class.is_active
    and selected_year.active
    and transfer_date between selected_year.start_date and selected_year.end_date
  for share of selected_class, selected_year;

  if target_school_year_id is null then
    raise exception using errcode = 'P0001', message = 'student workflow rejected';
  end if;

  select enrollment.id, enrollment.class_id, enrollment.starts_on
  into current_enrollment_id, current_class_id, current_starts_on
  from public.enrollments as enrollment
  where enrollment.student_id = target_student_id
    and enrollment.school_id = caller_school_id
    and enrollment.school_year_id = target_school_year_id
    and enrollment.ends_on is null
  for update;

  if current_enrollment_id is null
     or current_class_id = target_class_id
     or transfer_date <= current_starts_on then
    raise exception using errcode = 'P0001', message = 'student workflow rejected';
  end if;

  update public.enrollments
  set ends_on = transfer_date - 1
  where id = current_enrollment_id;

  insert into public.enrollments (
    school_id, school_year_id, student_id, class_id, starts_on, ends_on
  ) values (
    caller_school_id, target_school_year_id, target_student_id, target_class_id,
    transfer_date, null
  ) returning id into created_enrollment_id;

  return created_enrollment_id;
exception
  when check_violation or unique_violation or foreign_key_violation
    or exclusion_violation or not_null_violation then
    raise exception using errcode = 'P0001', message = 'student workflow rejected';
end;
$$;

create function public.admin_close_current_enrollment(
  target_student_id uuid,
  enrollment_end_date date
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  caller_school_id uuid;
  open_enrollment_count integer;
  current_enrollment_id uuid;
  current_starts_on date;
begin
  select profile.school_id
  into caller_school_id
  from public.user_profiles as profile
  where profile.id = auth.uid()
    and profile.role = 'ADMIN'::public.app_role
    and profile.active;

  if caller_school_id is null then
    raise exception using errcode = '42501', message = 'student workflow rejected';
  end if;

  if target_student_id is null or enrollment_end_date is null then
    raise exception using errcode = '22023', message = 'student workflow input rejected';
  end if;

  perform 1
  from public.students as target
  where target.id = target_student_id
    and target.school_id = caller_school_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'student workflow rejected';
  end if;

  select count(*)::integer
  into open_enrollment_count
  from public.enrollments as enrollment
  where enrollment.student_id = target_student_id
    and enrollment.school_id = caller_school_id
    and enrollment.ends_on is null;

  if open_enrollment_count <> 1 then
    raise exception using errcode = 'P0001', message = 'student workflow rejected';
  end if;

  select enrollment.id, enrollment.starts_on
  into current_enrollment_id, current_starts_on
  from public.enrollments as enrollment
  where enrollment.student_id = target_student_id
    and enrollment.school_id = caller_school_id
    and enrollment.ends_on is null
  for update;

  if enrollment_end_date < current_starts_on then
    raise exception using errcode = '22023', message = 'student workflow input rejected';
  end if;

  update public.enrollments
  set ends_on = enrollment_end_date
  where id = current_enrollment_id;
exception
  when check_violation or not_null_violation then
    raise exception using errcode = '22023', message = 'student workflow input rejected';
end;
$$;

revoke all on function public.admin_create_student_with_enrollment(text, text, text, uuid, date) from public, anon;
revoke all on function public.admin_update_student(uuid, text, text, text, boolean) from public, anon;
revoke all on function public.admin_transfer_student(uuid, uuid, date) from public, anon;
revoke all on function public.admin_close_current_enrollment(uuid, date) from public, anon;

grant execute on function public.admin_create_student_with_enrollment(text, text, text, uuid, date) to authenticated;
grant execute on function public.admin_update_student(uuid, text, text, text, boolean) to authenticated;
grant execute on function public.admin_transfer_student(uuid, uuid, date) to authenticated;
grant execute on function public.admin_close_current_enrollment(uuid, date) to authenticated;

comment on function public.admin_create_student_with_enrollment(text, text, text, uuid, date) is
  'Atomically creates one active school-owned student and their initial open class enrollment for an active ADMIN.';
comment on function public.admin_update_student(uuid, text, text, text, boolean) is
  'Updates only same-school student identity fields; deactivation is rejected while an open enrollment exists.';
comment on function public.admin_transfer_student(uuid, uuid, date) is
  'Atomically closes the current same-year enrollment the day before transfer and opens the target-class enrollment.';
comment on function public.admin_close_current_enrollment(uuid, date) is
  'Closes exactly one same-school open enrollment without changing student active state.';
