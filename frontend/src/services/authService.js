import api from '../api';

const authService = {
    login: async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        return res.data;
    },
    signup: async (userData) => {
        const res = await api.post('/auth/signup', userData);
        return res.data;
    },
    logout: async () => {
        const res = await api.post('/auth/logout');
        return res.data;
    },
    getProfile: async () => {
        const res = await api.get('/auth/profile');
        return res.data;
    },
    updateProfile: async (profileData) => {
        const res = await api.put('/auth/profile', profileData);
        return res.data;
    },
    changePassword: async (currentPassword, newPassword) => {
        const res = await api.put('/auth/profile/change-password', { currentPassword, newPassword });
        return res.data;
    },
    getUsers: async () => {
        const res = await api.get('/auth/users');
        return res.data;
    }
};

export default authService;
