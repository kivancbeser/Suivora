"use client";

import { useFormStatus } from "react-dom";
import { signOutAction } from "./actions";
import type { Locale } from "@/i18n/routing";

type SignOutButtonProps = Readonly<{
  className?: string;
  label: string;
  pendingLabel: string;
  locale: Locale;
}>;

function Button({ className, label, pendingLabel }: SignOutButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button className={className ?? "app-placeholder__sign-out"} disabled={pending} type="submit">
      {pending ? pendingLabel : label}
    </button>
  );
}

export function SignOutButton(props: SignOutButtonProps) {
  return (
    <form action={signOutAction}>
      <input name="locale" type="hidden" value={props.locale} />
      <Button {...props} />
    </form>
  );
}
