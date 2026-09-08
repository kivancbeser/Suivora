import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { invitationDestination, parseInvitationConfirmation } from "@/features/teachers/invitation-confirmation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = parseInvitationConfirmation(url.searchParams);
  if (!parsed.success) return NextResponse.redirect(new URL("/fr/invitation-invalide", url.origin));
  try {
    const supabase = await createServerSupabaseClient();
    const result = await supabase.auth.verifyOtp({ token_hash: parsed.data.token_hash, type: "invite" });
    if (result.error) return NextResponse.redirect(new URL("/fr/invitation-invalide", url.origin));
    return NextResponse.redirect(new URL(invitationDestination, url.origin));
  } catch {
    return NextResponse.redirect(new URL("/fr/invitation-invalide", url.origin));
  }
}
