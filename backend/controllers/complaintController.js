import prisma from '../DB/db.config.js';
import { createNotificationHelper } from './notificationController.js';
import {sendEmail} from '../utils/sendEmail.js'

// Helper to log audit trail events
const logComplaintHistory = async (complaintId, action, details, performedBy) => {
    try {
        await prisma.complaintHistory.create({
            data: {
                complaintId,
                action,
                details,
                performedBy
            }
        });
    } catch (err) {
        console.error("Failed to write to audit trail:", err);
    }
};
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

        // Fetch student's email and name from DB using req.user.id
        const student = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        // Log history
        if (student) {
            await logComplaintHistory(
                complaint.id,
                'CREATED',
                `Complaint raised with priority "${priority || 'MEDIUM'}"`,
                student.name
            );
        }

        if (student && student.email) {
            const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
            const complaintLink = `${clientUrl}/complaint/${complaint.id}`;

            sendEmail(
                student.email,
                "Complaint Submitted",
                `
                <h2>Complaint Submitted Successfully</h2>
                <p>Hello ${student.name},</p>
                <p>Your complaint has been registered.</p>
                <p><b>Title:</b> ${complaint.title}</p>
                <p><b>Status:</b> Pending</p>
                <br/>
                <a href="${complaintLink}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #4f46e5; text-decoration: none; border-radius: 6px; font-weight: bold;">View Complaint Status</a>
                `
            ).catch(err => console.error("Error sending complaint confirmation email in background:", err));
        }
        res.status(201).json({
            success: true,
            data: complaint,
        });

        // Notify wardens and student in the background
        (async () => {
            try {
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

                await createNotificationHelper(
                    req.user.id,
                    req.user.id,
                    'complaint_created',
                    complaint.id,
                    `Your complaint "${title}" has been successfully submitted.`
                );
            } catch (err) {
                console.error("Failed to notify in background of new complaint:", err);
            }
        })();
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
                feedback: true,
                history: {
                    orderBy: { createdAt: 'asc' }
                }
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
            where: { id: req.params.id },
            include: {
                createdBy: true,
            },
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

            // Log history
            if (status && status !== complaint.status) {
                await logComplaintHistory(
                    complaint.id,
                    'STATUS_CHANGE',
                    `Status updated from ${complaint.status} to ${status}`,
                    currentUser.name
                );
            }

            // Notify student
            if (status) {
                // Dispatch notification & email in the background
                (async () => {
                    try {
                        await createNotificationHelper(
                            complaint.createdById,
                            currentUser.id,
                            'status_change',
                            complaint.id,
                            `Your complaint "${complaint.title}" is now marked as ${status}.`
                        );

                        if (complaint.createdBy && complaint.createdBy.email) {
                            const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
                            const complaintLink = `${clientUrl}/complaint/${complaint.id}`;

                            await sendEmail(
                                complaint.createdBy.email,
                                `Complaint Status Updated: ${status}`,
                                `
                                <h2>Complaint Status Updated</h2>
                                <p>Hello ${complaint.createdBy.name},</p>
                                <p>The status of your complaint "<b>${complaint.title}</b>" has been updated to <b>${status}</b>.</p>
                                <br/>
                                <a href="${complaintLink}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #10b981; text-decoration: none; border-radius: 6px; font-weight: bold;">View Details</a>
                                `
                            );
                        }
                    } catch (err) {
                        console.error("Failed to notify student of status update in background:", err);
                    }
                })();
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

            // Log history
            let changeDetails = [];
            if (title && title !== complaint.title) changeDetails.push('title');
            if (description && description !== complaint.description) changeDetails.push('description');
            if (category && category !== complaint.category) changeDetails.push('category');
            if (priority && priority !== complaint.priority) changeDetails.push('priority');

            if (changeDetails.length > 0) {
                await logComplaintHistory(
                    complaint.id,
                    'TICKET_UPDATED',
                    `Updated: ${changeDetails.join(', ')}`,
                    currentUser.name
                );
            }

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
// @desc    Get complaint stats
// @route   GET /api/complaints/stats
// @access  Private
export const getComplaintStats = async (req, res) => {
    try {
        const { role, id } = req.user;

        if (role === 'student') {
            const complaintStats = await prisma.complaint.groupBy({
                by: ['status'],
                where: { createdById: id },
                _count: { id: true }
            });

            const totalLeaves = await prisma.leaveRequest.count({
                where: { studentId: id }
            });

            const stats = {
                totalComplaints: 0,
                pendingComplaints: 0,
                resolvedComplaints: 0,
                totalLeaves
            };

            complaintStats.forEach(item => {
                const count = item._count.id;
                stats.totalComplaints += count;
                if (item.status === 'PENDING') stats.pendingComplaints += count;
                if (item.status === 'RESOLVED') stats.resolvedComplaints += count;
            });

            return res.json({ success: true, data: stats });

        } else if (role === 'warden') {
            const warden = await prisma.user.findUnique({
                where: { id }
            });

            const statusStats = await prisma.complaint.groupBy({
                by: ['status'],
                where: { hostel: warden.hostel },
                _count: { id: true }
            });

            const categoryStats = await prisma.complaint.groupBy({
                by: ['category'],
                where: { hostel: warden.hostel },
                _count: { id: true }
            });

            const priorityStats = await prisma.complaint.groupBy({
                by: ['priority'],
                where: { hostel: warden.hostel },
                _count: { id: true }
            });

            const stats = {
                total: 0,
                pending: 0,
                inProgress: 0,
                resolved: 0,
                rejected: 0,
                categories: {},
                priorities: {}
            };

            statusStats.forEach(item => {
                const count = item._count.id;
                stats.total += count;
                if (item.status === 'PENDING') stats.pending = count;
                if (item.status === 'IN_PROGRESS') stats.inProgress = count;
                if (item.status === 'RESOLVED') stats.resolved = count;
                if (item.status === 'REJECTED') stats.rejected = count;
            });

            categoryStats.forEach(item => {
                stats.categories[item.category] = item._count.id;
            });

            priorityStats.forEach(item => {
                stats.priorities[item.priority] = item._count.id;
            });

            return res.json({ success: true, data: stats });
        }

        res.status(400).json({ success: false, message: 'Invalid role for statistics' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Escalate complaint
// @route   POST /api/complaints/:id/escalate
// @access  Private (Student only)
export const escalateComplaint = async (req, res) => {
    try {
        const { id } = req.params;

        const complaint = await prisma.complaint.findUnique({
            where: { id },
            include: { createdBy: true }
        });

        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        if (complaint.createdById !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to escalate this complaint' });
        }

        const updatedComplaint = await prisma.complaint.update({
            where: { id },
            data: { isEscalated: true }
        });

        // Log history
        await logComplaintHistory(
            id,
            'ESCALATED',
            `Complaint escalated to Admin due to lack of resolution`,
            complaint.createdBy.name
        );

        // Notify admins in-app and by email
        const admins = await prisma.user.findMany({ where: { role: 'admin' } });
        
        Promise.all(admins.map(async (admin) => {
            try {
                await createNotificationHelper(
                    admin.id,
                    req.user.id,
                    'status_change',
                    complaint.id,
                    `Complaint "${complaint.title}" has been escalated by ${complaint.createdBy.name}`
                );

                if (admin.email) {
                    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
                    const link = `${clientUrl}/complaint/${complaint.id}`;
                    await sendEmail(
                        admin.email,
                        `Complaint Escalation Alert: ${complaint.title}`,
                        `
                        <h2>Complaint Escalated</h2>
                        <p><b>Complaint:</b> ${complaint.title}</p>
                        <p><b>Raised By:</b> ${complaint.createdBy.name} (Room ${complaint.createdBy.room})</p>
                        <p><b>Hostel:</b> ${complaint.hostel}</p>
                        <br/>
                        <a href="${link}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #ef4444; text-decoration: none; border-radius: 6px; font-weight: bold;">View Details</a>
                        `
                    );
                }
            } catch (err) {
                console.error("Failed to notify admin of escalation in background:", err);
            }
        })).catch(err => console.error("Error in background admin escalation notifications:", err));

        res.json({ success: true, message: 'Complaint escalated to Admin successfully', data: updatedComplaint });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
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

        // Log history
        await logComplaintHistory(
            complaint.id,
            'COMMENT_ADDED',
            `Added comment: "${text.length > 30 ? text.substring(0, 30) + '...' : text}"`,
            comment.user.name
        );

        res.status(201).json({
            success: true,
            data: comment
        });

        // Notify other party in the background
        (async () => {
            try {
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
            } catch (err) {
                console.error("Failed to notify in background of new comment:", err);
            }
        })();
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

        // Log history
        const student = await prisma.user.findUnique({ where: { id: req.user.id } });
        await logComplaintHistory(
            complaint.id,
            'FEEDBACK_SUBMITTED',
            `Feedback submitted. Rating: ${rating}/5. Comment: "${comment || 'None'}"`,
            student.name
        );

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
