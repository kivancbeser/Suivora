begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

select extensions.has_type('public','homework_state','homework state enum exists');
select extensions.is(
  (select array_agg(enumlabel::text order by enumsortorder) from pg_enum where enumtypid='public.homework_state'::regtype),
  array['SUBMITTED_ON_TIME','SUBMITTED_LATE','NOT_SUBMITTED'],
  'only the three explicit states exist'
);
select extensions.has_table('public','homework_assignments','homework assignments table exists');
select extensions.has_table('public','homework_student_statuses','homework statuses table exists');
select extensions.has_column('public','homework_assignments','term_id','term scope is stored');
select extensions.has_column('public','homework_assignments','due_on','due date is stored');
select extensions.has_column('public','homework_student_statuses','submitted_on','submission date is stored');
select extensions.col_is_pk('public','homework_assignments','id','homework has primary key');
select extensions.col_is_pk('public','homework_student_statuses','id','status has primary key');
select extensions.ok((select relrowsecurity from pg_class where oid='public.homework_assignments'::regclass),'homework has RLS');
select extensions.ok((select relrowsecurity from pg_class where oid='public.homework_student_statuses'::regclass),'statuses have RLS');
select extensions.is((select count(*)::integer from pg_policies where schemaname='public' and tablename in ('homework_assignments','homework_student_statuses')),2,'only narrow read policies exist');
select extensions.ok(not has_table_privilege('authenticated','public.homework_assignments','insert,update,delete'),'no direct homework mutation grant');
select extensions.ok(not has_table_privilege('authenticated','public.homework_student_statuses','insert,update,delete'),'no direct status mutation grant');
select extensions.ok(not has_table_privilege('anon','public.homework_assignments','select'),'anonymous has no homework read grant');
select extensions.ok(to_regprocedure('public.create_homework_assignment(uuid,uuid,text,text,date,date)') is not null,'create RPC exists');
select extensions.ok(to_regprocedure('public.update_homework_assignment(uuid,text,text,date,date,boolean)') is not null,'update RPC exists');
select extensions.ok(to_regprocedure('public.save_homework_statuses(uuid,uuid[],public.homework_state[],date[])') is not null,'bulk status RPC exists');
select extensions.ok(to_regprocedure('public.list_homework_attention(date)') is not null,'attention projection exists');
select extensions.ok(has_function_privilege('authenticated','public.list_homework_attention(date)','execute'),'authenticated may reach protected projection');
select extensions.ok(not has_function_privilege('anon','public.list_homework_attention(date)','execute'),'anonymous cannot reach projection');
select extensions.ok(not has_function_privilege('authenticated','public.current_homework_streak(uuid,uuid,date)','execute'),'internal streak helper is not callable');
select extensions.is((select provolatile::text from pg_proc where oid='public.list_homework_attention(date)'::regprocedure),'s','projection is stable');
select extensions.is((select proconfig[1] from pg_proc where oid='public.list_homework_attention(date)'::regprocedure),'search_path=""','projection search path is empty');
select extensions.matches(
  pg_get_functiondef('public.current_homework_streak(uuid,uuid,date)'::regprocedure),
  'order by homework.due_on desc, homework.assigned_on desc, homework.id desc',
  'equal-date ordering has an immutable identifier tie-breaker'
);

insert into public.schools(id,name) values
 ('e1000000-0000-0000-0000-000000000001','Homework School One'),
 ('e2000000-0000-0000-0000-000000000002','Homework School Two');
insert into public.school_years(id,school_id,label,start_date,end_date,active) values
 ('e1100000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000001','2048–2049','2048-09-01','2049-06-30',true),
 ('e2100000-0000-0000-0000-000000000001','e2000000-0000-0000-0000-000000000002','2048–2049','2048-09-01','2049-06-30',true);
insert into public.terms(id,school_id,school_year_id,semester_number,start_date,end_date) values
 ('e1110000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000001','e1100000-0000-0000-0000-000000000001',1,'2048-09-01','2049-01-31'),
 ('e2110000-0000-0000-0000-000000000001','e2000000-0000-0000-0000-000000000002','e2100000-0000-0000-0000-000000000001',1,'2048-09-01','2049-01-31');
insert into public.classes(id,school_id,school_year_id,name) values
 ('e1200000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000001','e1100000-0000-0000-0000-000000000001','Homework Class'),
 ('e2200000-0000-0000-0000-000000000001','e2000000-0000-0000-0000-000000000002','e2100000-0000-0000-0000-000000000001','Other Class');
insert into public.courses(id,school_id,name,code) values
 ('e1300000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000001','Homework Course','HMW'),
 ('e2300000-0000-0000-0000-000000000001','e2000000-0000-0000-0000-000000000002','Other Course','OTH');
insert into public.class_courses(id,school_id,school_year_id,class_id,course_id,weekly_periods) values
 ('e1400000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000001','e1100000-0000-0000-0000-000000000001','e1200000-0000-0000-0000-000000000001','e1300000-0000-0000-0000-000000000001',10),
 ('e2400000-0000-0000-0000-000000000001','e2000000-0000-0000-0000-000000000002','e2100000-0000-0000-0000-000000000001','e2200000-0000-0000-0000-000000000001','e2300000-0000-0000-0000-000000000001',10);
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at) values
 ('00000000-0000-0000-0000-000000000000','ea000000-0000-0000-0000-000000000001','authenticated','authenticated','homework-admin@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','ea000000-0000-0000-0000-000000000002','authenticated','authenticated','homework-teacher@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','ea000000-0000-0000-0000-000000000003','authenticated','authenticated','homework-unassigned@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','ea000000-0000-0000-0000-000000000004','authenticated','authenticated','homework-other@example.test','',now(),now(),now());
insert into public.user_profiles(id,school_id,role,active,display_name) values
 ('ea000000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000001','ADMIN',true,'Homework Admin'),
 ('ea000000-0000-0000-0000-000000000002','e1000000-0000-0000-0000-000000000001','TEACHER',true,'Homework Teacher'),
 ('ea000000-0000-0000-0000-000000000003','e1000000-0000-0000-0000-000000000001','TEACHER',true,'Unassigned Teacher'),
 ('ea000000-0000-0000-0000-000000000004','e2000000-0000-0000-0000-000000000002','ADMIN',true,'Other Admin');
insert into public.teacher_assignments(school_id,class_course_id,teacher_id,weekly_periods) values
 ('e1000000-0000-0000-0000-000000000001','e1400000-0000-0000-0000-000000000001','ea000000-0000-0000-0000-000000000002',10);
insert into public.students(id,school_id,first_name,last_name) values
 ('e1500000-0000-0000-0000-000000000001','e1000000-0000-0000-0000-000000000001','Homework','Learner'),
 ('e1500000-0000-0000-0000-000000000002','e1000000-0000-0000-0000-000000000001','Future','Learner');
insert into public.enrollments(school_id,school_year_id,student_id,class_id,starts_on) values
 ('e1000000-0000-0000-0000-000000000001','e1100000-0000-0000-0000-000000000001','e1500000-0000-0000-0000-000000000001','e1200000-0000-0000-0000-000000000001','2048-09-01'),
 ('e1000000-0000-0000-0000-000000000001','e1100000-0000-0000-0000-000000000001','e1500000-0000-0000-0000-000000000002','e1200000-0000-0000-0000-000000000001','2049-01-01');

select set_config('request.jwt.claim.sub','ea000000-0000-0000-0000-000000000001',true);
set local role authenticated;
select extensions.lives_ok($$select public.create_homework_assignment('e1400000-0000-0000-0000-000000000001','e1110000-0000-0000-0000-000000000001','Homework 1','','2048-09-01','2048-09-01')$$,'ADMIN creates same-day homework');
select extensions.throws_ok($$select public.create_homework_assignment('e1400000-0000-0000-0000-000000000001','e1110000-0000-0000-0000-000000000001',' ','','2048-09-02','2048-09-03')$$,'22023',null,'blank title rejected');
select extensions.throws_ok($$select public.create_homework_assignment('e1400000-0000-0000-0000-000000000001','e1110000-0000-0000-0000-000000000001','Wrong order','','2048-09-03','2048-09-02')$$,'22023',null,'reversed dates rejected');
select extensions.throws_ok($$select public.create_homework_assignment('e1400000-0000-0000-0000-000000000001','e1110000-0000-0000-0000-000000000001','Outside','','2048-08-31','2048-09-02')$$,'22023',null,'date outside term rejected');
select extensions.throws_ok($$select public.create_homework_assignment('e1400000-0000-0000-0000-000000000001','e2110000-0000-0000-0000-000000000001','Cross school','','2048-09-02','2048-09-03')$$,'22023',null,'cross-school term rejected');
select extensions.is(public.save_homework_statuses((select id from public.homework_assignments),array['e1500000-0000-0000-0000-000000000001'::uuid],array['NOT_SUBMITTED'::public.homework_state],array[null::date]),1,'explicit not-submitted status saved');
select extensions.is((select count(*)::integer from public.homework_student_statuses),1,'one current status exists');
select extensions.is((select count(*)::integer from public.homework_student_statuses where student_id='e1500000-0000-0000-0000-000000000002'),0,'unrecorded is represented by no row');
select extensions.throws_ok($$select public.save_homework_statuses((select id from public.homework_assignments),array['e1500000-0000-0000-0000-000000000002'::uuid],array['NOT_SUBMITTED'::public.homework_state],array[null::date])$$,'22023',null,'student ineligible on due date rejected');
select extensions.throws_ok($$select public.save_homework_statuses((select id from public.homework_assignments),array['e1500000-0000-0000-0000-000000000001'::uuid],array['SUBMITTED_LATE'::public.homework_state],array['2048-09-01'::date])$$,'22023',null,'late state requires date after due date');
select extensions.is(public.save_homework_statuses((select id from public.homework_assignments),array['e1500000-0000-0000-0000-000000000001'::uuid],array['SUBMITTED_ON_TIME'::public.homework_state],array['2048-09-01'::date]),1,'historical status correction succeeds');
select extensions.is((select count(*)::integer from public.homework_student_statuses),1,'correction updates instead of duplicating');
select extensions.is((select updated_by from public.homework_student_statuses),'ea000000-0000-0000-0000-000000000001'::uuid,'audit actor is derived');
select extensions.throws_ok($$delete from public.homework_assignments$$,'42501',null,'ADMIN cannot hard delete homework');
reset role;

select set_config('request.jwt.claim.sub','ea000000-0000-0000-0000-000000000002',true);
set local role authenticated;
select extensions.is((select count(*)::integer from public.homework_assignments),1,'assigned teacher reads shared homework');
select extensions.lives_ok($$select public.create_homework_assignment('e1400000-0000-0000-0000-000000000001','e1110000-0000-0000-0000-000000000001','Homework 2','','2048-09-02','2048-09-02')$$,'assigned teacher creates homework');
select extensions.lives_ok($$select public.create_homework_assignment('e1400000-0000-0000-0000-000000000001','e1110000-0000-0000-0000-000000000001','Homework 3','','2048-09-03','2048-09-03')$$,'teacher creates second ordered homework');
select extensions.lives_ok($$select public.create_homework_assignment('e1400000-0000-0000-0000-000000000001','e1110000-0000-0000-0000-000000000001','Homework 4','','2048-09-04','2048-09-04')$$,'teacher creates third ordered homework');
select extensions.is(public.save_homework_statuses((select id from public.homework_assignments where title='Homework 2'),array['e1500000-0000-0000-0000-000000000001'::uuid],array['NOT_SUBMITTED'::public.homework_state],array[null::date]),1,'teacher records second miss');
select extensions.is(public.save_homework_statuses((select id from public.homework_assignments where title='Homework 3'),array['e1500000-0000-0000-0000-000000000001'::uuid],array['NOT_SUBMITTED'::public.homework_state],array[null::date]),1,'teacher records third miss candidate');
select extensions.is(public.save_homework_statuses((select id from public.homework_assignments where title='Homework 4'),array['e1500000-0000-0000-0000-000000000001'::uuid],array['NOT_SUBMITTED'::public.homework_state],array[null::date]),1,'teacher records latest miss');
select extensions.is((select current_streak from public.list_homework_attention('2048-09-04') limit 1),3,'three current misses reach the threshold exactly');
select extensions.is(public.save_homework_statuses((select id from public.homework_assignments where title='Homework 1'),array['e1500000-0000-0000-0000-000000000001'::uuid],array['NOT_SUBMITTED'::public.homework_state],array[null::date]),1,'historical correction recomputes source state');
select extensions.is((select current_streak from public.list_homework_attention('2048-09-04') limit 1),4,'four consecutive misses project one alert row');
select extensions.is(public.save_homework_statuses((select id from public.homework_assignments where title='Homework 3'),array['e1500000-0000-0000-0000-000000000001'::uuid],array['SUBMITTED_LATE'::public.homework_state],array['2048-09-04'::date]),1,'successful correction resets streak');
select extensions.is((select count(*)::integer from public.list_homework_attention('2048-09-04')),0,'reset removes derived alert');
select extensions.throws_ok($$delete from public.homework_student_statuses$$,'42501',null,'teacher cannot hard delete statuses');
reset role;

select set_config('request.jwt.claim.sub','ea000000-0000-0000-0000-000000000003',true);
set local role authenticated;
select extensions.is((select count(*)::integer from public.homework_assignments),0,'unassigned teacher sees no homework');
select extensions.throws_ok($$select public.create_homework_assignment('e1400000-0000-0000-0000-000000000001','e1110000-0000-0000-0000-000000000001','Denied','','2048-09-05','2048-09-05')$$,'42501',null,'unassigned teacher create denied');
select extensions.is((select count(*)::integer from public.list_homework_attention('2048-09-05')),0,'unassigned teacher sees no alerts');
reset role;

update public.user_profiles set active=false where id='ea000000-0000-0000-0000-000000000002';
select set_config('request.jwt.claim.sub','ea000000-0000-0000-0000-000000000002',true);
set local role authenticated;
select extensions.is((select count(*)::integer from public.homework_assignments),0,'inactive assigned teacher sees no homework');
select extensions.throws_ok($$select public.create_homework_assignment('e1400000-0000-0000-0000-000000000001','e1110000-0000-0000-0000-000000000001','Denied inactive','','2048-09-05','2048-09-05')$$,'42501',null,'inactive profile cannot mutate homework');
reset role;
update public.user_profiles set active=true where id='ea000000-0000-0000-0000-000000000002';
update public.teacher_assignments set is_active=false where teacher_id='ea000000-0000-0000-0000-000000000002';
select set_config('request.jwt.claim.sub','ea000000-0000-0000-0000-000000000002',true);
set local role authenticated;
select extensions.is((select count(*)::integer from public.homework_assignments),0,'inactive assignment removes homework access');
select extensions.throws_ok($$select public.save_homework_statuses((select id from public.homework_assignments limit 1),array['e1500000-0000-0000-0000-000000000001'::uuid],array['NOT_SUBMITTED'::public.homework_state],array[null::date])$$,'42501',null,'inactive assignment cannot mutate statuses');
reset role;
update public.teacher_assignments set is_active=true where teacher_id='ea000000-0000-0000-0000-000000000002';

select set_config('request.jwt.claim.sub','ea000000-0000-0000-0000-000000000004',true);
set local role authenticated;
select extensions.is((select count(*)::integer from public.homework_assignments),0,'cross-school ADMIN sees no homework');
select extensions.throws_ok($$select public.update_homework_assignment((select id from public.homework_assignments limit 1),'Denied','', '2048-09-01','2048-09-01',true)$$,'42501',null,'cross-school update denied safely');
reset role;

select extensions.finish();
rollback;
