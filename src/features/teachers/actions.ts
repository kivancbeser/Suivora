"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { resolveApplicationContext } from "@/server/application-context";
import { inviteAndProvisionTeacher } from "./provisioning";
import {
  initialTeacherActionState,
  invitationSchema,
  parseForm,
  passwordSchema,
  teacherUpdateSchema,
  type TeacherActionState,
} from "./teacher-management";

const teachersPath = "/fr/app/enseignants";

export async function inviteTeacherAction(
  _previous: TeacherActionState,
  formData: FormData,
): Promise<TeacherActionState> {
  const access = await resolveApplicationContext();
  if (access.status !== "ready" || access.context.role !== "ADMIN") {
    return { status: "error", message: "accessDenied" };
  }
  const parsed = parseForm(invitationSchema, formData);
  if (!parsed.ok) return parsed.state;
  try {
    const supabase = await createServerSupabaseClient();
    const message = await inviteAndProvisionTeacher({
      adminUserId: access.context.userId,
      displayName: parsed.data.displayName,
      email: parsed.data.email,
      schoolId: access.context.school.id,
      supabase,
    });
    if (message === "invitationSent") revalidatePath(teachersPath);
    return { status: message === "invitationSent" ? "success" : "error", message };
  } catch {
    return { status: "error", message: "unexpected" };
  }
}

export async function updateTeacherAction(
  _previous: TeacherActionState,
  formData: FormData,
): Promise<TeacherActionState> {
  const access = await resolveApplicationContext();
  if (access.status !== "ready" || access.context.role !== "ADMIN") {
    return { status: "error", message: "accessDenied" };
  }
  const parsed = parseForm(teacherUpdateSchema, formData);
  if (!parsed.ok) return parsed.state;
  try {
    const supabase = await createServerSupabaseClient();
    const result = await supabase.rpc("admin_update_teacher_profile", {
      target_user_id: parsed.data.teacherId,
      teacher_display_name: parsed.data.displayName,
      teacher_is_active: parsed.data.active,
    });
    if (result.error) return { status: "error", message: "notFound" };
    revalidatePath(teachersPath);
    return { status: "success", message: "profileUpdated" };
  } catch {
    return { status: "error", message: "unexpected" };
  }
}

export async function createTeacherPasswordAction(
  _previous: TeacherActionState,
  formData: FormData,
): Promise<TeacherActionState> {
  const supabase = await createServerSupabaseClient();
  const identity = await supabase.auth.getUser();
  if (!identity.data.user || identity.error) return { status: "error", message: "accessDenied" };
  const access = await resolveApplicationContext();
  if (access.status !== "ready" || access.context.role !== "TEACHER") {
    return { status: "error", message: "accessDenied" };
  }
  const parsed = parseForm(passwordSchema, formData);
  if (!parsed.ok) return parsed.state;
  const result = await supabase.auth.updateUser({ password: parsed.data.password });
  if (result.error) return { status: "error", message: "unexpected" };
  redirect("/fr/app");
}

export { initialTeacherActionState };
