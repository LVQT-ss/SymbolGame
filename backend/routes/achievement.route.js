import express from 'express';
import {
    getAllAchievements,
    getUserAchievements
} from '../controllers/achievement.controller.js';
import { verifyToken } from '../middleware/verifyUser.js';

const router = express.Router();

/**
 * @swagger
 * /api/achievements:
 *   get:
 *     tags:
 *     - Achievement Controller
 *     summary: Get all achievements
 *     description: Retrieve all available achievements in the SmartKid Math Game
 *     parameters:
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *           enum: [game_performance, social, progression, special]
 *         description: Filter achievements by category
 *     responses:
 *       200:
 *         description: Achievements retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Achievements retrieved successfully
 *                 total:
 *                   type: integer
 *                   example: 25
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [game_performance, social, progression, special]
 *                 achievements:
 *                   type: object
 *                   properties:
 *                     game_performance:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           name:
 *                             type: string
 *                             example: First Victory
 *                           description:
 *                             type: string
 *                             example: Complete your first game session
 *                           category:
 *                             type: string
 *                             example: game_performance
 *                           icon_url:
 *                             type: string
 *                             example: https://example.com/icons/first-victory.png
 *                           points_required:
 *                             type: integer
 *                             example: 1
 *                           reward_coins:
 *                             type: integer
 *                             example: 50
 *                     social:
 *                       type: array
 *                       items:
 *                         type: object
 *                     progression:
 *                       type: array
 *                       items:
 *                         type: object
 *                     special:
 *                       type: array
 *                       items:
 *                         type: object
 *       500:
 *         description: Server error
 */
router.get('/', getAllAchievements);

/**
 * @swagger
 * /api/achievements/me:
 *   get:
 *     tags:
 *     - Achievement Controller
 *     summary: Get user's achievements
 *     description: Retrieve achievements for the authenticated user with progress and earned status
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - name: earned_only
 *         in: query
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Show only earned achievements
 *     responses:
 *       200:
 *         description: User achievements retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User achievements retrieved successfully
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     total_achievements:
 *                       type: integer
 *                       example: 25
 *                     earned_achievements:
 *                       type: integer
 *                       example: 8
 *                     completion_percentage:
 *                       type: integer
 *                       example: 32
 *                 categories:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [game_performance, social, progression, special]
 *                 achievements:
 *                   type: object
 *                   properties:
 *                     game_performance:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           name:
 *                             type: string
 *                             example: First Victory
 *                           description:
 *                             type: string
 *                             example: Complete your first game session
 *                           category:
 *                             type: string
 *                             example: game_performance
 *                           icon_url:
 *                             type: string
 *                             example: https://example.com/icons/first-victory.png
 *                           points_required:
 *                             type: integer
 *                             example: 1
 *                           reward_coins:
 *                             type: integer
 *                             example: 50
 *                           is_earned:
 *                             type: boolean
 *                             example: true
 *                           earned_at:
 *                             type: string
 *                             format: date-time
 *                             example: 2024-01-15T10:30:00Z
 *                           progress:
 *                             type: integer
 *                             example: 1
 *                             description: Current progress towards this achievement
 *                     social:
 *                       type: array
 *                       items:
 *                         type: object
 *                     progression:
 *                       type: array
 *                       items:
 *                         type: object
 *                     special:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/me', verifyToken, getUserAchievements);

export default router; 