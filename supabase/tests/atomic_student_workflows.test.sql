begin;

create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

-- Hardened function catalog.
select extensions.ok(to_regprocedure('public.admin_create_student_with_enrollment(text,text,text,uuid,date)') is not null,'create workflow exists');
select extensions.ok(to_regprocedure('public.admin_update_student(uuid,text,text,text,boolean)') is not null,'update workflow exists');
select extensions.ok(to_regprocedure('public.admin_transfer_student(uuid,uuid,date)') is not null,'transfer workflow exists');
select extensions.ok(to_regprocedure('public.admin_close_current_enrollment(uuid,date)') is not null,'close workflow exists');
select extensions.is((select count(*)::integer from pg_proc where pronamespace='public'::regnamespace and proname in ('admin_create_student_with_enrollment','admin_update_student','admin_transfer_student','admin_close_current_enrollment')),4,'no workflow overload exists');
select extensions.ok((select bool_and(prosecdef) from pg_proc where pronamespace='public'::regnamespace and proname like 'admin_%student%'),'all workflows are security definer');
select extensions.ok((select bool_and(provolatile='v') from pg_proc where pronamespace='public'::regnamespace and proname like 'admin_%student%'),'all workflows are volatile');
select extensions.ok((select bool_and(proconfig=array['search_path=""']) from pg_proc where pronamespace='public'::regnamespace and proname like 'admin_%student%'),'all workflows have empty search path');
select extensions.ok((select bool_and(pg_get_userbyid(proowner)='postgres') from pg_proc where pronamespace='public'::regnamespace and proname like 'admin_%student%'),'all workflows are postgres-owned');
select extensions.is((select proargnames from pg_proc where oid='public.admin_create_student_with_enrollment(text,text,text,uuid,date)'::regprocedure),array['student_first_name','student_last_name','student_code','target_class_id','enrollment_starts_on'],'create accepts no tenant/year/role input');
select extensions.is((select proargnames from pg_proc where oid='public.admin_update_student(uuid,text,text,text,boolean)'::regprocedure),array['target_student_id','student_first_name','student_last_name','student_code','student_is_active'],'update exposes only identity input');
select extensions.is((select proargnames from pg_proc where oid='public.admin_transfer_student(uuid,uuid,date)'::regprocedure),array['target_student_id','target_class_id','transfer_date'],'transfer accepts no tenant/year/role input');
select extensions.is((select proargnames from pg_proc where oid='public.admin_close_current_enrollment(uuid,date)'::regprocedure),array['target_student_id','enrollment_end_date'],'close accepts no tenant input');
select extensions.ok(not has_function_privilege('public','public.admin_create_student_with_enrollment(text,text,text,uuid,date)','execute') and not has_function_privilege('anon','public.admin_create_student_with_enrollment(text,text,text,uuid,date)','execute'),'PUBLIC and anon cannot execute create');
select extensions.ok(not has_function_privilege('public','public.admin_update_student(uuid,text,text,text,boolean)','execute') and not has_function_privilege('anon','public.admin_update_student(uuid,text,text,text,boolean)','execute'),'PUBLIC and anon cannot execute update');
select extensions.ok(not has_function_privilege('public','public.admin_transfer_student(uuid,uuid,date)','execute') and not has_function_privilege('anon','public.admin_transfer_student(uuid,uuid,date)','execute'),'PUBLIC and anon cannot execute transfer');
select extensions.ok(not has_function_privilege('public','public.admin_close_current_enrollment(uuid,date)','execute') and not has_function_privilege('anon','public.admin_close_current_enrollment(uuid,date)','execute'),'PUBLIC and anon cannot execute close');
select extensions.ok(has_function_privilege('authenticated','public.admin_create_student_with_enrollment(text,text,text,uuid,date)','execute') and has_function_privilege('authenticated','public.admin_update_student(uuid,text,text,text,boolean)','execute') and has_function_privilege('authenticated','public.admin_transfer_student(uuid,uuid,date)','execute') and has_function_privilege('authenticated','public.admin_close_current_enrollment(uuid,date)','execute'),'authenticated has exactly the intended workflow entry points');

-- Fictional tenant, calendar, class, and caller fixtures.
insert into public.schools(id,name) values
 ('b1000000-0000-0000-0000-000000000001','Workflow School One'),
 ('b2000000-0000-0000-0000-000000000002','Workflow School Two');
insert into public.school_years(id,school_id,label,start_date,end_date,active) values
 ('b1100000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001','2040–2041','2040-09-01','2041-06-30',true),
 ('b1100000-0000-0000-0000-000000000002','b1000000-0000-0000-0000-000000000001','2041–2042','2041-09-01','2042-06-30',true),
 ('b1100000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000001','2042–2043','2042-09-01','2043-06-30',false),
 ('b2100000-0000-0000-0000-000000000001','b2000000-0000-0000-0000-000000000002','2040–2041','2040-09-01','2041-06-30',true);
insert into public.classes(id,school_id,school_year_id,name,is_active) values
 ('b1200000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001','b1100000-0000-0000-0000-000000000001','Workflow Class A',true),
 ('b1200000-0000-0000-0000-000000000002','b1000000-0000-0000-0000-000000000001','b1100000-0000-0000-0000-000000000001','Workflow Class B',true),
 ('b1200000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000001','b1100000-0000-0000-0000-000000000002','Workflow Class Next Year',true),
 ('b1200000-0000-0000-0000-000000000004','b1000000-0000-0000-0000-000000000001','b1100000-0000-0000-0000-000000000001','Workflow Class Inactive',false),
 ('b1200000-0000-0000-0000-000000000005','b1000000-0000-0000-0000-000000000001','b1100000-0000-0000-0000-000000000003','Workflow Inactive Year Class',true),
 ('b2200000-0000-0000-0000-000000000001','b2000000-0000-0000-0000-000000000002','b2100000-0000-0000-0000-000000000001','Workflow Other Class',true);
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at) values
 ('00000000-0000-0000-0000-000000000000','ba000000-0000-0000-0000-000000000001','authenticated','authenticated','workflow-admin-a@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','ba000000-0000-0000-0000-000000000002','authenticated','authenticated','workflow-admin-b@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','ba000000-0000-0000-0000-000000000003','authenticated','authenticated','workflow-teacher@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','ba000000-0000-0000-0000-000000000004','authenticated','authenticated','workflow-inactive@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','ba000000-0000-0000-0000-000000000005','authenticated','authenticated','workflow-profileless@example.test','',now(),now(),now());
insert into public.user_profiles(id,school_id,role,active,display_name) values
 ('ba000000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001','ADMIN',true,null),
 ('ba000000-0000-0000-0000-000000000002','b2000000-0000-0000-0000-000000000002','ADMIN',true,null),
 ('ba000000-0000-0000-0000-000000000003','b1000000-0000-0000-0000-000000000001','TEACHER',true,'Workflow Teacher'),
 ('ba000000-0000-0000-0000-000000000004','b1000000-0000-0000-0000-000000000001','ADMIN',false,null);
insert into public.students(id,school_id,first_name,last_name,student_code) values
 ('b1300000-0000-0000-0000-000000000001','b1000000-0000-0000-0000-000000000001','Cross','School','CROSS-1');

select set_config('request.jwt.claim.sub','ba000000-0000-0000-0000-000000000001',true);
set local role authenticated;

-- Atomic creation.
select extensions.lives_ok($$select public.admin_create_student_with_enrollment('  Ada  ','  Martin  ','  A-001  ','b1200000-0000-0000-0000-000000000001','2040-09-01')$$,'ADMIN creates student and enrollment atomically');
select extensions.is((select count(*)::integer from public.students where first_name='Ada' and last_name='Martin'),1,'names are normalized');
select extensions.is((select school_id from public.students where student_code='A-001'),'b1000000-0000-0000-0000-000000000001'::uuid,'student school derives from caller');
select extensions.ok((select is_active from public.students where student_code='A-001'),'student is active');
select extensions.is((select school_year_id from public.enrollments where student_id=(select id from public.students where student_code='A-001')),'b1100000-0000-0000-0000-000000000001'::uuid,'year derives from class');
select extensions.ok((select ends_on is null from public.enrollments where student_id=(select id from public.students where student_code='A-001')),'initial enrollment is open');
select extensions.lives_ok($$select public.admin_create_student_with_enrollment('Empty','Code','   ','b1200000-0000-0000-0000-000000000001','2040-09-02')$$,'blank optional code normalizes to null');
select extensions.ok((select student_code is null from public.students where first_name='Empty'),'normalized optional code is null');
select extensions.throws_ok($$select public.admin_create_student_with_enrollment(' ','Invalid',null,'b1200000-0000-0000-0000-000000000001','2040-09-01')$$,'22023',null,'invalid name rejected');
select extensions.throws_ok($$select public.admin_create_student_with_enrollment('Invalid','Code',E'BAD\nCODE','b1200000-0000-0000-0000-000000000001','2040-09-01')$$,'22023',null,'invalid code rejected');
select extensions.throws_ok($$select public.admin_create_student_with_enrollment('Inactive','Class',null,'b1200000-0000-0000-0000-000000000004','2040-09-01')$$,'P0001',null,'inactive class rejected');
select extensions.throws_ok($$select public.admin_create_student_with_enrollment('Inactive','Year',null,'b1200000-0000-0000-0000-000000000005','2042-09-01')$$,'P0001',null,'inactive school year rejected');
select extensions.throws_ok($$select public.admin_create_student_with_enrollment('Cross','School',null,'b2200000-0000-0000-0000-000000000001','2040-09-01')$$,'P0001',null,'cross-school class rejected');
select extensions.throws_ok($$select public.admin_create_student_with_enrollment('Bad','Date','ORPHAN','b1200000-0000-0000-0000-000000000001','2040-08-31')$$,'22023',null,'out-of-year start rejected');
select extensions.is((select count(*)::integer from public.students where student_code='ORPHAN'),0,'enrollment failure leaves no orphan student');

-- Identity update does not touch enrollment identity.
select extensions.lives_ok($$select public.admin_update_student((select id from public.students where student_code='A-001'),'  Adèle ',' Martin ','  A-002 ',true)$$,'same-school ADMIN updates identity');
select extensions.is((select first_name from public.students where student_code='A-002'),'Adèle','updated name is normalized');
select extensions.is((select count(*)::integer from public.enrollments where student_id=(select id from public.students where student_code='A-002') and class_id='b1200000-0000-0000-0000-000000000001' and starts_on='2040-09-01'),1,'identity update preserves enrollment');
select extensions.throws_ok($$select public.admin_update_student((select id from public.students where student_code='A-002'),' ','Martin',null,true)$$,'22023',null,'invalid update rejected');
select extensions.throws_ok($$select public.admin_update_student((select id from public.students where student_code='A-002'),'Adèle','Martin',null,false)$$,'P0001',null,'deactivation with open enrollment rejected');
select extensions.ok((select is_active from public.students where student_code='A-002'),'failed deactivation leaves student active');

-- Transfer is historical and atomic.
select extensions.lives_ok($$select public.admin_transfer_student((select id from public.students where student_code='A-002'),'b1200000-0000-0000-0000-000000000002','2041-01-15')$$,'valid transfer succeeds');
select extensions.is((select ends_on from public.enrollments where student_id=(select id from public.students where student_code='A-002') and class_id='b1200000-0000-0000-0000-000000000001'),'2041-01-14'::date,'old enrollment ends day before transfer');
select extensions.is((select starts_on from public.enrollments where student_id=(select id from public.students where student_code='A-002') and class_id='b1200000-0000-0000-0000-000000000002'),'2041-01-15'::date,'new enrollment starts on transfer date');
select extensions.ok((select ends_on is null from public.enrollments where student_id=(select id from public.students where student_code='A-002') and class_id='b1200000-0000-0000-0000-000000000002'),'new enrollment is open');
select extensions.is((select count(*)::integer from public.enrollments where student_id=(select id from public.students where student_code='A-002')),2,'transfer preserves both historical records');
select extensions.throws_ok($$select public.admin_transfer_student((select id from public.students where student_code='A-002'),'b1200000-0000-0000-0000-000000000002','2041-02-01')$$,'P0001',null,'same-class transfer rejected');
select extensions.throws_ok($$select public.admin_transfer_student((select id from public.students where student_code='A-002'),'b1200000-0000-0000-0000-000000000001','2041-01-15')$$,'P0001',null,'transfer on current start date rejected');
select extensions.throws_ok($$select public.admin_transfer_student((select id from public.students where student_code='A-002'),'b1200000-0000-0000-0000-000000000001','2041-07-01')$$,'P0001',null,'transfer outside year rejected');
select extensions.throws_ok($$select public.admin_transfer_student((select id from public.students where student_code='A-002'),'b1200000-0000-0000-0000-000000000003','2041-09-01')$$,'P0001',null,'different-year target rejected without same-year open enrollment');
select extensions.throws_ok($$select public.admin_transfer_student((select id from public.students where student_code='A-002'),'b1200000-0000-0000-0000-000000000004','2041-02-01')$$,'P0001',null,'inactive target class rejected');
select extensions.throws_ok($$select public.admin_transfer_student((select id from public.students where student_code='A-002'),'b2200000-0000-0000-0000-000000000001','2041-02-01')$$,'P0001',null,'cross-school target rejected');
select extensions.is((select ends_on from public.enrollments where student_id=(select id from public.students where student_code='A-002') and class_id='b1200000-0000-0000-0000-000000000002'),null::date,'failed transfers roll back current close');

-- Closing leaves identity untouched and makes future deactivation explicit.
select extensions.lives_ok($$select public.admin_close_current_enrollment((select id from public.students where student_code='A-002'),'2041-06-30')$$,'valid enrollment close succeeds');
select extensions.is((select ends_on from public.enrollments where student_id=(select id from public.students where student_code='A-002') order by starts_on desc limit 1),'2041-06-30'::date,'close stores last attendance date');
select extensions.ok((select is_active from public.students where student_code='A-002'),'closing enrollment leaves student active');
select extensions.throws_ok($$select public.admin_close_current_enrollment((select id from public.students where student_code='A-002'),'2041-06-30')$$,'P0001',null,'already closed enrollment rejected');
select extensions.lives_ok($$select public.admin_update_student((select id from public.students where student_code='A-002'),'Adèle','Martin','A-002',false)$$,'student may be deactivated after enrollment closes');
select extensions.ok(not (select is_active from public.students where student_code='A-002'),'deactivation preserves closed history');

-- A separate open enrollment tests invalid close and active-student transfer rejection.
select extensions.lives_ok($$select public.admin_create_student_with_enrollment('Close','Fixture','CLOSE-1','b1200000-0000-0000-0000-000000000001','2040-10-01')$$,'close fixture created');
select extensions.throws_ok($$select public.admin_close_current_enrollment((select id from public.students where student_code='CLOSE-1'),'2040-09-30')$$,'22023',null,'close before start rejected');
select extensions.throws_ok($$select public.admin_close_current_enrollment((select id from public.students where student_code='CLOSE-1'),'2041-07-01')$$,'22023',null,'close outside year rejected');
select extensions.ok((select ends_on is null from public.enrollments where student_id=(select id from public.students where student_code='CLOSE-1')),'failed close leaves enrollment open');
reset role;

-- Other actors fail without tenant disclosure.
select set_config('request.jwt.claim.sub','ba000000-0000-0000-0000-000000000002',true);
set local role authenticated;
select extensions.throws_ok($$select public.admin_update_student('b1300000-0000-0000-0000-000000000001','Other','Admin',null,true)$$,'P0001',null,'cross-school update rejected');
select extensions.throws_ok($$select public.admin_close_current_enrollment('00000000-0000-0000-0000-000000000000','2041-01-01')$$,'P0001',null,'cross-school or missing close target rejected safely');
reset role;
select set_config('request.jwt.claim.sub','ba000000-0000-0000-0000-000000000003',true);
set local role authenticated;
select extensions.throws_ok($$select public.admin_create_student_with_enrollment('Teacher','Denied',null,'b1200000-0000-0000-0000-000000000001','2040-09-01')$$,'42501',null,'teacher creation rejected');
select extensions.throws_ok($$select public.admin_transfer_student('00000000-0000-0000-0000-000000000000','b1200000-0000-0000-0000-000000000002','2041-01-01')$$,'42501',null,'teacher transfer rejected');
select extensions.is((select count(*)::integer from public.students),0,'teacher still sees no students');
reset role;
select set_config('request.jwt.claim.sub','ba000000-0000-0000-0000-000000000004',true);
set local role authenticated;
select extensions.throws_ok($$select public.admin_create_student_with_enrollment('Inactive','Denied',null,'b1200000-0000-0000-0000-000000000001','2040-09-01')$$,'42501',null,'inactive ADMIN rejected');
reset role;
select set_config('request.jwt.claim.sub','ba000000-0000-0000-0000-000000000005',true);
set local role authenticated;
select extensions.throws_ok($$select public.admin_create_student_with_enrollment('Profileless','Denied',null,'b1200000-0000-0000-0000-000000000001','2040-09-01')$$,'42501',null,'profileless user rejected');
reset role;

select extensions.is((select count(*)::integer from pg_policies where schemaname='public'),42,'expanded RLS policy matrix remains intact');
select extensions.is((select count(*)::integer from pg_policies where schemaname='public' and cmd='DELETE'),0,'DELETE policies remain absent');
select extensions.ok(not has_table_privilege('authenticated','public.students','delete') and not has_table_privilege('authenticated','public.enrollments','delete'),'hard deletion remains unavailable');
select extensions.ok(not has_table_privilege('anon','public.students','select') and not has_table_privilege('anon','public.enrollments','select'),'anonymous access remains unavailable');

select extensions.finish();
rollback;
