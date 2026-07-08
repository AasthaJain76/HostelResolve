import prisma from '../DB/db.config.js';
import { sendEmail } from '../utils/sendEmail.js';

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

        // Broadcast notifications to all registered students
        const students = await prisma.user.findMany({
            where: { role: 'student' }
        });

        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        const noticeLink = `${clientUrl}/notices`;

        Promise.all(students.map(async (student) => {
            try {
                // 1. Create in-app notification
                await prisma.notification.create({
                    data: {
                        recipientId: student.id,
                        senderId: req.user.id,
                        type: 'new_notice',
                        message: `New notice posted by Warden: "${title}"`
                    }
                });

                // 2. Send email notification
                if (student.email) {
                    await sendEmail(
                        student.email,
                        `New Hostel Notice: ${title}`,
                        `
                        <h2>New Notice Posted</h2>
                        <p>Hello ${student.name},</p>
                        <p>A new announcement has been posted on the Notice Board.</p>
                        <p><b>Title:</b> ${title}</p>
                        <p><b>Category:</b> ${category || 'Notice'}</p>
                        <br/>
                        <a href="${noticeLink}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #4f46e5; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Notice Board</a>
                        `
                    );
                }
            } catch (err) {
                console.error(`Failed to notify student ${student.email}:`, err);
            }
        })).catch(err => console.error("Error in notice notification broadcast:", err));

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
            orderBy: [
                { isPinned: 'desc' },
                { createdAt: 'desc' }
            ]
        });
        res.json({ success: true, data: announcements });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const updateAnnouncement = async (req, res) => {
    try {
        if (req.user.role !== 'warden') {
            return res.status(403).json({ success: false, message: 'Only wardens can edit announcements' });
        }
        const { title, content, category } = req.body;
        const announcementId = req.params.id;

        const announcement = await prisma.announcement.findUnique({
            where: { id: announcementId }
        });

        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        if (announcement.createdById !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to edit this announcement' });
        }

        const updatedData = {};
        if (title) updatedData.title = title;
        if (content) updatedData.content = content;
        if (category) updatedData.category = category;

        const updatedAnnouncement = await prisma.announcement.update({
            where: { id: announcementId },
            data: updatedData
        });

        res.json({ success: true, message: 'Announcement updated successfully', data: updatedAnnouncement });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

export const togglePinAnnouncement = async (req, res) => {
    try {
        if (req.user.role !== 'warden') {
            return res.status(403).json({ success: false, message: 'Only wardens can pin announcements' });
        }
        const announcementId = req.params.id;

        const announcement = await prisma.announcement.findUnique({
            where: { id: announcementId }
        });

        if (!announcement) {
            return res.status(404).json({ success: false, message: 'Announcement not found' });
        }

        const updatedAnnouncement = await prisma.announcement.update({
            where: { id: announcementId },
            data: { isPinned: !announcement.isPinned }
        });

        res.json({ 
            success: true, 
            message: updatedAnnouncement.isPinned ? 'Notice pinned successfully' : 'Notice unpinned successfully',
            data: updatedAnnouncement 
        });
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
