"use server";

import { redirect } from "next/navigation";
import {
  authenticateWithPassword,
  endLocalSession,
  type SignInState,
} from "./authentication";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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

export async function signOutAction(): Promise<never> {
  const supabase = await createServerSupabaseClient();

  await endLocalSession(supabase.auth);

  redirect("/fr/connexion");
}
