"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signUpAction } from "./sign-up-actions";
import type { SignUpErrorCode, SignUpState } from "./sign-up";
import type { Locale } from "@/i18n/routing";

type SignUpMessages = Readonly<{
  displayNameLabel: string;
  emailLabel: string;
  passwordLabel: string;
  passwordConfirmationLabel: string;
  submit: string;
  submitting: string;
  errors: Record<SignUpErrorCode, string>;
}>;

const initialState: SignUpState = {};

function SubmitButton({ messages }: Readonly<{ messages: SignUpMessages }>) {
  const { pending } = useFormStatus();
  return (
    <button className="auth-form__submit" disabled={pending} type="submit">
      {pending ? messages.submitting : messages.submit}
    </button>
  );
}

export function SignUpForm({ locale, messages }: Readonly<{ locale: Locale; messages: SignUpMessages }>) {
  const [state, action] = useActionState(signUpAction, initialState);
  const fields = [
    { name: "displayName", label: messages.displayNameLabel, type: "text", autoComplete: "name" },
    { name: "email", label: messages.emailLabel, type: "email", autoComplete: "email" },
    { name: "password", label: messages.passwordLabel, type: "password", autoComplete: "new-password" },
    { name: "passwordConfirmation", label: messages.passwordConfirmationLabel, type: "password", autoComplete: "new-password" },
  ] as const;

  return (
    <form action={action} className="auth-form" noValidate>
      <input name="locale" type="hidden" value={locale} />
      {state.error ? <p className="auth-form__alert" role="alert">{messages.errors[state.error]}</p> : null}
      {fields.map((field) => {
        const error = state.fieldErrors?.[field.name];
        const errorId = `${field.name}-error`;
        return (
          <div className="auth-form__field" key={field.name}>
            <label htmlFor={field.name}>{field.label}</label>
            <input
              aria-describedby={error ? errorId : undefined}
              aria-invalid={error ? true : undefined}
              autoComplete={field.autoComplete}
              id={field.name}
              inputMode={field.type === "email" ? "email" : undefined}
              name={field.name}
              type={field.type}
            />
            {error ? <p className="auth-form__field-error" id={errorId}>{messages.errors[error]}</p> : null}
          </div>
        );
      })}
      <SubmitButton messages={messages} />
    </form>
  );
}
