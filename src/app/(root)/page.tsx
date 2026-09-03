import { redirect } from "next/navigation";
import { getRootRedirectPath } from "@/i18n/routing";

export default function RootPage() {
  redirect(getRootRedirectPath());
}
