begin;

create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

select extensions.ok(
  to_regprocedure('public.claim_test_teacher_profile(text)') is not null,
  'test teacher self-signup function exists'
);
select extensions.ok(prosecdef, 'self-signup function is security definer')
from pg_proc where oid = 'public.claim_test_teacher_profile(text)'::regprocedure;
select extensions.is(proconfig, array['search_path=""'], 'self-signup function has empty search_path')
from pg_proc where oid = 'public.claim_test_teacher_profile(text)'::regprocedure;
select extensions.is(provolatile, 'v'::"char", 'self-signup function is explicitly volatile')
from pg_proc where oid = 'public.claim_test_teacher_profile(text)'::regprocedure;
select extensions.is(
  proargnames,
  array['teacher_display_name'],
  'self-signup accepts no school, role, or user id'
)
from pg_proc where oid = 'public.claim_test_teacher_profile(text)'::regprocedure;
select extensions.ok(
  not has_function_privilege('public', 'public.claim_test_teacher_profile(text)', 'execute'),
  'PUBLIC cannot execute self-signup function'
);
select extensions.ok(
  not has_function_privilege('anon', 'public.claim_test_teacher_profile(text)', 'execute'),
  'anon cannot execute self-signup function'
);
select extensions.ok(
  has_function_privilege('authenticated', 'public.claim_test_teacher_profile(text)', 'execute'),
  'authenticated can execute self-signup function'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '93000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'marked@example.test', '', now(), '{"suivora_test_signup": true}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '93000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'unmarked@example.test', '', now(), '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000000', '93000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'marked-two@example.test', '', now(), '{"suivora_test_signup": true}'::jsonb, now(), now());

select set_config('request.jwt.claim.sub', '93000000-0000-0000-0000-000000000001', true);
set local role authenticated;
select extensions.throws_ok(
  $$select public.claim_test_teacher_profile('Professeur sans école')$$,
  'P0001', 'test teacher signup unavailable',
  'self-signup is unavailable without exactly one school'
);
reset role;

insert into public.schools (id, name)
values ('93000000-0000-0000-0000-000000000010', 'École test unique');

set local role authenticated;
select extensions.lives_ok(
  $$select public.claim_test_teacher_profile('  Professeur Test  ')$$,
  'marked identity claims an active teacher profile'
);
select extensions.is(
  (
    select row(school_id, role, active, display_name)::text
    from public.user_profiles
    where id = '93000000-0000-0000-0000-000000000001'
  ),
  row(
    '93000000-0000-0000-0000-000000000010'::uuid,
    'TEACHER'::public.app_role,
    true,
    'Professeur Test'
  )::text,
  'profile is normalized and forced into the sole school as active TEACHER'
);
select extensions.throws_ok(
  $$select public.claim_test_teacher_profile('Doublon')$$,
  'P0001', 'test teacher signup rejected',
  'an identity cannot claim a second profile'
);
reset role;

select set_config('request.jwt.claim.sub', '93000000-0000-0000-0000-000000000002', true);
set local role authenticated;
select extensions.throws_ok(
  $$select public.claim_test_teacher_profile('Non marqué')$$,
  '42501', 'test teacher signup rejected',
  'an Auth identity without the server marker is rejected'
);
reset role;

insert into public.schools (id, name)
values ('93000000-0000-0000-0000-000000000011', 'Deuxième école test');

select set_config('request.jwt.claim.sub', '93000000-0000-0000-0000-000000000003', true);
set local role authenticated;
select extensions.throws_ok(
  $$select public.claim_test_teacher_profile('Professeur multi-école')$$,
  'P0001', 'test teacher signup unavailable',
  'self-signup is unavailable when more than one school exists'
);
reset role;

select extensions.is(
  (select count(*) from public.user_profiles where id in (
    '93000000-0000-0000-0000-000000000002',
    '93000000-0000-0000-0000-000000000003'
  )),
  0::bigint,
  'failed self-signups leave no profile'
);

select extensions.finish();
rollback;
