import api from '../api';

const announcementService = {
    getAnnouncements: async () => {
        const res = await api.get('/announcements');
        return res.data;
    },
    createAnnouncement: async (formData) => {
        const res = await api.post('/announcements', formData);
        return res.data;
    },
    deleteAnnouncement: async (id) => {
        const res = await api.delete(`/announcements/${id}`);
        return res.data;
    },
    updateAnnouncement: async (id, formData) => {
        const res = await api.put(`/announcements/${id}`, formData);
        return res.data;
    },
    togglePin: async (id) => {
        const res = await api.patch(`/announcements/${id}/pin`);
        return res.data;
    }
};

export default announcementService;
