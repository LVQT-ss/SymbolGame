import express from 'express';
import {
    startGame,
    completeGame,
    getGameHistory,
    getGameStatsSummary,
    getAssignedSessions,
    createGameWithCustomRounds,
    getAdminGameDashboard,
    getAvailableGames,
    joinGame,
    getGameSession,
    submitRound
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
 * /api/game/join:
 *   post:
 *     tags:
 *     - Game Controller
 *     summary: Join an available game session
 *     description: Join an unassigned game session created by admin
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
 *             properties:
 *               game_session_id:
 *                 type: integer
 *                 example: 123
 *                 description: ID of the game session to join
 *     responses:
 *       200:
 *         description: Successfully joined game session
 *       400:
 *         description: Game session ID is required
 *       404:
 *         description: Game session not found
 *       409:
 *         description: Game session already assigned or completed
 *       500:
 *         description: Server error
 */
router.post('/join', verifyToken, joinGame);

/**
 * @swagger
 * /api/game/available:
 *   get:
 *     tags:
 *     - Game Controller
 *     summary: Get available game sessions that anyone can join
 *     description: Retrieve unassigned game sessions created by admins that are open for anyone to join
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
 *       - name: admin_id
 *         in: query
 *         schema:
 *           type: integer
 *         description: Filter sessions by specific admin creator
 *     responses:
 *       200:
 *         description: Available game sessions retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/available', verifyToken, getAvailableGames);

/**
 * @swagger
 * /api/game/{id}:
 *   get:
 *     tags:
 *     - Game Controller
 *     summary: Get specific game session
 *     description: Get a specific game session with current round and progress
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Game session ID
 *     responses:
 *       200:
 *         description: Game session retrieved successfully
 *       404:
 *         description: Game session not found
 *       403:
 *         description: Game session not accessible
 *       500:
 *         description: Server error
 */
router.get('/:id', verifyToken, getGameSession);

/**
 * @swagger
 * /api/game/{id}/submit-round:
 *   post:
 *     tags:
 *     - Game Controller
 *     summary: Submit a single round
 *     description: Submit answer for a single round and get next round
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Game session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - round_number
 *               - user_symbol
 *               - response_time
 *             properties:
 *               round_number:
 *                 type: integer
 *                 example: 1
 *               user_symbol:
 *                 type: string
 *                 enum: [">", "<", "="]
 *                 example: ">"
 *               response_time:
 *                 type: number
 *                 format: float
 *                 example: 2.5
 *     responses:
 *       200:
 *         description: Round submitted successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Game session or round not found
 *       409:
 *         description: Round already completed
 *       500:
 *         description: Server error
 */
router.post('/:id/submit-round', verifyToken, submitRound);

/**
 * @swagger
 * /api/game/admin/create-custom:
 *   post:
 *     tags:
 *     - Game Controller
 *     summary: Create game session with fully customized rounds (ADMIN ONLY)
 *     description: Create a game session with complete control over each round's numbers and expected answers - ADMIN ONLY
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - custom_rounds
 *             properties:
 *               user_id:
 *                 type: integer
 *                 example: 5
 *                 description: Optional - assign to specific customer (omit for open games)
 *               admin_instructions:
 *                 type: string
 *                 example: "Focus on comparing larger numbers today"
 *                 description: Special instructions for the student
 *               custom_rounds:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 50
 *                 items:
 *                   type: object
 *                   required:
 *                     - first_number
 *                     - second_number
 *                   properties:
 *                     first_number:
 *                       type: integer
 *                       example: 25
 *                       description: First number for comparison
 *                     second_number:
 *                       type: integer
 *                       example: 18
 *                       description: Second number for comparison
 *                     expected_symbol:
 *                       type: string
 *                       enum: [">", "<", "="]
 *                       example: ">"
 *                       description: Optional - override auto-calculated correct answer
 *           examples:
 *             open_custom_game:
 *               summary: Open game anyone can join
 *               value:
 *                 admin_instructions: "Practice with these specific number pairs"
 *                 custom_rounds:
 *                   - first_number: 25
 *                     second_number: 18
 *                   - first_number: 7
 *                     second_number: 31
 *                   - first_number: 50
 *                     second_number: 50
 *             assigned_custom_game:
 *               summary: Assigned to specific user
 *               value:
 *                 user_id: 5
 *                 admin_instructions: "Special assignment for you"
 *                 custom_rounds:
 *                   - first_number: 15
 *                     second_number: 20
 *                   - first_number: 30
 *                     second_number: 30
 *     responses:
 *       201:
 *         description: Custom game session created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Custom game session created successfully
 *                 admin:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                 assigned_user:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     current_level:
 *                       type: integer
 *                 game_session:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 157
 *                     number_of_rounds:
 *                       type: integer
 *                       example: 3
 *                     admin_instructions:
 *                       type: string
 *                       example: Practice with these specific number pairs
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     assigned_to:
 *                       type: string
 *                       enum: [specific_user, open_to_all]
 *                       example: open_to_all
 *                     join_instructions:
 *                       type: string
 *                       example: "Game ID: 157 - Anyone can join using /api/game/join"
 *                 rounds:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       round_number:
 *                         type: integer
 *                       first_number:
 *                         type: integer
 *                       second_number:
 *                         type: integer
 *                       correct_symbol:
 *                         type: string
 *                         enum: [">", "<", "="]
 *       400:
 *         description: Bad request - invalid rounds data
 *       403:
 *         description: Only Admin users can create game sessions
 *       404:
 *         description: Target user not found (if user_id provided)
 *       500:
 *         description: Server error
 */
router.post('/admin/create-custom', verifyToken, createGameWithCustomRounds);

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
 *                     - user_symbol
 *                     - response_time
 *                   properties:
 *                     first_number:
 *                       type: integer
 *                       example: 15
 *                     second_number:
 *                       type: integer
 *                       example: 8
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
// Game statistics routes - both /stats and /stats/summary supported for compatibility
router.get('/stats/summary', verifyToken, getGameStatsSummary);
router.get('/stats', verifyToken, getGameStatsSummary);

/**
 * @swagger
 * /api/game/admin/dashboard:
 *   get:
 *     tags:
 *     - Game Controller
 *     summary: Admin game session dashboard (ADMIN ONLY)
 *     description: Comprehensive overview of all game sessions created by admin with filtering, sorting and analytics
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [all, active, completed]
 *           default: all
 *         description: Filter sessions by completion status
 *       - name: user_id
 *         in: query
 *         schema:
 *           type: integer
 *         description: Filter sessions by specific student
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
 *       - name: sort_by
 *         in: query
 *         schema:
 *           type: string
 *           enum: [created_at, completed_at, score, user_name]
 *           default: created_at
 *         description: Sort sessions by field
 *       - name: sort_order
 *         in: query
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Admin dashboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Admin game dashboard retrieved successfully
 *                 admin:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     total_sessions_created:
 *                       type: integer
 *                       example: 45
 *                     active_sessions:
 *                       type: integer
 *                       example: 12
 *                     completed_sessions:
 *                       type: integer
 *                       example: 33
 *                     total_students_assigned:
 *                       type: integer
 *                       example: 25
 *                     average_score:
 *                       type: number
 *                       format: float
 *                       example: 750.5
 *                     highest_score:
 *                       type: integer
 *                       example: 950
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
 *                 filters:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     user_id:
 *                       type: integer
 *                       nullable: true
 *                     sort_by:
 *                       type: string
 *                     sort_order:
 *                       type: string
 *                 sessions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       assigned_user:
 *                         type: object
 *                         nullable: true
 *                         properties:
 *                           id:
 *                             type: integer
 *                           username:
 *                             type: string
 *                           full_name:
 *                             type: string
 *                           current_level:
 *                             type: integer
 *                           avatar:
 *                             type: string
 *                       number_of_rounds:
 *                         type: integer
 *                       total_time:
 *                         type: number
 *                         format: float
 *                       correct_answers:
 *                         type: integer
 *                       score:
 *                         type: integer
 *                       accuracy:
 *                         type: integer
 *                       completed:
 *                         type: boolean
 *                       admin_instructions:
 *                         type: string
 *                         nullable: true
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       completed_at:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       rounds_summary:
 *                         type: object
 *                         properties:
 *                           total_rounds:
 *                             type: integer
 *                           completed_rounds:
 *                             type: integer
 *                           correct_rounds:
 *                             type: integer
 *       403:
 *         description: Only Admin users can access dashboard
 *       500:
 *         description: Server error
 */
router.get('/admin/dashboard', verifyToken, getAdminGameDashboard);

export default router; 