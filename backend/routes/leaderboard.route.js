import express from 'express';
import LeaderboardController from '../controllers/leaderboard.controller.js';
import { verifyToken } from '../middleware/verifyUser.js';

const router = express.Router();

/**
 * @swagger
 * /api/leaderboard/regional:
 *   get:
 *     tags:
 *     - Leaderboard Controller
 *     summary: Get Regional Leaderboard
 *     description: Retrieve top 10 players from all regions (Asia, America, Europe, Oceania, Africa)
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: query
 *         name: difficulty_level
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 3
 *         description: Filter by difficulty level (1=Easy, 2=Medium, 3=Hard)
 *         example: 2
 *     responses:
 *       200:
 *         description: Regional leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     asia:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/LeaderboardPlayer'
 *                     america:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/LeaderboardPlayer'
 *                     europe:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/LeaderboardPlayer'
 *                     oceania:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/LeaderboardPlayer'
 *                     africa:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/LeaderboardPlayer'
 *                 message:
 *                   type: string
 *                   example: Regional leaderboard retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Authentication required
 *       500:
 *         description: Server error
 */
router.get('/regional', LeaderboardController.getRegionalLeaderboard);

/**
 * @swagger
 * /api/leaderboard/monthly:
 *   get:
 *     tags:
 *     - Leaderboard Controller
 *     summary: Get Monthly Global Leaderboard
 *     description: Retrieve top players globally for this month
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: query
 *         name: difficulty_level
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 3
 *         description: Filter by difficulty level (1=Easy, 2=Medium, 3=Hard)
 *         example: 3
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of top players to retrieve
 *         example: 10
 *     responses:
 *       200:
 *         description: Monthly leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaderboardPlayer'
 *                 message:
 *                   type: string
 *                   example: Monthly leaderboard retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Authentication required
 *       500:
 *         description: Server error
 */
router.get('/monthly', LeaderboardController.getMonthlyLeaderboard);

/**
 * @swagger
 * /api/leaderboard/user/{userId}/rank:
 *   get:
 *     tags:
 *     - Leaderboard Controller
 *     summary: Get User's Rank in Leaderboard
 *     description: Retrieve a specific user's rank and position in leaderboard
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to get rank for
 *         example: 123
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [regional, monthly]
 *           default: regional
 *         description: Type of leaderboard to check rank in
 *         example: regional
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *           enum: [asia, america, europe, oceania, africa]
 *         description: Region to check rank in (only for regional type)
 *         example: asia
 *     responses:
 *       200:
 *         description: User rank retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     rank_position:
 *                       type: integer
 *                       example: 15
 *                     score:
 *                       type: integer
 *                       example: 1250
 *                     full_name:
 *                       type: string
 *                       example: John Doe
 *                 message:
 *                   type: string
 *                   example: User rank retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Authentication required
 *       404:
 *         description: User not found in leaderboard
 *       500:
 *         description: Server error
 */
router.get('/user/:userId/rank', verifyToken, LeaderboardController.getUserRank);

/**
 * @swagger
 * /api/leaderboard/update/regional:
 *   post:
 *     tags:
 *     - Leaderboard Controller
 *     summary: Update Regional Leaderboard Cache (Admin Only)
 *     description: Refresh the regional leaderboard cache with latest data from all regions
 *     security:
 *       - Authorization: []
 *     responses:
 *       200:
 *         description: Regional leaderboard cache updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Regional leaderboard cache updated successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.post('/update/regional', verifyToken, LeaderboardController.updateRegionalLeaderboard);

/**
 * @swagger
 * /api/leaderboard/update/monthly:
 *   post:
 *     tags:
 *     - Leaderboard Controller
 *     summary: Update Monthly Leaderboard Cache (Admin Only)
 *     description: Refresh the monthly global leaderboard cache with latest data from this month
 *     security:
 *       - Authorization: []
 *     responses:
 *       200:
 *         description: Monthly leaderboard cache updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Monthly leaderboard cache updated successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Server error
 */
router.post('/update/monthly', verifyToken, LeaderboardController.updateMonthlyLeaderboard);

/**
 * @swagger
 * components:
 *   schemas:
 *     LeaderboardPlayer:
 *       type: object
 *       properties:
 *         rank_position:
 *           type: integer
 *           example: 1
 *           description: Player's rank position in leaderboard
 *         full_name:
 *           type: string
 *           example: John Doe
 *           description: Player's full name
 *         avatar:
 *           type: string
 *           example: https://example.com/avatar.jpg
 *           description: Player's avatar URL
 *         current_level:
 *           type: integer
 *           example: 5
 *           description: Player's current game level
 *         country:
 *           type: string
 *           example: VN
 *           description: Player's country code (VN, US, JP, etc.)
 *         score:
 *           type: integer
 *           example: 1500
 *           description: Player's score used for ranking

 *         total_games:
 *           type: integer
 *           example: 150
 *           description: Total number of games played
 *         region:
 *           type: string
 *           enum: [asia, america, europe, oceania, africa]
 *           example: asia
 *           description: Player's region (only in regional leaderboard)
 *         medal:
 *           type: string
 *           enum: ["🥇", "🥈", "🥉", null]
 *           example: "🥇"
 *           description: Medal emoji for top 3 players
 *         isTopThree:
 *           type: boolean
 *           example: true
 *           description: Whether player is in top 3
 */

export default router; 