import api from './api';

export const clientService = {
    // Get all clients (with optional params)
    getAll: (params) => api.get('/clients/', { params }),

    // Get single client
    get: (id) => api.get(`/clients/${id}/`),

    // Create client
    create: (data) => api.post('/clients/', data),

    // Update client
    update: (id, data) => api.put(`/clients/${id}/`, data),

    // Delete client
    delete: (id, force = false) => api.delete(`/clients/${id}/${force ? '?force=true' : ''}`),

    // Check if client can be deleted (has contracts?)
    checkDelete: (id) => api.get(`/clients/${id}/check_delete/`),

    // Send SMS to all clients
    sendBulkSms: (message) => api.post('/clients/send_bulk_sms/', { message }),

    // Send SMS to a specific client
    sendSms: (id, message) => api.post(`/clients/${id}/send_sms/`, { message }),
};
