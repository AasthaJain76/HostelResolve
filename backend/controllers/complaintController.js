import prisma from '../DB/db.config.js';
import { createNotificationHelper } from './notificationController.js';

// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Private (Student only)
export const createComplaint = async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Only students are authorized to create complaints',
            });
        }

        const { title, description, category, priority, hostel, room } = req.body;

        // Prevent duplicate submissions - check if same complaint was created within last 5 seconds
        const recentComplaint = await prisma.complaint.findFirst({
            where: {
                createdById: req.user.id,
                title: title,
                createdAt: {
                    gte: new Date(Date.now() - 5000)
                }
            }
        });

        if (recentComplaint) {
            return res.status(429).json({
                success: false,
                message: 'Duplicate submission detected. Please wait before submitting again.',
                data: recentComplaint
            });
        }

        // Map files
        const images = req.files ? req.files.map(file => 'uploads/' + file.filename) : [];

        const complaint = await prisma.complaint.create({
            data: {
                title,
                description,
                category,
                priority: priority || 'MEDIUM',
                status: 'PENDING',
                hostel,
                room,
                images,
                createdById: req.user.id
            }
        });

        // Notify wardens of this hostel
        const wardens = await prisma.user.findMany({
            where: {
                role: 'warden',
                hostel: hostel
            }
        });

        for (const warden of wardens) {
            await createNotificationHelper(
                warden.id,
                req.user.id,
                'complaint_created',
                complaint.id,
                `New complaint raised: "${title}" in Room ${room}`
            );
        }

        // Notify student themselves
        await createNotificationHelper(
            req.user.id,
            req.user.id,
            'complaint_created',
            complaint.id,
            `Your complaint "${title}" has been successfully submitted.`
        );

        res.status(201).json({
            success: true,
            data: complaint,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get complaints
// @route   GET /api/complaints
// @access  Private
export const getComplaints = async (req, res) => {
    try {
        const { status, category, priority, search } = req.query;
        
        // Fetch current user details
        const currentUser = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        let whereClause = {};

        // Role-based visibility
        if (currentUser.role === 'student') {
            whereClause.createdById = currentUser.id;
        } else if (currentUser.role === 'warden') {
            whereClause.hostel = currentUser.hostel;
        }

        // Filters
        if (status) whereClause.status = status;
        if (category) whereClause.category = category;
        if (priority) whereClause.priority = priority;

        // Search
        if (search) {
            whereClause.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        const complaints = await prisma.complaint.findMany({
            where: whereClause,
            include: {
                createdBy: {
                    select: { name: true, email: true, hostel: true, room: true }
                },
                feedback: true,
                _count: {
                    select: { comments: true }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            success: true,
            data: complaints
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get single complaint
// @route   GET /api/complaints/:id
// @access  Private
export const getComplaintById = async (req, res) => {
    try {
        const complaint = await prisma.complaint.findUnique({
            where: { id: req.params.id },
            include: {
                createdBy: {
                    select: { name: true, email: true, hostel: true, room: true, phone: true, role: true }
                },
                comments: {
                    include: {
                        user: { select: { name: true, role: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                },
                feedback: true
            }
        });

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found',
            });
        }

        // Access check
        const currentUser = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        if (currentUser.role === 'student' && complaint.createdById !== currentUser.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this complaint'
            });
        }

        if (currentUser.role === 'warden' && complaint.hostel !== currentUser.hostel) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Warden can only view complaints of their own hostel'
            });
        }

        res.json({
            success: true,
            data: complaint,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Update complaint
// @route   PUT /api/complaints/:id
// @access  Private
export const updateComplaint = async (req, res) => {
    try {
        const complaint = await prisma.complaint.findUnique({
            where: { id: req.params.id }
        });

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        const currentUser = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        let updatedData = {};

        if (currentUser.role === 'warden') {
            // Warden can update status and upload resolving images
            const { status } = req.body;
            if (status) {
                updatedData.status = status;
            }

            // Check files for resolvedImages
            if (req.files && req.files.resolvedImages) {
                updatedData.resolvedImages = req.files.resolvedImages.map(file => 'uploads/' + file.filename);
            }

            const updatedComplaint = await prisma.complaint.update({
                where: { id: req.params.id },
                data: updatedData
            });

            // Notify student
            if (status) {
                await createNotificationHelper(
                    complaint.createdById,
                    currentUser.id,
                    'status_change',
                    complaint.id,
                    `Your complaint "${complaint.title}" is now marked as ${status}.`
                );
            }

            return res.json({
                success: true,
                message: 'Complaint updated by Warden',
                data: updatedComplaint
            });

        } else {
            // Student updates description/title
            if (complaint.createdById !== currentUser.id) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to modify this complaint'
                });
            }

            const { title, description, category, priority } = req.body;
            if (title) updatedData.title = title;
            if (description) updatedData.description = description;
            if (category) updatedData.category = category;
            if (priority) updatedData.priority = priority;

            const updatedComplaint = await prisma.complaint.update({
                where: { id: req.params.id },
                data: updatedData
            });

            return res.json({
                success: true,
                message: 'Complaint updated by Student',
                data: updatedComplaint
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// @desc    Get complaint stats
// @route   GET /api/complaints/stats
// @access  Private (Warden only)
export const getComplaintStats = async (req, res) => {
    try {
        if (req.user.role !== 'warden') {
            return res.status(403).json({
                success: false,
                message: 'Only wardens can view statistics'
            });
        }

        const warden = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        // Fetch counts
        const allComplaints = await prisma.complaint.findMany({
            where: { hostel: warden.hostel }
        });

        const stats = {
            total: allComplaints.length,
            pending: allComplaints.filter(c => c.status === 'PENDING').length,
            inProgress: allComplaints.filter(c => c.status === 'IN_PROGRESS').length,
            resolved: allComplaints.filter(c => c.status === 'RESOLVED').length,
            rejected: allComplaints.filter(c => c.status === 'REJECTED').length,
            categories: {},
            priorities: {}
        };

        allComplaints.forEach(c => {
            stats.categories[c.category] = (stats.categories[c.category] || 0) + 1;
            stats.priorities[c.priority] = (stats.priorities[c.priority] || 0) + 1;
        });

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Add comment
// @route   POST /api/complaints/:id/comments
// @access  Private
export const addComment = async (req, res) => {
    try {
        const { text } = req.body;
        const complaint = await prisma.complaint.findUnique({
            where: { id: req.params.id }
        });

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        const comment = await prisma.comment.create({
            data: {
                text,
                complaintId: req.params.id,
                userId: req.user.id
            },
            include: {
                user: { select: { name: true, role: true } }
            }
        });

        // Notify other party
        if (req.user.role === 'student') {
            // Notify wardens
            const wardens = await prisma.user.findMany({
                where: { role: 'warden', hostel: complaint.hostel }
            });
            for (const warden of wardens) {
                await createNotificationHelper(
                    warden.id,
                    req.user.id,
                    'new_comment',
                    complaint.id,
                    `New comment on "${complaint.title}" from student`
                );
            }
        } else {
            // Notify student
            await createNotificationHelper(
                complaint.createdById,
                req.user.id,
                'new_comment',
                complaint.id,
                `Warden commented on your complaint: "${complaint.title}"`
            );
        }

        res.status(201).json({
            success: true,
            data: comment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Edit comment
// @route   PUT /api/complaints/:id/comments/:commentId
// @access  Private
export const editComment = async (req, res) => {
    try {
        const comment = await prisma.comment.findUnique({
            where: { id: req.params.commentId }
        });

        if (!comment || comment.complaintId !== req.params.id) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        if (comment.userId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to edit this comment'
            });
        }

        const updatedComment = await prisma.comment.update({
            where: { id: req.params.commentId },
            data: { text: req.body.text },
            include: { user: { select: { name: true, role: true } } }
        });

        res.json({
            success: true,
            data: updatedComment
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete comment
// @route   DELETE /api/complaints/:id/comments/:commentId
// @access  Private
export const deleteComment = async (req, res) => {
    try {
        const comment = await prisma.comment.findUnique({
            where: { id: req.params.commentId }
        });

        if (!comment || comment.complaintId !== req.params.id) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        if (comment.userId !== req.user.id && req.user.role !== 'warden') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to delete this comment'
            });
        }

        await prisma.comment.delete({
            where: { id: req.params.commentId }
        });

        res.json({
            success: true,
            message: 'Comment deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Upvote complaint (Schema-free / Mock success)
// @route   POST /api/complaints/:id/upvote
// @access  Private
export const upvoteComplaint = async (req, res) => {
    // Return a mock success response to avoid breaking routes
    res.json({
        success: true,
        message: 'Complaint upvoted successfully (mocked)'
    });
};

// @desc    Delete complaint
// @route   DELETE /api/complaints/:id
// @access  Private (Warden only)
export const deleteComplaint = async (req, res) => {
    try {
        if (req.user.role !== 'warden') {
            return res.status(403).json({
                success: false,
                message: 'Only wardens can delete complaints'
            });
        }

        await prisma.complaint.delete({
            where: { id: req.params.id }
        });

        res.json({
            success: true,
            message: 'Complaint deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Submit feedback
// @route   POST /api/complaints/:id/feedback
// @access  Private (Student only)
export const submitFeedback = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const complaint = await prisma.complaint.findUnique({
            where: { id: req.params.id }
        });

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        if (complaint.createdById !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only the creator of the complaint can submit feedback'
            });
        }

        const feedback = await prisma.feedback.create({
            data: {
                rating,
                comment,
                complaintId: req.params.id
            }
        });

        // Automatically resolve / close status if not already
        await prisma.complaint.update({
            where: { id: req.params.id },
            data: { status: 'RESOLVED' }
        });

        // Notify warden
        const wardens = await prisma.user.findMany({
            where: { role: 'warden', hostel: complaint.hostel }
        });
        for (const warden of wardens) {
            await createNotificationHelper(
                warden.id,
                req.user.id,
                'feedback_received',
                complaint.id,
                `Feedback received on resolved complaint: "${complaint.title}" (Rating: ${rating}/5)`
            );
        }

        res.status(201).json({
            success: true,
            data: feedback
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Reopen complaint
// @route   POST /api/complaints/:id/reopen
// @access  Private (Student only)
export const reopenComplaint = async (req, res) => {
    try {
        const { reason } = req.body;
        const complaint = await prisma.complaint.findUnique({
            where: { id: req.params.id }
        });

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: 'Complaint not found'
            });
        }

        if (complaint.createdById !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only the creator can reopen this complaint'
            });
        }

        const updatedComplaint = await prisma.complaint.update({
            where: { id: req.params.id },
            data: { status: 'PENDING' } // Reopens back to PENDING status
        });

        // Add reason as a system-like comment if reason is provided
        if (reason) {
            await prisma.comment.create({
                data: {
                    text: `[SYSTEM: Complaint Reopened] Reason: ${reason}`,
                    complaintId: req.params.id,
                    userId: req.user.id
                }
            });
        }

        // Notify warden
        const wardens = await prisma.user.findMany({
            where: { role: 'warden', hostel: complaint.hostel }
        });
        for (const warden of wardens) {
            await createNotificationHelper(
                warden.id,
                req.user.id,
                'status_change',
                complaint.id,
                `Complaint Reopened: "${complaint.title}"`
            );
        }

        res.json({
            success: true,
            message: 'Complaint reopened successfully',
            data: updatedComplaint
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
