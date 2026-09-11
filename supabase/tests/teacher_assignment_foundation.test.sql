begin;

create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

-- Catalog and hardening.
select extensions.has_table('public','teacher_assignments','teacher assignments table exists');
select extensions.ok(
  (select array_agg(attname::text order by attnum) from pg_attribute
   where attrelid='public.teacher_assignments'::regclass and attnum>0 and not attisdropped)
  = array['id','school_id','class_course_id','teacher_id','weekly_periods','is_active','created_at','updated_at'],
  'teacher assignments has expected columns'
);
select extensions.col_type_is('public','teacher_assignments','weekly_periods','smallint','weekly periods uses smallint');
select extensions.has_pk('public','teacher_assignments','teacher assignments has primary key');
select extensions.ok(exists(select 1 from pg_constraint where conrelid='public.teacher_assignments'::regclass and conname='teacher_assignments_class_course_school_fk' and confdeltype='r'),'ClassCourse relationship restricts deletion');
select extensions.ok(exists(select 1 from pg_constraint where conrelid='public.teacher_assignments'::regclass and conname='teacher_assignments_teacher_school_fk' and confdeltype='r'),'teacher relationship restricts deletion');
select extensions.ok(exists(select 1 from pg_constraint where conrelid='public.teacher_assignments'::regclass and conname='teacher_assignments_teacher_class_course_key' and contype='u'),'teacher and ClassCourse are unique');
select extensions.ok(exists(select 1 from pg_constraint where conrelid='public.teacher_assignments'::regclass and conname='teacher_assignments_weekly_periods_check' and contype='c'),'weekly period check exists');
select extensions.ok((select relrowsecurity from pg_class where oid='public.teacher_assignments'::regclass),'teacher assignments has RLS enabled');
select extensions.is((select count(*)::integer from pg_trigger where tgrelid='public.teacher_assignments'::regclass and not tgisinternal),2,'assignment has validation and timestamp triggers');
select extensions.ok(exists(select 1 from pg_trigger where tgrelid='public.class_courses'::regclass and tgname='class_courses_protect_assignment_capacity' and not tgisinternal),'ClassCourse capacity trigger exists');
select extensions.ok(to_regprocedure('public.is_teacher_assigned(uuid)') is not null,'assignment helper exists');
select extensions.ok(to_regprocedure('public.admin_create_teacher_assignment(uuid,uuid,smallint)') is not null,'create RPC exists');
select extensions.ok(to_regprocedure('public.admin_update_teacher_assignment(uuid,smallint,boolean)') is not null,'update RPC exists');
select extensions.is((select count(*)::integer from pg_proc where pronamespace='public'::regnamespace and proname in ('is_teacher_assigned','admin_create_teacher_assignment','admin_update_teacher_assignment')),3,'no assignment function overload exists');
select extensions.ok((select bool_and(prosecdef) from pg_proc where pronamespace='public'::regnamespace and proname in ('is_teacher_assigned','admin_create_teacher_assignment','admin_update_teacher_assignment')),'public assignment functions are security definer');
select extensions.ok((select bool_and(proconfig=array['search_path=""']) from pg_proc where pronamespace='public'::regnamespace and proname in ('validate_teacher_assignment','protect_class_course_assignment_capacity','is_teacher_assigned','admin_create_teacher_assignment','admin_update_teacher_assignment')),'all assignment functions have empty search paths');
select extensions.ok((select bool_and(provolatile='v') from pg_proc where pronamespace='public'::regnamespace and proname in ('validate_teacher_assignment','protect_class_course_assignment_capacity','admin_create_teacher_assignment','admin_update_teacher_assignment')),'mutation functions are explicitly volatile');
select extensions.is((select provolatile::text from pg_proc where oid='public.is_teacher_assigned(uuid)'::regprocedure),'s','assignment helper is stable');
select extensions.ok(not has_function_privilege('public','public.is_teacher_assigned(uuid)','execute') and not has_function_privilege('anon','public.is_teacher_assigned(uuid)','execute') and has_function_privilege('authenticated','public.is_teacher_assigned(uuid)','execute'),'helper execution is authenticated only');
select extensions.ok(not has_function_privilege('public','public.admin_create_teacher_assignment(uuid,uuid,smallint)','execute') and not has_function_privilege('anon','public.admin_create_teacher_assignment(uuid,uuid,smallint)','execute') and has_function_privilege('authenticated','public.admin_create_teacher_assignment(uuid,uuid,smallint)','execute'),'create RPC execution is authenticated only');
select extensions.ok(not has_function_privilege('public','public.admin_update_teacher_assignment(uuid,smallint,boolean)','execute') and not has_function_privilege('anon','public.admin_update_teacher_assignment(uuid,smallint,boolean)','execute') and has_function_privilege('authenticated','public.admin_update_teacher_assignment(uuid,smallint,boolean)','execute'),'update RPC execution is authenticated only');
select extensions.ok(not has_function_privilege('authenticated','public.validate_teacher_assignment()','execute') and not has_function_privilege('authenticated','public.protect_class_course_assignment_capacity()','execute'),'trigger functions have no application execution grant');
select extensions.is((select count(*)::integer from pg_policies where schemaname='public'),42,'expected policy matrix exists');
select extensions.is((select count(*)::integer from pg_policies where schemaname='public' and tablename='teacher_assignments'),4,'four assignment policies exist');
select extensions.is((select count(*)::integer from pg_policies where schemaname='public' and cmd='DELETE'),0,'no DELETE policy exists');
select extensions.ok(not has_table_privilege('anon','public.teacher_assignments','select,insert,update,delete'),'anonymous has no assignment privileges');
select extensions.ok(not has_table_privilege('authenticated','public.teacher_assignments','delete'),'authenticated cannot delete assignments');
select extensions.ok(has_column_privilege('authenticated','public.teacher_assignments','weekly_periods','update') and has_column_privilege('authenticated','public.teacher_assignments','is_active','update'),'ADMIN-editable assignment columns are granted');
select extensions.ok(not has_column_privilege('authenticated','public.teacher_assignments','teacher_id','update') and not has_column_privilege('authenticated','public.teacher_assignments','class_course_id','update') and not has_column_privilege('authenticated','public.teacher_assignments','school_id','update'),'relationship columns have no update grant');

-- Fictional tenants and classroom structures.
insert into public.schools(id,name) values
 ('c1000000-0000-0000-0000-000000000001','Assignment School One'),
 ('c2000000-0000-0000-0000-000000000002','Assignment School Two');
insert into public.school_years(id,school_id,label,start_date,end_date,active) values
 ('c1100000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','2045–2046','2045-09-01','2046-06-30',true),
 ('c2100000-0000-0000-0000-000000000001','c2000000-0000-0000-0000-000000000002','2045–2046','2045-09-01','2046-06-30',true);
insert into public.terms(id,school_id,school_year_id,semester_number,start_date,end_date) values
 ('c1110000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','c1100000-0000-0000-0000-000000000001',1,'2045-09-01','2046-01-15'),
 ('c1110000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000001','c1100000-0000-0000-0000-000000000001',2,'2046-02-01','2046-06-30');
insert into public.classes(id,school_id,school_year_id,name,is_active) values
 ('c1200000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','c1100000-0000-0000-0000-000000000001','Assigned Class',true),
 ('c1200000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000001','c1100000-0000-0000-0000-000000000001','Unassigned Class',true),
 ('c2200000-0000-0000-0000-000000000001','c2000000-0000-0000-0000-000000000002','c2100000-0000-0000-0000-000000000001','Other School Class',true);
insert into public.courses(id,school_id,name,code,is_active) values
 ('c1300000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','Assigned Course','ASC',true),
 ('c1300000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000001','Unassigned Course','UNS',true),
 ('c2300000-0000-0000-0000-000000000001','c2000000-0000-0000-0000-000000000002','Other Course','OTH',true);
insert into public.class_courses(id,school_id,school_year_id,class_id,course_id,weekly_periods,is_active) values
 ('c1400000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','c1100000-0000-0000-0000-000000000001','c1200000-0000-0000-0000-000000000001','c1300000-0000-0000-0000-000000000001',20,true),
 ('c1400000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000001','c1100000-0000-0000-0000-000000000001','c1200000-0000-0000-0000-000000000002','c1300000-0000-0000-0000-000000000002',10,true),
 ('c2400000-0000-0000-0000-000000000001','c2000000-0000-0000-0000-000000000002','c2100000-0000-0000-0000-000000000001','c2200000-0000-0000-0000-000000000001','c2300000-0000-0000-0000-000000000001',10,true);
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at) values
 ('00000000-0000-0000-0000-000000000000','ca000000-0000-0000-0000-000000000001','authenticated','authenticated','assignment-admin@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','ca000000-0000-0000-0000-000000000002','authenticated','authenticated','assignment-teacher-a@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','ca000000-0000-0000-0000-000000000003','authenticated','authenticated','assignment-teacher-b@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','ca000000-0000-0000-0000-000000000004','authenticated','authenticated','assignment-inactive@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','ca000000-0000-0000-0000-000000000005','authenticated','authenticated','assignment-other-admin@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','ca000000-0000-0000-0000-000000000006','authenticated','authenticated','assignment-other-teacher@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','ca000000-0000-0000-0000-000000000007','authenticated','authenticated','assignment-profileless@example.test','',now(),now(),now());
insert into public.user_profiles(id,school_id,role,active,display_name) values
 ('ca000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','ADMIN',true,null),
 ('ca000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000001','TEACHER',true,'Teacher Alpha'),
 ('ca000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000001','TEACHER',true,'Teacher Beta'),
 ('ca000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000001','TEACHER',false,'Teacher Inactive'),
 ('ca000000-0000-0000-0000-000000000005','c2000000-0000-0000-0000-000000000002','ADMIN',true,null),
 ('ca000000-0000-0000-0000-000000000006','c2000000-0000-0000-0000-000000000002','TEACHER',true,'Teacher Other');
insert into public.students(id,school_id,first_name,last_name,student_code) values
 ('c1500000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','Assigned','Student','S-1'),
 ('c1500000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000001','Unassigned','Student','S-2');
insert into public.enrollments(id,school_id,school_year_id,student_id,class_id,starts_on) values
 ('c1600000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','c1100000-0000-0000-0000-000000000001','c1500000-0000-0000-0000-000000000001','c1200000-0000-0000-0000-000000000001','2045-09-01'),
 ('c1600000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000001','c1100000-0000-0000-0000-000000000001','c1500000-0000-0000-0000-000000000002','c1200000-0000-0000-0000-000000000002','2045-09-01');

-- Structural and capacity integrity under owner execution.
select extensions.throws_ok($$insert into public.teacher_assignments(school_id,class_course_id,teacher_id,weekly_periods) values('c1000000-0000-0000-0000-000000000001','c1400000-0000-0000-0000-000000000001','ca000000-0000-0000-0000-000000000002',0)$$,'23514',null,'zero periods rejected');
select extensions.throws_ok($$insert into public.teacher_assignments(school_id,class_course_id,teacher_id,weekly_periods) values('c1000000-0000-0000-0000-000000000001','c1400000-0000-0000-0000-000000000001','ca000000-0000-0000-0000-000000000002',41)$$,'22023',null,'periods above forty rejected before storage');
select extensions.throws_ok($$insert into public.teacher_assignments(school_id,class_course_id,teacher_id,weekly_periods) values('c1000000-0000-0000-0000-000000000001','c1400000-0000-0000-0000-000000000001','ca000000-0000-0000-0000-000000000001',5)$$,'22023',null,'ADMIN profile cannot be assigned');
select extensions.throws_ok($$insert into public.teacher_assignments(school_id,class_course_id,teacher_id,weekly_periods) values('c1000000-0000-0000-0000-000000000001','c1400000-0000-0000-0000-000000000001','ca000000-0000-0000-0000-000000000004',5)$$,'22023',null,'inactive teacher cannot receive assignment');
select extensions.throws_ok($$insert into public.teacher_assignments(school_id,class_course_id,teacher_id,weekly_periods) values('c1000000-0000-0000-0000-000000000001','c1400000-0000-0000-0000-000000000001','ca000000-0000-0000-0000-000000000006',5)$$,'22023',null,'cross-school teacher rejected before storage');
select extensions.lives_ok($$insert into public.teacher_assignments(id,school_id,class_course_id,teacher_id,weekly_periods) values('c1700000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','c1400000-0000-0000-0000-000000000001','ca000000-0000-0000-0000-000000000002',10)$$,'first allocation accepted');
select extensions.lives_ok($$insert into public.teacher_assignments(id,school_id,class_course_id,teacher_id,weekly_periods) values('c1700000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000001','c1400000-0000-0000-0000-000000000001','ca000000-0000-0000-0000-000000000003',10)$$,'exact total allocation accepted');
select extensions.throws_ok($$update public.teacher_assignments set weekly_periods=11 where id='c1700000-0000-0000-0000-000000000002'$$,'22023',null,'over-allocation rejected');
select extensions.is((select weekly_periods from public.teacher_assignments where id='c1700000-0000-0000-0000-000000000002'),10::smallint,'failed allocation update leaves row unchanged');
select extensions.throws_ok($$insert into public.teacher_assignments(school_id,class_course_id,teacher_id,weekly_periods) values('c1000000-0000-0000-0000-000000000001','c1400000-0000-0000-0000-000000000001','ca000000-0000-0000-0000-000000000002',1)$$,'22023',null,'duplicate teacher assignment is rejected without a second row');
select extensions.lives_ok($$update public.teacher_assignments set is_active=false where id='c1700000-0000-0000-0000-000000000002'$$,'assignment deactivation succeeds');
select extensions.lives_ok($$update public.teacher_assignments set weekly_periods=20 where id='c1700000-0000-0000-0000-000000000002'$$,'inactive periods do not consume capacity');
select extensions.throws_ok($$update public.teacher_assignments set is_active=true where id='c1700000-0000-0000-0000-000000000002'$$,'22023',null,'reactivation rechecks capacity');
select extensions.lives_ok($$update public.teacher_assignments set weekly_periods=10,is_active=true where id='c1700000-0000-0000-0000-000000000002'$$,'valid reactivation succeeds');
select extensions.throws_ok($$update public.class_courses set weekly_periods=19 where id='c1400000-0000-0000-0000-000000000001'$$,'22023',null,'ClassCourse reduction below allocation rejected');
select extensions.throws_ok($$update public.class_courses set is_active=false where id='c1400000-0000-0000-0000-000000000001'$$,'22023',null,'ClassCourse deactivation with active assignment rejected');
select extensions.is((select weekly_periods from public.class_courses where id='c1400000-0000-0000-0000-000000000001'),20::smallint,'failed ClassCourse reduction is atomic');
select extensions.throws_ok($$update public.teacher_assignments set teacher_id='ca000000-0000-0000-0000-000000000003' where id='c1700000-0000-0000-0000-000000000001'$$,'22023',null,'assignment relationship is immutable');
select extensions.throws_ok($$delete from public.user_profiles where id='ca000000-0000-0000-0000-000000000002'$$,'23503',null,'assigned teacher deletion is restricted');
select extensions.throws_ok($$delete from public.class_courses where id='c1400000-0000-0000-0000-000000000001'$$,'23503',null,'assigned ClassCourse deletion is restricted');

-- Helper truth table and RLS.
select set_config('request.jwt.claim.sub','ca000000-0000-0000-0000-000000000002',true);
set local role authenticated;
select extensions.ok(public.is_teacher_assigned('c1400000-0000-0000-0000-000000000001'),'active assigned teacher helper returns true');
select extensions.ok(not public.is_teacher_assigned('c1400000-0000-0000-0000-000000000002'),'unassigned ClassCourse helper returns false');
select extensions.is((select count(*)::integer from public.teacher_assignments),1,'teacher sees only own active assignment');
select extensions.is((select count(*)::integer from public.class_courses),1,'teacher sees only assigned ClassCourse');
select extensions.is((select count(*)::integer from public.classes),1,'teacher sees only related class');
select extensions.is((select count(*)::integer from public.courses),1,'teacher sees only related course');
select extensions.is((select count(*)::integer from public.students),1,'teacher sees only assigned class roster student');
select extensions.is((select count(*)::integer from public.enrollments),1,'teacher sees only related enrollment');
select extensions.is((select count(*)::integer from public.school_years),1,'teacher sees required own-school year');
select extensions.is((select count(*)::integer from public.terms),2,'teacher sees required own-school terms');
select extensions.lives_ok($$update public.teacher_assignments set weekly_periods=9 where id='c1700000-0000-0000-0000-000000000001'$$,'teacher mutation reaches no RLS-visible row');
select extensions.is((select weekly_periods from public.teacher_assignments),10::smallint,'teacher cannot mutate assignment');
select extensions.lives_ok($$update public.students set first_name='Changed' where id='c1500000-0000-0000-0000-000000000001'$$,'teacher student mutation reaches no RLS-visible row');
select extensions.is((select first_name from public.students),'Assigned','teacher has no student mutation access');
select extensions.throws_ok($$delete from public.teacher_assignments where id='c1700000-0000-0000-0000-000000000001'$$,'42501',null,'teacher cannot delete assignment');
select extensions.throws_ok($$select public.admin_create_teacher_assignment('ca000000-0000-0000-0000-000000000003','c1400000-0000-0000-0000-000000000002',5::smallint)$$,'42501',null,'teacher cannot call ADMIN create workflow');
reset role;

select set_config('request.jwt.claim.sub','ca000000-0000-0000-0000-000000000004',true);
set local role authenticated;
select extensions.ok(not public.is_teacher_assigned('c1400000-0000-0000-0000-000000000001'),'inactive teacher helper returns false');
select extensions.is((select count(*)::integer from public.teacher_assignments),0,'inactive teacher sees no assignment');
select extensions.is((select count(*)::integer from public.students),0,'inactive teacher sees no roster');
reset role;

select set_config('request.jwt.claim.sub','ca000000-0000-0000-0000-000000000006',true);
set local role authenticated;
select extensions.is((select count(*)::integer from public.class_courses),0,'other-school unassigned teacher sees no ClassCourse');
select extensions.is((select count(*)::integer from public.students),0,'other-school teacher sees no student');
reset role;

select set_config('request.jwt.claim.sub','ca000000-0000-0000-0000-000000000007',true);
set local role authenticated;
select extensions.ok(not public.is_teacher_assigned('c1400000-0000-0000-0000-000000000001'),'profileless helper returns false');
select extensions.is((select count(*)::integer from public.class_courses),0,'profileless user sees no ClassCourse');
reset role;

set local role anon;
select extensions.throws_ok($$select * from public.teacher_assignments$$,'42501',null,'anonymous cannot read assignments');
select extensions.throws_ok($$select public.is_teacher_assigned('c1400000-0000-0000-0000-000000000001')$$,'42501',null,'anonymous cannot execute helper');
reset role;

-- ADMIN RPC and policy behavior.
select set_config('request.jwt.claim.sub','ca000000-0000-0000-0000-000000000001',true);
set local role authenticated;
select extensions.is((select count(*)::integer from public.teacher_assignments),2,'same-school ADMIN sees all own assignments');
select extensions.lives_ok($$select public.admin_create_teacher_assignment('ca000000-0000-0000-0000-000000000002','c1400000-0000-0000-0000-000000000002',5::smallint)$$,'ADMIN creates same-school assignment through RPC');
select extensions.is((select school_id from public.teacher_assignments where class_course_id='c1400000-0000-0000-0000-000000000002'),'c1000000-0000-0000-0000-000000000001'::uuid,'RPC derives school from caller');
select extensions.throws_ok($$select public.admin_create_teacher_assignment('ca000000-0000-0000-0000-000000000001','c1400000-0000-0000-0000-000000000002',1::smallint)$$,'P0001',null,'RPC rejects ADMIN target');
select extensions.throws_ok($$select public.admin_create_teacher_assignment('ca000000-0000-0000-0000-000000000006','c1400000-0000-0000-0000-000000000002',1::smallint)$$,'P0001',null,'RPC rejects cross-school teacher');
select extensions.throws_ok($$select public.admin_create_teacher_assignment('ca000000-0000-0000-0000-000000000003','c2400000-0000-0000-0000-000000000001',1::smallint)$$,'P0001',null,'RPC rejects cross-school ClassCourse');
select extensions.throws_ok($$select public.admin_create_teacher_assignment('ca000000-0000-0000-0000-000000000002','c1400000-0000-0000-0000-000000000002',5::smallint)$$,'22023',null,'RPC rejects duplicate assignment safely');
select extensions.lives_ok($$select public.admin_update_teacher_assignment((select id from public.teacher_assignments where class_course_id='c1400000-0000-0000-0000-000000000002'),4::smallint,false)$$,'ADMIN updates and deactivates through RPC');
select extensions.ok(not (select is_active from public.teacher_assignments where class_course_id='c1400000-0000-0000-0000-000000000002'),'RPC deactivation preserves row');
select extensions.lives_ok($$select public.admin_update_teacher_assignment((select id from public.teacher_assignments where class_course_id='c1400000-0000-0000-0000-000000000002'),5::smallint,true)$$,'ADMIN reactivates valid assignment');
select extensions.throws_ok($$select public.admin_update_teacher_assignment('00000000-0000-0000-0000-000000000000',5::smallint,true)$$,'P0001',null,'missing assignment rejected safely');
select extensions.throws_ok($$delete from public.teacher_assignments where class_course_id='c1400000-0000-0000-0000-000000000002'$$,'42501',null,'ADMIN has no hard delete');
reset role;

-- Removing an assignment immediately removes roster access.
update public.teacher_assignments set is_active=false where teacher_id='ca000000-0000-0000-0000-000000000002';
select set_config('request.jwt.claim.sub','ca000000-0000-0000-0000-000000000002',true);
set local role authenticated;
select extensions.ok(not public.is_teacher_assigned('c1400000-0000-0000-0000-000000000001'),'inactive assignment helper returns false');
select extensions.is((select count(*)::integer from public.students),0,'inactive assignment removes roster access');
reset role;

select extensions.finish();
rollback;
