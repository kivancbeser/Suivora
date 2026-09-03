import type { Viewport } from "next";
import type { ReactNode } from "react";
import "../globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

type RootRedirectLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootRedirectLayout({
  children,
}: RootRedirectLayoutProps) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
