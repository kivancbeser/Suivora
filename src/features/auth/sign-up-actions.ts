"use server";

import { redirect } from "next/navigation";
import { registerTestTeacher, type SignUpState } from "./sign-up";
import { createPrivilegedInvitationResources } from "@/lib/supabase/privileged";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function signUpAction(
  _previousState: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  let result: Awaited<ReturnType<typeof registerTestTeacher>>;

  try {
    const privileged = createPrivilegedInvitationResources();
    const supabase = await createServerSupabaseClient();
    result = await registerTestTeacher(
      {
        admin: {
          createUser: (input) => privileged.client.auth.admin.createUser(input),
          deleteUser: (userId) => privileged.client.auth.admin.deleteUser(userId),
        },
        user: {
          signInWithPassword: (credentials) => supabase.auth.signInWithPassword(credentials),
          claimTeacherProfile: async (displayName) => {
            const { error } = await supabase.rpc("claim_test_teacher_profile", {
              teacher_display_name: displayName,
            });
            return { error };
          },
          signOut: () => supabase.auth.signOut({ scope: "local" }),
        },
      },
      formData,
    );
  } catch {
    return { error: "unexpected" };
  }

  if (!result.ok) return result.state;
  redirect(result.redirectTo);
}
