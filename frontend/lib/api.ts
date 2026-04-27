import axios from "axios";
import { API_URL } from "@/lib/constants";
import {
  Exam,
  Question,
  Student,
  Submission,
  Answer,
  Correction,
  QuestionCorrection,
  Statistics
} from "@/lib/types";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// API Functions

// Health
export const getHealth = () => api.get("/health");
export const getHealthReady = () => api.get("/health/ready");
export const getHealthStats = () => api.get("/health/stats");

// Exams
export const getExams = (params?: {
  grade_level?: number;
  subject?: string;
  skip?: number;
  limit?: number;
}) => api.get<{ exams: Exam[]; total: number }>("/exams", { params });

export const getExam = (id: string) =>
  api.get<{ success: boolean; exam: Exam }>(`/exams/${id}`);

export const createExam = (data: Partial<Exam>) =>
  api.post<{ success: boolean; exam: Exam }>("/exams", data);

export const deleteExam = (id: string) =>
  api.delete<{ success: boolean }>(`/exams/${id}`);

export const getExamStatistics = (id: string) =>
  api.get<{ success: boolean; statistics: Statistics }>(
    `/exams/${id}/statistics`,
  );

export const uploadExamTemplate = (formData: FormData) =>
  api.post("/exams/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const uploadAnswerKey = (examId: string, formData: FormData) =>
  api.post(`/exams/upload-answer-key/${examId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Students
export const getStudents = (params?: {
  class_name?: string;
  grade_level?: number;
  skip?: number;
  limit?: number;
}) => api.get<{ students: Student[]; total: number }>("/students", { params });

export const getStudent = (id: string) =>
  api.get<{ success: boolean; student: Student }>(`/students/${id}`);

export const createStudent = (data: Partial<Student>) =>
  api.post<{ success: boolean; student: Student }>("/students", data);

export const bulkCreateStudents = (students: Partial<Student>[]) =>
  api.post<{ success: boolean; created: number; students: Student[] }>(
    "/students/bulk",
    { students },
  );

export const getStudentStatistics = (id: string) =>
  api.get<{ success: boolean; statistics: Statistics }>(
    `/students/${id}/statistics`,
  );

export const getStudentSubmissions = (
  id: string,
  params?: { skip?: number; limit?: number },
) =>
  api.get<{ success: boolean; submissions: Submission[]; total: number }>(
    `/students/${id}/submissions`,
    { params },
  );

export const getStudentSkills = (id: string) =>
  api.get(`/students/${id}/skills`);

export const getClassStatistics = (className: string) =>
  api.get<{ success: boolean; statistics: Statistics }>(
    `/students/class/${className}/statistics`,
  );

// Submissions
export const getSubmissions = (params?: {
  exam_id?: string;
  student_id?: string;
  status?: string;
  skip?: number;
  limit?: number;
}) =>
  api.get<{ submissions: Submission[]; total: number }>("/submissions", {
    params,
  });

export const getSubmission = (id: string) =>
  api.get<{ success: boolean; submission: Submission }>(`/submissions/${id}`);

export const createSubmission = (data: {
  exam_id: string;
  student_id: string;
  answers?: { question_id: string; answer: string }[];
}) =>
  api.post<{ success: boolean; submission: Submission }>("/submissions", data);

export const uploadSubmission = (formData: FormData) =>
  api.post("/submissions/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const correctSubmission = (id: string) =>
  api.post<{ success: boolean; correction: Correction }>(
    `/submissions/${id}/correct`,
  );

export const extractAnswers = (id: string) =>
  api.post(`/submissions/${id}/extract-answers`);

export const getCorrection = (id: string) =>
  api.get<{ success: boolean; correction: Correction }>(
    `/submissions/${id}/correction`,
  );

export const batchCorrectSubmissions = (submissionIds: string[]) =>
  api.post("/submissions/batch/correct", submissionIds);

// Graph
export const getGraphOverview = () => api.get("/graph/overview");

export const getGraphVisualization = (params?: {
  node_type?: string;
  limit?: number;
}) => api.get("/graph/visualization", { params });

export const getStudentGraph = (id: string) => api.get(`/graph/student/${id}`);

export const getExamGraph = (id: string) => api.get(`/graph/exam/${id}`);

export const getSkillsGraph = () => api.get("/graph/skills");

export const getErrorsGraph = (params?: {
  exam_id?: string;
  class_name?: string;
}) => api.get("/graph/errors", { params });
