import prisma from '../DB/db.config.js';
import { sendEmail } from '../utils/sendEmail.js';
import { createNotificationHelper } from './notificationController.js';

// 1. Apply for Leave (Student Only)
export const applyLeave = async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ success: false, message: 'Only students can apply for leave' });
        }

        const { startDate, endDate, reason } = req.body;

        if (!startDate || !endDate || !reason) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Date Validation (Simple & Crucial)
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (start >= end) {
            return res.status(400).json({ success: false, message: 'Start date must be before end date' });
        }

        // Fetch student's hostel info
        const student = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        // Create the leave request
        const leaveRequest = await prisma.leaveRequest.create({
            data: {
                studentId: req.user.id,
                startDate: start,
                endDate: end,
                reason,
                status: 'PENDING'
            }
        });

        // NOTIFICATION: Find and notify wardens of this student's hostel
        const wardens = await prisma.user.findMany({
            where: { role: 'warden', hostel: student.hostel }
        });

        res.status(201).json({ success: true, message: 'Leave request submitted successfully', data: leaveRequest });

        // Dispatch notifications in the background
        Promise.all(wardens.map(async (warden) => {
            try {
                // In-app notification
                await createNotificationHelper(
                    warden.id,
                    req.user.id,
                    'status_change',
                    null,
                    `New leave request from ${student.name} (Room ${student.room})`
                );

                // Email Notification
                if (warden.email) {
                    await sendEmail(
                        warden.email,
                        `New Leave Request: ${student.name}`,
                        `
                        <h2>New Leave Request Submitted</h2>
                        <p><b>Student:</b> ${student.name} (Room ${student.room})</p>
                        <p><b>Duration:</b> ${start.toLocaleDateString()} to ${end.toLocaleDateString()}</p>
                        <p><b>Reason:</b> ${reason}</p>
                        <br/>
                        <p>Log in to ResolveHub to approve or reject this request.</p>
                        `
                    );
                }
            } catch (err) {
                console.error("Failed to send warden notification in background:", err);
            }
        })).catch(err => console.error("Error in background leave apply notifications:", err));
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. Fetch Leave Requests (Role-Based Visibility)
export const getLeaves = async (req, res) => {
    try {
        const currentUser = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        let leaves;

        if (currentUser.role === 'student') {
            // Students only see their own leaves
            leaves = await prisma.leaveRequest.findMany({
                where: { studentId: currentUser.id },
                orderBy: { createdAt: 'desc' }
            });
        } else if (currentUser.role === 'warden') {
            // Wardens see leaves of students in their hostel
            leaves = await prisma.leaveRequest.findMany({
                where: {
                    student: {
                        hostel: currentUser.hostel
                    }
                },
                include: {
                    student: { select: { name: true, room: true, hostel: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
        } else {
            // Admin sees all leaves
            leaves = await prisma.leaveRequest.findMany({
                include: {
                    student: { select: { name: true, room: true, hostel: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
        }

        res.json({ success: true, data: leaves });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 3. Approve or Reject Leave Request (Warden Only)
export const updateLeaveStatus = async (req, res) => {
    try {
        if (req.user.role !== 'warden') {
            return res.status(403).json({ success: false, message: 'Only wardens can approve/reject leaves' });
        }

        const { status, remarks } = req.body;
        const leaveId = req.params.id;

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status update' });
        }

        // Fetch the leave request first
        const leaveRequest = await prisma.leaveRequest.findUnique({
            where: { id: leaveId },
            include: { student: true }
        });

        if (!leaveRequest) {
            return res.status(404).json({ success: false, message: 'Leave request not found' });
        }

        // Security check: Warden can only approve leaves of their own hostel
        const warden = await prisma.user.findUnique({
            where: { id: req.user.id }
        });
        if (leaveRequest.student.hostel !== warden.hostel) {
            return res.status(403).json({ success: false, message: 'Not authorized to manage leaves for this hostel' });
        }

        // Update request
        const updatedLeave = await prisma.leaveRequest.update({
            where: { id: leaveId },
            data: {
                status,
                remarks,
                approvedById: warden.id
            }
        });

        res.json({ success: true, message: `Leave request ${status.toLowerCase()} successfully`, data: updatedLeave });

        // Dispatch notifications to the student in the background
        (async () => {
            try {
                // In-app notification
                await createNotificationHelper(
                    leaveRequest.studentId,
                    warden.id,
                    'status_change',
                    null,
                    `Your leave request has been ${status.toLowerCase()} by the Warden.`
                );

                // Email Notification
                if (leaveRequest.student.email) {
                    await sendEmail(
                        leaveRequest.student.email,
                        `Leave Request ${status}`,
                        `
                        <h2>Leave Request Update</h2>
                        <p>Hello ${leaveRequest.student.name},</p>
                        <p>Your leave request from <b>${new Date(leaveRequest.startDate).toLocaleDateString()}</b> to <b>${new Date(leaveRequest.endDate).toLocaleDateString()}</b> has been <b>${status}</b>.</p>
                        ${remarks ? `<p><b>Warden Remarks:</b> ${remarks}</p>` : ''}
                        `
                    );
                }
            } catch (err) {
                console.error("Failed to notify student of leave status in background:", err);
            }
        })();
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};