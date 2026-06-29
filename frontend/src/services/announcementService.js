import api from '../api';

const announcementService = {
    getAnnouncements: async () => {
        const res = await api.get('/announcements');
        return res.data;
    },
    createAnnouncement: async (formData) => {
        const res = await api.post('/announcements', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data;
    },
    deleteAnnouncement: async (id) => {
        const res = await api.delete(`/announcements/${id}`);
        return res.data;
    }
};

export default announcementService;
