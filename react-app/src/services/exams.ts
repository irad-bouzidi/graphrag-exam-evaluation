import api from './api';
import { Exam, Question, AnswerKey } from '@/types';

export const getExams = (params?: {
  grade_level?: number;
  subject?: string;
  skip?: number;
  limit?: number;
}) => api.get<{ exams: Exam[]; total: number }>('/exams', { params });

export const getExam = (id: string) =>
  api.get<{ success: boolean; exam: Exam }>(`/exams/${id}`);

export const createExam = (data: Partial<Exam>) =>
  api.post<{ success: boolean; exam: Exam }>('/exams', data);

export const deleteExam = (id: string) =>
  api.delete<{ success: boolean }>(`/exams/${id}`);

export const getExamStatistics = (id: string) =>
  api.get<{ success: boolean; statistics: any }>(
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
