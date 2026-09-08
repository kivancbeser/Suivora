"use client";

import { useFormStatus } from "react-dom";
import { signOutAction } from "./actions";

type SignOutButtonProps = Readonly<{
  className?: string;
  label: string;
  pendingLabel: string;
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
      <Button {...props} />
    </form>
  );
}
