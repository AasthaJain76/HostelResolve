import prisma from '../DB/db.config.js';

export const createNotificationHelper = async (recipientId, senderId, type, complaintId, message) => {
    try {
        return await prisma.notification.create({
            data: {
                recipientId,
                senderId,
                type,
                complaintId,
                message
            }
        });
    } catch (err) {
        console.error("Failed to create notification:", err);
    }
};

export const getNotifications = async (req, res) => {
    try {
        const notifications = await prisma.notification.findMany({
            where: { recipientId: req.user.id },
            include: {
                sender: { select: { name: true, role: true } },
                complaint: { select: { title: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: notifications });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const markAsRead = async (req, res) => {
    try {
        await prisma.notification.update({
            where: { id: req.params.id, recipientId: req.user.id },
            data: { isRead: true }
        });
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: { recipientId: req.user.id, isRead: false },
            data: { isRead: true }
        });
        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
