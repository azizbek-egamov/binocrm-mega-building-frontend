import api from './api';

export const getLeadOperator = () => api.get('/settings/lead_operator/');
export const updateLeadOperator = (username) => api.post('/settings/lead_operator/', { username });
