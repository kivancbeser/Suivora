import type { ApplicationRole } from "./application-context";

export type NavigationKey =
  | "home"
  | "schoolYears"
  | "teachers"
  | "classes"
  | "students"
  | "subjects"
  | "settings"
  | "today"
  | "myClasses"
  | "quizzesAndGrades"
  | "homework"
  | "progression"
  | "studentFollowUp"
  | "reports";

export type NavigationItem = Readonly<{
  key: NavigationKey;
  href: `/app${string}`;
  marker: string;
}>;

const adminNavigation = [
  { key: "home", href: "/app", marker: "A" },
  { key: "schoolYears", href: "/app/annees-scolaires", marker: "AS" },
  { key: "teachers", href: "/app/enseignants", marker: "EN" },
  { key: "classes", href: "/app/classes", marker: "CL" },
  { key: "students", href: "/app/eleves", marker: "ÉL" },
  { key: "subjects", href: "/app/matieres", marker: "MA" },
  { key: "settings", href: "/app/parametres", marker: "PA" },
] as const satisfies readonly NavigationItem[];

const teacherNavigation = [
  { key: "today", href: "/app", marker: "AJ" },
  { key: "myClasses", href: "/app/mes-classes", marker: "MC" },
  { key: "students", href: "/app/eleves", marker: "ÉL" },
  { key: "quizzesAndGrades", href: "/app/quiz-et-notes", marker: "QN" },
  { key: "homework", href: "/app/devoirs", marker: "DE" },
  { key: "progression", href: "/app/progression", marker: "PR" },
  { key: "studentFollowUp", href: "/app/suivi-des-eleves", marker: "SE" },
  { key: "reports", href: "/app/rapports", marker: "RA" },
] as const satisfies readonly NavigationItem[];

export function getNavigationForRole(role: ApplicationRole): readonly NavigationItem[] {
  return role === "ADMIN" ? adminNavigation : teacherNavigation;
}

export function canRoleAccessModule(role: ApplicationRole, slug: string): boolean {
  return getNavigationForRole(role).some((item) => item.href === `/app/${slug}`);
}

export function getNavigationKeyForSlug(slug: string): NavigationKey | undefined {
  const item = [...adminNavigation, ...teacherNavigation].find(
    (candidate) => candidate.href === `/app/${slug}`,
  );
  return item?.key;
}
