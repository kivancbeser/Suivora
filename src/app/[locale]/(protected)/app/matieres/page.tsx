import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CoursesPage } from "@/features/courses/course-page";
import { listCourses } from "@/features/courses/data";
import { structureMessages } from "@/features/class-courses/messages";
import { isLocale } from "@/i18n/routing";
export default async function Page({params}:{params:Promise<{locale:string}>}) { const {locale}=await params;if(!isLocale(locale))notFound();const result=await listCourses();if(result.status==="unauthenticated")redirect(`/${locale}/connexion`);if(result.status==="forbidden")notFound();if(result.status==="access-unavailable")return null;const t=await getTranslations({locale,namespace:"Courses"});return <CoursesPage courses={result.status==="ready"?result.courses:[]} m={structureMessages((key)=>t(key as never))} readError={result.status==="error"}/>; }
