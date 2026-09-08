begin;

create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

insert into public.schools (id, name) values
  ('10000000-0000-0000-0000-000000000001', 'École A'),
  ('20000000-0000-0000-0000-000000000002', 'École B');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'admin-a@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'teacher-a@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'user-b@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'c0000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'no-profile@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'd0000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'inactive@example.test', '', now(), now(), now());

insert into public.user_profiles (id, school_id, role, active, display_name) values
  ('a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'ADMIN', true, null),
  ('a0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'TEACHER', true, 'Professeur A'),
  ('b0000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', 'TEACHER', true, 'Professeur B'),
  ('d0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'TEACHER', false, 'Professeur inactif');

insert into public.school_years (id, school_id, label, start_date, end_date) values
  ('11000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '2026-2027 A', '2026-09-01', '2027-06-30'),
  ('22000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '2026-2027 B', '2026-09-01', '2027-06-30');

insert into public.terms (id, school_id, school_year_id, semester_number, start_date, end_date) values
  ('11100000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 1, '2026-09-01', '2027-01-31'),
  ('22200000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', '22000000-0000-0000-0000-000000000002', 1, '2026-09-01', '2027-01-31');

select extensions.ok(prosecdef, 'current_school_id is security definer')
from pg_proc where oid = 'public.current_school_id()'::regprocedure;
select extensions.ok(prosecdef, 'current_app_role is security definer')
from pg_proc where oid = 'public.current_app_role()'::regprocedure;
select extensions.ok(prosecdef, 'is_school_admin is security definer')
from pg_proc where oid = 'public.is_school_admin(uuid)'::regprocedure;
select extensions.is(proconfig, array['search_path=""'], 'current_school_id has empty search_path')
from pg_proc where oid = 'public.current_school_id()'::regprocedure;
select extensions.is(proconfig, array['search_path=""'], 'current_app_role has empty search_path')
from pg_proc where oid = 'public.current_app_role()'::regprocedure;
select extensions.is(proconfig, array['search_path=""'], 'is_school_admin has empty search_path')
from pg_proc where oid = 'public.is_school_admin(uuid)'::regprocedure;

select extensions.ok(not has_function_privilege('public', 'public.current_school_id()', 'execute'), 'PUBLIC cannot execute school helper');
select extensions.ok(not has_function_privilege('anon', 'public.current_school_id()', 'execute'), 'anon cannot execute school helper');
select extensions.ok(has_function_privilege('authenticated', 'public.current_school_id()', 'execute'), 'authenticated can execute school helper');
select extensions.ok(not has_function_privilege('public', 'public.current_app_role()', 'execute'), 'PUBLIC cannot execute role helper');
select extensions.ok(not has_function_privilege('anon', 'public.current_app_role()', 'execute'), 'anon cannot execute role helper');
select extensions.ok(has_function_privilege('authenticated', 'public.current_app_role()', 'execute'), 'authenticated can execute role helper');
select extensions.ok(not has_function_privilege('public', 'public.is_school_admin(uuid)', 'execute'), 'PUBLIC cannot execute admin helper');
select extensions.ok(not has_function_privilege('anon', 'public.is_school_admin(uuid)', 'execute'), 'anon cannot execute admin helper');
select extensions.ok(has_function_privilege('authenticated', 'public.is_school_admin(uuid)', 'execute'), 'authenticated can execute admin helper');

set local role anon;
select extensions.throws_ok($$select * from public.schools$$, '42501', null, 'anon cannot read schools');
select extensions.throws_ok($$select * from public.user_profiles$$, '42501', null, 'anon cannot read profiles');
select extensions.throws_ok($$select * from public.school_years$$, '42501', null, 'anon cannot read school years');
select extensions.throws_ok($$select * from public.terms$$, '42501', null, 'anon cannot read terms');
select extensions.throws_ok($$select public.current_school_id()$$, '42501', null, 'anon cannot call protected helper');
select extensions.throws_ok($$insert into public.schools (name) values ('Interdite')$$, '42501', null, 'anon cannot insert');
reset role;

select set_config('request.jwt.claim.sub', 'c0000000-0000-0000-0000-000000000001', true);
set local role authenticated;
select extensions.is((select count(*) from public.schools), 0::bigint, 'missing profile sees no schools');
select extensions.is((select count(*) from public.user_profiles), 0::bigint, 'missing profile sees no profiles');
select extensions.is((select count(*) from public.school_years), 0::bigint, 'missing profile sees no school years');
select extensions.is((select count(*) from public.terms), 0::bigint, 'missing profile sees no terms');
select extensions.is(public.current_school_id(), null::uuid, 'missing profile has no school');
select extensions.is(public.current_app_role(), null::public.app_role, 'missing profile has no role');
select extensions.is(public.is_school_admin('10000000-0000-0000-0000-000000000001'), false, 'missing profile is not admin');
select extensions.throws_ok(
  $$insert into public.school_years (school_id, label, start_date, end_date) values ('10000000-0000-0000-0000-000000000001', 'Interdite', '2027-09-01', '2028-06-30')$$,
  '42501', null, 'missing profile cannot insert'
);
reset role;

select set_config('request.jwt.claim.sub', 'd0000000-0000-0000-0000-000000000001', true);
set local role authenticated;
select extensions.is((select count(*) from public.schools), 0::bigint, 'inactive profile sees no schools');
select extensions.is((select count(*) from public.user_profiles), 0::bigint, 'inactive profile cannot read even its own profile');
select extensions.is((select count(*) from public.school_years), 0::bigint, 'inactive profile sees no school years');
select extensions.is((select count(*) from public.terms), 0::bigint, 'inactive profile sees no terms');
select extensions.is(public.current_school_id(), null::uuid, 'inactive profile has no authorized school');
select extensions.is(public.current_app_role(), null::public.app_role, 'inactive profile has no authorized role');
reset role;

select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000002', true);
set local role authenticated;
select extensions.is((select count(*) from public.schools), 1::bigint, 'teacher reads own school');
select extensions.is((select count(*) from public.user_profiles), 1::bigint, 'teacher reads only own profile without recursion');
select extensions.is((select count(*) from public.school_years), 1::bigint, 'teacher reads own school years');
select extensions.is((select count(*) from public.terms), 1::bigint, 'teacher reads own terms');
select extensions.is(public.current_school_id(), '10000000-0000-0000-0000-000000000001'::uuid, 'teacher school helper is correct');
select extensions.is(public.current_app_role(), 'TEACHER'::public.app_role, 'teacher role helper is correct');
select extensions.is(public.is_school_admin('10000000-0000-0000-0000-000000000001'), false, 'teacher is not admin');
select extensions.throws_ok(
  $$insert into public.school_years (school_id, label, start_date, end_date) values ('10000000-0000-0000-0000-000000000001', 'Interdite', '2027-09-01', '2028-06-30')$$,
  '42501', null, 'teacher cannot insert school year'
);
select extensions.lives_ok($$update public.school_years set label = 'Interdite' where id = '11000000-0000-0000-0000-000000000001'$$, 'teacher year update is filtered by RLS');
select extensions.throws_ok(
  $$insert into public.terms (school_id, school_year_id, semester_number, start_date, end_date) values ('10000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 2, '2027-02-01', '2027-06-30')$$,
  '42501', null, 'teacher cannot insert term'
);
select extensions.lives_ok($$update public.terms set end_date = '2027-01-30' where id = '11100000-0000-0000-0000-000000000001'$$, 'teacher term update is filtered by RLS');
select extensions.throws_ok($$update public.user_profiles set role = 'ADMIN' where id = auth.uid()$$, '42501', null, 'teacher cannot promote self');
select extensions.throws_ok($$update public.user_profiles set school_id = '20000000-0000-0000-0000-000000000002' where id = auth.uid()$$, '42501', null, 'teacher cannot change school');
select extensions.throws_ok($$insert into public.user_profiles (id, school_id, role) values ('c0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'TEACHER')$$, '42501', null, 'teacher cannot create profiles');
select extensions.throws_ok($$delete from public.user_profiles where id = auth.uid()$$, '42501', null, 'teacher cannot delete profiles');
reset role;

select set_config('request.jwt.claim.sub', 'b0000000-0000-0000-0000-000000000001', true);
set local role authenticated;
select extensions.is((select count(*) from public.schools), 1::bigint, 'School B user reads only School B');
select extensions.is((select count(*) from public.user_profiles), 1::bigint, 'School B teacher reads only own profile');
select extensions.is((select count(*) from public.school_years), 1::bigint, 'School B user reads only School B years');
select extensions.is((select count(*) from public.terms), 1::bigint, 'School B user reads only School B terms');
reset role;

select set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);
set local role authenticated;
select extensions.is((select count(*) from public.schools), 1::bigint, 'admin reads own school');
select extensions.is((select count(*) from public.user_profiles), 3::bigint, 'admin reads own-school profiles including inactive records');
select extensions.is((select count(*) from public.school_years), 1::bigint, 'admin cannot read other-school years');
select extensions.is((select count(*) from public.terms), 1::bigint, 'admin cannot read other-school terms');
select extensions.is(public.current_app_role(), 'ADMIN'::public.app_role, 'admin role helper is correct');
select extensions.is(public.is_school_admin('10000000-0000-0000-0000-000000000001'), true, 'admin recognized for own school');
select extensions.is(public.is_school_admin('20000000-0000-0000-0000-000000000002'), false, 'admin not recognized for another school');
select extensions.lives_ok(
  $$insert into public.school_years (school_id, label, start_date, end_date) values ('10000000-0000-0000-0000-000000000001', '2027-2028 A', '2027-09-01', '2028-06-30')$$,
  'admin inserts own-school year'
);
select extensions.lives_ok($$update public.school_years set label = '2027–2028 A' where label = '2027-2028 A'$$, 'admin updates own-school year');
select extensions.lives_ok(
  $$insert into public.terms (school_id, school_year_id, semester_number, start_date, end_date) select '10000000-0000-0000-0000-000000000001', id, 1, '2027-09-01', '2028-01-31' from public.school_years where label = '2027–2028 A'$$,
  'admin inserts own-school term'
);
select extensions.lives_ok($$update public.terms set end_date = '2028-02-01' where start_date = '2027-09-01'$$, 'admin updates own-school term');
select extensions.throws_ok(
  $$insert into public.school_years (school_id, label, start_date, end_date) values ('20000000-0000-0000-0000-000000000002', 'Forgée', '2027-09-01', '2028-06-30')$$,
  '42501', null, 'admin cannot forge school on year insert'
);
select extensions.throws_ok(
  $$insert into public.terms (school_id, school_year_id, semester_number, start_date, end_date) values ('20000000-0000-0000-0000-000000000002', '22000000-0000-0000-0000-000000000002', 2, '2027-02-01', '2027-06-30')$$,
  '42501', null, 'admin cannot forge school on term insert'
);
select extensions.lives_ok($$update public.school_years set label = 'École B falsifiée' where id = '22000000-0000-0000-0000-000000000002'$$, 'cross-school year update is filtered by RLS');
select extensions.lives_ok($$update public.terms set end_date = '2027-01-30' where id = '22200000-0000-0000-0000-000000000002'$$, 'cross-school term update is filtered by RLS');
select extensions.throws_ok($$update public.user_profiles set role = 'ADMIN' where id = 'a0000000-0000-0000-0000-000000000002'$$, '42501', null, 'admin cannot alter profile roles yet');
select extensions.throws_ok($$insert into public.schools (name) values ('École C')$$, '42501', null, 'admin cannot create schools yet');
select extensions.throws_ok($$delete from public.schools where id = '10000000-0000-0000-0000-000000000001'$$, '42501', null, 'admin cannot delete schools');
select extensions.throws_ok($$delete from public.school_years where id = '11000000-0000-0000-0000-000000000001'$$, '42501', null, 'school year deletion remains deferred');
select extensions.throws_ok($$delete from public.terms where id = '11100000-0000-0000-0000-000000000001'$$, '42501', null, 'term deletion remains deferred');
select extensions.throws_ok($$update public.terms set school_id = '20000000-0000-0000-0000-000000000002' where id = '11100000-0000-0000-0000-000000000001'$$, '42501', null, 'term cannot be moved to another school');
reset role;

select extensions.is((select label from public.school_years where id = '11000000-0000-0000-0000-000000000001'), '2026-2027 A', 'denied teacher year update made no change');
select extensions.is((select end_date from public.terms where id = '11100000-0000-0000-0000-000000000001'), '2027-01-31'::date, 'denied teacher term update made no change');
select extensions.is((select count(*) from public.school_years where label in ('Interdite', 'Forgée')), 0::bigint, 'denied year inserts made no rows');
select extensions.is((select count(*) from public.terms where semester_number = 2), 0::bigint, 'denied term inserts made no rows');
select extensions.is((select label from public.school_years where id = '22000000-0000-0000-0000-000000000002'), '2026-2027 B', 'cross-school year update made no change');
select extensions.is((select end_date from public.terms where id = '22200000-0000-0000-0000-000000000002'), '2027-01-31'::date, 'cross-school term update made no change');

select extensions.throws_ok(
  $$insert into public.school_years (school_id, label, start_date, end_date) values ('10000000-0000-0000-0000-000000000001', 'Dates invalides', '2028-06-30', '2028-06-30')$$,
  '23514', null, 'school year date constraint remains active'
);
select extensions.throws_ok(
  $$insert into public.terms (school_id, school_year_id, semester_number, start_date, end_date) values ('10000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 3, '2027-02-01', '2027-06-30')$$,
  '23514', null, 'term semester constraint remains active'
);
select extensions.throws_ok(
  $$insert into public.terms (school_id, school_year_id, semester_number, start_date, end_date) values ('10000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000002', 2, '2027-02-01', '2027-06-30')$$,
  '23503', null, 'cross-school term foreign key remains active'
);
select extensions.throws_ok(
  $$insert into public.school_years (school_id, label, start_date, end_date) values ('10000000-0000-0000-0000-000000000001', '2026-2027 A', '2026-09-01', '2027-06-30')$$,
  '23505', null, 'school year uniqueness remains active'
);

select * from extensions.finish();
rollback;
