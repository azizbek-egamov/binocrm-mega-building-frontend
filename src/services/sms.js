import api from './api';

const smsService = {
    // Shablonlar
    getTemplates: () => api.get('/sms-templates/'),
    createTemplate: (data) => api.post('/sms-templates/', data),
    updateTemplate: (id, data) => api.put(`/sms-templates/${id}/`, data),
    deleteTemplate: (id) => api.delete(`/sms-templates/${id}/`),

    // Tarix
    getHistory: () => api.get('/sms-history/'),

    // Eskiz ma'lumotlari (balans va h.k.)
    getEskizInfo: () => api.get('/sms-history/eskiz_info/'),

    // Eskiz dan kelgan shablonlar va tarix
    getEskizTemplates: () => api.get('/sms-history/eskiz_templates/'),
    getEskizHistory: () => api.get('/sms-history/eskiz_history/'),
    createEskizTemplate: (data) => api.post('/sms-history/eskiz_create_template/', data),

    // Qo'lda SMS yuborish
    sendManual: (data) => api.post('/sms-history/send_manual/', data),
};

export default smsService;
