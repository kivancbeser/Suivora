export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      assessment_element_outcomes: {
        Row: {
          allocation_weight: number
          assessment_element_id: string
          class_course_outcome_id: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          school_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          allocation_weight: number
          assessment_element_id: string
          class_course_outcome_id: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          school_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          allocation_weight?: number
          assessment_element_id?: string
          class_course_outcome_id?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          school_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_element_outcomes_assessment_element_id_school_i_fkey"
            columns: ["assessment_element_id", "school_id"]
            isOneToOne: false
            referencedRelation: "assessment_elements"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "assessment_element_outcomes_class_course_outcome_id_school_fkey"
            columns: ["class_course_outcome_id", "school_id"]
            isOneToOne: false
            referencedRelation: "class_course_outcomes"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "assessment_element_outcomes_created_by_school_id_fkey"
            columns: ["created_by", "school_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "assessment_element_outcomes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_element_outcomes_updated_by_school_id_fkey"
            columns: ["updated_by", "school_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id", "school_id"]
          },
        ]
      }
      assessment_elements: {
        Row: {
          created_at: string
          created_by: string
          id: string
          max_points: number
          position: number
          quiz_id: string
          school_id: string
          title: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          max_points: number
          position: number
          quiz_id: string
          school_id: string
          title: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          max_points?: number
          position?: number
          quiz_id?: string
          school_id?: string
          title?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_elements_created_by_school_id_fkey"
            columns: ["created_by", "school_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "assessment_elements_quiz_id_school_id_fkey"
            columns: ["quiz_id", "school_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "assessment_elements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_elements_updated_by_school_id_fkey"
            columns: ["updated_by", "school_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id", "school_id"]
          },
        ]
      }
      class_course_outcomes: {
        Row: {
          class_course_id: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          outcome_revision_id: string
          school_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          class_course_id: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          outcome_revision_id: string
          school_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          class_course_id?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          outcome_revision_id?: string
          school_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_course_outcomes_class_course_id_school_id_fkey"
            columns: ["class_course_id", "school_id"]
            isOneToOne: false
            referencedRelation: "class_courses"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "class_course_outcomes_created_by_school_id_fkey"
            columns: ["created_by", "school_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "class_course_outcomes_outcome_revision_id_school_id_fkey"
            columns: ["outcome_revision_id", "school_id"]
            isOneToOne: false
            referencedRelation: "learning_outcome_revisions"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "class_course_outcomes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_course_outcomes_updated_by_school_id_fkey"
            columns: ["updated_by", "school_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id", "school_id"]
          },
        ]
      }
      class_courses: {
        Row: {
          class_id: string
          course_id: string
          created_at: string
          id: string
          is_active: boolean
          school_id: string
          school_year_id: string
          updated_at: string
          weekly_periods: number
        }
        Insert: {
          class_id: string
          course_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          school_id: string
          school_year_id: string
          updated_at?: string
          weekly_periods: number
        }
        Update: {
          class_id?: string
          course_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          school_id?: string
          school_year_id?: string
          updated_at?: string
          weekly_periods?: number
        }
        Relationships: [
          {
            foreignKeyName: "class_courses_class_school_year_fk"
            columns: ["class_id", "school_id", "school_year_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id", "school_id", "school_year_id"]
          },
          {
            foreignKeyName: "class_courses_course_school_fk"
            columns: ["course_id", "school_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "class_courses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          school_id: string
          school_year_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          school_id: string
          school_year_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string
          school_year_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_year_school_fk"
            columns: ["school_year_id", "school_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id", "school_id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          class_id: string
          created_at: string
          ends_on: string | null
          id: string
          school_id: string
          school_year_id: string
          starts_on: string
          student_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          ends_on?: string | null
          id?: string
          school_id: string
          school_year_id: string
          starts_on: string
          student_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          ends_on?: string | null
          id?: string
          school_id?: string
          school_year_id?: string
          starts_on?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_class_school_year_fk"
            columns: ["class_id", "school_id", "school_year_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id", "school_id", "school_year_id"]
          },
          {
            foreignKeyName: "enrollments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_school_year_school_fk"
            columns: ["school_year_id", "school_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "enrollments_student_school_fk"
            columns: ["student_id", "school_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id", "school_id"]
          },
        ]
      }
      homework_assignments: {
        Row: {
          assigned_on: string
          class_course_id: string
          created_at: string
          created_by: string
          description: string | null
          due_on: string
          id: string
          is_active: boolean
          school_id: string
          school_year_id: string
          term_id: string
          title: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          assigned_on: string
          class_course_id: string
          created_at?: string
          created_by: string
          description?: string | null
          due_on: string
          id?: string
          is_active?: boolean
          school_id: string
          school_year_id: string
          term_id: string
          title: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          assigned_on?: string
          class_course_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_on?: string
          id?: string
          is_active?: boolean
          school_id?: string
          school_year_id?: string
          term_id?: string
          title?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_assignments_class_course_school_fk"
            columns: ["class_course_id", "school_id"]
            isOneToOne: false
            referencedRelation: "class_courses"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "homework_assignments_created_by_school_fk"
            columns: ["created_by", "school_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "homework_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_assignments_term_school_year_school_fk"
            columns: ["term_id", "school_year_id", "school_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id", "school_year_id", "school_id"]
          },
          {
            foreignKeyName: "homework_assignments_updated_by_school_fk"
            columns: ["updated_by", "school_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id", "school_id"]
          },
        ]
      }
      homework_student_statuses: {
        Row: {
          created_at: string
          created_by: string
          homework_assignment_id: string
          id: string
          school_id: string
          state: Database["public"]["Enums"]["homework_state"]
          student_id: string
          submitted_on: string | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          homework_assignment_id: string
          id?: string
          school_id: string
          state: Database["public"]["Enums"]["homework_state"]
          student_id: string
          submitted_on?: string | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          homework_assignment_id?: string
          id?: string
          school_id?: string
          state?: Database["public"]["Enums"]["homework_state"]
          student_id?: string
          submitted_on?: string | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_status_assignment_school_fk"
            columns: ["homework_assignment_id", "school_id"]
            isOneToOne: false
            referencedRelation: "homework_assignments"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "homework_status_created_by_school_fk"
            columns: ["created_by", "school_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "homework_status_student_school_fk"
            columns: ["student_id", "school_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "homework_status_updated_by_school_fk"
            columns: ["updated_by", "school_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "homework_student_statuses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_outcome_revisions: {
        Row: {
          created_at: string
          created_by: string
          description: string
          id: string
          learning_outcome_id: string
          revision_number: number
          school_id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string
          id?: string
          learning_outcome_id: string
          revision_number: number
          school_id: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          learning_outcome_id?: string
          revision_number?: number
          school_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_outcome_revisions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outcome_revisions_created_by_school_fk"
            columns: ["created_by", "school_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "outcome_revisions_outcome_school_fk"
            columns: ["learning_outcome_id", "school_id"]
            isOneToOne: false
            referencedRelation: "learning_outcomes"
            referencedColumns: ["id", "school_id"]
          },
        ]
      }
      learning_outcomes: {
        Row: {
          code: string
          course_id: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          school_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          code: string
          course_id: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          school_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          code?: string
          course_id?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          school_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_outcomes_course_school_fk"
            columns: ["course_id", "school_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "learning_outcomes_created_by_school_fk"
            columns: ["created_by", "school_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "learning_outcomes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_outcomes_updated_by_school_fk"
            columns: ["updated_by", "school_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id", "school_id"]
          },
        ]
      }
      quiz_scores: {
        Row: {
          created_at: string
          created_by: string
          id: string
          quiz_id: string
          school_id: string
          score: number
          student_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          quiz_id: string
          school_id: string
          score: number
          student_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          quiz_id?: string
          school_id?: string
          score?: number
          student_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_scores_created_by_school_fk"
            columns: ["created_by", "school_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "quiz_scores_quiz_school_fk"
            columns: ["quiz_id", "school_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "quiz_scores_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_scores_student_school_fk"
            columns: ["student_id", "school_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "quiz_scores_updated_by_school_fk"
            columns: ["updated_by", "school_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id", "school_id"]
          },
        ]
      }
      quizzes: {
        Row: {
          assessment_mode: Database["public"]["Enums"]["quiz_assessment_mode"]
          class_course_id: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          is_finalized: boolean
          max_score: number
          quiz_date: string
          school_id: string
          school_year_id: string
          slot: Database["public"]["Enums"]["quiz_slot"]
          term_id: string
          title: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          assessment_mode?: Database["public"]["Enums"]["quiz_assessment_mode"]
          class_course_id: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          is_finalized?: boolean
          max_score?: number
          quiz_date: string
          school_id: string
          school_year_id: string
          slot: Database["public"]["Enums"]["quiz_slot"]
          term_id: string
          title: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          assessment_mode?: Database["public"]["Enums"]["quiz_assessment_mode"]
          class_course_id?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          is_finalized?: boolean
          max_score?: number
          quiz_date?: string
          school_id?: string
          school_year_id?: string
          slot?: Database["public"]["Enums"]["quiz_slot"]
          term_id?: string
          title?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_class_course_school_fk"
            columns: ["class_course_id", "school_id"]
            isOneToOne: false
            referencedRelation: "class_courses"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "quizzes_created_by_school_fk"
            columns: ["created_by", "school_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "quizzes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_term_school_year_school_fk"
            columns: ["term_id", "school_year_id", "school_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id", "school_year_id", "school_id"]
          },
          {
            foreignKeyName: "quizzes_updated_by_school_fk"
            columns: ["updated_by", "school_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id", "school_id"]
          },
        ]
      }
      school_years: {
        Row: {
          active: boolean
          created_at: string
          end_date: string
          id: string
          label: string
          school_id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          end_date: string
          id?: string
          label: string
          school_id: string
          start_date: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          end_date?: string
          id?: string
          label?: string
          school_id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_years_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_element_scores: {
        Row: {
          assessment_element_id: string
          created_at: string
          created_by: string
          id: string
          school_id: string
          score: number
          student_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          assessment_element_id: string
          created_at?: string
          created_by: string
          id?: string
          school_id: string
          score: number
          student_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          assessment_element_id?: string
          created_at?: string
          created_by?: string
          id?: string
          school_id?: string
          score?: number
          student_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_element_scores_assessment_element_id_school_id_fkey"
            columns: ["assessment_element_id", "school_id"]
            isOneToOne: false
            referencedRelation: "assessment_elements"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "student_element_scores_created_by_school_id_fkey"
            columns: ["created_by", "school_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "student_element_scores_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_element_scores_student_id_school_id_fkey"
            columns: ["student_id", "school_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "student_element_scores_updated_by_school_id_fkey"
            columns: ["updated_by", "school_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id", "school_id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          school_id: string
          student_code: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_name: string
          id?: string
          is_active?: boolean
          last_name: string
          school_id: string
          student_code?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          school_id?: string
          student_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_assignments: {
        Row: {
          class_course_id: string
          created_at: string
          id: string
          is_active: boolean
          school_id: string
          teacher_id: string
          updated_at: string
          weekly_periods: number
        }
        Insert: {
          class_course_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          school_id: string
          teacher_id: string
          updated_at?: string
          weekly_periods: number
        }
        Update: {
          class_course_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          school_id?: string
          teacher_id?: string
          updated_at?: string
          weekly_periods?: number
        }
        Relationships: [
          {
            foreignKeyName: "teacher_assignments_class_course_school_fk"
            columns: ["class_course_id", "school_id"]
            isOneToOne: false
            referencedRelation: "class_courses"
            referencedColumns: ["id", "school_id"]
          },
          {
            foreignKeyName: "teacher_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_teacher_school_fk"
            columns: ["teacher_id", "school_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id", "school_id"]
          },
        ]
      }
      terms: {
        Row: {
          created_at: string
          end_date: string
          id: string
          school_id: string
          school_year_id: string
          semester_number: number
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          school_id: string
          school_year_id: string
          semester_number: number
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          school_id?: string
          school_year_id?: string
          semester_number?: number
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "terms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terms_school_year_school_fk"
            columns: ["school_year_id", "school_id"]
            isOneToOne: false
            referencedRelation: "school_years"
            referencedColumns: ["id", "school_id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          active: boolean
          created_at: string
          display_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          display_name?: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          display_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_close_current_enrollment: {
        Args: { enrollment_end_date: string; target_student_id: string }
        Returns: undefined
      }
      admin_create_student_with_enrollment: {
        Args: {
          enrollment_starts_on: string
          student_code: string
          student_first_name: string
          student_last_name: string
          target_class_id: string
        }
        Returns: string
      }
      admin_create_teacher_assignment: {
        Args: {
          assigned_weekly_periods: number
          target_class_course_id: string
          target_teacher_id: string
        }
        Returns: string
      }
      admin_provision_teacher_profile: {
        Args: { target_user_id: string; teacher_display_name: string }
        Returns: undefined
      }
      admin_transfer_student: {
        Args: {
          target_class_id: string
          target_student_id: string
          transfer_date: string
        }
        Returns: string
      }
      admin_update_student: {
        Args: {
          student_code: string
          student_first_name: string
          student_is_active: boolean
          student_last_name: string
          target_student_id: string
        }
        Returns: undefined
      }
      admin_update_teacher_assignment: {
        Args: {
          assigned_weekly_periods: number
          assignment_is_active: boolean
          target_assignment_id: string
        }
        Returns: undefined
      }
      admin_update_teacher_profile: {
        Args: {
          target_user_id: string
          teacher_display_name: string
          teacher_is_active: boolean
        }
        Returns: undefined
      }
      assign_outcome_revision: {
        Args: { target_class_course_id: string; target_revision_id: string }
        Returns: string
      }
      claim_test_teacher_profile: {
        Args: { teacher_display_name: string }
        Returns: undefined
      }
      configure_detailed_quiz: {
        Args: { target_finalized?: boolean; target_quiz_id: string }
        Returns: undefined
      }
      create_homework_assignment: {
        Args: {
          homework_description: string
          homework_title: string
          target_assigned_on: string
          target_class_course_id: string
          target_due_on: string
          target_term_id: string
        }
        Returns: string
      }
      create_learning_outcome: {
        Args: {
          outcome_code: string
          outcome_description?: string
          outcome_title: string
          target_course_id: string
        }
        Returns: string
      }
      create_quiz: {
        Args: {
          quiz_title: string
          target_class_course_id: string
          target_quiz_date: string
          target_slot: Database["public"]["Enums"]["quiz_slot"]
          target_term_id: string
        }
        Returns: string
      }
      current_app_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      current_homework_streak: {
        Args: {
          as_of_date?: string
          target_class_course_id: string
          target_student_id: string
        }
        Returns: number
      }
      current_school_id: { Args: never; Returns: string }
      is_school_admin: { Args: { target_school_id: string }; Returns: boolean }
      is_teacher_assigned: {
        Args: { target_class_course_id: string }
        Returns: boolean
      }
      learning_outcome_progression: {
        Args: { target_class_course_id: string; target_student_id?: string }
        Returns: {
          contributing_element_count: number
          contributing_quiz_count: number
          evidence_state: Database["public"]["Enums"]["progression_evidence_state"]
          outcome_code: string
          outcome_id: string
          outcome_title: string
          percentage: number
          performance_band: string
          student_id: string
        }[]
      }
      list_homework_attention: {
        Args: { as_of_date?: string }
        Returns: {
          class_course_id: string
          current_streak: number
          student_first_name: string
          student_id: string
          student_last_name: string
        }[]
      }
      publish_learning_outcome_revision: {
        Args: {
          outcome_description?: string
          outcome_title: string
          target_outcome_id: string
        }
        Returns: string
      }
      save_homework_statuses: {
        Args: {
          target_homework_id: string
          target_states: Database["public"]["Enums"]["homework_state"][]
          target_student_ids: string[]
          target_submitted_on: string[]
        }
        Returns: number
      }
      save_quiz_scores: {
        Args: {
          entered_scores: number[]
          target_quiz_id: string
          target_student_ids: string[]
        }
        Returns: number
      }
      save_student_element_scores: {
        Args: {
          entered_scores: number[]
          target_element_ids: string[]
          target_quiz_id: string
          target_student_id: string
        }
        Returns: number
      }
      set_element_outcome_link: {
        Args: {
          target_active?: boolean
          target_class_course_outcome_id: string
          target_element_id: string
          target_weight: number
        }
        Returns: string
      }
      set_learning_outcome_active: {
        Args: { target_active: boolean; target_outcome_id: string }
        Returns: undefined
      }
      update_homework_assignment: {
        Args: {
          homework_description: string
          homework_is_active: boolean
          homework_title: string
          target_assigned_on: string
          target_due_on: string
          target_homework_id: string
        }
        Returns: undefined
      }
      update_quiz: {
        Args: {
          quiz_is_active: boolean
          quiz_title: string
          target_quiz_date: string
          target_quiz_id: string
        }
        Returns: undefined
      }
      upsert_assessment_element: {
        Args: {
          element_max_points: number
          element_position: number
          element_title: string
          target_element_id: string
          target_quiz_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "ADMIN" | "TEACHER"
      homework_state: "SUBMITTED_ON_TIME" | "SUBMITTED_LATE" | "NOT_SUBMITTED"
      progression_evidence_state:
        | "NO_DATA"
        | "INSUFFICIENT_DATA"
        | "SUFFICIENT_DATA"
        | "INCONSISTENT_DATA"
      quiz_assessment_mode: "QUICK_TOTAL" | "OUTCOME_DETAILED"
      quiz_slot: "C1" | "C2" | "C3" | "C4" | "C5" | "C6" | "C7" | "C8"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["ADMIN", "TEACHER"],
      homework_state: ["SUBMITTED_ON_TIME", "SUBMITTED_LATE", "NOT_SUBMITTED"],
      progression_evidence_state: [
        "NO_DATA",
        "INSUFFICIENT_DATA",
        "SUFFICIENT_DATA",
        "INCONSISTENT_DATA",
      ],
      quiz_assessment_mode: ["QUICK_TOTAL", "OUTCOME_DETAILED"],
      quiz_slot: ["C1", "C2", "C3", "C4", "C5", "C6", "C7", "C8"],
    },
  },
} as const
