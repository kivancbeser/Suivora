import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "@/lib/env/public";
import type { Database } from "@/types/database.generated";

export async function refreshAuthSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  const configuration = getSupabasePublicConfig();
  const supabase = createServerClient<Database>(
    configuration.url,
    configuration.publishableKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getUser verifies identity with Supabase Auth and refreshes expired cookies.
  // Authorization and application-table queries deliberately stay out of Proxy.
  await supabase.auth.getUser();

  return response;
}
