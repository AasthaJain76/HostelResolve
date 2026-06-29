import prisma from '../DB/db.config.js';

export const createAnnouncement = async (req, res) => {
    try {
        if (req.user.role !== 'warden') {
            return res.status(403).json({ success: false, message: 'Only wardens can create announcements' });
        }
        const { title, content, category } = req.body;
        const images = req.files ? req.files.map(file => 'uploads/' + file.filename) : [];

        const announcement = await prisma.announcement.create({
            data: {
                title,
                content,
                category: category || 'Notice',
                images,
                createdById: req.user.id
            },
            include: {
                createdBy: { select: { name: true, hostel: true } }
            }
        });
        res.status(201).json({ success: true, data: announcement });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const getAnnouncements = async (req, res) => {
    try {
        const announcements = await prisma.announcement.findMany({
            include: {
                createdBy: { select: { name: true, hostel: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: announcements });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const deleteAnnouncement = async (req, res) => {
    try {
        if (req.user.role !== 'warden') {
            return res.status(403).json({ success: false, message: 'Only wardens can delete announcements' });
        }
        await prisma.announcement.delete({
            where: { id: req.params.id }
        });
        res.json({ success: true, message: 'Announcement deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
