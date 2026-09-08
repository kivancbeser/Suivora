import { createSchoolYearAction, createSemesterAction, updateSchoolYearAction, updateSemesterAction } from "./actions";
import { SchoolYearForm, SemesterForm, type CalendarFormMessages } from "./calendar-form";
import type { SchoolYear, SemesterNumber } from "./calendar";

export type CalendarPageMessages = Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  addYear: string;
  emptyTitle: string;
  emptyDescription: string;
  editYear: string;
  completion: string;
  addSemester: string;
  editSemester: string;
  readErrorTitle: string;
  readErrorDescription: string;
  semesters: Record<"1" | "2", string>;
  form: CalendarFormMessages;
}>;

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function SemesterBlock({ messages, semester }: Readonly<{
  messages: CalendarPageMessages;
  semester: SchoolYear["semesters"][number];
}>) {
  const updateAction = updateSemesterAction.bind(null, semester.id);
  return (
    <article className="calendar-semester">
      <div>
        <h4>{messages.semesters[String(semester.semesterNumber) as "1" | "2"]}</h4>
        <p>{formatDate(semester.startDate)} — {formatDate(semester.endDate)}</p>
      </div>
      <details className="calendar-disclosure">
        <summary>{messages.editSemester}</summary>
        <SemesterForm action={updateAction} initial={{ startDate: semester.startDate, endDate: semester.endDate }} messages={messages.form} semesterNumber={semester.semesterNumber} />
      </details>
    </article>
  );
}

function MissingSemester({ messages, semesterNumber, yearId }: Readonly<{
  messages: CalendarPageMessages;
  semesterNumber: SemesterNumber;
  yearId: string;
}>) {
  const createAction = createSemesterAction.bind(null, yearId);
  return (
    <details className="calendar-disclosure calendar-disclosure--add">
      <summary>{messages.addSemester}: {messages.semesters[String(semesterNumber) as "1" | "2"]}</summary>
      <SemesterForm action={createAction} messages={messages.form} semesterNumber={semesterNumber} />
    </details>
  );
}

function SchoolYearCard({ messages, year }: Readonly<{ messages: CalendarPageMessages; year: SchoolYear }>) {
  const updateAction = updateSchoolYearAction.bind(null, year.id);
  const present = new Set(year.semesters.map((semester) => semester.semesterNumber));
  return (
    <article className="calendar-year-card">
      <header className="calendar-year-card__header">
        <div><h2>{year.label}</h2><p>{formatDate(year.startDate)} — {formatDate(year.endDate)}</p></div>
        <span className="calendar-completion">{messages.completion}: {year.semesters.length}/2</span>
      </header>
      <details className="calendar-disclosure">
        <summary>{messages.editYear}</summary>
        <SchoolYearForm action={updateAction} initial={{ label: year.label, startDate: year.startDate, endDate: year.endDate }} messages={messages.form} />
      </details>
      <div className="calendar-semesters">
        {year.semesters.map((semester) => <SemesterBlock key={semester.id} messages={messages} semester={semester} />)}
        {([1, 2] as const).filter((semester) => !present.has(semester)).map((semester) => <MissingSemester key={semester} messages={messages} semesterNumber={semester} yearId={year.id} />)}
      </div>
    </article>
  );
}

export function CalendarPage({ messages, readError, years }: Readonly<{
  messages: CalendarPageMessages;
  readError?: boolean;
  years: readonly SchoolYear[];
}>) {
  return (
    <section aria-labelledby="calendar-title" className="calendar-page">
      <header className="calendar-page__header">
        <div><p className="calendar-page__eyebrow">{messages.eyebrow}</p><h1 id="calendar-title">{messages.title}</h1><p>{messages.description}</p></div>
        <details className="calendar-disclosure calendar-disclosure--primary">
          <summary>{messages.addYear}</summary>
          <SchoolYearForm action={createSchoolYearAction} messages={messages.form} />
        </details>
      </header>
      {readError ? (
        <div className="calendar-empty" role="alert"><h2>{messages.readErrorTitle}</h2><p>{messages.readErrorDescription}</p></div>
      ) : years.length === 0 ? (
        <div className="calendar-empty"><h2>{messages.emptyTitle}</h2><p>{messages.emptyDescription}</p></div>
      ) : (
        <div className="calendar-year-list">{years.map((year) => <SchoolYearCard key={year.id} messages={messages} year={year} />)}</div>
      )}
    </section>
  );
}
