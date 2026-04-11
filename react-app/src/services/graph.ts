import api from './api';

export const getGraphOverview = () => api.get('/graph/overview');
export const getGraphVisualization = (params?: {
  node_type?: string;
  limit?: number;
}) => api.get('/graph/visualization', { params });
export const getStudentGraph = (id: string) => api.get(`/graph/student/${id}`);
export const getExamGraph = (id: string) => api.get(`/graph/exam/${id}`);
export const getSkillsGraph = () => api.get('/graph/skills');
export const getErrorsGraph = (params?: {
  exam_id?: string;
  class_name?: string;
}) => api.get('/graph/errors', { params });
