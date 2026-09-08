"use server";

import { redirect } from "next/navigation";
import {
  authenticateWithPassword,
  endLocalSession,
  type SignInState,
} from "./authentication";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isLocale } from "@/i18n/routing";

export async function signInAction(
  _previousState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const supabase = await createServerSupabaseClient();
  const result = await authenticateWithPassword(
    {
      signInWithPassword: (credentials) =>
        supabase.auth.signInWithPassword(credentials),
    },
    formData,
  );

  if (!result.ok) {
    return result.state;
  }

  redirect(result.redirectTo);
}

export async function signOutAction(formData: FormData): Promise<never> {
  const supabase = await createServerSupabaseClient();

  await endLocalSession(supabase.auth);

  const localeCandidate = formData.get("locale");
  const locale = isLocale(localeCandidate) ? localeCandidate : "fr";
  redirect(`/${locale}/connexion`);
}
