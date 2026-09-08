import type { NextRequest } from "next/server";
import { refreshAuthSession } from "@/lib/supabase/proxy";

export function proxy(request: NextRequest) {
  return refreshAuthSession(request);
}

export const config = {
  // Only routes that read or mutate the authentication session need refreshes.
  matcher: [
    "/auth/confirm",
    "/fr/connexion",
    "/fr/activation",
    "/fr/app/:path*",
    "/tr/connexion",
    "/tr/activation",
    "/tr/app/:path*",
  ],
};
