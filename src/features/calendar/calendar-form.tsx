"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { useFormStatus } from "react-dom";
import { initialCalendarActionState, type CalendarActionState, type CalendarErrorCode, type SemesterNumber } from "./calendar";

export type CalendarFormMessages = Readonly<{
  label: string;
  startDate: string;
  endDate: string;
  save: string;
  saving: string;
  cancel: string;
  errors: Record<CalendarErrorCode, string>;
  success: Readonly<{
    yearCreated: string;
    yearUpdated: string;
    semesterCreated: string;
    semesterUpdated: string;
  }>;
}>;

type CalendarAction = (state: CalendarActionState, formData: FormData) => Promise<CalendarActionState>;

function SubmitButton({ messages }: { messages: CalendarFormMessages }) {
  const { pending } = useFormStatus();
  return (
    <button className="calendar-button calendar-button--primary" disabled={pending} type="submit">
      {pending ? messages.saving : messages.save}
    </button>
  );
}

function CancelButton({ label }: { label: string }) {
  return (
    <button
      className="calendar-button calendar-button--quiet"
      onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}
      type="button"
    >
      {label}
    </button>
  );
}

function Feedback({ state, messages }: { state: CalendarActionState; messages: CalendarFormMessages }) {
  if (!state.message) return null;
  const message = state.message in messages.errors
    ? messages.errors[state.message as CalendarErrorCode]
    : messages.success[state.message as keyof CalendarFormMessages["success"]];
  return (
    <p aria-live="polite" className={`calendar-feedback calendar-feedback--${state.status}`} role={state.status === "error" ? "alert" : "status"} tabIndex={-1}>
      {message}
    </p>
  );
}

type DateFieldsProps = Readonly<{
  endDate: string;
  formId: string;
  messages: CalendarFormMessages;
  startDate: string;
  state: CalendarActionState;
}>;

function DateFields({ endDate, formId, messages, startDate, state }: DateFieldsProps) {
  const startError = state.fieldErrors?.startDate;
  const endError = state.fieldErrors?.endDate;
  return (
    <div className="calendar-form__dates">
      <div className="calendar-field">
        <label htmlFor={`${formId}-start`}>{messages.startDate}</label>
        <input aria-describedby={startError ? `${formId}-start-error` : undefined} aria-invalid={Boolean(startError)} defaultValue={startDate} id={`${formId}-start`} name="startDate" required type="date" />
        {startError ? <p className="calendar-field__error" id={`${formId}-start-error`}>{messages.errors[startError]}</p> : null}
      </div>
      <div className="calendar-field">
        <label htmlFor={`${formId}-end`}>{messages.endDate}</label>
        <input aria-describedby={endError ? `${formId}-end-error` : undefined} aria-invalid={Boolean(endError)} defaultValue={endDate} id={`${formId}-end`} name="endDate" required type="date" />
        {endError ? <p className="calendar-field__error" id={`${formId}-end-error`}>{messages.errors[endError]}</p> : null}
      </div>
    </div>
  );
}

export function SchoolYearForm({ action, initial, messages }: Readonly<{
  action: CalendarAction;
  initial?: Readonly<{ label: string; startDate: string; endDate: string }>;
  messages: CalendarFormMessages;
}>) {
  const [state, formAction] = useActionState(action, initialCalendarActionState);
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const labelError = state.fieldErrors?.label;
  useEffect(() => {
    if (state.status === "error") {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], .calendar-feedback')?.focus();
    }
  }, [state]);
  return (
    <form action={formAction} className="calendar-form" noValidate ref={formRef}>
      <Feedback messages={messages} state={state} />
      <div className="calendar-field">
        <label htmlFor={`${id}-label`}>{messages.label}</label>
        <input aria-describedby={labelError ? `${id}-label-error` : undefined} aria-invalid={Boolean(labelError)} defaultValue={initial?.label} id={`${id}-label`} maxLength={120} name="label" required />
        {labelError ? <p className="calendar-field__error" id={`${id}-label-error`}>{messages.errors[labelError]}</p> : null}
      </div>
      <DateFields endDate={initial?.endDate ?? ""} formId={id} messages={messages} startDate={initial?.startDate ?? ""} state={state} />
      <div className="calendar-form__actions"><SubmitButton messages={messages} /><CancelButton label={messages.cancel} /></div>
    </form>
  );
}

export function SemesterForm({ action, initial, messages, semesterNumber }: Readonly<{
  action: CalendarAction;
  initial?: Readonly<{ startDate: string; endDate: string }>;
  messages: CalendarFormMessages;
  semesterNumber: SemesterNumber;
}>) {
  const [state, formAction] = useActionState(action, initialCalendarActionState);
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "error") {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], .calendar-feedback')?.focus();
    }
  }, [state]);
  return (
    <form action={formAction} className="calendar-form" noValidate ref={formRef}>
      <input name="semesterNumber" type="hidden" value={semesterNumber} />
      <Feedback messages={messages} state={state} />
      <DateFields endDate={initial?.endDate ?? ""} formId={id} messages={messages} startDate={initial?.startDate ?? ""} state={state} />
      <div className="calendar-form__actions"><SubmitButton messages={messages} /><CancelButton label={messages.cancel} /></div>
    </form>
  );
}
