import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import prisma from '../DB/db.config.js'
import rateLimit from "express-rate-limit";
import { sendEmail } from '../utils/sendEmail.js';

// Signup controller
export const signup = async (req, res) => {
    try {
        const { name, email, password, role, hostel, room, phone } = req.body;

        // Check if user exists by email
        const userExists = await prisma.user.findUnique({
            where: { email }
        });

        if (userExists) {
            return res.status(400).json({
                success: false,
                message: "User already exists",
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create user in DB
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || "student",
                hostel,
                room,
                phone
            }
        });

        console.log("User registered successfully");

        // Generate tokens
        const accessToken = generateAccessToken(newUser.id, newUser.role);
        const refreshToken = generateRefreshToken(newUser.id, newUser.role);

        // Remove password from user object before sending as response
        const { password: _, ...userResponse } = newUser;

        // Set refreshToken as httpOnly cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(201).json({
            success: true,
            user: userResponse,
            accessToken,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Login controller
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }
        
        // Generate tokens
        const accessToken = generateAccessToken(user.id, user.role);
        const refreshToken = generateRefreshToken(user.id, user.role);

        // --- DIAGNOSTIC LOGS ---
        console.log("=== LOGIN DEBUG ===");
        console.log("Access Token Length:", accessToken ? accessToken.length : "UNDEFINED");
        console.log("Refresh Token Length:", refreshToken ? refreshToken.length : "UNDEFINED");
        console.log("NODE_ENV value:", process.env.NODE_ENV);
        console.log("====================");
        // Remove password before sending user object in response
        const { password: _, ...userResponse } = user;

        // Set refreshToken as httpOnly cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            user: userResponse,
            accessToken,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// Login rate limiter
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many login attempts. Try again after 15 minutes."
    }
});

// Get user profile
export const getProfile = async (req, res) => {
    try {
        const userId = req.params.id || req.user.id;
        const user = await prisma.user.findUnique({
            where: {
                id: userId // Prisma user.id is a string (uuid)
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const { password: _, ...userResponse } = user;

        res.status(200).json({
            success: true,
            data: userResponse,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Update user profile
export const updateProfile = async (req, res) => {
    try {
        const userId = req.params.id || req.user.id;
        const { name, email, phone, hostel, room } = req.body;

        const updatedUser = await prisma.user.update({
            where: {
                id: userId // Prisma user.id is a string (uuid)
            },
            data: {
                name,
                email,
                phone,
                hostel,
                room
            }
        });

        const { password: _, ...userResponse } = updatedUser;
        
        res.status(200).json({
            success: true,
            message: "User updated successfully",
            user: userResponse
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// Forgot Password & Reset Password controllers
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "No account found with this email address"
            });
        }

        // Generate a signed password reset token valid for 15 minutes
        const resetToken = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15m' }
        );

        const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
        const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;

        // Send Email asynchronously in the background
        sendEmail(
            user.email,
            "Password Reset Request",
            `
            <h2>Password Reset Request</h2>
            <p>Hello ${user.name},</p>
            <p>We received a request to reset your password. Click the link below to set a new password. This link is only valid for 15 minutes:</p>
            <br/>
            <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; color: white; background-color: #ef4444; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
            <br/><br/>
            <p>If you did not request a password reset, please ignore this email.</p>
            `
        ).catch(err => console.error("Failed to send reset email in background:", err));

        return res.status(200).json({
            success: true,
            message: "Password reset link has been sent to your email"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: "Reset token is required"
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || process.env.ACCESS_TOKEN_SECRET);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: "The reset link is invalid or has expired"
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: decoded.id },
            data: { password: hashedPassword }
        });

        return res.status(200).json({
            success: true,
            message: "Password has been reset successfully. You can now log in with your new password."
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get all users
export const getUsers = async (req, res) => {
    try {
        const users = await prisma.user.findMany({});
        const usersWithoutPasswords = users.map(({ password, ...rest }) => rest);
        res.status(200).json({
            success: true,
            data: usersWithoutPasswords,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

// Refresh access token controller
export const refreshAccessToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token missing"
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(
                refreshToken,
                process.env.REFRESH_TOKEN_SECRET,
            );
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired refresh token",
            });
        }

        // Find user by id from token
        const user = await prisma.user.findUnique({
            where: { id: decoded.id }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        // (Optional: If you store the refreshToken in db, compare it here)

        // Generate new access token
        const accessToken = generateAccessToken(user.id, user.role);

        return res.status(200).json({
            success: true,
            accessToken,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Logout
export const logout = async (req, res) => {
    // Optionally: Invalidate refresh token here in DB (if storing it)
    res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({
        success: true,
        message: "Logged out successfully"
    });
// Change user password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: "Incorrect current password"
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Save new password
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        return res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Helper functions for generating tokens
const generateAccessToken = (id, role) => {
    return jwt.sign(
        { id, role },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" },
    );
};

const generateRefreshToken = (id, role) => {
    return jwt.sign(
        { id, role },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" },
    );
};

