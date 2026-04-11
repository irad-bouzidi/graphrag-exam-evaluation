import api from './api';
import { Student } from '@/types';

export const getStudents = (params?: {
  class_name?: string;
  grade_level?: number;
  skip?: number;
  limit?: number;
}) => api.get<{ students: Student[]; total: number }>('/students', { params });

export const getStudent = (id: string) =>
  api.get<{ success: boolean; student: Student }>(`/students/${id}`);

export const createStudent = (data: Partial<Student>) =>
  api.post<{ success: boolean; student: Student }>('/students', data);

export const bulkCreateStudents = (students: Partial<Student>[]) =>
  api.post<{ success: boolean; created: number; students: Student[] }>(
    '/students/bulk',
    { students },
  );

export const getStudentStatistics = (id: string) =>
  api.get<{ success: boolean; statistics: any }>(
    `/students/${id}/statistics`,
  );

export const getStudentSubmissions = (
  id: string,
  params?: { skip?: number; limit?: number },
) =>
  api.get<{ success: boolean; submissions: any; total: number }>(
    `/students/${id}/submissions`,
    { params },
  );

export const getStudentSkills = (id: string) =>
  api.get(`/students/${id}/skills`);

export const getClassStatistics = (className: string) =>
  api.get<{ success: boolean; statistics: any }>(
    `/students/class/${className}/statistics`,
  );
