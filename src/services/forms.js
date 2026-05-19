import api from './api';

// ======== FORMS (Admin) ========
export const getForms = (params) => api.get('/forms/', { params });
export const getForm = (id) => api.get(`/forms/${id}/`);
export const createForm = (data) => api.post('/forms/', data);
export const updateForm = (id, data) => api.put(`/forms/${id}/`, data);
export const deleteForm = (id) => api.delete(`/forms/${id}/`);
export const getFormSubmissions = (id) => api.get(`/forms/${id}/submissions/`);
export const getFormStats = (id) => api.get(`/forms/${id}/stats/`);

// ======== PUBLIC FORMS (No Auth) ========
export const getPublicForm = (slug) => api.get(`/public/forms/${slug}/`);
export const submitPublicForm = (slug, data) => api.post(`/public/forms/${slug}/submit/`, { data });
