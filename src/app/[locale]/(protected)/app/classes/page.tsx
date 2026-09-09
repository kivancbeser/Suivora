import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ClassesPage } from "@/features/classes/class-pages";
import { listClasses } from "@/features/classes/data";
import { structureMessages } from "@/features/class-courses/messages";
import { isLocale } from "@/i18n/routing";
export default async function Page({params}:{params:Promise<{locale:string}>}) { const {locale}=await params;if(!isLocale(locale))notFound();const result=await listClasses();if(result.status==="unauthenticated")redirect(`/${locale}/connexion`);if(result.status==="forbidden")notFound();if(result.status==="access-unavailable")return null;const t=await getTranslations({locale,namespace:"Classes"});return <ClassesPage classes={result.status==="ready"?result.classes:[]} locale={locale} m={structureMessages((key)=>t(key as never))} readError={result.status==="error"} years={result.status==="ready"?result.years:[]}/>; }
