begin;

create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

select extensions.ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.terms'::regclass and conname = 'terms_date_order' and contype = 'c'
  ),
  'strict term date constraint exists'
);
select extensions.ok(
  (select attnotnull from pg_attribute where attrelid = 'public.terms'::regclass and attname = 'semester_number'),
  'semester number remains required'
);
select extensions.ok(
  not exists (
    select 1 from pg_attribute
    where attrelid = 'public.terms'::regclass and attname in ('name', 'title', 'label') and not attisdropped
  ),
  'terms store no localized name, title, or label'
);
select extensions.ok(to_regprocedure('public.validate_term_calendar_integrity()') is not null, 'term validation function exists');
select extensions.ok(to_regprocedure('public.validate_school_year_calendar_integrity()') is not null, 'year validation function exists');
select extensions.ok(prosecdef, 'term validation is security definer')
from pg_proc where oid = 'public.validate_term_calendar_integrity()'::regprocedure;
select extensions.ok(prosecdef, 'year validation is security definer')
from pg_proc where oid = 'public.validate_school_year_calendar_integrity()'::regprocedure;
select extensions.is(pg_get_userbyid(proowner), 'postgres', 'term validation function is owned by postgres')
from pg_proc where oid = 'public.validate_term_calendar_integrity()'::regprocedure;
select extensions.is(pg_get_userbyid(proowner), 'postgres', 'year validation function is owned by postgres')
from pg_proc where oid = 'public.validate_school_year_calendar_integrity()'::regprocedure;
select extensions.is(provolatile, 'v'::"char", 'term validation function is explicitly volatile')
from pg_proc where oid = 'public.validate_term_calendar_integrity()'::regprocedure;
select extensions.is(provolatile, 'v'::"char", 'year validation function is explicitly volatile')
from pg_proc where oid = 'public.validate_school_year_calendar_integrity()'::regprocedure;
select extensions.is(proconfig, array['search_path=""'], 'term validation has empty search_path')
from pg_proc where oid = 'public.validate_term_calendar_integrity()'::regprocedure;
select extensions.is(proconfig, array['search_path=""'], 'year validation has empty search_path')
from pg_proc where oid = 'public.validate_school_year_calendar_integrity()'::regprocedure;
select extensions.ok(not has_function_privilege('public', 'public.validate_term_calendar_integrity()', 'execute'), 'PUBLIC cannot execute term trigger function');
select extensions.ok(not has_function_privilege('anon', 'public.validate_term_calendar_integrity()', 'execute'), 'anon cannot execute term trigger function');
select extensions.ok(not has_function_privilege('authenticated', 'public.validate_term_calendar_integrity()', 'execute'), 'authenticated cannot execute term trigger function');
select extensions.ok(not has_function_privilege('public', 'public.validate_school_year_calendar_integrity()', 'execute'), 'PUBLIC cannot execute year trigger function');
select extensions.ok(not has_function_privilege('anon', 'public.validate_school_year_calendar_integrity()', 'execute'), 'anon cannot execute year trigger function');
select extensions.ok(not has_function_privilege('authenticated', 'public.validate_school_year_calendar_integrity()', 'execute'), 'authenticated cannot execute year trigger function');
select extensions.ok(
  exists (
    select 1 from pg_trigger
    where tgrelid = 'public.terms'::regclass and tgname = 'terms_validate_calendar_integrity' and not tgisinternal
  ),
  'term validation trigger exists'
);
select extensions.ok(
  exists (
    select 1 from pg_trigger
    where tgrelid = 'public.school_years'::regclass and tgname = 'school_years_validate_calendar_integrity' and not tgisinternal
  ),
  'year validation trigger exists'
);

insert into public.schools (id, name) values
  ('81000000-0000-0000-0000-000000000001', 'École Calendrier A'),
  ('82000000-0000-0000-0000-000000000002', 'École Calendrier B');

insert into public.school_years (id, school_id, label, start_date, end_date) values
  ('81100000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001', 'A principal', '2026-09-01', '2027-06-30'),
  ('81100000-0000-0000-0000-000000000002', '81000000-0000-0000-0000-000000000001', 'A overlap', '2027-09-01', '2028-06-30'),
  ('81100000-0000-0000-0000-000000000003', '81000000-0000-0000-0000-000000000001', 'A reverse', '2028-09-01', '2029-06-30'),
  ('82100000-0000-0000-0000-000000000001', '82000000-0000-0000-0000-000000000002', 'B principal', '2026-09-01', '2027-06-30');

select extensions.lives_ok(
  $$insert into public.terms (id, school_id, school_year_id, semester_number, start_date, end_date) values ('81110000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001', '81100000-0000-0000-0000-000000000001', 1, '2026-09-01', '2027-01-31')$$,
  'valid Semester 1 inserts'
);
select extensions.lives_ok(
  $$insert into public.terms (id, school_id, school_year_id, semester_number, start_date, end_date) values ('81120000-0000-0000-0000-000000000002', '81000000-0000-0000-0000-000000000001', '81100000-0000-0000-0000-000000000001', 2, '2027-01-31', '2027-06-30')$$,
  'valid back-to-back Semester 2 inserts'
);
select extensions.throws_ok(
  $$insert into public.terms (school_id, school_year_id, semester_number, start_date, end_date) values ('81000000-0000-0000-0000-000000000001', '81100000-0000-0000-0000-000000000002', 1, '2027-10-01', '2027-10-01')$$,
  '23514', null, 'equal term dates are rejected'
);
select extensions.throws_ok(
  $$insert into public.terms (school_id, school_year_id, semester_number, start_date, end_date) values ('81000000-0000-0000-0000-000000000001', '81100000-0000-0000-0000-000000000002', 1, '2027-11-01', '2027-10-01')$$,
  '23514', null, 'reversed term dates are rejected'
);
select extensions.throws_ok(
  $$insert into public.terms (school_id, school_year_id, semester_number, start_date, end_date) values ('81000000-0000-0000-0000-000000000001', '81100000-0000-0000-0000-000000000002', 1, '2027-08-31', '2028-01-31')$$,
  '23514', null, 'term before parent year is rejected'
);
select extensions.throws_ok(
  $$insert into public.terms (school_id, school_year_id, semester_number, start_date, end_date) values ('81000000-0000-0000-0000-000000000001', '81100000-0000-0000-0000-000000000002', 1, '2027-09-01', '2028-07-01')$$,
  '23514', null, 'term after parent year is rejected'
);
select extensions.throws_ok(
  $$insert into public.terms (school_id, school_year_id, semester_number, start_date, end_date) values ('81000000-0000-0000-0000-000000000001', '81100000-0000-0000-0000-000000000001', 1, '2026-09-02', '2027-01-30')$$,
  '23505', null, 'duplicate Semester 1 is rejected'
);
select extensions.throws_ok(
  $$insert into public.terms (school_id, school_year_id, semester_number, start_date, end_date) values ('81000000-0000-0000-0000-000000000001', '81100000-0000-0000-0000-000000000001', 2, '2027-02-01', '2027-06-29')$$,
  '23505', null, 'duplicate Semester 2 is rejected'
);
select extensions.throws_ok(
  $$insert into public.terms (school_id, school_year_id, semester_number, start_date, end_date) values ('81000000-0000-0000-0000-000000000001', '81100000-0000-0000-0000-000000000002', 3, '2027-09-01', '2028-01-31')$$,
  '23514', null, 'semester values outside 1 and 2 are rejected'
);

insert into public.terms (id, school_id, school_year_id, semester_number, start_date, end_date)
values ('81210000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001', '81100000-0000-0000-0000-000000000002', 1, '2027-09-01', '2028-02-15');
select extensions.throws_ok(
  $$insert into public.terms (school_id, school_year_id, semester_number, start_date, end_date) values ('81000000-0000-0000-0000-000000000001', '81100000-0000-0000-0000-000000000002', 2, '2028-02-01', '2028-06-30')$$,
  '23514', null, 'overlapping semesters are rejected'
);

insert into public.terms (id, school_id, school_year_id, semester_number, start_date, end_date)
values ('81320000-0000-0000-0000-000000000002', '81000000-0000-0000-0000-000000000001', '81100000-0000-0000-0000-000000000003', 2, '2028-09-01', '2028-12-31');
select extensions.throws_ok(
  $$insert into public.terms (school_id, school_year_id, semester_number, start_date, end_date) values ('81000000-0000-0000-0000-000000000001', '81100000-0000-0000-0000-000000000003', 1, '2029-01-01', '2029-06-30')$$,
  '23514', null, 'Semester 2 inserted first still rejects reversed chronology'
);

select extensions.throws_ok(
  $$update public.terms set end_date = '2027-02-01' where id = '81110000-0000-0000-0000-000000000001'$$,
  '23514', null, 'Semester 1 update into overlap is rejected'
);
select extensions.throws_ok(
  $$update public.terms set start_date = '2027-01-30' where id = '81120000-0000-0000-0000-000000000002'$$,
  '23514', null, 'Semester 2 update into overlap is rejected'
);
select extensions.throws_ok(
  $$update public.terms set start_date = '2026-08-31' where id = '81110000-0000-0000-0000-000000000001'$$,
  '23514', null, 'moving term outside parent year is rejected'
);
select extensions.throws_ok(
  $$update public.terms set school_year_id = '82100000-0000-0000-0000-000000000001' where id = '81110000-0000-0000-0000-000000000001'$$,
  '23503', null, 'term cannot reference another school year'
);

select extensions.throws_ok(
  $$update public.school_years set start_date = '2026-10-01', end_date = '2027-06-01' where id = '81100000-0000-0000-0000-000000000001'$$,
  '23514', null, 'shrinking year around existing terms is rejected'
);
select extensions.throws_ok(
  $$update public.school_years set start_date = '2026-09-02' where id = '81100000-0000-0000-0000-000000000001'$$,
  '23514', null, 'moving year start beyond a term is rejected'
);
select extensions.throws_ok(
  $$update public.school_years set end_date = '2027-06-29' where id = '81100000-0000-0000-0000-000000000001'$$,
  '23514', null, 'moving year end before a term is rejected'
);
select extensions.lives_ok(
  $$update public.school_years set start_date = '2026-08-15', end_date = '2027-07-15' where id = '81100000-0000-0000-0000-000000000001'$$,
  'expanding a school year is allowed'
);
select extensions.is((select start_date from public.terms where id = '81110000-0000-0000-0000-000000000001'), '2026-09-01'::date, 'failed term update leaves original start date');
select extensions.is((select end_date from public.terms where id = '81110000-0000-0000-0000-000000000001'), '2027-01-31'::date, 'failed overlap update leaves original end date');
select extensions.is((select start_date from public.school_years where id = '81100000-0000-0000-0000-000000000001'), '2026-08-15'::date, 'only valid expanded year update persists');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at) values
  ('00000000-0000-0000-0000-000000000000', '8a000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'calendar-admin@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '8a000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'calendar-teacher@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '8a000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'calendar-missing@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '8a000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'calendar-inactive@example.test', '', now(), now(), now());
insert into public.user_profiles (id, school_id, role, active, display_name) values
  ('8a000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001', 'ADMIN', true, null),
  ('8a000000-0000-0000-0000-000000000002', '81000000-0000-0000-0000-000000000001', 'TEACHER', true, 'Professeur calendrier'),
  ('8a000000-0000-0000-0000-000000000004', '81000000-0000-0000-0000-000000000001', 'TEACHER', false, 'Professeur calendrier inactif');

select set_config('request.jwt.claim.sub', '8a000000-0000-0000-0000-000000000001', true);
set local role authenticated;
select extensions.lives_ok(
  $$insert into public.school_years (school_id, label, start_date, end_date) values ('81000000-0000-0000-0000-000000000001', 'Admin valid', '2030-09-01', '2031-06-30')$$,
  'ADMIN inserts a valid own-school year'
);
select extensions.lives_ok(
  $$insert into public.terms (school_id, school_year_id, semester_number, start_date, end_date) select '81000000-0000-0000-0000-000000000001', id, 1, '2030-09-01', '2031-01-31' from public.school_years where label = 'Admin valid'$$,
  'ADMIN inserts a valid own-school term'
);
select extensions.throws_ok(
  $$insert into public.school_years (school_id, label, start_date, end_date) values ('82000000-0000-0000-0000-000000000002', 'Cross school', '2030-09-01', '2031-06-30')$$,
  '42501', null, 'ADMIN cannot insert a cross-school year'
);
select extensions.throws_ok(
  $$insert into public.terms (school_id, school_year_id, semester_number, start_date, end_date) values ('82000000-0000-0000-0000-000000000002', '82100000-0000-0000-0000-000000000001', 1, '2026-09-01', '2027-01-31')$$,
  '42501', null, 'ADMIN cannot insert a cross-school term'
);
reset role;

select set_config('request.jwt.claim.sub', '8a000000-0000-0000-0000-000000000002', true);
set local role authenticated;
select extensions.throws_ok(
  $$insert into public.school_years (school_id, label, start_date, end_date) values ('81000000-0000-0000-0000-000000000001', 'Teacher denied', '2031-09-01', '2032-06-30')$$,
  '42501', null, 'TEACHER cannot mutate calendar records'
);
reset role;

set local role anon;
select extensions.throws_ok(
  $$insert into public.school_years (school_id, label, start_date, end_date) values ('81000000-0000-0000-0000-000000000001', 'Anon denied', '2031-09-01', '2032-06-30')$$,
  '42501', null, 'anonymous actor cannot mutate calendar records'
);
reset role;

select set_config('request.jwt.claim.sub', '8a000000-0000-0000-0000-000000000003', true);
set local role authenticated;
select extensions.throws_ok(
  $$insert into public.school_years (school_id, label, start_date, end_date) values ('81000000-0000-0000-0000-000000000001', 'Missing denied', '2031-09-01', '2032-06-30')$$,
  '42501', null, 'missing-profile actor cannot mutate calendar records'
);
reset role;

select set_config('request.jwt.claim.sub', '8a000000-0000-0000-0000-000000000004', true);
set local role authenticated;
select extensions.throws_ok(
  $$insert into public.school_years (school_id, label, start_date, end_date) values ('81000000-0000-0000-0000-000000000001', 'Inactive denied', '2031-09-01', '2032-06-30')$$,
  '42501', null, 'inactive-profile actor cannot mutate calendar records'
);
reset role;

select extensions.is(public.current_app_role(), null::public.app_role, 'authorization helper remains safe without an active actor');
select extensions.ok((select count(*) > 0 from public.school_years), 'transactional fixtures exist before rollback');

select * from extensions.finish();
rollback;
