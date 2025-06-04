import express from 'express';
import {
    getLeaderboard,
    getLeaderboardTypes,
    getUserRanks,
    updateLeaderboards
} from '../controllers/leaderboard.controller.js';
import { verifyToken } from '../middleware/verifyUser.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     LeaderboardEntry:
 *       type: object
 *       properties:
 *         rank:
 *           type: integer
 *           description: User's rank position
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *             username:
 *               type: string
 *             full_name:
 *               type: string
 *             avatar:
 *               type: string
 *             level:
 *               type: integer
 *         score:
 *           type: number
 *           description: Primary score value
 *         secondary_score:
 *           type: number
 *           description: Secondary score for tie-breaking
 *         tier:
 *           type: string
 *           enum: [bronze, silver, gold, platinum, diamond]
 *         trend:
 *           type: string
 *           enum: [up, down, stable, new]
 *         rank_change:
 *           type: integer
 *           description: Change in rank (positive = moved up)
 *         games_count:
 *           type: integer
 *         last_game_date:
 *           type: string
 *           format: date-time
 *         is_personal_best:
 *           type: boolean
 *         is_season_best:
 *           type: boolean
 */

/**
 * @swagger
 * /api/leaderboard:
 *   get:
 *     summary: Get leaderboard for specific type and period
 *     tags: [Leaderboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: false
 *         schema:
 *           type: string
 *           enum: [overall_score, best_single_game, speed_masters, accuracy_kings, experience_leaders, level_champions, most_followed, most_liked, most_active, achievement_hunters]
 *           default: overall_score
 *         description: Type of leaderboard
 *       - in: query
 *         name: period
 *         required: false
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, all_time]
 *           default: all_time
 *         description: Time period for leaderboard
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of entries to return
 *       - in: query
 *         name: offset
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of entries to skip
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 leaderboard_type:
 *                   type: string
 *                 time_period:
 *                   type: string
 *                 period_info:
 *                   type: object
 *                   properties:
 *                     start:
 *                       type: string
 *                       format: date-time
 *                     end:
 *                       type: string
 *                       format: date-time
 *                 total_entries:
 *                   type: integer
 *                 user_rank:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     position:
 *                       type: integer
 *                     score:
 *                       type: number
 *                     tier:
 *                       type: string
 *                     trend:
 *                       type: string
 *                 entries:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaderboardEntry'
 *       400:
 *         description: Invalid leaderboard type
 */
router.get('/', verifyToken, getLeaderboard);

/**
 * @swagger
 * /api/leaderboard/types:
 *   get:
 *     summary: Get all available leaderboard types
 *     tags: [Leaderboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leaderboard types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 types:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       category:
 *                         type: string
 *                       icon:
 *                         type: string
 */
router.get('/types', verifyToken, getLeaderboardTypes);

/**
 * @swagger
 * /api/leaderboard/user/{userId}:
 *   get:
 *     summary: Get user's ranks across all leaderboards
 *     tags: [Leaderboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: query
 *         name: period
 *         required: false
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, all_time]
 *           default: all_time
 *         description: Time period for rankings
 *     responses:
 *       200:
 *         description: User ranks retrieved successfully
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
 *                     avatar:
 *                       type: string
 *                     current_level:
 *                       type: integer
 *                 period:
 *                   type: string
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     games_played:
 *                       type: integer
 *                     best_score:
 *                       type: integer
 *                     total_score:
 *                       type: integer
 *                     achievements_unlocked:
 *                       type: integer
 *                 ranks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       leaderboard_type:
 *                         type: string
 *                       rank_position:
 *                         type: integer
 *                       score_value:
 *                         type: number
 *                       tier:
 *                         type: string
 *                       trend:
 *                         type: string
 *                       rank_change:
 *                         type: integer
 *                       is_personal_best:
 *                         type: boolean
 *                       last_updated:
 *                         type: string
 *                         format: date-time
 *                 best_overall_rank:
 *                   type: integer
 *                   nullable: true
 *       404:
 *         description: User not found
 */
router.get('/user/:userId', verifyToken, getUserRanks);

/**
 * @swagger
 * /api/leaderboard/update:
 *   post:
 *     summary: Update leaderboards (Admin only)
 *     tags: [Leaderboard]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               types:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Leaderboard types to update (optional, updates all if not specified)
 *               periods:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [daily, weekly, monthly, all_time]
 *                 description: Time periods to update (optional, updates all if not specified)
 *     responses:
 *       200:
 *         description: Leaderboards updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 updated_count:
 *                   type: integer
 *                 types_updated:
 *                   type: array
 *                   items:
 *                     type: string
 *                 periods_updated:
 *                   type: array
 *                   items:
 *                     type: string
 *       403:
 *         description: Admin privileges required
 */
router.post('/update', verifyToken, updateLeaderboards);

export default router; 