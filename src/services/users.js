import api from './api';

export const getUsers = (params) => api.get('/users/', { params });
export const createUser = (data) => api.post('/users/', data);
export const updateUser = (id, data) => api.patch(`/users/${id}/`, data);
export const deleteUser = (id) => api.delete(`/users/${id}/`);
export const getFinanceUsers = () => api.get('/users/finance_users/');
