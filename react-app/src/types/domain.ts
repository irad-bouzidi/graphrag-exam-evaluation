// Domain models for the exam evaluation system

export interface Exam {
  id: string;
  title: string;
  description?: string;
  grade_level: number;
  subject: string;
  created_at: string;
  updated_at: string;
  questions?: Question[];
  answer_key?: AnswerKey;
  template?: boolean;
}

export interface Question {
  id: string;
  content: string;
  difficulty: number; // 1-10
  points: number;
  is_multiple_choice: boolean;
  options?: string[];
}

export interface AnswerKey {
  question_id: string;
  correct_answer: string;
  is_multiple_choice: boolean;
  correct_options: string[];
}

export interface Student {
  id: string;
  class_name: string;
  grade_level: number;
  created_at: string;
}

export interface Submission {
  id: string;
  exam_id: string;
  student_id: string;
  answers: {
    question_id: string;
    answer: string;
  }[];
  is_multiple_choice: boolean;
  submitted_at: string;
}

export interface Answer {
  id: string;
  question_id: string;
  question_content: string;
  answer: string;
  score: number;
  is_correct: boolean;
  correction?: string;
}

export interface Correction {
  id: string;
  submission_id: string;
  exam_id: string;
  student_id: string;
  answers: Answer[];
  created_at: string;
}

export interface QuestionCorrection {
  question_id: string;
  question_content: string;
  student_answer: string;
  correction: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  usage_count: number;
}

export interface Statistics {
  total_exams: number;
  total_students: number;
  total_submissions: number;
  total_corrections: number;
  grade_distribution?: Record<string, number>;
  skill_breakdown?: Record<string, number>;
}
