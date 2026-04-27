export interface Exam {
  id: string;
  title: string;
  grade_level: number;
  subject: string;
  duration_minutes: number;
  total_points: number;
  status: string;
  created_at?: string;
  questions: Question[];
}

export interface Question {
  id: string;
  number: number;
  text: string;
  type: string;
  correct_answer: string;
  points: number;
  skills: string[];
  topic: string;
}

export interface Student {
  id: string;
  name: string;
  student_number: string;
  class_name: string;
  grade_level: number;
  created_at?: string;
}

export interface Submission {
  id: string;
  status: string;
  raw_text?: string;
  submitted_at?: string;
  student: Student;
  exam: Exam;
  answers: Answer[];
  correction?: Correction;
}

export interface Answer {
  id: string;
  question_id: string;
  answer_text: string;
}

export interface Correction {
  id: string;
  total_points: number;
  earned_points: number;
  percentage: number;
  feedback: string;
  corrected_at?: string;
  question_corrections: QuestionCorrection[];
}

export interface QuestionCorrection {
  id: string;
  question_id: string;
  is_correct: boolean;
  points_earned: number;
  points_possible: number;
  student_answer: string;
  correct_answer: string;
  feedback: string;
  step_by_step_solution?: string;
  error_types: string[];
}

export interface Statistics {
  total_exams?: number;
  total_students?: number;
  total_submissions?: number;
  total_corrections?: number;
  average_score?: number;
  pass_rate?: number;
  highest_score?: number;
  lowest_score?: number;
}
