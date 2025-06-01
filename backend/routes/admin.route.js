import express from 'express';
import {
    createGameSessionForUser,
    getAdminCreatedSessions,
    getAvailableCustomers
} from '../controllers/admin.controller.js';
import { verifyToken } from '../middleware/verifyUser.js';

const router = express.Router();

/**
 * @swagger
 * /api/admin/customers/available:
 *   get:
 *     tags:
 *     - Admin Controller
 *     summary: Get available customers
 *     description: Retrieve list of active customers that can be assigned game sessions
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
 *           default: 50
 *     responses:
 *       200:
 *         description: Available customers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Available customers retrieved successfully
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
 *                 customers:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 5
 *                       username:
 *                         type: string
 *                         example: student_alice
 *                       full_name:
 *                         type: string
 *                         example: Alice Johnson
 *                       avatar:
 *                         type: string
 *                         example: https://example.com/avatar5.jpg
 *                       current_level:
 *                         type: integer
 *                         example: 3
 *                       experience_points:
 *                         type: integer
 *                         example: 2500
 *                       coins:
 *                         type: integer
 *                         example: 150
 *                       statistics:
 *                         type: object
 *                         properties:
 *                           games_played:
 *                             type: integer
 *                             example: 25
 *                           best_score:
 *                             type: integer
 *                             example: 850
 *                           total_score:
 *                             type: integer
 *                             example: 15000
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/customers/available', verifyToken, getAvailableCustomers);

/**
 * @swagger
 * /api/admin/game/create-for-user:
 *   post:
 *     tags:
 *     - Admin Controller
 *     summary: Create game session for customer
 *     description: Admin creates a new game session for a specific customer
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_id
 *             properties:
 *               customer_id:
 *                 type: integer
 *                 example: 5
 *                 description: ID of the customer to create session for
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
 *               instructions:
 *                 type: string
 *                 example: Focus on accuracy over speed today
 *                 description: Optional instructions from admin to customer
 *     responses:
 *       201:
 *         description: Game session created successfully for customer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Game session created successfully for customer
 *                 admin:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     username:
 *                       type: string
 *                       example: admin_teacher
 *                 customer:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 5
 *                     username:
 *                       type: string
 *                       example: student_alice
 *                     full_name:
 *                       type: string
 *                       example: Alice Johnson
 *                     current_level:
 *                       type: integer
 *                       example: 3
 *                     games_played:
 *                       type: integer
 *                       example: 25
 *                 game_session:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 156
 *                     difficulty_level:
 *                       type: integer
 *                       example: 3
 *                     number_of_rounds:
 *                       type: integer
 *                       example: 15
 *                     instructions:
 *                       type: string
 *                       example: Focus on accuracy over speed today
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - missing customer_id or invalid customer
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Customer not found
 *       500:
 *         description: Server error
 */
router.post('/game/create-for-user', verifyToken, createGameSessionForUser);

/**
 * @swagger
 * /api/admin/game/sessions:
 *   get:
 *     tags:
 *     - Admin Controller
 *     summary: Get admin-created game sessions
 *     description: Retrieve game sessions created by the current admin
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
 *           default: 20
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [all, active, completed]
 *           default: all
 *         description: Filter sessions by completion status
 *     responses:
 *       200:
 *         description: Admin-created game sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Admin-created game sessions retrieved successfully
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
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           username:
 *                             type: string
 *                           full_name:
 *                             type: string
 *                           current_level:
 *                             type: integer
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/game/sessions', verifyToken, getAdminCreatedSessions);

export default router; 