// Form types for validation

export interface ExamForm {
  title: string;
  description?: string;
  grade_level: number;
  subject: string;
  questions: {
    id: string;
    content: string;
    difficulty: number;
    points: number;
    is_multiple_choice: boolean;
    options?: string[];
  }[];
  answer_key: {
    question_id: string;
    correct_answer: string;
    is_multiple_choice: boolean;
    correct_options: string[];
  }[];
}

export interface StudentForm {
  class_name: string;
  grade_level: number;
  first_name: string;
  last_name: string;
}

export interface SubmissionForm {
  exam_id: string;
  student_id: string;
  answers: {
    question_id: string;
    answer: string;
  }[];
}

export interface BatchCorrectionRequest {
  submission_ids: string[];
}
