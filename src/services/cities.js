import api from './api';

// Barcha shaharlarni olish (paginatsiya bilan)
export const getCities = async (params = {}) => {
    const response = await api.get('/cities/', { params });
    return response.data; // { count, next, previous, results }
};

// Barcha shaharlarni olish (paginatsiyasiz - select uchun)
export const getAllCities = async () => {
    const response = await api.get('/cities/', { params: { page_size: 1000 } });
    return response.data.results || response.data;
};


// Bitta shaharni olish
export const getCity = async (id) => {
    const response = await api.get(`/cities/${id}/`);
    return response.data;
};

// Yangi shahar yaratish
export const createCity = async (data) => {
    const response = await api.post('/cities/', data);
    return response.data;
};

// Shaharni yangilash
export const updateCity = async (id, data) => {
    const response = await api.put(`/cities/${id}/`, data);
    return response.data;
};

// Shaharni o'chirish
export const deleteCity = async (id) => {
    const response = await api.delete(`/cities/${id}/`);
    return response.data;
};
