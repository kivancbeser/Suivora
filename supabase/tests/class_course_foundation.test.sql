begin;

create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

select extensions.has_table('public', 'classes', 'classes exists');
select extensions.has_table('public', 'courses', 'courses exists');
select extensions.has_table('public', 'class_courses', 'class_courses exists');

select extensions.ok(
  (select array_agg(attname::text order by attnum) from pg_attribute
   where attrelid = 'public.classes'::regclass and attnum > 0 and not attisdropped)
  = array['id','school_id','school_year_id','name','is_active','created_at','updated_at'],
  'classes has the expected columns'
);
select extensions.ok(
  (select array_agg(attname::text order by attnum) from pg_attribute
   where attrelid = 'public.courses'::regclass and attnum > 0 and not attisdropped)
  = array['id','school_id','name','code','is_active','created_at','updated_at'],
  'courses has the expected columns'
);
select extensions.ok(
  (select array_agg(attname::text order by attnum) from pg_attribute
   where attrelid = 'public.class_courses'::regclass and attnum > 0 and not attisdropped)
  = array['id','school_id','school_year_id','class_id','course_id','weekly_periods','is_active','created_at','updated_at'],
  'class_courses has the expected columns'
);
select extensions.col_type_is('public', 'class_courses', 'weekly_periods', 'smallint', 'weekly periods is an integer type');

select extensions.ok(
  (select count(*) = 3 from pg_constraint where conrelid in ('public.classes'::regclass, 'public.courses'::regclass, 'public.class_courses'::regclass) and contype = 'p'),
  'all new tables have primary keys'
);
select extensions.ok(
  exists (select 1 from pg_constraint where conrelid = 'public.classes'::regclass and conname = 'classes_school_year_school_fk' and contype = 'f'),
  'classes has the same-school school-year foreign key'
);
select extensions.ok(
  exists (select 1 from pg_constraint where conrelid = 'public.class_courses'::regclass and conname = 'class_courses_class_school_year_fk' and contype = 'f'),
  'class_courses has the same-school/year class foreign key'
);
select extensions.ok(
  exists (select 1 from pg_constraint where conrelid = 'public.class_courses'::regclass and conname = 'class_courses_course_school_fk' and contype = 'f'),
  'class_courses has the same-school course foreign key'
);
select extensions.ok(
  (select count(*) = 3 from pg_trigger where tgrelid in ('public.classes'::regclass, 'public.courses'::regclass, 'public.class_courses'::regclass) and tgname like '%_set_updated_at' and not tgisinternal),
  'all new tables have updated-at triggers'
);
select extensions.ok(
  (select count(*) = 3 from pg_class where oid in ('public.classes'::regclass, 'public.courses'::regclass, 'public.class_courses'::regclass) and relrowsecurity),
  'RLS is enabled on every new table'
);
select extensions.is(
  (select count(*)::integer from pg_policies where schemaname = 'public' and tablename in ('classes','courses','class_courses')),
  12,
  'nine ADMIN and three assignment-scoped SELECT policies exist'
);
select extensions.is(
  (select count(*)::integer from pg_policies where schemaname = 'public' and tablename in ('classes','courses','class_courses') and cmd = 'DELETE'),
  0,
  'no DELETE policy exists'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.classes', 'select,insert,update,delete')
  and not has_table_privilege('anon', 'public.courses', 'select,insert,update,delete')
  and not has_table_privilege('anon', 'public.class_courses', 'select,insert,update,delete'),
  'anonymous has no privileges on new tables'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.classes', 'delete')
  and not has_table_privilege('authenticated', 'public.courses', 'delete')
  and not has_table_privilege('authenticated', 'public.class_courses', 'delete'),
  'authenticated has no DELETE grant'
);

insert into public.schools (id, name) values
  ('91000000-0000-0000-0000-000000000001', 'Test School One'),
  ('92000000-0000-0000-0000-000000000002', 'Test School Two');
insert into public.school_years (id, school_id, label, start_date, end_date) values
  ('91100000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001', 'Year One', '2035-09-01', '2036-06-30'),
  ('91100000-0000-0000-0000-000000000002', '91000000-0000-0000-0000-000000000001', 'Year Two', '2036-09-01', '2037-06-30'),
  ('92100000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000002', 'Year Other', '2035-09-01', '2036-06-30');

select extensions.lives_ok(
  $$insert into public.classes (id, school_id, school_year_id, name) values ('91200000-0000-0000-0000-000000000001','91000000-0000-0000-0000-000000000001','91100000-0000-0000-0000-000000000001','Class A')$$,
  'valid class accepted'
);
select extensions.throws_ok($$insert into public.classes (school_id,school_year_id,name) values ('91000000-0000-0000-0000-000000000001','91100000-0000-0000-0000-000000000001','')$$, '23514', null, 'blank class rejected');
select extensions.throws_ok($$insert into public.classes (school_id,school_year_id,name) values ('91000000-0000-0000-0000-000000000001','91100000-0000-0000-0000-000000000001',' Class B')$$, '23514', null, 'untrimmed class rejected');
select extensions.throws_ok($$insert into public.classes (school_id,school_year_id,name) values ('91000000-0000-0000-0000-000000000001','91100000-0000-0000-0000-000000000001',repeat('x',121))$$, '23514', null, 'overlong class rejected');
select extensions.throws_ok($$insert into public.classes (school_id,school_year_id,name) values ('91000000-0000-0000-0000-000000000001','91100000-0000-0000-0000-000000000001','class a')$$, '23505', null, 'case-insensitive duplicate class rejected');
select extensions.lives_ok($$insert into public.classes (id,school_id,school_year_id,name) values ('91200000-0000-0000-0000-000000000002','91000000-0000-0000-0000-000000000001','91100000-0000-0000-0000-000000000002','class a')$$, 'same class name in another year accepted');
select extensions.throws_ok($$insert into public.classes (school_id,school_year_id,name) values ('91000000-0000-0000-0000-000000000001','92100000-0000-0000-0000-000000000001','Cross')$$, '23503', null, 'cross-school class year rejected');

select extensions.lives_ok($$insert into public.courses (id,school_id,name,code) values ('91300000-0000-0000-0000-000000000001','91000000-0000-0000-0000-000000000001','French','FR')$$, 'valid coded course accepted');
select extensions.lives_ok($$insert into public.courses (id,school_id,name) values ('91300000-0000-0000-0000-000000000002','91000000-0000-0000-0000-000000000001','Mathematics')$$, 'null course code accepted');
select extensions.throws_ok($$insert into public.courses (school_id,name) values ('91000000-0000-0000-0000-000000000001','')$$, '23514', null, 'blank course name rejected');
select extensions.throws_ok($$insert into public.courses (school_id,name) values ('91000000-0000-0000-0000-000000000001',' French')$$, '23514', null, 'untrimmed course name rejected');
select extensions.throws_ok($$insert into public.courses (school_id,name) values ('91000000-0000-0000-0000-000000000001',repeat('x',121))$$, '23514', null, 'overlong course name rejected');
select extensions.throws_ok($$insert into public.courses (school_id,name) values ('91000000-0000-0000-0000-000000000001','french')$$, '23505', null, 'case-insensitive duplicate course name rejected');
select extensions.lives_ok($$insert into public.courses (id,school_id,name,code) values ('92300000-0000-0000-0000-000000000001','92000000-0000-0000-0000-000000000002','french','fr')$$, 'same course name and code in another school accepted');
select extensions.throws_ok($$insert into public.courses (school_id,name,code) values ('91000000-0000-0000-0000-000000000001','Art','')$$, '23514', null, 'blank course code rejected');
select extensions.throws_ok($$insert into public.courses (school_id,name,code) values ('91000000-0000-0000-0000-000000000001','Art',' ART')$$, '23514', null, 'untrimmed course code rejected');
select extensions.throws_ok($$insert into public.courses (school_id,name,code) values ('91000000-0000-0000-0000-000000000001','Language','fr')$$, '23505', null, 'case-insensitive duplicate course code rejected');

select extensions.lives_ok($$insert into public.class_courses (id,school_id,school_year_id,class_id,course_id,weekly_periods) values ('91400000-0000-0000-0000-000000000001','91000000-0000-0000-0000-000000000001','91100000-0000-0000-0000-000000000001','91200000-0000-0000-0000-000000000001','91300000-0000-0000-0000-000000000001',1)$$, 'valid lower-bound ClassCourse accepted');
select extensions.lives_ok($$insert into public.class_courses (id,school_id,school_year_id,class_id,course_id,weekly_periods) values ('91400000-0000-0000-0000-000000000002','91000000-0000-0000-0000-000000000001','91100000-0000-0000-0000-000000000001','91200000-0000-0000-0000-000000000001','91300000-0000-0000-0000-000000000002',40)$$, 'valid upper-bound ClassCourse accepted');
select extensions.throws_ok($$insert into public.class_courses (school_id,school_year_id,class_id,course_id,weekly_periods) values ('91000000-0000-0000-0000-000000000001','91100000-0000-0000-0000-000000000001','91200000-0000-0000-0000-000000000001','91300000-0000-0000-0000-000000000001',2)$$, '23505', null, 'duplicate ClassCourse rejected');
select extensions.throws_ok($$insert into public.class_courses (school_id,school_year_id,class_id,course_id,weekly_periods) values ('92000000-0000-0000-0000-000000000002','91100000-0000-0000-0000-000000000001','91200000-0000-0000-0000-000000000001','92300000-0000-0000-0000-000000000001',2)$$, '23503', null, 'cross-school class association rejected');
select extensions.throws_ok($$insert into public.class_courses (school_id,school_year_id,class_id,course_id,weekly_periods) values ('91000000-0000-0000-0000-000000000001','91100000-0000-0000-0000-000000000001','91200000-0000-0000-0000-000000000001','92300000-0000-0000-0000-000000000001',2)$$, '23503', null, 'cross-school course association rejected');
select extensions.throws_ok($$insert into public.class_courses (school_id,school_year_id,class_id,course_id,weekly_periods) values ('91000000-0000-0000-0000-000000000001','91100000-0000-0000-0000-000000000002','91200000-0000-0000-0000-000000000001','91300000-0000-0000-0000-000000000002',2)$$, '23503', null, 'cross-year class association rejected');
select extensions.throws_ok($$insert into public.class_courses (school_id,school_year_id,class_id,course_id,weekly_periods) values ('91000000-0000-0000-0000-000000000001','91100000-0000-0000-0000-000000000002','91200000-0000-0000-0000-000000000002','91300000-0000-0000-0000-000000000002',0)$$, '23514', null, 'zero weekly periods rejected');
select extensions.throws_ok($$insert into public.class_courses (school_id,school_year_id,class_id,course_id,weekly_periods) values ('91000000-0000-0000-0000-000000000001','91100000-0000-0000-0000-000000000002','91200000-0000-0000-0000-000000000002','91300000-0000-0000-0000-000000000002',-1)$$, '23514', null, 'negative weekly periods rejected');
select extensions.throws_ok($$insert into public.class_courses (school_id,school_year_id,class_id,course_id,weekly_periods) values ('91000000-0000-0000-0000-000000000001','91100000-0000-0000-0000-000000000002','91200000-0000-0000-0000-000000000002','91300000-0000-0000-0000-000000000002',41)$$, '23514', null, 'weekly periods above 40 rejected');
select extensions.throws_ok($$delete from public.classes where id = '91200000-0000-0000-0000-000000000001'$$, '23503', null, 'referenced class deletion is restricted');
select extensions.throws_ok($$delete from public.courses where id = '91300000-0000-0000-0000-000000000001'$$, '23503', null, 'referenced course deletion is restricted');

insert into auth.users (instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at) values
 ('00000000-0000-0000-0000-000000000000','9a000000-0000-0000-0000-000000000001','authenticated','authenticated','structure-admin-one@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','9a000000-0000-0000-0000-000000000002','authenticated','authenticated','structure-admin-two@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','9a000000-0000-0000-0000-000000000003','authenticated','authenticated','structure-teacher@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','9a000000-0000-0000-0000-000000000004','authenticated','authenticated','structure-inactive@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','9a000000-0000-0000-0000-000000000005','authenticated','authenticated','structure-missing@example.test','',now(),now(),now());
insert into public.user_profiles (id,school_id,role,active,display_name) values
 ('9a000000-0000-0000-0000-000000000001','91000000-0000-0000-0000-000000000001','ADMIN',true,null),
 ('9a000000-0000-0000-0000-000000000002','92000000-0000-0000-0000-000000000002','ADMIN',true,null),
 ('9a000000-0000-0000-0000-000000000003','91000000-0000-0000-0000-000000000001','TEACHER',true,'Test Teacher'),
 ('9a000000-0000-0000-0000-000000000004','91000000-0000-0000-0000-000000000001','TEACHER',false,'Inactive Teacher');

set local role anon;
select extensions.throws_ok($$select * from public.classes$$, '42501', null, 'anonymous cannot read classes');
select extensions.throws_ok($$select * from public.courses$$, '42501', null, 'anonymous cannot read courses');
select extensions.throws_ok($$select * from public.class_courses$$, '42501', null, 'anonymous cannot read ClassCourses');
reset role;

select set_config('request.jwt.claim.sub','9a000000-0000-0000-0000-000000000005',true);
set local role authenticated;
select extensions.is((select count(*)::integer from public.classes), 0, 'missing-profile user sees no classes');
reset role;
select set_config('request.jwt.claim.sub','9a000000-0000-0000-0000-000000000004',true);
set local role authenticated;
select extensions.is((select count(*)::integer from public.courses), 0, 'inactive-profile user sees no courses');
reset role;
select set_config('request.jwt.claim.sub','9a000000-0000-0000-0000-000000000003',true);
set local role authenticated;
select extensions.is((select count(*)::integer from public.class_courses), 0, 'active TEACHER sees no ClassCourses');
select extensions.throws_ok($$insert into public.courses (school_id,name) values ('91000000-0000-0000-0000-000000000001','Teacher Insert')$$, '42501', null, 'TEACHER cannot insert');
select extensions.is((select count(*)::integer from public.courses where name = 'Teacher Insert'), 0, 'failed TEACHER insert leaves no row');
reset role;

select set_config('request.jwt.claim.sub','9a000000-0000-0000-0000-000000000001',true);
set local role authenticated;
select extensions.is((select count(*)::integer from public.classes), 2, 'same-school ADMIN reads own classes');
select extensions.is((select count(*)::integer from public.courses), 2, 'same-school ADMIN reads own courses');
select extensions.is((select count(*)::integer from public.class_courses), 2, 'same-school ADMIN reads own ClassCourses');
select extensions.lives_ok($$insert into public.classes (school_id,school_year_id,name) values ('91000000-0000-0000-0000-000000000001','91100000-0000-0000-0000-000000000002','Admin Class')$$, 'ADMIN creates an own-school class');
select extensions.lives_ok($$insert into public.courses (school_id,name,code) values ('91000000-0000-0000-0000-000000000001','Admin Course','ADM')$$, 'ADMIN creates an own-school course');
select extensions.lives_ok($$insert into public.class_courses (school_id,school_year_id,class_id,course_id,weekly_periods) select '91000000-0000-0000-0000-000000000001','91100000-0000-0000-0000-000000000002',cl.id,co.id,2 from public.classes cl cross join public.courses co where cl.name='Admin Class' and co.name='Admin Course'$$, 'ADMIN creates a valid own-school ClassCourse');
select extensions.throws_ok($$insert into public.courses (school_id,name) values ('92000000-0000-0000-0000-000000000002','Cross-school Insert')$$, '42501', null, 'ADMIN cannot insert another school course');
select extensions.throws_ok($$update public.classes set school_year_id='92100000-0000-0000-0000-000000000001' where name='Admin Class'$$, '23503', null, 'ADMIN cannot bypass school-year consistency');
select extensions.throws_ok($$update public.classes set school_id='92000000-0000-0000-0000-000000000002' where name='Admin Class'$$, '42501', null, 'ADMIN cannot update a class into another school');
select extensions.throws_ok($$delete from public.class_courses where id='91400000-0000-0000-0000-000000000001'$$, '42501', null, 'ADMIN cannot delete');
select extensions.is((select school_year_id from public.classes where name='Admin Class'), '91100000-0000-0000-0000-000000000002'::uuid, 'failed year move leaves original value');
reset role;

select set_config('request.jwt.claim.sub','9a000000-0000-0000-0000-000000000002',true);
set local role authenticated;
select extensions.is((select count(*)::integer from public.classes), 0, 'other-school ADMIN cannot read first-school classes');
select extensions.is((select count(*)::integer from public.courses), 1, 'other-school ADMIN reads only own course');
select extensions.is((select count(*)::integer from public.class_courses), 0, 'other-school ADMIN cannot read first-school ClassCourses');
reset role;

select set_config('request.jwt.claim.sub','9a000000-0000-0000-0000-000000000003',true);
set local role authenticated;
select extensions.lives_ok($$update public.courses set name='Teacher Update' where id='91300000-0000-0000-0000-000000000001'$$, 'TEACHER update cannot reach a protected row');
reset role;
select extensions.is((select name from public.courses where id='91300000-0000-0000-0000-000000000001'), 'French', 'TEACHER update leaves the protected row unchanged');

select extensions.finish();
rollback;
