import { notFound,redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getStudentDetail } from "@/features/students/data";
import { studentMessages } from "@/features/students/messages";
import { StudentDetailPage } from "@/features/students/student-pages";
import { isLocale } from "@/i18n/routing";
export default async function Page({params}:{params:Promise<{locale:string;studentId:string}>}){const{locale,studentId}=await params;if(!isLocale(locale))notFound();const result=await getStudentDetail(studentId);if(result.status==="unauthenticated")redirect(`/${locale}/connexion`);if(result.status==="forbidden"||result.status==="not-found")notFound();if(result.status==="access-unavailable")return null;const t=await getTranslations({locale,namespace:"Students"});if(result.status==="error")return <section className="student-empty" role="alert"><h1>{t("readError.title")}</h1><p>{t("readError.description")}</p></section>;if(result.status!=="ready")notFound();return <StudentDetailPage locale={locale} m={studentMessages((key)=>t(key as never))} student={result.student}/>;}
