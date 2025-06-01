import express from 'express';
import {
    startGame,
    completeGame,
    getGameHistory,
    getGameStatsSummary,
    getAssignedSessions
} from '../controllers/game.controller.js';
import { verifyToken } from '../middleware/verifyUser.js';

const router = express.Router();

/**
 * @swagger
 * /api/game/start:
 *   post:
 *     tags:
 *     - Game Controller
 *     summary: Start a new game session (ADMIN ONLY)
 *     description: Create a new math comparison game session - RESTRICTED TO ADMIN USERS ONLY. Customers can only play admin-assigned sessions.
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               difficulty_level:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 default: 1
 *                 example: 3
 *                 description: Game difficulty level
 *               number_of_rounds:
 *                 type: integer
 *                 minimum: 5
 *                 maximum: 50
 *                 default: 10
 *                 example: 15
 *                 description: Number of game rounds
 *     responses:
 *       201:
 *         description: Game session started successfully (Admin only)
 *       403:
 *         description: Only Admin users can create game sessions
 *       500:
 *         description: Server error
 */
router.post('/start', verifyToken, startGame);

/**
 * @swagger
 * /api/game/assigned:
 *   get:
 *     tags:
 *     - Game Controller
 *     summary: Get assigned game sessions (CUSTOMER ONLY)
 *     description: Retrieve game sessions assigned by admin - CUSTOMER USERS ONLY
 *     security:
 *       - Authorization: []
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
 *           default: 10
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [all, active, completed]
 *           default: all
 *         description: Filter sessions by completion status
 *     responses:
 *       200:
 *         description: Assigned game sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Assigned game sessions retrieved successfully
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
 *                 sessions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 156
 *                       difficulty_level:
 *                         type: integer
 *                         example: 3
 *                       number_of_rounds:
 *                         type: integer
 *                         example: 15
 *                       completed:
 *                         type: boolean
 *                         example: false
 *                       score:
 *                         type: integer
 *                         example: 0
 *                       admin_instructions:
 *                         type: string
 *                         example: Focus on accuracy over speed today
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       assigned_by:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           username:
 *                             type: string
 *                           full_name:
 *                             type: string
 *       403:
 *         description: This endpoint is for Customer users only
 *       500:
 *         description: Server error
 */
router.get('/assigned', verifyToken, getAssignedSessions);

/**
 * @swagger
 * /api/game/complete:
 *   post:
 *     tags:
 *     - Game Controller
 *     summary: Complete a game session
 *     description: Submit game results and calculate score/rewards. Customers can only complete admin-assigned sessions.
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - game_session_id
 *               - total_time
 *               - rounds
 *             properties:
 *               game_session_id:
 *                 type: integer
 *                 example: 123
 *                 description: ID of the game session to complete
 *               total_time:
 *                 type: number
 *                 format: float
 *                 example: 180.5
 *                 description: Total time taken in seconds
 *               rounds:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - first_number
 *                     - second_number
 *                     - correct_symbol
 *                     - user_symbol
 *                     - response_time
 *                   properties:
 *                     first_number:
 *                       type: integer
 *                       example: 15
 *                     second_number:
 *                       type: integer
 *                       example: 8
 *                     correct_symbol:
 *                       type: string
 *                       enum: [">", "<", "="]
 *                       example: ">"
 *                     user_symbol:
 *                       type: string
 *                       enum: [">", "<", "="]
 *                       example: ">"
 *                     response_time:
 *                       type: number
 *                       format: float
 *                       example: 2.5
 *               recording_url:
 *                 type: string
 *                 example: "https://example.com/recording.mp4"
 *                 description: Optional video recording URL
 *     responses:
 *       200:
 *         description: Game completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Game completed successfully
 *                 game_result:
 *                   type: object
 *                   properties:
 *                     score:
 *                       type: integer
 *                       example: 850
 *                     correct_answers:
 *                       type: integer
 *                       example: 8
 *                     total_rounds:
 *                       type: integer
 *                       example: 10
 *                     accuracy:
 *                       type: integer
 *                       example: 80
 *                     experience_gained:
 *                       type: integer
 *                       example: 85
 *                     coins_earned:
 *                       type: integer
 *                       example: 8
 *                     session_type:
 *                       type: string
 *                       enum: [admin_assigned, self_created]
 *                       example: admin_assigned
 *       400:
 *         description: Bad request - missing required fields
 *       403:
 *         description: Customers can only complete admin-assigned sessions
 *       404:
 *         description: Game session not found or already completed
 *       500:
 *         description: Server error
 */
router.post('/complete', verifyToken, completeGame);

/**
 * @swagger
 * /api/game/history:
 *   get:
 *     tags:
 *     - Game Controller
 *     summary: Get game history
 *     description: Retrieve user's completed games. Customers only see admin-assigned sessions.
 *     security:
 *       - Authorization: []
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
 *           default: 10
 *     responses:
 *       200:
 *         description: Game history retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/history', verifyToken, getGameHistory);

/**
 * @swagger
 * /api/game/stats/summary:
 *   get:
 *     tags:
 *     - Game Controller
 *     summary: Get game statistics summary
 *     description: Get comprehensive performance analytics and statistics. Customers only see stats from admin-assigned sessions.
 *     security:
 *       - Authorization: []
 *     responses:
 *       200:
 *         description: Game statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Game statistics summary retrieved successfully
 *                 summary:
 *                   type: object
 *                   properties:
 *                     overall:
 *                       type: object
 *                       properties:
 *                         games_played:
 *                           type: integer
 *                           example: 15
 *                         best_score:
 *                           type: integer
 *                           example: 950
 *                         total_score:
 *                           type: integer
 *                           example: 12500
 *                         current_level:
 *                           type: integer
 *                           example: 5
 *                         experience_points:
 *                           type: integer
 *                           example: 4250
 *                         level_progress:
 *                           type: number
 *                           format: float
 *                           example: 0.25
 *                         coins:
 *                           type: integer
 *                           example: 125
 *                     recent_performance:
 *                       type: object
 *                       properties:
 *                         average_score:
 *                           type: integer
 *                           example: 775
 *                         average_accuracy:
 *                           type: integer
 *                           example: 78
 *                         average_time:
 *                           type: integer
 *                           example: 165
 *                         games_analyzed:
 *                           type: integer
 *                           example: 10
 *                     recent_games:
 *                       type: array
 *                       items:
 *                         type: object
 *                     user_type:
 *                       type: string
 *                       enum: [Admin, Customer]
 *                       example: Customer
 *                     access_level:
 *                       type: string
 *                       enum: [admin_assigned_only, full_access]
 *                       example: admin_assigned_only
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/stats/summary', verifyToken, getGameStatsSummary);

export default router; 