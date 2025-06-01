import express from 'express';
import {
    getDailyLeaderboard,
    getWeeklyLeaderboard,
    getMonthlyLeaderboard,
    getAllTimeLeaderboard,
    getUserLeaderboardPositions
} from '../controllers/leaderboard.controller.js';
import { verifyToken } from '../middleware/verifyUser.js';

const router = express.Router();

/**
 * @swagger
 * /api/leaderboard/daily:
 *   get:
 *     tags:
 *     - Leaderboard Controller
 *     summary: Get daily leaderboard
 *     description: Retrieve today's leaderboard rankings
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Daily leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Daily leaderboard retrieved successfully
 *                 period:
 *                   type: string
 *                   example: daily
 *                 date:
 *                   type: string
 *                   example: 2024-01-15
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                 leaderboard:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rank:
 *                         type: integer
 *                         example: 1
 *                       score:
 *                         type: integer
 *                         example: 2500
 *                       games_played:
 *                         type: integer
 *                         example: 5
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           username:
 *                             type: string
 *                           full_name:
 *                             type: string
 *                           avatar:
 *                             type: string
 *                           current_level:
 *                             type: integer
 */
router.get('/daily', getDailyLeaderboard);

/**
 * @swagger
 * /api/leaderboard/weekly:
 *   get:
 *     tags:
 *     - Leaderboard Controller
 *     summary: Get weekly leaderboard
 *     description: Retrieve this week's leaderboard rankings
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Weekly leaderboard retrieved successfully
 */
router.get('/weekly', getWeeklyLeaderboard);

/**
 * @swagger
 * /api/leaderboard/monthly:
 *   get:
 *     tags:
 *     - Leaderboard Controller
 *     summary: Get monthly leaderboard
 *     description: Retrieve this month's leaderboard rankings
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Monthly leaderboard retrieved successfully
 */
router.get('/monthly', getMonthlyLeaderboard);

/**
 * @swagger
 * /api/leaderboard/all-time:
 *   get:
 *     tags:
 *     - Leaderboard Controller
 *     summary: Get all-time leaderboard
 *     description: Retrieve all-time leaderboard rankings
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: All-time leaderboard retrieved successfully
 */
router.get('/all-time', getAllTimeLeaderboard);

/**
 * @swagger
 * /api/leaderboard/user/me/positions:
 *   get:
 *     tags:
 *     - Leaderboard Controller
 *     summary: Get user's leaderboard positions
 *     description: Retrieve authenticated user's position in all leaderboards
 *     security:
 *       - Authorization: []
 *     responses:
 *       200:
 *         description: User positions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     current_level:
 *                       type: integer
 *                 positions:
 *                   type: object
 *                   properties:
 *                     daily:
 *                       type: object
 *                       properties:
 *                         rank:
 *                           type: integer
 *                         score:
 *                           type: integer
 *                         games_played:
 *                           type: integer
 *                     weekly:
 *                       type: object
 *                     monthly:
 *                       type: object
 *                     all-time:
 *                       type: object
 */
router.get('/user/me/positions', verifyToken, getUserLeaderboardPositions);

export default router; 