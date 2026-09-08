import { TeacherEditForm, TeacherInvitationForm, type TeacherFormMessages } from "./teacher-forms";
import type { TeacherSummary } from "./data";

export type TeacherPageMessages = Readonly<{
  eyebrow: string; title: string; description: string; invitationTitle: string;
  listTitle: string; emptyTitle: string; emptyDescription: string;
  readErrorTitle: string; readErrorDescription: string; active: string; inactive: string;
  form: TeacherFormMessages;
}>;

export function TeacherPage({ messages, readError, teachers }: Readonly<{
  messages: TeacherPageMessages; readError: boolean; teachers: readonly TeacherSummary[];
}>) {
  return <section aria-labelledby="teachers-title" className="teacher-page">
    <header className="teacher-page__header">
      <div><p className="teacher-page__eyebrow">{messages.eyebrow}</p><h1 id="teachers-title">{messages.title}</h1><p>{messages.description}</p></div>
      <section aria-labelledby="teacher-invitation-title" className="teacher-invitation">
        <h2 id="teacher-invitation-title">{messages.invitationTitle}</h2>
        <TeacherInvitationForm messages={messages.form} />
      </section>
    </header>
    <section aria-labelledby="teacher-list-title">
      <h2 id="teacher-list-title">{messages.listTitle}</h2>
      {readError ? <div className="teacher-empty" role="alert"><h3>{messages.readErrorTitle}</h3><p>{messages.readErrorDescription}</p></div>
      : teachers.length === 0 ? <div className="teacher-empty"><h3>{messages.emptyTitle}</h3><p>{messages.emptyDescription}</p></div>
      : <div className="teacher-list">{teachers.map((teacher) => <article className="teacher-card" key={teacher.id}>
          <div><h3>{teacher.displayName}</h3><p className={`teacher-status teacher-status--${teacher.active ? "active" : "inactive"}`}><span aria-hidden="true">●</span> {teacher.active ? messages.active : messages.inactive}</p></div>
          <div className="teacher-card__actions">
            <TeacherEditForm displayName={teacher.displayName} label={messages.form.edit} messages={messages.form} targetActive={teacher.active} teacherId={teacher.id} />
            <TeacherEditForm displayName={teacher.displayName} label={teacher.active ? messages.form.deactivate : messages.form.reactivate} messages={messages.form} requiresConfirmation={teacher.active} targetActive={!teacher.active} teacherId={teacher.id} />
          </div>
        </article>)}</div>}
    </section>
  </section>;
}
