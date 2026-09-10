import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GradingClassesPage, GradingDetailPage, type GradingMessages } from "./pages";

vi.mock("./actions",()=>({createQuizAction:vi.fn(),updateQuizAction:vi.fn(),saveScoresAction:vi.fn()}));
const results={accessDenied:"Denied",invalidFields:"Invalid",invalidTitle:"Title",invalidDate:"Date",invalidScore:"Score",duplicateQuiz:"Duplicate",unavailable:"Unavailable",unexpected:"Unexpected",quizCreated:"Created",quizUpdated:"Updated",scoresSaved:"Saved"} as const;
const m:GradingMessages={eyebrow:"Assessments",title:"Quizzes",description:"Shared",emptyClasses:"No authorized classes",open:"Open",back:"Back",noStudents:"No enrolled students",noQuizzes:"No quizzes",addQuiz:"Add quiz",term:"Term",semester1:"Semester 1",semester2:"Semester 2",slot:"Slot",date:"Date",active:"Active",create:"Create",edit:"Edit",save:"Save",saving:"Saving",cancel:"Cancel",notEntered:"Not entered",score:"Score",average:"Average",suggestion:"Oral suggestion",unavailable:"Unavailable",performance:{EXCELLENT:"Excellent",GOOD:"Good",AVERAGE:"Average",NEEDS_REINFORCEMENT:"Reinforcement"},results};
const classroom={id:"11111111-1111-4111-8111-111111111111",className:"Class A",courseName:"French",courseCode:"FRA",schoolYear:"2040–2041"} as const;
afterEach(cleanup);
describe("grading presentation",()=>{
  it("keeps authorized class links localized without printing identifiers",()=>{const{container}=render(<GradingClassesPage classes={[classroom]} locale="tr" m={m}/>);expect(screen.getByRole("link",{name:"Open"})).toHaveAttribute("href",`/tr/app/quiz-et-notes/${classroom.id}`);expect(container).not.toHaveTextContent(classroom.id);});
  it("shows an honest student and quiz empty state",()=>{render(<GradingDetailPage locale="fr" m={m} value={{...classroom,terms:[{id:"22222222-2222-4222-8222-222222222222",semesterNumber:1,startDate:"2040-09-01",endDate:"2041-01-31"}],quizzes:[],students:[]}}/>);expect(screen.getAllByText("No enrolled students").length).toBeGreaterThan(0);expect(screen.getByText("No quizzes")).toBeInTheDocument();expect(screen.queryByRole("textbox",{name:/Score/})).not.toBeInTheDocument();});
});
