import api from '../api';

const complaintService = {
    getComplaints: async (params) => {
        const res = await api.get('/complaints', { params });
        return res.data;
    },
    createComplaint: async (formData) => {
        const res = await api.post('/complaints', formData);
        return res.data;
    },
    getComplaintById: async (id) => {
        const res = await api.get(`/complaints/${id}`);
        return res.data;
    },
    updateComplaint: async (id, formData) => {
        const res = await api.put(`/complaints/${id}`, formData);
        return res.data;
    },
    deleteComplaint: async (id) => {
        const res = await api.delete(`/complaints/${id}`);
        return res.data;
    },
    getStats: async () => {
        const res = await api.get('/complaints/stats');
        return res.data;
    },
    addComment: async (id, text) => {
        const res = await api.post(`/complaints/${id}/comments`, { text });
        return res.data;
    },
    deleteComment: async (id, commentId) => {
        const res = await api.delete(`/complaints/${id}/comments/${commentId}`);
        return res.data;
    },
    submitFeedback: async (id, rating, comment) => {
        const res = await api.post(`/complaints/${id}/feedback`, { rating, comment });
        return res.data;
    },
    reopenComplaint: async (id, reason) => {
        const res = await api.post(`/complaints/${id}/reopen`, { reason });
        return res.data;
    },
    escalateComplaint: async (id) => {
        const res = await api.post(`/complaints/${id}/escalate`);
        return res.data;
    }
};

export default complaintService;
