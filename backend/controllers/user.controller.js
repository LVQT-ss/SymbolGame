// src/controller/user.controller.js
import User from '../model/user.model.js';
import jwt from 'jsonwebtoken';
import process from 'process';
import 'dotenv/config'

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).send(err.message);
    }
};

export const getUserById = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ message: "User ID is required" });
    }

    try {
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (err) {
        console.error('Error fetching user:', err);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateUser = async (req, res) => {
    const { userId } = req.params;
    const { userAddress, userPhoneNumber, email, image } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await user.update({
            userAddress,
            userPhoneNumber,
            email,
            image
        });

        res.json({ message: 'User updated successfully' });
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).send('Server error');
    }
};


export const deleteUser = async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required' });
    }

    try {
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the user type is Admin
        if (user.usertype === 'Admin') {
            return res.status(403).json({ message: 'Admin users cannot be deleted' });
        }

        await user.destroy();
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        res.status(500).send('Server error');
    }
};





export const getAllCustomer = async (req, res) => {
    try {
        const customerUsers = await User.findAll({
            where: { usertype: 'Customer' },
        });

        if (customerUsers.length === 0) {
            return res.status(404).json({ message: 'No customer users found' });
        }

        res.status(200).json(customerUsers);
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