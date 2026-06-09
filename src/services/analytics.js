import api from './api';

export const analyticsService = {
    getContractsStats: (params) => api.get('/analytics/contracts_stats/', { params }),
    getLeadsStats: (params) => api.get('/analytics/leads_stats/', { params }),
    getSummary: () => api.get('/analytics/summary/'),
    getFinanceStats: (params) => api.get('/analytics/finance_stats/', { params }),
};
