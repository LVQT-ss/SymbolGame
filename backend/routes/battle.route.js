import express from 'express';
import {
    createBattle,
    joinBattle,
    submitBattleRound,
    completeBattle,
    getBattleSession,
    getMyBattles,
    getAllBattles,
    getAvailableBattles
} from '../controllers/battle.controller.js';
import { verifyToken } from '../middleware/verifyUser.js';

const router = express.Router();

/**
 * @swagger
 * /api/battle/create:
 *   post:
 *     tags:
 *     - Battle Controller
 *     summary: Create a new battle session
 *     description: Create a new math comparison battle session that other players can join
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               number_of_rounds:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 20
 *                 default: 10
 *                 example: 15
 *                 description: Number of battle rounds
 *               time_limit:
 *                 type: integer
 *                 default: 600
 *                 example: 300
 *                 description: Total time limit for the battle in seconds
 *               is_public:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *                 description: Whether the battle is public or private
 *     responses:
 *       201:
 *         description: Battle created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Battle created successfully! Share the battle code with your opponent.
 *                 battle_session:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     battle_code:
 *                       type: string
 *                       example: "ABC12345"
 *                     number_of_rounds:
 *                       type: integer
 *                     time_limit:
 *                       type: integer
 *                     is_public:
 *                       type: boolean
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                 creator:
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
 *                     avatar:
 *                       type: string
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
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */
router.post('/create', verifyToken, createBattle);

/**
 * @swagger
 * /api/battle/join:
 *   post:
 *     tags:
 *     - Battle Controller
 *     summary: Join a battle using battle code
 *     description: Join an existing battle session using its unique battle code
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - battle_code
 *             properties:
 *               battle_code:
 *                 type: string
 *                 example: "ABC12345"
 *                 description: Unique battle code to join
 *     responses:
 *       200:
 *         description: Successfully joined battle
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully joined the battle! Battle is starting now.
 *                 battle_session:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     battle_code:
 *                       type: string
 *                     number_of_rounds:
 *                       type: integer
 *                     time_limit:
 *                       type: integer
 *                 creator:
 *                   type: object
 *                 opponent:
 *                   type: object
 *                 rounds:
 *                   type: array
 *       400:
 *         description: Battle code is required or invalid
 *       404:
 *         description: Battle not found
 *       409:
 *         description: Battle already has an opponent or is completed
 *       500:
 *         description: Server error
 */
router.post('/join', verifyToken, joinBattle);

/**
 * @swagger
 * /api/battle/submit-round:
 *   post:
 *     tags:
 *     - Battle Controller
 *     summary: Submit answer for a battle round
 *     description: Submit your symbol choice and response time for a specific battle round
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - battle_session_id
 *               - round_number
 *               - symbol_chosen
 *               - response_time
 *             properties:
 *               battle_session_id:
 *                 type: integer
 *                 example: 123
 *                 description: ID of the battle session
 *               round_number:
 *                 type: integer
 *                 example: 1
 *                 description: Current round number
 *               symbol_chosen:
 *                 type: string
 *                 enum: ['>', '<', '=']
 *                 example: ">"
 *                 description: Symbol chosen by the player
 *               response_time:
 *                 type: number
 *                 example: 2.5
 *                 description: Time taken to respond in seconds
 *     responses:
 *       200:
 *         description: Round submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Round submitted successfully!
 *                 is_correct:
 *                   type: boolean
 *                 correct_symbol:
 *                   type: string
 *                 round_winner:
 *                   type: string
 *                   nullable: true
 *                 both_completed:
 *                   type: boolean
 *       400:
 *         description: Missing required fields or invalid round
 *       403:
 *         description: Not part of this battle or round already submitted
 *       404:
 *         description: Battle or round not found
 *       500:
 *         description: Server error
 */
router.post('/submit-round', verifyToken, submitBattleRound);

/**
 * @swagger
 * /api/battle/complete:
 *   post:
 *     tags:
 *     - Battle Controller
 *     summary: Mark battle as completed for the user
 *     description: Complete the battle session and calculate final scores
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - battle_session_id
 *             properties:
 *               battle_session_id:
 *                 type: integer
 *                 example: 123
 *                 description: ID of the battle session to complete
 *               total_time:
 *                 type: number
 *                 example: 45.5
 *                 description: Total time taken for the battle in seconds
 *     responses:
 *       200:
 *         description: Battle completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 battle_completed:
 *                   type: boolean
 *                 your_results:
 *                   type: object
 *                   properties:
 *                     score:
 *                       type: integer
 *                     correct_answers:
 *                       type: integer
 *                     total_time:
 *                       type: number
 *                     completed:
 *                       type: boolean
 *                 battle_results:
 *                   type: object
 *                   nullable: true
 *       400:
 *         description: Battle session ID is required
 *       403:
 *         description: Not part of this battle
 *       404:
 *         description: Battle session not found
 *       500:
 *         description: Server error
 */
router.post('/complete', verifyToken, completeBattle);

/**
 * @swagger
 * /api/battle/{id}:
 *   get:
 *     tags:
 *     - Battle Controller
 *     summary: Get battle session details
 *     description: Retrieve detailed information about a specific battle session
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Battle session ID
 *     responses:
 *       200:
 *         description: Battle session retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Battle session retrieved successfully
 *                 battle_session:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     battle_code:
 *                       type: string
 *                     number_of_rounds:
 *                       type: integer
 *                     time_limit:
 *                       type: integer
 *                     creator_score:
 *                       type: integer
 *                     opponent_score:
 *                       type: integer
 *                     creator_correct_answers:
 *                       type: integer
 *                     opponent_correct_answers:
 *                       type: integer
 *                     creator_completed:
 *                       type: boolean
 *                     opponent_completed:
 *                       type: boolean
 *                     started_at:
 *                       type: string
 *                       format: date-time
 *                     completed_at:
 *                       type: string
 *                       format: date-time
 *                     is_public:
 *                       type: boolean
 *                 creator:
 *                   type: object
 *                 opponent:
 *                   type: object
 *                 winner:
 *                   type: object
 *                   nullable: true
 *                 rounds:
 *                   type: array
 *       403:
 *         description: Access denied to private battle
 *       404:
 *         description: Battle session not found
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/battle/my-battles:
 *   get:
 *     tags:
 *     - Battle Controller
 *     summary: Get user's battle history
 *     description: Retrieve the current user's battle history with pagination and filtering
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
 *         description: Number of battles per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ['completed', 'waiting', 'active']
 *         description: Filter battles by status
 *     responses:
 *       200:
 *         description: Battle history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Battle history retrieved successfully
 *                 battles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       battle_code:
 *                         type: string
 *                       number_of_rounds:
 *                         type: integer
 *                       creator:
 *                         type: object
 *                       opponent:
 *                         type: object
 *                       winner:
 *                         type: object
 *                       your_role:
 *                         type: string
 *                         enum: ['creator', 'opponent']
 *                       your_score:
 *                         type: integer
 *                       opponent_score:
 *                         type: integer
 *                       started_at:
 *                         type: string
 *                         format: date-time
 *                       completed_at:
 *                         type: string
 *                         format: date-time
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current_page:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *                     total_battles:
 *                       type: integer
 *                     per_page:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get('/my-battles', verifyToken, getMyBattles);

/**
 * @swagger
 * /api/battle/all:
 *   get:
 *     tags:
 *     - Battle Controller
 *     summary: Get all public battles
 *     description: Retrieve all public battles that are not completed
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
 *           default: 30
 *         description: Number of battles per page
 *     responses:
 *       200:
 *         description: Available battles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Available battles retrieved successfully
 *                 battles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       battle_code:
 *                         type: string
 *                       number_of_rounds:
 *                         type: integer
 *                       time_limit:
 *                         type: integer
 *                       creator:
 *                         type: object
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       time_since_created:
 *                         type: integer
 *                         description: Time since creation in seconds
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current_page:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *                     total_available:
 *                       type: integer
 *                     per_page:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get('/all', getAllBattles);

/**
 * @swagger
 * /api/battle/available:
 *   get:
 *     tags:
 *     - Battle Controller
 *     summary: Get available battles for joining
 *     description: Retrieve battles that can be joined or are currently active
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
 *           default: 30
 *         description: Number of battles per page
 *     responses:
 *       200:
 *         description: Available battles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Available battles retrieved successfully
 *                 battles:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       battle_code:
 *                         type: string
 *                       number_of_rounds:
 *                         type: integer
 *                       time_limit:
 *                         type: integer
 *                       creator:
 *                         type: object
 *                       opponent:
 *                         type: object
 *                         nullable: true
 *                       can_join:
 *                         type: boolean
 *                         description: Whether the battle can be joined
 *                       is_active:
 *                         type: boolean
 *                         description: Whether the battle is currently active
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       started_at:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                       time_since_created:
 *                         type: integer
 *                         description: Time since creation in seconds
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current_page:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *                     total_available:
 *                       type: integer
 *                     per_page:
 *                       type: integer
 *       500:
 *         description: Server error
 */
router.get('/available', getAvailableBattles);

/**
 * @swagger
 * /api/battle/{id}:
 *   get:
 *     tags:
 *     - Battle Controller
 *     summary: Get battle session details
 *     description: Retrieve detailed information about a specific battle session
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Battle session ID
 *     responses:
 *       200:
 *         description: Battle session retrieved successfully
 *       403:
 *         description: Access denied to private battle
 *       404:
 *         description: Battle session not found
 *       500:
 *         description: Server error
 */
router.get('/:id', verifyToken, getBattleSession);

export default router; 