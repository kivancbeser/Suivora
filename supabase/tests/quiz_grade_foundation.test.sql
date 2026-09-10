begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

select extensions.has_table('public','quizzes','quizzes table exists');
select extensions.has_table('public','quiz_scores','quiz scores table exists');
select extensions.has_type('public','quiz_slot','quiz slot enum exists');
select extensions.is(
  (select array_agg(enumlabel::text order by enumsortorder) from pg_enum where enumtypid='public.quiz_slot'::regtype),
  array['C1','C2','C3','C4','C5','C6','C7','C8'],
  'quiz slots are fixed'
);
select extensions.ok((select relrowsecurity from pg_class where oid='public.quizzes'::regclass),'quizzes has RLS');
select extensions.ok((select relrowsecurity from pg_class where oid='public.quiz_scores'::regclass),'quiz scores has RLS');
select extensions.is((select count(*)::integer from pg_policies where schemaname='public' and tablename in ('quizzes','quiz_scores')),2,'only narrow read policies exist');
select extensions.ok(not has_table_privilege('authenticated','public.quizzes','insert,update,delete'),'authenticated has no direct quiz mutation');
select extensions.ok(not has_table_privilege('authenticated','public.quiz_scores','insert,update,delete'),'authenticated has no direct score mutation');
select extensions.ok(to_regprocedure('public.create_quiz(uuid,uuid,public.quiz_slot,text,date)') is not null,'create quiz RPC exists');
select extensions.ok(to_regprocedure('public.update_quiz(uuid,text,date,boolean)') is not null,'update quiz RPC exists');
select extensions.ok(to_regprocedure('public.save_quiz_scores(uuid,uuid[],numeric[])') is not null,'bulk score RPC exists');
select extensions.ok(not has_function_privilege('anon','public.save_quiz_scores(uuid,uuid[],numeric[])','execute'),'anonymous cannot save scores');
select extensions.ok(has_function_privilege('authenticated','public.save_quiz_scores(uuid,uuid[],numeric[])','execute'),'authenticated may reach protected score RPC');

insert into public.schools(id,name) values
 ('d1000000-0000-0000-0000-000000000001','Grade School One'),
 ('d2000000-0000-0000-0000-000000000002','Grade School Two');
insert into public.school_years(id,school_id,label,start_date,end_date,active) values
 ('d1100000-0000-0000-0000-000000000001','d1000000-0000-0000-0000-000000000001','2046–2047','2046-09-01','2047-06-30',true),
 ('d2100000-0000-0000-0000-000000000001','d2000000-0000-0000-0000-000000000002','2046–2047','2046-09-01','2047-06-30',true);
insert into public.terms(id,school_id,school_year_id,semester_number,start_date,end_date) values
 ('d1110000-0000-0000-0000-000000000001','d1000000-0000-0000-0000-000000000001','d1100000-0000-0000-0000-000000000001',1,'2046-09-01','2047-01-15'),
 ('d1110000-0000-0000-0000-000000000002','d1000000-0000-0000-0000-000000000001','d1100000-0000-0000-0000-000000000001',2,'2047-02-01','2047-06-30'),
 ('d2110000-0000-0000-0000-000000000001','d2000000-0000-0000-0000-000000000002','d2100000-0000-0000-0000-000000000001',1,'2046-09-01','2047-01-15');
insert into public.classes(id,school_id,school_year_id,name) values
 ('d1200000-0000-0000-0000-000000000001','d1000000-0000-0000-0000-000000000001','d1100000-0000-0000-0000-000000000001','Grade Class'),
 ('d2200000-0000-0000-0000-000000000001','d2000000-0000-0000-0000-000000000002','d2100000-0000-0000-0000-000000000001','Other Class');
insert into public.courses(id,school_id,name,code) values
 ('d1300000-0000-0000-0000-000000000001','d1000000-0000-0000-0000-000000000001','Grade Course','GRA'),
 ('d2300000-0000-0000-0000-000000000001','d2000000-0000-0000-0000-000000000002','Other Course','OTH');
insert into public.class_courses(id,school_id,school_year_id,class_id,course_id,weekly_periods) values
 ('d1400000-0000-0000-0000-000000000001','d1000000-0000-0000-0000-000000000001','d1100000-0000-0000-0000-000000000001','d1200000-0000-0000-0000-000000000001','d1300000-0000-0000-0000-000000000001',10),
 ('d2400000-0000-0000-0000-000000000001','d2000000-0000-0000-0000-000000000002','d2100000-0000-0000-0000-000000000001','d2200000-0000-0000-0000-000000000001','d2300000-0000-0000-0000-000000000001',10);
insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at) values
 ('00000000-0000-0000-0000-000000000000','da000000-0000-0000-0000-000000000001','authenticated','authenticated','grade-admin@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','da000000-0000-0000-0000-000000000002','authenticated','authenticated','grade-teacher@example.test','',now(),now(),now()),
 ('00000000-0000-0000-0000-000000000000','da000000-0000-0000-0000-000000000003','authenticated','authenticated','grade-other@example.test','',now(),now(),now());
insert into public.user_profiles(id,school_id,role,active,display_name) values
 ('da000000-0000-0000-0000-000000000001','d1000000-0000-0000-0000-000000000001','ADMIN',true,'Grade Admin'),
 ('da000000-0000-0000-0000-000000000002','d1000000-0000-0000-0000-000000000001','TEACHER',true,'Grade Teacher'),
 ('da000000-0000-0000-0000-000000000003','d2000000-0000-0000-0000-000000000002','ADMIN',true,'Other Admin');
insert into public.teacher_assignments(school_id,class_course_id,teacher_id,weekly_periods)
values('d1000000-0000-0000-0000-000000000001','d1400000-0000-0000-0000-000000000001','da000000-0000-0000-0000-000000000002',10);
insert into public.students(id,school_id,first_name,last_name) values
 ('d1500000-0000-0000-0000-000000000001','d1000000-0000-0000-0000-000000000001','Current','Learner'),
 ('d1500000-0000-0000-0000-000000000002','d1000000-0000-0000-0000-000000000001','Late','Learner');
insert into public.enrollments(school_id,school_year_id,student_id,class_id,starts_on) values
 ('d1000000-0000-0000-0000-000000000001','d1100000-0000-0000-0000-000000000001','d1500000-0000-0000-0000-000000000001','d1200000-0000-0000-0000-000000000001','2046-09-01'),
 ('d1000000-0000-0000-0000-000000000001','d1100000-0000-0000-0000-000000000001','d1500000-0000-0000-0000-000000000002','d1200000-0000-0000-0000-000000000001','2047-01-01');

select set_config('request.jwt.claim.sub','da000000-0000-0000-0000-000000000001',true);
set local role authenticated;
select extensions.lives_ok($$select public.create_quiz('d1400000-0000-0000-0000-000000000001','d1110000-0000-0000-0000-000000000001','C1','Quiz One','2046-10-01')$$,'ADMIN creates quiz through RPC');
select extensions.throws_ok($$select public.create_quiz('d1400000-0000-0000-0000-000000000001','d1110000-0000-0000-0000-000000000001','C5','Wrong semester','2046-10-01')$$,'22023',null,'semester slot mismatch rejected');
select extensions.throws_ok($$select public.create_quiz('d1400000-0000-0000-0000-000000000001','d1110000-0000-0000-0000-000000000001','C2','Wrong date','2047-03-01')$$,'22023',null,'date outside term rejected');
select extensions.is(public.save_quiz_scores((select id from public.quizzes where slot='C1'),array['d1500000-0000-0000-0000-000000000001'::uuid],array[0::numeric]),1,'zero is saved as an entered score');
select extensions.is((select score from public.quiz_scores),0.00::numeric,'stored zero remains numeric zero');
select extensions.throws_ok($$select public.save_quiz_scores((select id from public.quizzes where slot='C1'),array['d1500000-0000-0000-0000-000000000001'::uuid],array[10.001::numeric])$$,'22023',null,'over-precise score rejected');
select extensions.throws_ok($$select public.save_quiz_scores((select id from public.quizzes where slot='C1'),array['d1500000-0000-0000-0000-000000000002'::uuid],array[50::numeric])$$,'22023',null,'student not enrolled on quiz date rejected');
select extensions.throws_ok($$select public.save_quiz_scores((select id from public.quizzes where slot='C1'),array['d1500000-0000-0000-0000-000000000001'::uuid,'d1500000-0000-0000-0000-000000000001'::uuid],array[50::numeric,60::numeric])$$,'22023',null,'duplicate bulk student rejected atomically');
select extensions.is((select score from public.quiz_scores),0.00::numeric,'failed bulk writes preserve prior score');
reset role;

select set_config('request.jwt.claim.sub','da000000-0000-0000-0000-000000000002',true);
set local role authenticated;
select extensions.is((select count(*)::integer from public.quizzes),1,'assigned teacher sees shared quiz');
select extensions.is((select count(*)::integer from public.quiz_scores),1,'assigned teacher sees shared score');
select extensions.is(public.save_quiz_scores((select id from public.quizzes),array['d1500000-0000-0000-0000-000000000001'::uuid],array[84.99::numeric]),1,'assigned teacher updates score through RPC');
select extensions.is((select updated_by from public.quiz_scores),'da000000-0000-0000-0000-000000000002'::uuid,'RPC derives audit actor');
select extensions.throws_ok($$delete from public.quiz_scores$$,'42501',null,'teacher cannot hard delete scores');
reset role;

select set_config('request.jwt.claim.sub','da000000-0000-0000-0000-000000000003',true);
set local role authenticated;
select extensions.is((select count(*)::integer from public.quizzes),0,'other-school ADMIN sees no quiz');
select extensions.throws_ok($$select public.save_quiz_scores((select id from public.quizzes limit 1),array[]::uuid[],array[]::numeric[])$$,'42501',null,'other-school mutation is rejected');
reset role;

select extensions.finish();
rollback;
