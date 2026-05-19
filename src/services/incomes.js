import api from './api';

const incomesService = {
    // Categories
    getCategories: async (params = {}) => {
        const response = await api.get('/income-categories/', { params });
        return response.data;
    },
    createCategory: async (data) => {
        const response = await api.post('/income-categories/', data);
        return response.data;
    },
    updateCategory: async (id, data) => {
        const response = await api.patch(`/income-categories/${id}/`, data);
        return response.data;
    },
    deleteCategory: async (id) => {
        const response = await api.delete(`/income-categories/${id}/`);
        return response.data;
    },

    // Incomes
    getIncomes: async (params = {}) => {
        const response = await api.get('/incomes/', { params });
        return response.data;
    },
    createIncome: async (data) => {
        const response = await api.post('/incomes/', data);
        return response.data;
    },
    updateIncome: async (id, data) => {
        const response = await api.patch(`/incomes/${id}/`, data);
        return response.data;
    },
    deleteIncome: async (id) => {
        const response = await api.delete(`/incomes/${id}/`);
        return response.data;
    },
    getBuildingIncomeStats: async (buildingId, params = {}) => {
        const response = await api.get(`/buildings/${buildingId}/income_statistics/`, { params });
        return response.data;
    }
};

export default incomesService;
