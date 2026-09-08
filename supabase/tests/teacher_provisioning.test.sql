begin;

create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

select extensions.has_column('public', 'user_profiles', 'display_name', 'profile display_name column exists');
select extensions.col_is_null('public', 'user_profiles', 'display_name', 'legacy ADMIN display_name remains nullable');
select extensions.ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.user_profiles'::regclass
      and conname = 'user_profiles_display_name_check'
      and contype = 'c'
  ),
  'display name constraint exists'
);
select extensions.ok(to_regprocedure('public.admin_provision_teacher_profile(uuid,text)') is not null, 'provision function exists');
select extensions.ok(to_regprocedure('public.admin_update_teacher_profile(uuid,text,boolean)') is not null, 'update function exists');

select extensions.ok(prosecdef, 'provision function is security definer')
from pg_proc where oid = 'public.admin_provision_teacher_profile(uuid,text)'::regprocedure;
select extensions.ok(prosecdef, 'update function is security definer')
from pg_proc where oid = 'public.admin_update_teacher_profile(uuid,text,boolean)'::regprocedure;
select extensions.is(proconfig, array['search_path=""'], 'provision function has empty search_path')
from pg_proc where oid = 'public.admin_provision_teacher_profile(uuid,text)'::regprocedure;
select extensions.is(proconfig, array['search_path=""'], 'update function has empty search_path')
from pg_proc where oid = 'public.admin_update_teacher_profile(uuid,text,boolean)'::regprocedure;
select extensions.is(pg_get_userbyid(proowner), 'postgres', 'provision function is owned by postgres')
from pg_proc where oid = 'public.admin_provision_teacher_profile(uuid,text)'::regprocedure;
select extensions.is(pg_get_userbyid(proowner), 'postgres', 'update function is owned by postgres')
from pg_proc where oid = 'public.admin_update_teacher_profile(uuid,text,boolean)'::regprocedure;
select extensions.is(provolatile, 'v'::"char", 'provision function is explicitly volatile')
from pg_proc where oid = 'public.admin_provision_teacher_profile(uuid,text)'::regprocedure;
select extensions.is(provolatile, 'v'::"char", 'update function is explicitly volatile')
from pg_proc where oid = 'public.admin_update_teacher_profile(uuid,text,boolean)'::regprocedure;
select extensions.is(proargnames, array['target_user_id', 'teacher_display_name'], 'provision function exposes no school or role parameter')
from pg_proc where oid = 'public.admin_provision_teacher_profile(uuid,text)'::regprocedure;
select extensions.is(proargnames, array['target_user_id', 'teacher_display_name', 'teacher_is_active'], 'update function exposes no school or role parameter')
from pg_proc where oid = 'public.admin_update_teacher_profile(uuid,text,boolean)'::regprocedure;

select extensions.ok(not has_function_privilege('public', 'public.admin_provision_teacher_profile(uuid,text)', 'execute'), 'PUBLIC cannot execute provision function');
select extensions.ok(not has_function_privilege('anon', 'public.admin_provision_teacher_profile(uuid,text)', 'execute'), 'anon cannot execute provision function');
select extensions.ok(has_function_privilege('authenticated', 'public.admin_provision_teacher_profile(uuid,text)', 'execute'), 'authenticated can execute provision function');
select extensions.ok(not has_function_privilege('public', 'public.admin_update_teacher_profile(uuid,text,boolean)', 'execute'), 'PUBLIC cannot execute update function');
select extensions.ok(not has_function_privilege('anon', 'public.admin_update_teacher_profile(uuid,text,boolean)', 'execute'), 'anon cannot execute update function');
select extensions.ok(has_function_privilege('authenticated', 'public.admin_update_teacher_profile(uuid,text,boolean)', 'execute'), 'authenticated can execute update function');

select extensions.ok(not has_table_privilege('authenticated', 'public.user_profiles', 'insert'), 'authenticated has no direct profile INSERT');
select extensions.ok(not has_table_privilege('authenticated', 'public.user_profiles', 'update'), 'authenticated has no direct profile UPDATE');
select extensions.ok(not has_table_privilege('authenticated', 'public.user_profiles', 'delete'), 'authenticated has no direct profile DELETE');
select extensions.ok(not has_table_privilege('anon', 'public.user_profiles', 'select'), 'anonymous profile access remains blocked');
select extensions.is(
  (select count(*) from pg_policies where schemaname = 'public' and tablename in ('schools', 'user_profiles', 'school_years', 'terms')),
  8::bigint,
  'existing eight policies remain unchanged'
);
select extensions.is(
  (select count(*) from pg_policies where schemaname = 'public' and cmd = 'DELETE'),
  0::bigint,
  'no DELETE policy exists'
);

insert into public.schools (id, name) values
  ('91000000-0000-0000-0000-000000000001', 'École Fondation A'),
  ('92000000-0000-0000-0000-000000000002', 'École Fondation B');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '91000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'admin-a@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '91000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'teacher-caller@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '91000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'inactive-admin@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '92000000-0000-0000-0000-000000000004', 'authenticated', 'authenticated', 'admin-b@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '92000000-0000-0000-0000-000000000005', 'authenticated', 'authenticated', 'teacher-b@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '91000000-0000-0000-0000-000000000006', 'authenticated', 'authenticated', 'no-profile@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '91000000-0000-0000-0000-000000000010', 'authenticated', 'authenticated', 'invited-one@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '91000000-0000-0000-0000-000000000011', 'authenticated', 'authenticated', 'invited-two@example.test', '', now(), now(), now()),
  ('00000000-0000-0000-0000-000000000000', '91000000-0000-0000-0000-000000000012', 'authenticated', 'authenticated', 'invited-three@example.test', '', now(), now(), now());

insert into public.user_profiles (id, school_id, role, active, display_name) values
  ('91000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001', 'ADMIN', true, null),
  ('91000000-0000-0000-0000-000000000002', '91000000-0000-0000-0000-000000000001', 'TEACHER', true, 'Professeur appelant'),
  ('91000000-0000-0000-0000-000000000003', '91000000-0000-0000-0000-000000000001', 'ADMIN', false, null),
  ('92000000-0000-0000-0000-000000000004', '92000000-0000-0000-0000-000000000002', 'ADMIN', true, null),
  ('92000000-0000-0000-0000-000000000005', '92000000-0000-0000-0000-000000000002', 'TEACHER', true, 'Professeur B');

select extensions.throws_ok(
  $$insert into public.user_profiles (id, school_id, role, active, display_name) values ('91000000-0000-0000-0000-000000000011', '91000000-0000-0000-0000-000000000001', 'TEACHER', true, null)$$,
  '23514', null, 'database rejects a TEACHER without a display name'
);
select extensions.throws_ok(
  $$insert into public.user_profiles (id, school_id, role, active, display_name) values ('91000000-0000-0000-0000-000000000011', '91000000-0000-0000-0000-000000000001', 'TEACHER', true, ' Non normalisé ')$$,
  '23514', null, 'database rejects an untrimmed stored display name'
);
select extensions.throws_ok(
  $$insert into public.user_profiles (id, school_id, role, active, display_name) values ('91000000-0000-0000-0000-000000000011', '91000000-0000-0000-0000-000000000001', 'TEACHER', true, repeat('A', 121))$$,
  '23514', null, 'database rejects an overlong stored display name'
);

select set_config('request.jwt.claim.sub', '91000000-0000-0000-0000-000000000001', true);
set local role authenticated;

select extensions.lives_ok(
  $$select public.admin_provision_teacher_profile('91000000-0000-0000-0000-000000000010', '  Professeur Invité  ')$$,
  'active ADMIN provisions an existing invited Auth user'
);
select extensions.is(
  (select school_id from public.user_profiles where id = '91000000-0000-0000-0000-000000000010'),
  '91000000-0000-0000-0000-000000000001'::uuid,
  'provisioned teacher inherits the caller school'
);
select extensions.is(
  (select role from public.user_profiles where id = '91000000-0000-0000-0000-000000000010'),
  'TEACHER'::public.app_role,
  'provisioned role is always TEACHER'
);
select extensions.is(
  (select active from public.user_profiles where id = '91000000-0000-0000-0000-000000000010'),
  true,
  'provisioned teacher is active'
);
select extensions.is(
  (select display_name from public.user_profiles where id = '91000000-0000-0000-0000-000000000010'),
  'Professeur Invité',
  'provisioning trims and stores the display name'
);
select extensions.throws_ok(
  $$select public.admin_provision_teacher_profile('91000000-0000-0000-0000-000000000011', '   ')$$,
  '22023', 'teacher profile input rejected', 'blank display name is rejected safely'
);
select extensions.throws_ok(
  $$select public.admin_provision_teacher_profile('91000000-0000-0000-0000-000000000011', repeat('A', 121))$$,
  '22023', 'teacher profile input rejected', 'overlong display name is rejected safely'
);
select extensions.throws_ok(
  $$select public.admin_provision_teacher_profile('99999999-0000-0000-0000-000000000999', 'Absent')$$,
  'P0001', 'teacher profile operation rejected', 'missing Auth user is rejected safely'
);
select extensions.throws_ok(
  $$select public.admin_provision_teacher_profile('91000000-0000-0000-0000-000000000010', 'Doublon')$$,
  'P0001', 'teacher profile operation rejected', 'duplicate provisioning is rejected safely'
);
select extensions.throws_ok(
  $$select public.admin_provision_teacher_profile('91000000-0000-0000-0000-000000000001', 'Auto provision')$$,
  '42501', 'teacher profile operation rejected', 'ADMIN cannot provision their own identity'
);
select extensions.is(
  (select count(*) from public.user_profiles where id in ('91000000-0000-0000-0000-000000000010', '91000000-0000-0000-0000-000000000011')),
  1::bigint,
  'failed provisioning leaves no partial profile'
);

select extensions.lives_ok(
  $$select public.admin_update_teacher_profile('91000000-0000-0000-0000-000000000010', '  Professeur Renommé  ', true)$$,
  'same-school ADMIN updates teacher name'
);
select extensions.is(
  (select display_name from public.user_profiles where id = '91000000-0000-0000-0000-000000000010'),
  'Professeur Renommé',
  'updated teacher name is normalized'
);
select extensions.lives_ok(
  $$select public.admin_update_teacher_profile('91000000-0000-0000-0000-000000000010', 'Professeur Renommé', false)$$,
  'same-school ADMIN deactivates teacher'
);
select extensions.is(
  (select active from public.user_profiles where id = '91000000-0000-0000-0000-000000000010'),
  false,
  'teacher is inactive after deactivation'
);
select extensions.lives_ok(
  $$select public.admin_update_teacher_profile('91000000-0000-0000-0000-000000000010', 'Professeur Renommé', true)$$,
  'same-school ADMIN reactivates teacher'
);
select extensions.is(
  (select active from public.user_profiles where id = '91000000-0000-0000-0000-000000000010'),
  true,
  'teacher is active after reactivation'
);
select extensions.throws_ok(
  $$select public.admin_update_teacher_profile('92000000-0000-0000-0000-000000000005', 'Intrusion', false)$$,
  'P0001', 'teacher profile operation rejected', 'cross-school teacher update is rejected safely'
);
select extensions.throws_ok(
  $$select public.admin_update_teacher_profile('91000000-0000-0000-0000-000000000001', 'Admin cible', false)$$,
  'P0001', 'teacher profile operation rejected', 'ADMIN target is rejected safely'
);
select extensions.throws_ok(
  $$select public.admin_update_teacher_profile('91000000-0000-0000-0000-000000000010', '   ', false)$$,
  '22023', 'teacher profile input rejected', 'invalid update display name is rejected safely'
);
select extensions.throws_ok(
  $$select public.admin_update_teacher_profile('91000000-0000-0000-0000-000000000010', 'Professeur Renommé', null)$$,
  '22023', 'teacher profile input rejected', 'null activation state is rejected safely'
);
select extensions.is(
  (select row(school_id, role, active, display_name)::text from public.user_profiles where id = '91000000-0000-0000-0000-000000000010'),
  row('91000000-0000-0000-0000-000000000001'::uuid, 'TEACHER'::public.app_role, true, 'Professeur Renommé')::text,
  'failed updates preserve school, role, active state, and name'
);
reset role;

select set_config('request.jwt.claim.sub', '91000000-0000-0000-0000-000000000002', true);
set local role authenticated;
select extensions.throws_ok(
  $$select public.admin_provision_teacher_profile('91000000-0000-0000-0000-000000000011', 'Tentative professeur')$$,
  '42501', 'teacher profile operation rejected', 'TEACHER cannot provision another teacher'
);
select extensions.throws_ok(
  $$select public.admin_update_teacher_profile('91000000-0000-0000-0000-000000000010', 'Tentative professeur', false)$$,
  '42501', 'teacher profile operation rejected', 'TEACHER cannot update another teacher'
);
reset role;

select set_config('request.jwt.claim.sub', '91000000-0000-0000-0000-000000000003', true);
set local role authenticated;
select extensions.throws_ok(
  $$select public.admin_provision_teacher_profile('91000000-0000-0000-0000-000000000011', 'Admin inactif')$$,
  '42501', 'teacher profile operation rejected', 'inactive ADMIN cannot provision teacher'
);
select extensions.throws_ok(
  $$select public.admin_update_teacher_profile('91000000-0000-0000-0000-000000000010', 'Admin inactif', false)$$,
  '42501', 'teacher profile operation rejected', 'inactive ADMIN cannot update teacher'
);
reset role;

select set_config('request.jwt.claim.sub', '91000000-0000-0000-0000-000000000006', true);
set local role authenticated;
select extensions.throws_ok(
  $$select public.admin_provision_teacher_profile('91000000-0000-0000-0000-000000000011', 'Sans profil')$$,
  '42501', 'teacher profile operation rejected', 'user without profile cannot provision teacher'
);
reset role;

set local role anon;
select extensions.throws_ok(
  $$select public.admin_provision_teacher_profile('91000000-0000-0000-0000-000000000011', 'Anonyme')$$,
  '42501', null, 'anonymous caller cannot execute provision function'
);
select extensions.throws_ok(
  $$select public.admin_update_teacher_profile('91000000-0000-0000-0000-000000000010', 'Anonyme', false)$$,
  '42501', null, 'anonymous caller cannot execute update function'
);
reset role;

select extensions.is(
  (select school_id from public.user_profiles where id = '92000000-0000-0000-0000-000000000005'),
  '92000000-0000-0000-0000-000000000002'::uuid,
  'failed cross-school update preserves teacher school'
);
select extensions.is(
  (select display_name from public.user_profiles where id = '92000000-0000-0000-0000-000000000005'),
  'Professeur B',
  'failed cross-school update preserves teacher name'
);
select extensions.ok(
  exists (
    select 1 from pg_constraint
    where conrelid = 'public.user_profiles'::regclass
      and conname = 'user_profiles_pkey'
      and contype = 'p'
  ),
  'profile primary key serializes duplicate provisioning attempts'
);
select extensions.ok((select count(*) > 0 from public.user_profiles), 'transactional fictional fixtures exist before rollback');

select * from extensions.finish();
rollback;
