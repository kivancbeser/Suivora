-- Enforce school-calendar date integrity at the database boundary.
-- Semester labels remain presentation data derived from semester_number.

do $$
begin
  if exists (
    select 1
    from public.terms
    where start_date >= end_date
  ) then
    raise exception 'calendar integrity preflight failed: invalid term date order';
  end if;

  if exists (
    select 1
    from public.terms as term
    join public.school_years as school_year
      on school_year.id = term.school_year_id
     and school_year.school_id = term.school_id
    where term.start_date < school_year.start_date
       or term.end_date > school_year.end_date
  ) then
    raise exception 'calendar integrity preflight failed: term outside school year';
  end if;

  if exists (
    select 1
    from public.terms as semester_1
    join public.terms as semester_2
      on semester_2.school_year_id = semester_1.school_year_id
     and semester_2.semester_number = 2
    where semester_1.semester_number = 1
      and semester_1.end_date > semester_2.start_date
  ) then
    raise exception 'calendar integrity preflight failed: semester chronology';
  end if;
end;
$$;

alter table public.terms
  drop constraint terms_date_order;

alter table public.terms
  add constraint terms_date_order
  check (start_date < end_date);

create function public.validate_term_calendar_integrity()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  parent_start_date date;
  parent_end_date date;
  sibling public.terms%rowtype;
begin
  if tg_op = 'UPDATE' then
    perform 1
    from public.school_years as school_year
    where (
      school_year.id = old.school_year_id
      and school_year.school_id = old.school_id
    ) or (
      school_year.id = new.school_year_id
      and school_year.school_id = new.school_id
    )
    order by school_year.id
    for update;
  else
    perform 1
    from public.school_years as school_year
    where school_year.id = new.school_year_id
      and school_year.school_id = new.school_id
    for update;
  end if;

  select school_year.start_date, school_year.end_date
  into parent_start_date, parent_end_date
  from public.school_years as school_year
  where school_year.id = new.school_year_id
    and school_year.school_id = new.school_id;

  if not found then
    raise exception 'calendar integrity violation'
      using errcode = '23503',
            constraint = 'terms_school_year_school_fk';
  end if;

  if new.start_date < parent_start_date or new.end_date > parent_end_date then
    raise exception 'calendar integrity violation'
      using errcode = '23514',
            constraint = 'terms_within_school_year_dates';
  end if;

  select term.*
  into sibling
  from public.terms as term
  where term.school_year_id = new.school_year_id
    and term.semester_number <> new.semester_number
    and term.id <> new.id
  limit 1;

  if found and (
    (new.semester_number = 1 and new.end_date > sibling.start_date)
    or (new.semester_number = 2 and sibling.end_date > new.start_date)
  ) then
    raise exception 'calendar integrity violation'
      using errcode = '23514',
            constraint = 'terms_semester_chronology';
  end if;

  return new;
end
$$;

create function public.validate_school_year_calendar_integrity()
returns trigger
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.terms as term
    where term.school_year_id = new.id
      and term.school_id = new.school_id
      and (
        term.start_date < new.start_date
        or term.end_date > new.end_date
      )
  ) then
    raise exception 'calendar integrity violation'
      using errcode = '23514',
            constraint = 'school_year_contains_terms';
  end if;

  return new;
end
$$;

revoke all on function public.validate_term_calendar_integrity()
  from public, anon, authenticated;
revoke all on function public.validate_school_year_calendar_integrity()
  from public, anon, authenticated;

create trigger terms_validate_calendar_integrity
before insert or update of school_id, school_year_id, semester_number, start_date, end_date
on public.terms
for each row execute function public.validate_term_calendar_integrity();

create trigger school_years_validate_calendar_integrity
before update of start_date, end_date
on public.school_years
for each row execute function public.validate_school_year_calendar_integrity();

comment on function public.validate_term_calendar_integrity() is
  'Validates parent-year bounds and serializes sibling-semester chronology checks by locking the parent school-year row.';
comment on function public.validate_school_year_calendar_integrity() is
  'Rejects school-year date updates that would exclude an existing term; the updated parent row serializes against term validation.';
