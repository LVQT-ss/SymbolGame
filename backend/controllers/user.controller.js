// src/controller/user.controller.js
import User from '../model/user.model.js';
import UserStatistics from '../model/user-statistics.model.js';
import jwt from 'jsonwebtoken';
import process from 'process';
import 'dotenv/config'
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const DAILY_BONUS_COINS = 50;

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/profile-pictures';
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image.'), false);
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            include: [
                {
                    model: UserStatistics,
                    as: 'statistics'
                }
            ],
            attributes: { exclude: ['password'] }, // Exclude password from response
            order: [['id', 'ASC']] // Order by ID for consistent results
        });

        res.status(200).json({
            message: 'Users retrieved successfully',
            count: users.length,
            users: users
        });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

export const getUserById = async (req, res) => {
    const { id } = req.params;

    // Validate ID is a number
    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ message: "Valid user ID is required" });
    }

    try {
        const user = await User.findByPk(parseInt(id), {
            include: [
                {
                    model: UserStatistics,
                    as: 'statistics'
                }
            ],
            attributes: { exclude: ['password'] } // Exclude password from response
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

export const updateUser = async (req, res) => {
    const { userId } = req.params;
    const { full_name, avatar, email, age } = req.body;

    // Validate user ID is a number
    if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({ message: 'Valid user ID is required' });
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    // Validate age format if provided
    if (age && isNaN(Date.parse(age))) {
        return res.status(400).json({ message: 'Invalid age format. Use YYYY-MM-DD' });
    }

    try {
        const user = await User.findByPk(parseInt(userId));

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update user with new model fields
        await user.update({
            full_name: full_name !== undefined ? full_name : user.full_name,
            avatar: avatar !== undefined ? avatar : user.avatar,
            email: email !== undefined ? email : user.email,
            age: age ? new Date(age) : user.age
        });

        // Fetch updated user with statistics
        const updatedUser = await User.findByPk(parseInt(userId), {
            include: [
                {
                    model: UserStatistics,
                    as: 'statistics'
                }
            ],
            attributes: { exclude: ['password'] }
        });

        res.status(200).json({
            message: 'User updated successfully',
            user: updatedUser
        });
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ message: 'Email already exists' });
        }
        console.error('Error updating user:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

export const deleteUser = async (req, res) => {
    const { userId } = req.params;

    // Validate user ID is a number
    if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({ message: 'Valid user ID is required' });
    }

    try {
        const user = await User.findByPk(parseInt(userId));

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the user type is Admin
        if (user.usertype === 'Admin') {
            return res.status(403).json({ message: 'Admin users cannot be deleted' });
        }

        await user.destroy();
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

export const getAllCustomer = async (req, res) => {
    try {
        const customerUsers = await User.findAll({
            where: { usertype: 'Customer' },
            include: [
                {
                    model: UserStatistics,
                    as: 'statistics'
                }
            ],
            attributes: { exclude: ['password'] }, // Exclude password from response
            order: [['current_level', 'DESC'], ['experience_points', 'DESC']] // Order by level and XP
        });

        if (customerUsers.length === 0) {
            return res.status(404).json({ message: 'No customer users found' });
        }

        res.status(200).json({
            message: 'Customer users retrieved successfully',
            count: customerUsers.length,
            users: customerUsers
        });
    } catch (error) {
        console.error('Error fetching customer users:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const logout = async (req, res) => {
    try {
        // Get the token from the authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(400).json({ message: 'No token provided' });
        }

        // Verify the token is valid before proceeding with logout
        try {
            jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        res.status(200).json({
            message: 'Logged out successfully',
            success: true
        });

    } catch (err) {
        console.error('Logout error:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

export const claimDailyBonus = async (req, res) => {
    const userId = req.userId;
    try {
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const now = new Date();
        const lastClaim = user.last_daily_bonus;
        let canClaim = false;
        if (!lastClaim) {
            canClaim = true;
        } else {
            const last = new Date(lastClaim);
            const diffMs = now.getTime() - last.getTime();
            if (diffMs >= 24 * 60 * 60 * 1000) {
                canClaim = true;
            }
        }
        if (canClaim) {
            user.coins += DAILY_BONUS_COINS;
            user.last_daily_bonus = now;
            await user.save();
            return res.status(200).json({
                message: 'Daily bonus claimed!',
                coins: user.coins,
                last_daily_bonus: user.last_daily_bonus,
                bonus: DAILY_BONUS_COINS
            });
        } else {
            const last = new Date(lastClaim);
            const nextClaim = new Date(last.getTime() + 24 * 60 * 60 * 1000);
            const msLeft = nextClaim.getTime() - now.getTime();
            return res.status(400).json({
                message: 'Daily bonus already claimed. Try again later.',
                time_left_ms: msLeft,
                next_claim_time: nextClaim
            });
        }
    } catch (err) {
        console.error('Error in claimDailyBonus:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

export const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file provided' });
        }

        // Get the file path
        const filePath = req.file.path;

        // Convert file path to URL
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const imageUrl = `${baseUrl}/${filePath.replace(/\\/g, '/')}`;

        res.status(200).json({
            message: 'Profile picture uploaded successfully',
            imageUrl: imageUrl
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        // Delete uploaded file if there's an error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            message: 'Error uploading profile picture',
            error: error.message
        });
    }
};