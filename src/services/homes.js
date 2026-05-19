import api from './api';

// Xonadonlar ro'yxatini olish (paginatsiya bilan)
export const getHomes = async (params) => {
    const response = await api.get('/homes/', { params });
    return response.data; // { count, next, previous, results }
};


export const getHome = async (id) => {
    const response = await api.get(`/homes/${id}/`);
    return response.data;
};

export const createHome = async (data) => {
    const response = await api.post('/homes/', data);
    return response.data;
};

export const updateHome = async (id, data) => {
    const response = await api.patch(`/homes/${id}/`, data);
    return response.data;
};

export const deleteHome = async (id) => {
    const response = await api.delete(`/homes/${id}/`);
    return response.data;
};

export const uploadExcel = async (formData) => {
    const response = await api.post('/homes/upload-excel/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const batchCreateHomes = async (formData) => {
    const response = await api.post('/homes/batch-create/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};
