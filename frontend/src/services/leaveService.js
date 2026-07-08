import api from '../api';

const leaveService = {
    getLeaves: async () => {
        const res = await api.get('/leaves');
        return res.data;
    },
    applyLeave: async (leaveData) => {
        const res = await api.post('/leaves', leaveData);
        return res.data;
    },
    updateLeaveStatus: async (id, status, remarks) => {
        const res = await api.put(`/leaves/${id}/status`, { status, remarks });
        return res.data;
    }
};

export default leaveService;