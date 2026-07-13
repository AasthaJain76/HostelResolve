import prisma from '../DB/db.config.js';
import bcrypt from 'bcrypt';
import { logComplaintHistory } from './complaintController.js';
import { sendEmail } from '../utils/sendEmail.js';

// 1. Create Warden Account (Admin Only)
export const createWarden = async (req, res) => {
    try {
        const { name, email, password, hostel, phone, room } = req.body;

        if (!name || !email || !password || !hostel) {
            return res.status(400).json({ success: false, message: 'Required fields are missing' });
        }

        // Check if email already exists
        const userExists = await prisma.user.findUnique({ where: { email } });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Save Warden in database
        const warden = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'warden',
                hostel,
                phone,
                room: room || 'Warden Office'
            }
        });

        res.status(201).json({ success: true, message: 'Warden account created successfully', data: { id: warden.id, name: warden.name, email: warden.email } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. Get Admin Dashboard Statistics
export const getAdminStats = async (req, res) => {
    try {
        const totalStudents = await prisma.user.count({ where: { role: 'student' } });
        const totalWardens = await prisma.user.count({ where: { role: 'warden' } });
        const totalComplaints = await prisma.complaint.count();
        const totalEscalated = await prisma.complaint.count({ where: { isEscalated: true } });

        // Hostel-wise complaints comparison
        const hostelStats = await prisma.complaint.groupBy({
            by: ['hostel'],
            _count: { id: true }
        });

        res.json({
            success: true,
            data: { totalStudents, totalWardens, totalComplaints, totalEscalated, hostelStats }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 3. Get all Escalated Complaints
export const getEscalatedComplaints = async (req, res) => {
    try {
        const complaints = await prisma.complaint.findMany({
            where: { isEscalated: true },
            include: {
                createdBy: { select: { name: true, room: true, hostel: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: complaints });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 4. Resolve Escalated Complaint Directly (Admin Override)
export const resolveEscalatedComplaint = async (req, res) => {
    try {
        const complaintId = req.params.id;

        const complaint = await prisma.complaint.findUnique({
            where: { id: complaintId },
            include: { createdBy: true }
        });

        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint not found' });
        }

        const updatedComplaint = await prisma.complaint.update({
            where: { id: complaintId },
            data: {
                status: 'RESOLVED',
                isEscalated: false // Unflag escalation once resolved
            }
        });

        // Log history of Admin Resolution
        const adminUser = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { name: true }
        });

        await logComplaintHistory(
            complaintId,
            'RESOLVED',
            `Complaint resolved directly by Admin`,
            adminUser?.name || 'Admin'
        );

        // Send Email notification to student in the background
        if (complaint.createdBy && complaint.createdBy.email) {
            const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
            const complaintLink = `${clientUrl}/complaint/${complaintId}`;

            sendEmail(
                complaint.createdBy.email,
                `Escalated Complaint Resolved by Admin`,
                `
                <h2>Escalated Complaint Resolved</h2>
                <p>Hello ${complaint.createdBy.name},</p>
                <p>Your escalated complaint "<b>${complaint.title}</b>" has been reviewed and resolved directly by the Admin.</p>
                <br/>
                <a href="${complaintLink}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #10b981; text-decoration: none; border-radius: 6px; font-weight: bold;">View Details</a>
                `
            ).catch(err => console.error("Failed to send Admin resolution email in background:", err));
        }

        res.json({ success: true, message: 'Complaint resolved by Admin successfully', data: updatedComplaint });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};