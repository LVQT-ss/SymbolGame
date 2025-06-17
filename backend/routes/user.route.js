// src/routes/user.route.js
import express from 'express';
import {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getAllCustomer,
    logout
} from '../controllers/user.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/user/getalluser:
 *   get:
 *     tags:
 *     - User Controller
 *     summary: Retrieve all users with statistics
 *     description: Get all users in the SmartKid Math Game system with their game statistics
 *     responses:
 *       200:
 *         description: Successfully retrieved users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                     description: Auto-incremented user ID
 *                   username:
 *                     type: string
 *                     example: johndoe
 *                   email:
 *                     type: string
 *                     example: john@example.com
 *                   usertype:
 *                     type: string
 *                     enum: [Admin, Customer]
 *                     example: Customer
 *                   full_name:
 *                     type: string
 *                     example: John Doe
 *                   avatar:
 *                     type: string
 *                     example: https://example.com/avatar.jpg
 *                   coins:
 *                     type: integer
 *                     example: 150
 *                   followers_count:
 *                     type: integer
 *                     example: 10
 *                   following_count:
 *                     type: integer
 *                     example: 5
 *                   experience_points:
 *                     type: integer
 *                     example: 1250
 *                   current_level:
 *                     type: integer
 *                     example: 3
 *                   level_progress:
 *                     type: number
 *                     example: 0.75
 *                   is_active:
 *                     type: boolean
 *                     example: true
 *                   statistics:
 *                     type: object
 *                     properties:
 *                       games_played:
 *                         type: integer
 *                         example: 25
 *                       best_score:
 *                         type: integer
 *                         example: 980
 *                       total_score:
 *                         type: integer
 *                         example: 12500
 *       500:
 *         description: Server error
 */
router.get('/getalluser', getAllUsers);

/**
 * @swagger
 * /api/user/getallcustomer:
 *   get:
 *     tags:
 *     - User Controller
 *     summary: Retrieve all customer users with statistics
 *     description: Get all users with Customer usertype and their game statistics
 *     responses:
 *       200:
 *         description: Successfully retrieved customer users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   username:
 *                     type: string
 *                     example: player123
 *                   email:
 *                     type: string
 *                     example: player@example.com
 *                   usertype:
 *                     type: string
 *                     example: Customer
 *                   full_name:
 *                     type: string
 *                     example: Young Player
 *                   coins:
 *                     type: integer
 *                     example: 200
 *                   current_level:
 *                     type: integer
 *                     example: 5
 *                   experience_points:
 *                     type: integer
 *                     example: 2500
 *                   is_active:
 *                     type: boolean
 *                     example: true
 *                   statistics:
 *                     type: object
 *                     properties:
 *                       games_played:
 *                         type: integer
 *                       best_score:
 *                         type: integer
 *                       total_score:
 *                         type: integer
 *       404:
 *         description: No customer users found
 *       500:
 *         description: Server error
 */
router.get('/getallcustomer', getAllCustomer);

/**
 * @swagger
 * /api/user/update/{userId}:
 *   put:
 *     tags:
 *     - User Controller
 *     summary: Update a user's profile information
 *     description: Update user profile with new personal information for SmartKid Math Game
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to update
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 maxLength: 255
 *                 example: John Updated Doe
 *                 description: User's full name
 *               avatar:
 *                 type: string
 *                 maxLength: 255
 *                 example: https://example.com/new-avatar.jpg
 *                 description: URL to user's avatar image
 *               email:
 *                 type: string
 *                 format: email
 *                 maxLength: 255
 *                 example: newemail@example.com
 *                 description: User's email address
 *               age:
 *                 type: string
 *                 format: date
 *                 example: 2010-12-25
 *                 description: User's birthdate
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User updated successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     username:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                     email:
 *                       type: string
 *       400:
 *         description: Bad request (User ID is required)
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/update/:userId', updateUser);

/**
 * @swagger
 * /api/user/delete/{userId}:
 *   delete:
 *     tags:
 *     - User Controller
 *     summary: Delete a user account
 *     description: Delete a user account (Admin users cannot be deleted)
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to delete
 *         example: 1
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       400:
 *         description: Bad request (User ID is required)
 *       403:
 *         description: Forbidden (Admin users cannot be deleted)
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/delete/:userId', deleteUser);

/**
 * @swagger
 * /api/user/{id}:
 *   get:
 *     tags:
 *     - User Controller
 *     summary: Retrieve a specific user by ID
 *     description: Get detailed information about a specific user including game statistics
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Numeric ID of the user to retrieve
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Successfully retrieved the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 username:
 *                   type: string
 *                   example: johndoe
 *                 email:
 *                   type: string
 *                   example: john@example.com
 *                 usertype:
 *                   type: string
 *                   example: Customer
 *                 full_name:
 *                   type: string
 *                   example: John Doe
 *                 avatar:
 *                   type: string
 *                   example: https://example.com/avatar.jpg
 *                 age:
 *                   type: string
 *                   format: date
 *                   example: 2010-05-15
 *                 coins:
 *                   type: integer
 *                   example: 150
 *                 followers_count:
 *                   type: integer
 *                   example: 10
 *                 following_count:
 *                   type: integer
 *                   example: 5
 *                 experience_points:
 *                   type: integer
 *                   example: 1250
 *                 current_level:
 *                   type: integer
 *                   example: 3
 *                 level_progress:
 *                   type: number
 *                   example: 0.75
 *                 is_active:
 *                   type: boolean
 *                   example: true
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     games_played:
 *                       type: integer
 *                       example: 25
 *                     best_score:
 *                       type: integer
 *                       example: 980
 *                     total_score:
 *                       type: integer
 *                       example: 12500
 *       404:
 *         description: User not found
 *       400:
 *         description: Invalid request, User ID is missing
 *       500:
 *         description: Server error
 */
router.get('/:id', getUserById);

/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     tags:
 *     - User Controller
 *     summary: Log out user
 *     description: Logout user by validating and invalidating their JWT token
 *     security:
 *       - Authorization: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *                 success:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: No token provided
 *       401:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
router.post('/logout', logout);

export default router;
