begin;

create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

-- Schema and privilege contract.
select extensions.has_table('public', 'students', 'students exists');
select extensions.has_table('public', 'enrollments', 'enrollments exists');
select extensions.ok(
  (select array_agg(attname::text order by attnum) from pg_attribute where attrelid='public.students'::regclass and attnum>0 and not attisdropped)
  = array['id','school_id','first_name','last_name','student_code','is_active','created_at','updated_at'],
  'students has expected columns'
);
select extensions.ok(
  (select array_agg(attname::text order by attnum) from pg_attribute where attrelid='public.enrollments'::regclass and attnum>0 and not attisdropped)
  = array['id','school_id','school_year_id','student_id','class_id','starts_on','ends_on','created_at','updated_at'],
  'enrollments has expected columns'
);
select extensions.col_type_is('public','students','student_code','text','student code is text');
select extensions.col_type_is('public','enrollments','starts_on','date','starts_on is date');
select extensions.col_type_is('public','enrollments','ends_on','date','ends_on is date');
select extensions.ok((select count(*)=2 from pg_constraint where conrelid in ('public.students'::regclass,'public.enrollments'::regclass) and contype='p'),'both tables have primary keys');
select extensions.ok(exists(select 1 from pg_constraint where conrelid='public.enrollments'::regclass and conname='enrollments_school_year_school_fk' and contype='f'),'same-school year FK exists');
select extensions.ok(exists(select 1 from pg_constraint where conrelid='public.enrollments'::regclass and conname='enrollments_student_school_fk' and contype='f'),'same-school student FK exists');
select extensions.ok(exists(select 1 from pg_constraint where conrelid='public.enrollments'::regclass and conname='enrollments_class_school_year_fk' and contype='f'),'same-school/year class FK exists');
select extensions.ok(exists(select 1 from pg_constraint where conrelid='public.enrollments'::regclass and conname='enrollments_student_year_no_overlap' and contype='x'),'overlap exclusion constraint exists');
select extensions.ok((select count(*)=3 from pg_trigger where tgrelid in ('public.students'::regclass,'public.enrollments'::regclass) and not tgisinternal),'expected timestamp and integrity triggers exist');
select extensions.ok((select bool_and(relrowsecurity) from pg_class where oid in ('public.students'::regclass,'public.enrollments'::regclass)),'RLS enabled on both tables');
select extensions.is((select count(*)::integer from pg_policies where schemaname='public' and tablename in ('students','enrollments')),6,'six ADMIN policies exist');
select extensions.is((select count(*)::integer from pg_policies where schemaname='public' and tablename in ('students','enrollments') and cmd='DELETE'),0,'no DELETE policy exists');
select extensions.ok(not has_table_privilege('anon','public.students','select,insert,update,delete') and not has_table_privilege('anon','public.enrollments','select,insert,update,delete'),'anonymous has no table grants');
select extensions.ok(has_table_privilege('authenticated','public.students','select') and has_table_privilege('authenticated','public.enrollments','select'),'authenticated has SELECT grants');
select extensions.ok(has_column_privilege('authenticated','public.students','first_name','update') and has_column_privilege('authenticated','public.students','is_active','update') and not has_column_privilege('authenticated','public.students','school_id','update'),'student update grant is column-limited');
select extensions.ok(has_column_privilege('authenticated','public.enrollments','ends_on','update') and not has_column_privilege('authenticated','public.enrollments','class_id','update') and not has_column_privilege('authenticated','public.enrollments','starts_on','update'),'enrollment update grant is ends_on only');
select extensions.ok(not has_table_privilege('authenticated','public.students','delete') and not has_table_privilege('authenticated','public.enrollments','delete'),'authenticated has no DELETE grant');
select extensions.ok(not has_function_privilege('authenticated','public.validate_enrollment_school_year_dates()','execute'),'integrity trigger is not directly executable');

-- Fictional structural fixtures.
insert into public.schools(id,name) values
 ('a1000000-0000-0000-0000-000000000001','Fixture School One'),
 ('a2000000-0000-0000-0000-000000000002','Fixture School Two');
insert into public.school_years(id,school_id,label,start_date,end_date) values
 ('a1100000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','2035–2036','2035-09-01','2036-06-30'),
 ('a1100000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000001','2036–2037','2036-09-01','2037-06-30'),
 ('a2100000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000002','2035–2036','2035-09-01','2036-06-30');
insert into public.classes(id,school_id,school_year_id,name) values
 ('a1200000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','a1100000-0000-0000-0000-000000000001','Fixture Class A'),
 ('a1200000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000001','a1100000-0000-0000-0000-000000000001','Fixture Class B'),
 ('a1200000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000001','a1100000-0000-0000-0000-000000000002','Fixture Class Next'),
 ('a2200000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000002','a2100000-0000-0000-0000-000000000001','Fixture Other Class');

-- Student integrity.
select extensions.lives_ok($$insert into public.students(id,school_id,first_name,last_name,student_code) values ('a1300000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','Alex','Martin','ST-001')$$,'valid student accepted');
select extensions.lives_ok($$insert into public.students(id,school_id,first_name,last_name) values ('a1300000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000001','Alex','Martin')$$,'duplicate student names allowed');
select extensions.throws_ok($$insert into public.students(school_id,first_name,last_name) values ('a1000000-0000-0000-0000-000000000001','','Martin')$$,'23514',null,'blank first name rejected');
select extensions.throws_ok($$insert into public.students(school_id,first_name,last_name) values ('a1000000-0000-0000-0000-000000000001','Alex','   ')$$,'23514',null,'blank last name rejected');
select extensions.throws_ok($$insert into public.students(school_id,first_name,last_name) values ('a1000000-0000-0000-0000-000000000001',' Alex','Martin')$$,'23514',null,'untrimmed first name rejected');
select extensions.throws_ok($$insert into public.students(school_id,first_name,last_name) values ('a1000000-0000-0000-0000-000000000001','Alex','Martin ')$$,'23514',null,'untrimmed last name rejected');
select extensions.throws_ok($$insert into public.students(school_id,first_name,last_name) values ('a1000000-0000-0000-0000-000000000001',repeat('x',101),'Martin')$$,'23514',null,'overlong first name rejected');
select extensions.throws_ok($$insert into public.students(school_id,first_name,last_name) values ('a1000000-0000-0000-0000-000000000001','Alex',repeat('x',101))$$,'23514',null,'overlong last name rejected');
select extensions.throws_ok($$insert into public.students(school_id,first_name,last_name) values ('a1000000-0000-0000-0000-000000000001',E'Alex\n','Martin')$$,'23514',null,'control characters rejected');
select extensions.lives_ok($$insert into public.students(id,school_id,first_name,last_name,student_code) values ('a2300000-0000-0000-0000-000000000001','a2000000-0000-0000-0000-000000000002','Sam','Fixture','st-001')$$,'same code in another school accepted');
select extensions.throws_ok($$insert into public.students(school_id,first_name,last_name,student_code) values ('a1000000-0000-0000-0000-000000000001','Sam','Fixture','')$$,'23514',null,'empty student code rejected');
select extensions.throws_ok($$insert into public.students(school_id,first_name,last_name,student_code) values ('a1000000-0000-0000-0000-000000000001','Sam','Fixture',' ST-2')$$,'23514',null,'untrimmed student code rejected');
select extensions.throws_ok($$insert into public.students(school_id,first_name,last_name,student_code) values ('a1000000-0000-0000-0000-000000000001','Sam','Fixture','st-001')$$,'23505',null,'student code is case-insensitively unique per school');
select extensions.lives_ok($$update public.students set is_active=false where id='a1300000-0000-0000-0000-000000000002'$$,'student can be deactivated');
select extensions.is((select count(*)::integer from public.students where id='a1300000-0000-0000-0000-000000000002'),1,'deactivation preserves student row');

-- Enrollment integrity and history.
select extensions.lives_ok($$insert into public.enrollments(id,school_id,school_year_id,student_id,class_id,starts_on) values ('a1400000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','a1100000-0000-0000-0000-000000000001','a1300000-0000-0000-0000-000000000001','a1200000-0000-0000-0000-000000000001','2035-09-01')$$,'valid open enrollment accepted');
select extensions.lives_ok($$insert into public.enrollments(id,school_id,school_year_id,student_id,class_id,starts_on,ends_on) values ('a1400000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000001','a1100000-0000-0000-0000-000000000001','a1300000-0000-0000-0000-000000000002','a1200000-0000-0000-0000-000000000001','2035-09-01','2035-09-10')$$,'valid closed enrollment accepted');
select extensions.throws_ok($$insert into public.enrollments(school_id,school_year_id,student_id,class_id,starts_on,ends_on) values ('a1000000-0000-0000-0000-000000000001','a1100000-0000-0000-0000-000000000001','a1300000-0000-0000-0000-000000000002','a1200000-0000-0000-0000-000000000001','2035-09-10','2035-09-09')$$,'23514',null,'end before start rejected');
select extensions.throws_ok($$insert into public.enrollments(school_id,school_year_id,student_id,class_id,starts_on) values ('a1000000-0000-0000-0000-000000000001','a1100000-0000-0000-0000-000000000001','a1300000-0000-0000-0000-000000000002','a1200000-0000-0000-0000-000000000001','2035-08-31')$$,'23514',null,'enrollment before year rejected');
select extensions.throws_ok($$insert into public.enrollments(school_id,school_year_id,student_id,class_id,starts_on) values ('a1000000-0000-0000-0000-000000000001','a1100000-0000-0000-0000-000000000001','a1300000-0000-0000-0000-000000000002','a1200000-0000-0000-0000-000000000001','2036-07-01')$$,'23514',null,'enrollment after year rejected');
select extensions.throws_ok($$insert into public.enrollments(school_id,school_year_id,student_id,class_id,starts_on) values ('a1000000-0000-0000-0000-000000000001','a1100000-0000-0000-0000-000000000001','a2300000-0000-0000-0000-000000000001','a1200000-0000-0000-0000-000000000001','2035-10-01')$$,'23503',null,'other-school student rejected');
select extensions.throws_ok($$insert into public.enrollments(school_id,school_year_id,student_id,class_id,starts_on) values ('a1000000-0000-0000-0000-000000000001','a1100000-0000-0000-0000-000000000001','a1300000-0000-0000-0000-000000000002','a2200000-0000-0000-0000-000000000001','2035-10-01')$$,'23503',null,'other-school class rejected');
select extensions.throws_ok($$insert into public.enrollments(school_id,school_year_id,student_id,class_id,starts_on) values ('a1000000-0000-0000-0000-000000000001','a1100000-0000-0000-0000-000000000001','a1300000-0000-0000-0000-000000000002','a1200000-0000-0000-0000-000000000003','2035-10-01')$$,'23503',null,'class from another year rejected');
select extensions.throws_ok($$insert into public.enrollments(school_id,school_year_id,student_id,class_id,starts_on,ends_on) values ('a1000000-0000-0000-0000-000000000001','a1100000-0000-0000-0000-000000000001','a1300000-0000-0000-0000-000000000002','a1200000-0000-0000-0000-000000000002','2035-09-05','2035-09-12')$$,'23P01',null,'overlap rejected');
select extensions.throws_ok($$insert into public.enrollments(school_id,school_year_id,student_id,class_id,starts_on,ends_on) values ('a1000000-0000-0000-0000-000000000001','a1100000-0000-0000-0000-000000000001','a1300000-0000-0000-0000-000000000002','a1200000-0000-0000-0000-000000000002','2035-09-01','2035-09-10')$$,'23P01',null,'identical range rejected');
select extensions.throws_ok($$insert into public.enrollments(school_id,school_year_id,student_id,class_id,starts_on) values ('a1000000-0000-0000-0000-000000000001','a1100000-0000-0000-0000-000000000001','a1300000-0000-0000-0000-000000000001','a1200000-0000-0000-0000-000000000002','2036-01-01')$$,'23P01',null,'open enrollment blocks later overlap');
select extensions.lives_ok($$insert into public.enrollments(id,school_id,school_year_id,student_id,class_id,starts_on,ends_on) values ('a1400000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000001','a1100000-0000-0000-0000-000000000001','a1300000-0000-0000-0000-000000000002','a1200000-0000-0000-0000-000000000002','2035-09-11','2036-06-30')$$,'next-day class transfer accepted');
select extensions.throws_ok($$insert into public.enrollments(school_id,school_year_id,student_id,class_id,starts_on,ends_on) values ('a1000000-0000-0000-0000-000000000001','a1100000-0000-0000-0000-000000000001','a1300000-0000-0000-0000-000000000002','a1200000-0000-0000-0000-000000000002','2035-09-10','2035-09-10')$$,'23P01',null,'same-day adjacency overlaps under inclusive dates');
select extensions.lives_ok($$insert into public.enrollments(id,school_id,school_year_id,student_id,class_id,starts_on) values ('a1400000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000001','a1100000-0000-0000-0000-000000000002','a1300000-0000-0000-0000-000000000002','a1200000-0000-0000-0000-000000000003','2036-09-01')$$,'different-year enrollment accepted');
select extensions.throws_ok($$update public.enrollments set ends_on='2037-07-01' where id='a1400000-0000-0000-0000-000000000004'$$,'23514',null,'invalid closing date rejected');
select extensions.throws_ok($$delete from public.students where id='a1300000-0000-0000-0000-000000000001'$$,'23503',null,'student parent deletion restricted');
select extensions.throws_ok($$delete from public.classes where id='a1200000-0000-0000-0000-000000000001'$$,'23503',null,'class parent deletion restricted');

-- Auth fixtures and RLS behavior.
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at) values
 ('00000000-0000-0000-0000-000000000000','aa000000-0000-0000-0000-000000000001','authenticated','authenticated','student-admin-one@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','aa000000-0000-0000-0000-000000000002','authenticated','authenticated','student-admin-two@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','aa000000-0000-0000-0000-000000000003','authenticated','authenticated','student-teacher@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','aa000000-0000-0000-0000-000000000004','authenticated','authenticated','student-inactive@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','aa000000-0000-0000-0000-000000000005','authenticated','authenticated','student-missing@example.test','',now(),now(),now());
insert into public.user_profiles(id,school_id,role,active,display_name) values
 ('aa000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','ADMIN',true,null),
 ('aa000000-0000-0000-0000-000000000002','a2000000-0000-0000-0000-000000000002','ADMIN',true,null),
 ('aa000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000001','TEACHER',true,'Fixture Teacher'),
 ('aa000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000001','ADMIN',false,null);

set local role anon;
select extensions.throws_ok($$select * from public.students$$,'42501',null,'anonymous sees no students');
select extensions.throws_ok($$select * from public.enrollments$$,'42501',null,'anonymous sees no enrollments');
reset role;

select set_config('request.jwt.claim.sub','aa000000-0000-0000-0000-000000000005',true);
set local role authenticated;
select extensions.is((select count(*)::integer from public.students),0,'missing-profile user sees no students');
select extensions.is((select count(*)::integer from public.enrollments),0,'missing-profile user sees no enrollments');
reset role;
select set_config('request.jwt.claim.sub','aa000000-0000-0000-0000-000000000004',true);
set local role authenticated;
select extensions.is((select count(*)::integer from public.students),0,'inactive profile sees no students');
select extensions.is((select count(*)::integer from public.enrollments),0,'inactive profile sees no enrollments');
reset role;
select set_config('request.jwt.claim.sub','aa000000-0000-0000-0000-000000000003',true);
set local role authenticated;
select extensions.is((select count(*)::integer from public.students),0,'active teacher sees no students');
select extensions.is((select count(*)::integer from public.enrollments),0,'active teacher sees no enrollments');
select extensions.throws_ok($$insert into public.students(school_id,first_name,last_name) values ('a1000000-0000-0000-0000-000000000001','Teacher','Denied')$$,'42501',null,'teacher cannot insert student');
select extensions.lives_ok($$update public.students set first_name='Teacher Edit' where id='a1300000-0000-0000-0000-000000000001'$$,'teacher update reaches no row');
reset role;

select set_config('request.jwt.claim.sub','aa000000-0000-0000-0000-000000000001',true);
set local role authenticated;
select extensions.is((select count(*)::integer from public.students),2,'same-school ADMIN sees own students');
select extensions.is((select count(*)::integer from public.enrollments),4,'same-school ADMIN sees own enrollments');
select extensions.lives_ok($$insert into public.students(school_id,first_name,last_name,student_code) values ('a1000000-0000-0000-0000-000000000001','Admin','Created','ADMIN-1')$$,'ADMIN inserts own-school student');
select extensions.throws_ok($$insert into public.students(school_id,first_name,last_name) values ('a2000000-0000-0000-0000-000000000002','Forged','Student')$$,'42501',null,'ADMIN cannot insert other-school student');
select extensions.lives_ok($$update public.students set first_name='Alexandre',is_active=true where id='a1300000-0000-0000-0000-000000000002'$$,'ADMIN updates allowed student fields');
select extensions.throws_ok($$update public.students set school_id='a2000000-0000-0000-0000-000000000002' where id='a1300000-0000-0000-0000-000000000002'$$,'42501',null,'ADMIN cannot change student school');
select extensions.throws_ok($$update public.enrollments set class_id='a1200000-0000-0000-0000-000000000002' where id='a1400000-0000-0000-0000-000000000001'$$,'42501',null,'ADMIN cannot change enrollment class');
select extensions.throws_ok($$update public.enrollments set student_id='a1300000-0000-0000-0000-000000000002' where id='a1400000-0000-0000-0000-000000000001'$$,'42501',null,'ADMIN cannot change enrollment student');
select extensions.throws_ok($$update public.enrollments set school_year_id='a1100000-0000-0000-0000-000000000002' where id='a1400000-0000-0000-0000-000000000001'$$,'42501',null,'ADMIN cannot change enrollment year');
select extensions.throws_ok($$update public.enrollments set starts_on='2035-09-02' where id='a1400000-0000-0000-0000-000000000001'$$,'42501',null,'ADMIN cannot change enrollment start');
select extensions.lives_ok($$update public.enrollments set ends_on='2036-06-30' where id='a1400000-0000-0000-0000-000000000001'$$,'ADMIN can close enrollment');
select extensions.throws_ok($$delete from public.students where id='a1300000-0000-0000-0000-000000000002'$$,'42501',null,'ADMIN cannot hard-delete student');
select extensions.throws_ok($$delete from public.enrollments where id='a1400000-0000-0000-0000-000000000002'$$,'42501',null,'ADMIN cannot hard-delete enrollment');
reset role;

select set_config('request.jwt.claim.sub','aa000000-0000-0000-0000-000000000002',true);
set local role authenticated;
select extensions.is((select count(*)::integer from public.students),1,'other-school ADMIN sees only own students');
select extensions.is((select count(*)::integer from public.enrollments),0,'other-school ADMIN sees no first-school enrollments');
select extensions.lives_ok($$update public.students set first_name='Hidden Edit' where id='a1300000-0000-0000-0000-000000000001'$$,'other-school student update reaches no row');
select extensions.lives_ok($$update public.enrollments set ends_on='2035-12-01' where id='a1400000-0000-0000-0000-000000000001'$$,'other-school enrollment update reaches no row');
reset role;
select extensions.is((select first_name from public.students where id='a1300000-0000-0000-0000-000000000001'),'Alex','failed and invisible mutations leave no partial change');

select extensions.finish();
rollback;
