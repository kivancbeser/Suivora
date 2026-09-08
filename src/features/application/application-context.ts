import type { Locale } from "@/i18n/routing";

export const applicationRoles = ["ADMIN", "TEACHER"] as const;

export type ApplicationRole = (typeof applicationRoles)[number];

export type AppContext = Readonly<{
  userId: string;
  role: ApplicationRole;
  school: Readonly<{
    id: string;
    name: string;
  }>;
}>;

type ProfileRecord = Readonly<{
  id: string;
  school_id: string;
  role: string;
  active: boolean;
}>;

type SchoolRecord = Readonly<{
  id: string;
  name: string;
}>;

type QueryResult<T> = Readonly<{
  data: T | null;
  error: unknown | null;
}>;

export type ApplicationContextGateway = Readonly<{
  getAuthenticatedUser(): Promise<QueryResult<Readonly<{ id: string }>>>;
  getProfile(userId: string): Promise<QueryResult<ProfileRecord>>;
  getSchool(schoolId: string): Promise<QueryResult<SchoolRecord>>;
}>;

export type ApplicationAccessResult =
  | Readonly<{ status: "ready"; context: AppContext }>
  | Readonly<{ status: "unauthenticated" }>
  | Readonly<{
      status: "access-unavailable";
      reason:
        | "profile-missing"
        | "profile-inactive"
        | "school-missing"
        | "unsupported-role"
        | "unexpected";
    }>;

export function isApplicationRole(value: string): value is ApplicationRole {
  return applicationRoles.some((role) => role === value);
}

export function getUnauthenticatedApplicationRedirect(
  result: ApplicationAccessResult,
  locale: Locale,
): string | null {
  return result.status === "unauthenticated" ? `/${locale}/connexion` : null;
}

export async function resolveApplicationContextFromGateway(
  gateway: ApplicationContextGateway,
): Promise<ApplicationAccessResult> {
  try {
    const userResult = await gateway.getAuthenticatedUser();

    if (!userResult.data) {
      return { status: "unauthenticated" };
    }

    if (userResult.error) {
      return { status: "access-unavailable", reason: "unexpected" };
    }

    const profileResult = await gateway.getProfile(userResult.data.id);

    if (profileResult.error) {
      return { status: "access-unavailable", reason: "unexpected" };
    }

    if (!profileResult.data) {
      return { status: "access-unavailable", reason: "profile-missing" };
    }

    if (!profileResult.data.active) {
      return { status: "access-unavailable", reason: "profile-inactive" };
    }

    if (!isApplicationRole(profileResult.data.role)) {
      return { status: "access-unavailable", reason: "unsupported-role" };
    }

    const schoolResult = await gateway.getSchool(profileResult.data.school_id);

    if (schoolResult.error) {
      return { status: "access-unavailable", reason: "unexpected" };
    }

    if (!schoolResult.data) {
      return { status: "access-unavailable", reason: "school-missing" };
    }

    return {
      status: "ready",
      context: {
        userId: userResult.data.id,
        role: profileResult.data.role,
        school: {
          id: schoolResult.data.id,
          name: schoolResult.data.name,
        },
      },
    };
  } catch {
    return { status: "access-unavailable", reason: "unexpected" };
  }
}
