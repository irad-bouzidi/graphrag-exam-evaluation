/**
 * Form-related type definitions
 */

import { SKILLS } from '@/lib/constants/form'

/**
 * Question form state for creating/editing exam questions
 */
export interface QuestionForm {
  text: string
  type: string
  correct_answer: string
  points: number
  topic: string
  skills: string[]
}

/**
 * Student form state for bulk creation
 */
export interface StudentFormInput {
  name: string
  student_number: string
  class_name: string
  grade_level: number
}

/**
 * Exam form submission payload
 */
export interface ExamFormPayload {
  title: string
  grade_level: number
  subject: string
  duration_minutes: number
  questions: QuestionForm[]
}

/**
 * Manual answer input for submission
 */
export interface ManualAnswerInput {
  question_id: string
  answer: string
}

/**
 * Submission form payload
 */
export interface SubmissionFormPayload {
  exam_id: string
  student_id: string
  answers?: ManualAnswerInput[]
}

/**
 * Skill type extracted from SKILLS constant
 */
export type Skill = typeof SKILLS[number]

/**
 * Topic option type
 */
export interface TopicOption {
  value: string
  label: string
}

/**
 * Question type option
 */
export interface QuestionTypeOption {
  value: string
  label: string
}

/**
 * Grade level type
 */
export type GradeLevel = typeof number

/**
 * Form validation errors
 */
export interface FormErrors {
  [key: string]: string | undefined
}

/**
 * Form field touched state
 */
export interface FormTouched {
  [key: string]: boolean | undefined
}