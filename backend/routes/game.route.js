import express from 'express';
import {
    startGame,
    completeGame,
    getGameHistory,
    getGameSessionHistory,
    getGameStatsSummary,
    createGameWithCustomRounds,
    getAvailableGames,
    joinGame,
    getGameSession,
    submitRound,
    createInstantGame,
    // submitWholeGame,
    uploadGameRecording,
    upload,
    getMonthlyLeaderboard,
    getMonthlyLeaderboardFromRedis
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
 *                 maximum: 3
 *                 default: 1
 *                 example: 2
 *                 description: Game difficulty level (1=Easy, 2=Medium, 3=Hard)
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
 *                 maximum: 3
 *                 default: 1
 *                 example: 2
 *                 description: Game difficulty level (1=Easy, 2=Medium, 3=Hard)
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
 *                 maximum: 3
 *                 default: 1
 *                 example: 2
 *                 description: Game difficulty level (1=Easy, 2=Medium, 3=Hard)
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
// router.post('/submit-whole-game', verifyToken, submitWholeGame);

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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/stats/summary', verifyToken, getGameStatsSummary);

/**
 * @swagger
 * /api/game/session/{sessionId}/history:
 *   get:
 *     tags:
 *     - Game Controller
 *     summary: Get user's play history for a specific game session
 *     description: Retrieve all times the current user has played a specific game session, with detailed performance data
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - name: sessionId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Game session ID
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
 *         description: Game session history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 game_session:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     number_of_rounds:
 *                       type: integer
 *                     difficulty_level:
 *                       type: integer
 *                     admin_instructions:
 *                       type: string
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     times_played:
 *                       type: integer
 *                     best_score:
 *                       type: integer
 *                     average_score:
 *                       type: number
 *                     completion_rate:
 *                       type: number
 *                 plays:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       score:
 *                         type: integer
 *                       accuracy:
 *                         type: integer
 *                       completed:
 *                         type: boolean
 *                       total_time:
 *                         type: number
 *                       started_at:
 *                         type: string
 *                       completed_at:
 *                         type: string
 *       404:
 *         description: Game session not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/session/:sessionId/history', verifyToken, getGameSessionHistory);

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
 * /api/game/complete:
 *   post:
 *     tags:
 *     - Game Controller
 *     summary: Complete a game session with results (2 modes)
 *     description: |
 *       Submit final results for a game session. Supports two modes:
 *       
 *       **Mode 1: Complete Existing Game Session** (with game_session_id)
 *       - Must include first_number, second_number, user_symbol, response_time for each round
 *       - Numbers must match the original game session to prevent cheating
 *       
 *       **Mode 2: Create New Game Session** (without game_session_id)
 *       - Only requires user_symbol and response_time for each round
 *       - Server generates the numbers automatically
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
 *                 example: 8
 *                 description: ID of existing game session (optional - if not provided, creates new session)
 *               total_time:
 *                 type: number
 *                 format: float
 *                 example: 45.5
 *                 description: Total time taken to complete the game in seconds
 *               rounds:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     first_number:
 *                       type: integer
 *                       example: 40
 *                       description: First number from the comparison (REQUIRED for existing game sessions)
 *                     second_number:
 *                       type: integer
 *                       example: 48
 *                       description: Second number from the comparison (REQUIRED for existing game sessions)
 *                     user_symbol:
 *                       type: string
 *                       enum: ['>', '<', '=']
 *                       example: ">"
 *                       description: Symbol chosen by user (ALWAYS REQUIRED)
 *                     response_time:
 *                       type: number
 *                       format: float
 *                       example: 2.5
 *                       description: Time taken to answer in seconds (ALWAYS REQUIRED)
 *                 description: |
 *                   Round requirements depend on mode:
 *                   - Existing session: first_number, second_number, user_symbol, response_time
 *                   - New session: user_symbol, response_time only
 *               recording_url:
 *                 type: string
 *                 example: "https://example.com/recordings/game123.mp4"
 *                 description: URL to the game recording (optional)
 *               recording_duration:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 60
 *                 default: 5
 *                 example: 10
 *                 description: Duration of the game recording in seconds (optional)
 *               difficulty_level:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 3
 *                 default: 1
 *                 example: 2
 *                 description: Game difficulty level for new sessions (1=Easy, 2=Medium, 3=Hard)
 *           examples:
 *             existing_session:
 *               summary: Complete Existing Game Session
 *               value:
 *                 game_session_id: 8
 *                 total_time: 45.5
 *                 rounds:
 *                   - first_number: 40
 *                     second_number: 48
 *                     user_symbol: ">"
 *                     response_time: 2.5
 *                 recording_url: "https://example.com/recordings/game123.mp4"
 *                 recording_duration: 10
 *                 difficulty_level: 1
 *             new_session:
 *               summary: Create New Game Session
 *               value:
 *                 total_time: 30.0
 *                 rounds:
 *                   - user_symbol: "<"
 *                     response_time: 3.2
 *                   - user_symbol: ">"
 *                     response_time: 2.8
 *                   - user_symbol: "="
 *                     response_time: 4.1
 *                 difficulty_level: 2
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
 *                   example: Game completed successfully!
 *                 game_session:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     score:
 *                       type: integer
 *                     correct_answers:
 *                       type: integer
 *                     total_time:
 *                       type: number
 *                     recording_url:
 *                       type: string
 *                     recording_duration:
 *                       type: integer
 *                 rounds:
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
 *                       response_time:
 *                         type: number
 *                 rewards:
 *                   type: object
 *                   properties:
 *                     experience_gained:
 *                       type: integer
 *                     coins_earned:
 *                       type: integer
 *       400:
 *         description: Invalid input or missing required fields
 *       401:
 *         description: Unauthorized - Authentication required
 *       404:
 *         description: Game session or user not found
 *       409:
 *         description: Game session already completed
 *       500:
 *         description: Server error
 */
router.post('/complete', verifyToken, completeGame);



/**
 * @swagger
 * /api/game/upload-recording:
 *   post:
 *     tags:
 *     - Game Controller
 *     summary: Upload game recording video
 *     description: Upload a video recording of the game session (maximum 10 seconds)
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - video
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Video file of the game recording (max 10 seconds)
 *               duration:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 default: 5
 *                 description: Duration of the recording in seconds (max 10 seconds)
 *     responses:
 *       200:
 *         description: Video uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Video uploaded successfully
 *                 recording_url:
 *                   type: string
 *                   example: uploads/game-recordings/game-recording-123456.mp4
 *                 recording_duration:
 *                   type: integer
 *                   example: 5
 *       400:
 *         description: No video file uploaded, invalid file type, or duration exceeds 10 seconds
 *       500:
 *         description: Server error
 */
router.post('/upload-recording', verifyToken, upload.single('video'), uploadGameRecording);

// Đã di chuyển các route monthly-leaderboard và monthly-leaderboard-redis sang leaderboard.route.js

export default router; 