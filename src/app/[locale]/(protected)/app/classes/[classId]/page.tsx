import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ClassDetailPage } from "@/features/classes/class-pages";
import { getClassDetail } from "@/features/classes/data";
import { structureMessages } from "@/features/class-courses/messages";
import { assignmentMessages } from "@/features/teacher-assignments/messages";
import { isLocale } from "@/i18n/routing";
export default async function Page({params}:{params:Promise<{locale:string;classId:string}>}) { const {locale,classId}=await params;if(!isLocale(locale))notFound();const result=await getClassDetail(classId);if(result.status==="unauthenticated")redirect(`/${locale}/connexion`);if(result.status==="forbidden"||result.status==="not-found")notFound();if(result.status==="access-unavailable")return null;const [t,a]=await Promise.all([getTranslations({locale,namespace:"Classes"}),getTranslations({locale,namespace:"Assignments"})]);if(result.status==="error")return <section className="structure-empty" role="alert"><h1>{t("readError.title")}</h1><p>{t("readError.description")}</p></section>;if(result.status!=="ready")notFound();return <ClassDetailPage assignments={assignmentMessages((key)=>a(key as never))} locale={locale} m={structureMessages((key)=>t(key as never))} value={result.value}/>; }
