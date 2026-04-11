import api from './api';
import { Submission, Answer } from '@/types';

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
  api.post<{ success: boolean; correction: any }>(
    `/submissions/${id}/correct`,
  );

export const extractAnswers = (id: string) =>
  api.post(`/submissions/${id}/extract-answers`);

export const getCorrection = (id: string) =>
  api.get<{ success: boolean; correction: any }>(
    `/submissions/${id}/correction`,
  );

export const batchCorrectSubmissions = (submissionIds: string[]) =>
  api.post("/submissions/batch/correct", submissionIds);
