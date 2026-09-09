import { notFound,redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { listStudents } from "@/features/students/data";
import { studentMessages } from "@/features/students/messages";
import { StudentsPage } from "@/features/students/student-pages";
import { isLocale } from "@/i18n/routing";
export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<{q?:string;class?:string;status?:string}>}){const[{locale},filters]=await Promise.all([params,searchParams]);if(!isLocale(locale))notFound();const result=await listStudents();if(result.status==="unauthenticated")redirect(`/${locale}/connexion`);if(result.status==="forbidden")notFound();if(result.status==="access-unavailable")return null;const t=await getTranslations({locale,namespace:"Students"});return <StudentsPage classes={result.status==="ready"?result.classes:[]} filters={{query:filters.q??"",classId:filters.class??"",status:filters.status??""}} locale={locale} m={studentMessages((key)=>t(key as never))} readError={result.status==="error"} students={result.status==="ready"?result.students:[]}/>;}

