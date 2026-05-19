import api from './api';

const expensesService = {
    // Expenses
    getExpenses: async (params) => (await api.get('/expenses/', { params })).data,
    getExpense: async (id) => (await api.get(`/expenses/${id}/`)).data,
    createExpense: async (data) => (await api.post('/expenses/', data)).data,
    updateExpense: async (id, data) => (await api.put(`/expenses/${id}/`, data)).data,
    deleteExpense: async (id) => (await api.delete(`/expenses/${id}/`)).data,

    // Expense Categories
    getCategories: async (params) => (await api.get('/expense-categories/', { params })).data,
    getCategory: async (id) => (await api.get(`/expense-categories/${id}/`)).data,
    createCategory: async (data) => (await api.post('/expense-categories/', data)).data,
    updateCategory: async (id, data) => (await api.put(`/expense-categories/${id}/`, data)).data,
    deleteCategory: async (id) => (await api.delete(`/expense-categories/${id}/`)).data,

    // Building specific statistics
    getBuildingStats: async (buildingId, params) => (await api.get(`/buildings/${buildingId}/statistics/`, { params })).data,
};

export default expensesService;
