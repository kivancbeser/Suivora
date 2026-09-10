"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createTestTeacherAction, updateTeacherAction } from "./actions";
import { initialTeacherActionState, type TeacherActionState, type TeacherResultCode } from "./teacher-management";

export type TeacherFormMessages = Readonly<{
  displayName: string; email: string; invite: string; inviting: string;
  password: string; passwordConfirmation: string; testWarning: string;
  save: string; saving: string; edit: string; cancel: string;
  deactivate: string; reactivate: string; deactivationWarning: string; confirmDeactivation: string;
  errors: Record<TeacherResultCode, string>;
}>;

function Submit({ idle, pending }: Readonly<{ idle: string; pending: string }>) {
  const status = useFormStatus();
  return <button className="teacher-button teacher-button--primary" disabled={status.pending} type="submit">{status.pending ? pending : idle}</button>;
}

function Feedback({ messages, state }: Readonly<{ messages: TeacherFormMessages; state: TeacherActionState }>) {
  if (!state.message) return null;
  return <p aria-live="polite" className={`teacher-feedback teacher-feedback--${state.status}`} role={state.status === "error" ? "alert" : "status"} tabIndex={-1}>{messages.errors[state.message]}</p>;
}

export function TeacherInvitationForm({ messages }: Readonly<{ messages: TeacherFormMessages }>) {
  const [state, action] = useActionState(createTestTeacherAction, initialTeacherActionState);
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "success") form.current?.reset();
    if (state.status === "error") form.current?.querySelector<HTMLElement>('[aria-invalid="true"], .teacher-feedback')?.focus();
  }, [state]);
  return <form action={action} className="teacher-form" noValidate ref={form}>
    <Feedback messages={messages} state={state} />
    <div className="teacher-field">
      <label htmlFor={`${id}-name`}>{messages.displayName}</label>
      <input aria-invalid={Boolean(state.fieldErrors?.displayName)} id={`${id}-name`} maxLength={120} name="displayName" required />
      {state.fieldErrors?.displayName ? <p className="teacher-field__error">{messages.errors[state.fieldErrors.displayName]}</p> : null}
    </div>
    <div className="teacher-field">
      <label htmlFor={`${id}-email`}>{messages.email}</label>
      <input aria-invalid={Boolean(state.fieldErrors?.email)} autoComplete="email" id={`${id}-email`} maxLength={254} name="email" required type="email" />
      {state.fieldErrors?.email ? <p className="teacher-field__error">{messages.errors[state.fieldErrors.email]}</p> : null}
    </div>
    <div className="teacher-field">
      <label htmlFor={`${id}-password`}>{messages.password}</label>
      <input aria-invalid={Boolean(state.fieldErrors?.password)} autoComplete="new-password" id={`${id}-password`} minLength={12} name="password" required type="password" />
      {state.fieldErrors?.password ? <p className="teacher-field__error">{messages.errors[state.fieldErrors.password]}</p> : null}
    </div>
    <div className="teacher-field">
      <label htmlFor={`${id}-confirmation`}>{messages.passwordConfirmation}</label>
      <input aria-invalid={Boolean(state.fieldErrors?.confirmation)} autoComplete="new-password" id={`${id}-confirmation`} minLength={12} name="confirmation" required type="password" />
      {state.fieldErrors?.confirmation ? <p className="teacher-field__error">{messages.errors[state.fieldErrors.confirmation]}</p> : null}
    </div>
    <p className="teacher-form__hint">{messages.testWarning}</p>
    <Submit idle={messages.invite} pending={messages.inviting} />
  </form>;
}

export function TeacherEditForm({ displayName, label, messages, requiresConfirmation = false, targetActive, teacherId }: Readonly<{
  displayName: string; label: string; messages: TeacherFormMessages; requiresConfirmation?: boolean; targetActive: boolean; teacherId: string;
}>) {
  const [state, action] = useActionState(updateTeacherAction, initialTeacherActionState);
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status === "error") form.current?.querySelector<HTMLElement>('[aria-invalid="true"], .teacher-feedback')?.focus();
  }, [state]);
  return <details className="teacher-disclosure">
    <summary>{label}</summary>
    <form action={action} className="teacher-form" noValidate ref={form}>
      <input name="teacherId" type="hidden" value={teacherId} />
      <input name="active" type="hidden" value={targetActive ? "true" : "false"} />
      {!requiresConfirmation && !targetActive ? <input name="confirmation" type="hidden" value="confirmed" /> : null}
      <Feedback messages={messages} state={state} />
      <div className="teacher-field">
        <label htmlFor={`${id}-name`}>{messages.displayName}</label>
        <input aria-invalid={Boolean(state.fieldErrors?.displayName)} defaultValue={displayName} id={`${id}-name`} maxLength={120} name="displayName" required />
      </div>
      {requiresConfirmation ? <div className="teacher-confirmation">
        <p>{messages.deactivationWarning}</p>
        <label><input name="confirmation" required type="checkbox" value="confirmed" /> {messages.confirmDeactivation}</label>
      </div> : null}
      <div className="teacher-form__actions">
        <Submit idle={label} pending={messages.saving} />
        <button className="teacher-button" onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")} type="button">{messages.cancel}</button>
      </div>
    </form>
  </details>;
}
