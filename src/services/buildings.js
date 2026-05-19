import api from './api';

// Binolar ro'yxatini olish (paginatsiya bilan)
export const getBuildings = async (params = {}) => {
    const response = await api.get('/buildings/', { params });
    return response.data; // { count, next, previous, results }
};

// Barcha binolarni olish (paginatsiyasiz - select uchun)
export const getAllBuildings = async (params = {}) => {
    const response = await api.get('/buildings/', { params: { ...params, page_size: 1000 } });
    return response.data.results || response.data;
};


// Bitta binoni olish
export const getBuilding = async (id) => {
    const response = await api.get(`/buildings/${id}/`);
    return response.data;
};

// Yangi bino yaratish
export const createBuilding = async (data) => {
    const response = await api.post('/buildings/', data);
    return response.data;
};

// Binoni yangilash
export const updateBuilding = async (id, data) => {
    const response = await api.put(`/buildings/${id}/`, data);
    return response.data;
};

// Binoni o'chirish
export const deleteBuilding = async (id) => {
    const response = await api.delete(`/buildings/${id}/`);
    return response.data;
};
