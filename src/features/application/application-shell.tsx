import type { ReactNode } from "react";
import type { AppContext } from "./application-context";
import { RoleNavigation, type LocalizedNavigationItem } from "./role-navigation";
import { SignOutButton } from "@/features/auth/sign-out-button";

type ApplicationShellProps = Readonly<{
  children: ReactNode;
  context: AppContext;
  navigationItems: readonly LocalizedNavigationItem[];
  messages: Readonly<{
    brand: string;
    navigationLabel: string;
    mobileMenuLabel: string;
    schoolLabel: string;
    roleLabel: string;
    role: string;
    signOut: string;
    signingOut: string;
  }>;
}>;

function SchoolContext({ context, messages }: Pick<ApplicationShellProps, "context" | "messages">) {
  return (
    <div className="app-school-context">
      <span>{messages.schoolLabel}</span>
      <strong>{context.school.name}</strong>
      <span className="app-role-badge">
        {messages.roleLabel}: {messages.role}
      </span>
    </div>
  );
}

export function ApplicationShell({
  children,
  context,
  navigationItems,
  messages,
}: ApplicationShellProps) {
  const navigation = (
    <RoleNavigation ariaLabel={messages.navigationLabel} items={navigationItems} />
  );

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <p className="app-brand">{messages.brand}</p>
        <SchoolContext context={context} messages={messages} />
        {navigation}
        <SignOutButton
          className="app-sign-out"
          label={messages.signOut}
          pendingLabel={messages.signingOut}
        />
      </aside>

      <header className="app-mobile-header">
        <div>
          <p className="app-brand">{messages.brand}</p>
          <SchoolContext context={context} messages={messages} />
        </div>
        <details className="app-mobile-menu">
          <summary aria-label={messages.mobileMenuLabel}>{messages.mobileMenuLabel}</summary>
          <div className="app-mobile-menu__panel">
            {navigation}
            <SignOutButton
              className="app-sign-out"
              label={messages.signOut}
              pendingLabel={messages.signingOut}
            />
          </div>
        </details>
      </header>

      <main className="app-main" id="contenu-principal">
        {children}
      </main>
    </div>
  );
}
