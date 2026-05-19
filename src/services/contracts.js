import api from './api';

export const contractService = {
    getAll: (params) => api.get('/contracts/', { params }),
    get: (id) => api.get(`/contracts/${id}/`),
    create: (data) => api.post('/contracts/', data),
    update: (id, data) => api.put(`/contracts/${id}/`, data),
    delete: (id) => api.delete(`/contracts/${id}/`),
    getPayments: (id) => api.get(`/contracts/${id}/payments/`),
    makePayment: (id, data) => api.post(`/contracts/${id}/make_payment/`, data),
    updateSchedule: (id, data) => api.post(`/contracts/${id}/update_schedule/`, data),
    updateMonths: (id, data) => api.post(`/contracts/${id}/update_months/`, data),
    autoDistribute: (id, data) => api.post(`/contracts/${id}/auto_distribute/`, data),
    adminAction: (id, data) => api.post(`/contracts/${id}/admin_payment/`, data),
    downloadPdf: (id) => api.get(`/contracts/${id}/download_pdf/`, { responseType: 'blob' }),
    downloadSchedulePdf: (id) => api.get(`/contracts/${id}/download_schedule_pdf/`, { responseType: 'blob' }),
    downloadGrafikPdf: (id) => api.get(`/contracts/${id}/download_grafik_pdf/`, { responseType: 'blob' }),
    downloadTransactionPdf: (id, transactionId) => api.get(`/contracts/${id}/download_transaction_pdf/${transactionId}/`, { responseType: 'blob' }),
    getTransactions: (id) => api.get(`/contracts/${id}/transactions/`),
    updateTransaction: (id, transactionId, data) => api.patch(`/contracts/${id}/update_transaction/${transactionId}/`, data),
    checkNumber: (params) => api.get('/contracts/check-number/', { params }),
};
