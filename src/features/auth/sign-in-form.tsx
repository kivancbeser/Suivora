"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signInAction } from "./actions";
import type { SignInErrorCode, SignInState } from "./authentication";
import type { Locale } from "@/i18n/routing";

type AuthMessages = Readonly<{
  emailLabel: string;
  passwordLabel: string;
  submit: string;
  submitting: string;
  errors: Record<SignInErrorCode, string>;
}>;

type SignInFormProps = Readonly<{
  locale: Locale;
  messages: AuthMessages;
  returnTo: string;
}>;

const initialState: SignInState = {};

function SubmitButton({ messages }: Pick<SignInFormProps, "messages">) {
  const { pending } = useFormStatus();

  return (
    <button className="auth-form__submit" disabled={pending} type="submit">
      {pending ? messages.submitting : messages.submit}
    </button>
  );
}

export function SignInForm({ locale, messages, returnTo }: SignInFormProps) {
  const [state, action] = useActionState(signInAction, initialState);
  const emailError = state.fieldErrors?.email;
  const passwordError = state.fieldErrors?.password;

  return (
    <form action={action} className="auth-form" noValidate>
      <input name="locale" type="hidden" value={locale} />
      <input name="returnTo" type="hidden" value={returnTo} />

      {state.error ? (
        <p className="auth-form__alert" role="alert">
          {messages.errors[state.error]}
        </p>
      ) : null}

      <div className="auth-form__field">
        <label htmlFor="email">{messages.emailLabel}</label>
        <input
          aria-describedby={emailError ? "email-error" : undefined}
          aria-invalid={emailError ? true : undefined}
          autoComplete="email"
          id="email"
          inputMode="email"
          name="email"
          type="email"
        />
        {emailError ? (
          <p className="auth-form__field-error" id="email-error">
            {messages.errors[emailError]}
          </p>
        ) : null}
      </div>

      <div className="auth-form__field">
        <label htmlFor="password">{messages.passwordLabel}</label>
        <input
          aria-describedby={passwordError ? "password-error" : undefined}
          aria-invalid={passwordError ? true : undefined}
          autoComplete="current-password"
          id="password"
          name="password"
          type="password"
        />
        {passwordError ? (
          <p className="auth-form__field-error" id="password-error">
            {messages.errors[passwordError]}
          </p>
        ) : null}
      </div>

      <SubmitButton messages={messages} />
    </form>
  );
}
