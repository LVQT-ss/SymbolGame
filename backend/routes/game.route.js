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
    submitRound,
    createInstantGame,
    submitWholeGame,
    replayGame,
    getGameDetails,
    joinGameSession,
    completeGameSession,
    getUserGameHistory,
    getGameHistoryDetails
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
 * /api/game/create-instant:
 *   post:
 *     tags:
 *     - Game Controller
 *     summary: Create instant game for immediate play (QUICK PLAY)
 *     description: Create a new game session instantly for any user with automatic round generation. Perfect for quick play without waiting for admin assignments.
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
 *                 description: Game difficulty level (affects number range)
 *               number_of_rounds:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 default: 10
 *                 example: 15
 *                 description: Number of game rounds
 *               custom_rounds:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     first_number:
 *                       type: integer
 *                       example: 25
 *                     second_number:
 *                       type: integer
 *                       example: 17
 *                 description: Optional custom rounds instead of auto-generation
 *     responses:
 *       201:
 *         description: Instant game created successfully, ready to play
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Instant game created successfully! You can start playing immediately.
 *                 player:
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
 *                 game_session:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 456
 *                     difficulty_level:
 *                       type: integer
 *                     number_of_rounds:
 *                       type: integer
 *                     time_limit:
 *                       type: integer
 *                       example: 600
 *                     round_time_limit:
 *                       type: integer
 *                       example: 60
 *                     points_per_correct:
 *                       type: integer
 *                       example: 100
 *                     status:
 *                       type: string
 *                       example: ready_to_play
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
 *                 instructions:
 *                   type: object
 *                   properties:
 *                     how_to_play:
 *                       type: string
 *                     scoring:
 *                       type: string
 *                     next_steps:
 *                       type: array
 *                       items:
 *                         type: string
 *       400:
 *         description: Invalid input parameters
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/create-instant', verifyToken, createInstantGame);

/**
 * @swagger
 * /api/game/submit-whole-game:
 *   post:
 *     tags:
 *     - Game Controller
 *     summary: Submit complete game in one call (EASIEST WAY)
 *     description: Create a game and submit all answers in a single API call. Perfect for mobile apps or offline play.
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - total_time
 *               - rounds
 *             properties:
 *               difficulty_level:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 default: 1
 *                 example: 2
 *                 description: Game difficulty level
 *               number_of_rounds:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 50
 *                 default: 10
 *                 example: 5
 *                 description: Number of rounds
 *               total_time:
 *                 type: number
 *                 format: float
 *                 example: 25.5
 *                 description: Total time spent on game (seconds)
 *               rounds:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - user_symbol
 *                     - response_time
 *                   properties:
 *                     user_symbol:
 *                       type: string
 *                       enum: [">", "<", "="]
 *                       example: ">"
 *                       description: Your answer to the comparison
 *                     response_time:
 *                       type: number
 *                       format: float
 *                       example: 2.5
 *                       description: Time taken for this round (seconds)
 *                 description: Array of your answers for each round
 *                 example:
 *                   - user_symbol: ">"
 *                     response_time: 2.5
 *                   - user_symbol: "<"
 *                     response_time: 1.8
 *                   - user_symbol: "="
 *                     response_time: 3.2
 *     responses:
 *       200:
 *         description: Existing game session completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Game session completed successfully!
 *                 game_result:
 *                   type: object
 *                   properties:
 *                     session_info:
 *                       type: object
 *                       properties:
 *                         mode:
 *                           type: string
 *                           enum: [existing_session, new_session]
 *                         auto_assigned:
 *                           type: boolean
 *                         session_type:
 *                           type: string
 *                           enum: [admin_assigned, self_created]
 *       201:
 *         description: New game created and completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Game created and completed successfully!
 *                 game_result:
 *                   type: object
 *                   properties:
 *                     game_id:
 *                       type: integer
 *                       example: 789
 *                     player:
 *                       type: object
 *                       properties:
 *                         username:
 *                           type: string
 *                         level_before:
 *                           type: integer
 *                         level_after:
 *                           type: integer
 *                         level_up:
 *                           type: boolean
 *                     performance:
 *                       type: object
 *                       properties:
 *                         total_rounds:
 *                           type: integer
 *                         correct_answers:
 *                           type: integer
 *                         accuracy:
 *                           type: integer
 *                         total_time:
 *                           type: number
 *                     scoring:
 *                       type: object
 *                       properties:
 *                         final_score:
 *                           type: integer
 *                         experience_gained:
 *                           type: integer
 *                         coins_earned:
 *                           type: integer
 *                 detailed_rounds:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       round_number:
 *                         type: integer
 *                       question:
 *                         type: string
 *                         example: "25 ? 17"
 *                       your_answer:
 *                         type: string
 *                       correct_answer:
 *                         type: string
 *                       is_correct:
 *                         type: boolean
 *                 summary:
 *                   type: object
 *                   properties:
 *                     result:
 *                       type: string
 *                       example: "🎉 Great job!"
 *                     next_suggestion:
 *                       type: string
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/submit-whole-game', verifyToken, submitWholeGame);

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
 *     summary: Complete a game session or create a new one
 *     description: Submit game results and calculate score/rewards. Can complete existing sessions OR create new sessions. Anyone can complete any available game session.
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - total_time
 *               - rounds
 *             properties:
 *               game_session_id:
 *                 type: integer
 *                 example: 123
 *                 description: Optional - ID of existing game session to complete. If not provided, creates new session.
 *               difficulty_level:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 default: 1
 *                 example: 2
 *                 description: Game difficulty level (only used when creating new session)
 *               total_time:
 *                 type: number
 *                 format: float
 *                 example: 180.5
 *                 description: Total time taken in seconds
 *               rounds:
 *                 type: array
 *                 description: Array of round data (format depends on whether completing existing session or creating new one)
 *                 items:
 *                   oneOf:
 *                     - type: object
 *                       title: Existing Session Round
 *                       required:
 *                         - first_number
 *                         - second_number
 *                         - user_symbol
 *                         - response_time
 *                       properties:
 *                         first_number:
 *                           type: integer
 *                           example: 15
 *                           description: Must match existing round numbers
 *                         second_number:
 *                           type: integer
 *                           example: 8
 *                           description: Must match existing round numbers
 *                         user_symbol:
 *                           type: string
 *                           enum: [">", "<", "="]
 *                           example: ">"
 *                         response_time:
 *                           type: number
 *                           format: float
 *                           example: 2.5
 *                     - type: object
 *                       title: New Session Round
 *                       required:
 *                         - user_symbol
 *                         - response_time
 *                       properties:
 *                         user_symbol:
 *                           type: string
 *                           enum: [">", "<", "="]
 *                           example: ">"
 *                           description: Your answer to the comparison
 *                         response_time:
 *                           type: number
 *                           format: float
 *                           example: 2.5
 *                           description: Time taken for this round
 *               recording_url:
 *                 type: string
 *                 example: "https://example.com/recording.mp4"
 *                 description: Optional video recording URL
 *     responses:
 *       200:
 *         description: Existing game session completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Game completed successfully!
 *                 session_info:
 *                   type: object
 *                   properties:
 *                     mode:
 *                       type: string
 *                       example: existing_session
 *                     game_id:
 *                       type: integer
 *                       example: 123
 *                     completed_by:
 *                       type: string
 *                       example: username
 *                 game_result:
 *                   type: object
 *                   properties:
 *                     game_id:
 *                       type: integer
 *                       example: 123
 *                     player:
 *                       type: object
 *                       properties:
 *                         username:
 *                           type: string
 *                         level_before:
 *                           type: integer
 *                         level_after:
 *                           type: integer
 *                         level_up:
 *                           type: boolean
 *                     performance:
 *                       type: object
 *                       properties:
 *                         total_rounds:
 *                           type: integer
 *                         correct_answers:
 *                           type: integer
 *                         accuracy:
 *                           type: integer
 *                         total_time:
 *                           type: number
 *                     scoring:
 *                       type: object
 *                       properties:
 *                         final_score:
 *                           type: integer
 *                         experience_gained:
 *                           type: integer
 *                         coins_earned:
 *                           type: integer
 *       201:
 *         description: New game session created and completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Game created and completed successfully!
 *                 session_info:
 *                   type: object
 *                   properties:
 *                     mode:
 *                       type: string
 *                       example: new_session
 *                     game_id:
 *                       type: integer
 *                       example: 456
 *                     completed_by:
 *                       type: string
 *                       example: username
 *                 game_result:
 *                   type: object
 *                   properties:
 *                     game_id:
 *                       type: integer
 *                     player:
 *                       type: object
 *                     performance:
 *                       type: object
 *                     scoring:
 *                       type: object
 *                 detailed_rounds:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       round_number:
 *                         type: integer
 *                       question:
 *                         type: string
 *                         example: "25 ? 17"
 *                       your_answer:
 *                         type: string
 *                       correct_answer:
 *                         type: string
 *                       is_correct:
 *                         type: boolean
 *       400:
 *         description: Bad request - missing required fields or validation error
 *       404:
 *         description: Game session not found (when game_session_id is provided)
 *       409:
 *         description: Game session already completed
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

/**
 * @swagger
 * /api/game/replay/{gameId}:
 *   post:
 *     tags:
 *     - Game Controller
 *     summary: Replay a completed game with same questions
 *     description: Create a new game session that replicates a previously completed game with identical questions
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - name: gameId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 123
 *         description: ID of the completed game to replay
 *     responses:
 *       201:
 *         description: Replay game created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Replay game created successfully! Same questions, new challenge!
 *                 replay_info:
 *                   type: object
 *                   properties:
 *                     original_game_id:
 *                       type: integer
 *                     original_score:
 *                       type: integer
 *                     original_accuracy:
 *                       type: integer
 *                 challenge:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                     target_score:
 *                       type: integer
 *       400:
 *         description: Can only replay completed games
 *       404:
 *         description: Original game not found
 *       500:
 *         description: Server error
 */
router.post('/replay/:gameId', verifyToken, replayGame);

/**
 * @swagger
 * /api/game/history/{gameId}/details:
 *   get:
 *     tags:
 *     - Game Controller
 *     summary: Get detailed game history
 *     description: Retrieve comprehensive details of a specific completed game including round-by-round analysis
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - name: gameId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 123
 *         description: ID of the game to get details for
 *     responses:
 *       200:
 *         description: Game details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 game:
 *                   type: object
 *                   properties:
 *                     performance:
 *                       type: object
 *                       properties:
 *                         score:
 *                           type: integer
 *                         accuracy:
 *                           type: integer
 *                         average_response_time:
 *                           type: number
 *                     rounds:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           question:
 *                             type: string
 *                           correct_answer:
 *                             type: string
 *                           your_answer:
 *                             type: string
 *                           is_correct:
 *                             type: boolean
 *                           response_time:
 *                             type: number
 *                     replay_available:
 *                       type: boolean
 *       403:
 *         description: Access denied - can only view your own games
 *       404:
 *         description: Game not found
 *       500:
 *         description: Server error
 */
router.get('/history/:gameId/details', verifyToken, getGameDetails);

/**
 * @swagger
 * /api/game/join-session/{sessionId}:
 *   post:
 *     tags:
 *     - Game Controller - New History System
 *     summary: Join a game session and create game history record
 *     description: Join an admin-created game session and create a game history record to track user participation
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the game session to join
 *     responses:
 *       201:
 *         description: Successfully joined game session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully joined game session!
 *                 game_history:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 789
 *                     started_at:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Game session not found
 *       409:
 *         description: Already joined this session or session is inactive
 *       500:
 *         description: Server error
 */
router.post('/join-session/:sessionId', verifyToken, joinGameSession);

/**
 * @swagger
 * /api/game/complete-session:
 *   post:
 *     tags:
 *     - Game Controller - New History System
 *     summary: Complete a game session using game history
 *     description: Complete a joined game session by submitting all round responses. This API uses the new game history structure.
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - game_history_id
 *               - total_time
 *               - round_responses
 *             properties:
 *               game_history_id:
 *                 type: integer
 *                 example: 789
 *                 description: ID of the game history record from joining the session
 *               total_time:
 *                 type: number
 *                 format: float
 *                 example: 145.5
 *                 description: Total time taken to complete all rounds in seconds
 *               round_responses:
 *                 type: array
 *                 description: Array of user responses for each round
 *                 items:
 *                   type: object
 *                   required:
 *                     - user_symbol
 *                     - response_time
 *                   properties:
 *                     user_symbol:
 *                       type: string
 *                       enum: [">", "<", "="]
 *                       example: ">"
 *                       description: User's chosen comparison symbol
 *                     response_time:
 *                       type: number
 *                       format: float
 *                       example: 12.5
 *                       description: Time taken for this round in seconds
 *     responses:
 *       200:
 *         description: Game session completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Game session completed successfully!
 *                 session_info:
 *                   type: object
 *                   properties:
 *                     game_session_id:
 *                       type: integer
 *                     game_history_id:
 *                       type: integer
 *                     session_name:
 *                       type: string
 *                     completed_by:
 *                       type: string
 *                 game_result:
 *                   type: object
 *                   properties:
 *                     performance:
 *                       type: object
 *                       properties:
 *                         total_rounds:
 *                           type: integer
 *                         correct_answers:
 *                           type: integer
 *                         accuracy:
 *                           type: integer
 *                         total_time:
 *                           type: number
 *                     scoring:
 *                       type: object
 *                       properties:
 *                         final_score:
 *                           type: integer
 *                         experience_gained:
 *                           type: integer
 *                         coins_earned:
 *                           type: integer
 *                 detailed_rounds:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       round_number:
 *                         type: integer
 *                       question:
 *                         type: string
 *                       your_answer:
 *                         type: string
 *                       correct_answer:
 *                         type: string
 *                       is_correct:
 *                         type: boolean
 *                       points_earned:
 *                         type: integer
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Game history record not found
 *       409:
 *         description: Game session already completed
 *       500:
 *         description: Server error
 */
router.post('/complete-session', verifyToken, completeGameSession);

/**
 * @swagger
 * /api/game/my-history:
 *   get:
 *     tags:
 *     - Game Controller - New History System
 *     summary: Get user's game history across all sessions
 *     description: Retrieve user's participation history in game sessions with filtering options
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of records per page

 *       - in: query
 *         name: completed_only
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: true
 *         description: Show only completed sessions
 *     responses:
 *       200:
 *         description: Game history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Game history retrieved successfully
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
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     total_sessions_joined:
 *                       type: integer
 *                     completed_sessions:
 *                       type: integer
 *                     total_score:
 *                       type: integer
 *                     best_score:
 *                       type: integer
 *                 game_histories:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       game_session:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           difficulty_level:
 *                             type: integer
 *                           number_of_rounds:
 *                             type: integer
 *                           admin_instructions:
 *                             type: string
 *                           created_by_admin:
 *                             type: integer
 *                       score:
 *                         type: integer
 *                       accuracy:
 *                         type: integer
 *                       completed:
 *                         type: boolean
 *                       started_at:
 *                         type: string
 *                         format: date-time
 *                       completed_at:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Server error
 */
router.get('/my-history', verifyToken, getUserGameHistory);

/**
 * @swagger
 * /api/game/history-details/{historyId}:
 *   get:
 *     tags:
 *     - Game Controller - New History System
 *     summary: Get detailed round-by-round data for specific game history
 *     description: Retrieve comprehensive details including all user inputs and responses for a specific game history record
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: path
 *         name: historyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the game history record
 *     responses:
 *       200:
 *         description: Detailed game history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Game history details retrieved successfully
 *                 game_history:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     performance:
 *                       type: object
 *                       properties:
 *                         total_rounds:
 *                           type: integer
 *                         correct_answers:
 *                           type: integer
 *                         accuracy:
 *                           type: integer
 *                         final_score:
 *                           type: integer
 *                 detailed_rounds:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       round_number:
 *                         type: integer
 *                       question:
 *                         type: string
 *                         example: "15 ? 23"
 *                       user_answer:
 *                         type: string
 *                         example: "<"
 *                       correct_answer:
 *                         type: string
 *                         example: "<"
 *                       is_correct:
 *                         type: boolean
 *                       response_time:
 *                         type: number
 *                       points_earned:
 *                         type: integer
 *                       result_emoji:
 *                         type: string
 *                         example: "✅"
 *                 summary:
 *                   type: object
 *                   properties:
 *                     fastest_correct_time:
 *                       type: number
 *                     slowest_correct_time:
 *                       type: number
 *                     most_common_mistake:
 *                       type: object
 *                     performance_trend:
 *                       type: array
 *       404:
 *         description: Game history not found
 *       403:
 *         description: Access denied - can only view your own history
 *       500:
 *         description: Server error
 */
router.get('/history-details/:historyId', verifyToken, getGameHistoryDetails);

export default router; 