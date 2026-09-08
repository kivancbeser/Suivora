"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createTeacherPasswordAction } from "./actions";
import { initialTeacherActionState, type TeacherResultCode } from "./teacher-management";

function PasswordSubmit({ label, pendingLabel }: Readonly<{ label: string; pendingLabel: string }>) {
  const { pending } = useFormStatus();
  return <button className="auth-form__submit" disabled={pending} type="submit">{pending ? pendingLabel : label}</button>;
}

export function PasswordCreationForm({ messages }: Readonly<{ messages: Readonly<{
  password: string; confirmation: string; submit: string; submitting: string;
  errors: Partial<Record<TeacherResultCode, string>>;
}> }>) {
  const [state, action] = useActionState(createTeacherPasswordAction, initialTeacherActionState);
  const form = useRef<HTMLFormElement>(null);
  const id = useId();
  useEffect(() => {
    if (state.status === "error") form.current?.querySelector<HTMLElement>('[aria-invalid="true"], [role="alert"]')?.focus();
  }, [state]);
  return <form action={action} className="auth-form" noValidate ref={form}>
    {state.message ? <p className="auth-form__alert" role="alert" tabIndex={-1}>{messages.errors[state.message]}</p> : null}
    <div className="auth-form__field"><label htmlFor={`${id}-password`}>{messages.password}</label><input aria-invalid={Boolean(state.fieldErrors?.password)} autoComplete="new-password" id={`${id}-password`} maxLength={1024} minLength={12} name="password" required type="password" />{state.fieldErrors?.password ? <p className="auth-form__field-error">{messages.errors[state.fieldErrors.password]}</p> : null}</div>
    <div className="auth-form__field"><label htmlFor={`${id}-confirmation`}>{messages.confirmation}</label><input aria-invalid={Boolean(state.fieldErrors?.confirmation)} autoComplete="new-password" id={`${id}-confirmation`} maxLength={1024} minLength={12} name="confirmation" required type="password" />{state.fieldErrors?.confirmation ? <p className="auth-form__field-error">{messages.errors[state.fieldErrors.confirmation]}</p> : null}</div>
    <PasswordSubmit label={messages.submit} pendingLabel={messages.submitting} />
  </form>;
}
