import api from './api';

export const getHealth = () => api.get('/health');
export const getHealthReady = () => api.get('/health/ready');
export const getHealthStats = () => api.get('/health/stats');
