import express from 'express';
import {
    getUserStats,
    followUser,
    unfollowUser,
    getUserFollowers,
    getUserFollowing
} from '../controllers/social.controller.js';
import { verifyToken } from '../middleware/verifyUser.js';

const router = express.Router();

/**
 * @swagger
 * /api/users/{userId}/stats:
 *   get:
 *     tags:
 *     - Social Controller
 *     summary: Get user statistics
 *     description: Retrieve user's gaming statistics and profile info
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *         description: ID of the user to get stats for
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User statistics retrieved successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     username:
 *                       type: string
 *                       example: johndoe
 *                     full_name:
 *                       type: string
 *                       example: John Doe
 *                     avatar:
 *                       type: string
 *                       example: https://example.com/avatar.jpg
 *                     coins:
 *                       type: integer
 *                       example: 150
 *                     followers_count:
 *                       type: integer
 *                       example: 25
 *                     following_count:
 *                       type: integer
 *                       example: 15
 *                     experience_points:
 *                       type: integer
 *                       example: 2500
 *                     current_level:
 *                       type: integer
 *                       example: 5
 *                     level_progress:
 *                       type: number
 *                       example: 0.75
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         games_played:
 *                           type: integer
 *                           example: 50
 *                         best_score:
 *                           type: integer
 *                           example: 980
 *                         total_score:
 *                           type: integer
 *                           example: 25000
 *       400:
 *         description: Invalid user ID
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:userId/stats', getUserStats);

/**
 * @swagger
 * /api/users/{userId}/follow:
 *   post:
 *     tags:
 *     - Social Controller
 *     summary: Follow a user
 *     description: Follow another user in the SmartKid Math Game community
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2
 *         description: ID of the user to follow
 *     responses:
 *       201:
 *         description: Successfully followed user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully followed user
 *                 followed_user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 2
 *                     username:
 *                       type: string
 *                       example: janedoe
 *                     full_name:
 *                       type: string
 *                       example: Jane Doe
 *       400:
 *         description: Invalid user ID or cannot follow yourself
 *       404:
 *         description: User not found
 *       409:
 *         description: Already following this user
 *       500:
 *         description: Server error
 */
router.post('/:userId/follow', verifyToken, followUser);

/**
 * @swagger
 * /api/users/{userId}/unfollow:
 *   delete:
 *     tags:
 *     - Social Controller
 *     summary: Unfollow a user
 *     description: Unfollow a user in the SmartKid Math Game community
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2
 *         description: ID of the user to unfollow
 *     responses:
 *       200:
 *         description: Successfully unfollowed user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully unfollowed user
 *       400:
 *         description: Invalid user ID
 *       404:
 *         description: Not following this user
 *       500:
 *         description: Server error
 */
router.delete('/:userId/unfollow', verifyToken, unfollowUser);

/**
 * @swagger
 * /api/users/{userId}/followers:
 *   get:
 *     tags:
 *     - Social Controller
 *     summary: Get user's followers
 *     description: Retrieve list of users following this user
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *         description: ID of the user to get followers for
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of followers per page
 *     responses:
 *       200:
 *         description: Followers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Followers retrieved successfully
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     totalPages:
 *                       type: integer
 *                       example: 2
 *                 followers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 3
 *                       username:
 *                         type: string
 *                         example: player123
 *                       full_name:
 *                         type: string
 *                         example: Young Player
 *                       avatar:
 *                         type: string
 *                         example: https://example.com/avatar3.jpg
 *                       current_level:
 *                         type: integer
 *                         example: 4
 *                       experience_points:
 *                         type: integer
 *                         example: 1800
 *       400:
 *         description: Invalid user ID
 *       500:
 *         description: Server error
 */
router.get('/:userId/followers', getUserFollowers);

/**
 * @swagger
 * /api/users/{userId}/following:
 *   get:
 *     tags:
 *     - Social Controller
 *     summary: Get users this user is following
 *     description: Retrieve list of users that this user is following
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *         description: ID of the user to get following list for
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: Following list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Following retrieved successfully
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 15
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     totalPages:
 *                       type: integer
 *                       example: 1
 *                 following:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 2
 *                       username:
 *                         type: string
 *                         example: mathexpert
 *                       full_name:
 *                         type: string
 *                         example: Math Expert
 *                       avatar:
 *                         type: string
 *                         example: https://example.com/avatar2.jpg
 *                       current_level:
 *                         type: integer
 *                         example: 8
 *                       experience_points:
 *                         type: integer
 *                         example: 5500
 *       400:
 *         description: Invalid user ID
 *       500:
 *         description: Server error
 */
router.get('/:userId/following', getUserFollowing);

export default router; 