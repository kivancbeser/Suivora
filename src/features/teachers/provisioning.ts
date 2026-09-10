import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createPrivilegedInvitationResources } from "@/lib/supabase/privileged";
import { PrivilegedEnvironmentError } from "@/lib/env/privileged";
import type { Database } from "@/types/database.generated";
import { isDuplicateInvitationError, type TeacherResultCode } from "./teacher-management";

type NormalClient = SupabaseClient<Database>;

export async function inviteAndProvisionTeacher(input: Readonly<{
  adminUserId: string;
  displayName: string;
  email: string;
  schoolId: string;
  supabase: NormalClient;
}>): Promise<TeacherResultCode> {
  let invitedUserId: string | undefined;
  try {
    const resources = createPrivilegedInvitationResources();
    const privileged = resources.client;
    const redirectTo = new URL("/auth/confirm?next=/fr/activation", resources.appOrigin).toString();
    const invitation = await privileged.auth.admin.inviteUserByEmail(input.email, { redirectTo });
    if (invitation.error || !invitation.data.user) {
      return isDuplicateInvitationError(invitation.error) ? "invitationFailed" : "invitationFailed";
    }
    invitedUserId = invitation.data.user.id;

    const provision = await input.supabase.rpc("admin_provision_teacher_profile", {
      target_user_id: invitedUserId,
      teacher_display_name: input.displayName,
    });
    if (!provision.error) return "invitationSent";

    const profile = await input.supabase.from("user_profiles")
      .select("id, school_id, role, display_name")
      .eq("id", invitedUserId)
      .eq("school_id", input.schoolId)
      .eq("role", "TEACHER")
      .maybeSingle();
    if (!profile.error && profile.data?.display_name) return "invitationSent";

    if (invitedUserId === input.adminUserId) return "manualIntervention";
    const cleanup = await privileged.auth.admin.deleteUser(invitedUserId);
    return cleanup.error ? "manualIntervention" : "retryableFailure";
  } catch (error) {
    if (error instanceof PrivilegedEnvironmentError) return "configurationUnavailable";
    return invitedUserId ? "manualIntervention" : "invitationFailed";
  }
}

export async function createAndProvisionTestTeacher(input: Readonly<{
  adminUserId: string;
  displayName: string;
  email: string;
  password: string;
  schoolId: string;
  supabase: NormalClient;
}>): Promise<TeacherResultCode> {
  let createdUserId: string | undefined;
  try {
    const privileged = createPrivilegedInvitationResources().client;
    const created = await privileged.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
    });
    if (created.error || !created.data.user) {
      return isDuplicateInvitationError(created.error) ? "userAlreadyExists" : "invitationFailed";
    }
    createdUserId = created.data.user.id;
    const provision = await input.supabase.rpc("admin_provision_teacher_profile", {
      target_user_id: createdUserId,
      teacher_display_name: input.displayName,
    });
    if (!provision.error) return "testUserCreated";

    const profile = await input.supabase.from("user_profiles")
      .select("id, school_id, role, display_name")
      .eq("id", createdUserId)
      .eq("school_id", input.schoolId)
      .eq("role", "TEACHER")
      .maybeSingle();
    if (!profile.error && profile.data?.display_name) return "testUserCreated";
    if (createdUserId === input.adminUserId) return "manualIntervention";
    const cleanup = await privileged.auth.admin.deleteUser(createdUserId);
    return cleanup.error ? "manualIntervention" : "retryableFailure";
  } catch (error) {
    if (error instanceof PrivilegedEnvironmentError) return "configurationUnavailable";
    return createdUserId ? "manualIntervention" : "invitationFailed";
  }
}
