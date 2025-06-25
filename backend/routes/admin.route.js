import express from 'express';
import {
    getCustomerCount,
    createSampleGames,
    updateUserLevels,
    recalculateAllLevels
} from '../controllers/admin.controller.js';
import { verifyToken } from '../middleware/verifyUser.js';

const router = express.Router();

/**
 * @swagger
 * /api/admin/customers/count:
 *   get:
 *     tags:
 *     - Admin Controller
 *     summary: Get customer count statistics
 *     description: Get count of active, inactive, and total customers
 *     security:
 *       - Authorization: []
 *     responses:
 *       200:
 *         description: Customer count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Customer count retrieved successfully
 *                 active_customers:
 *                   type: integer
 *                   example: 25
 *                 total_customers:
 *                   type: integer
 *                   example: 30
 *                 inactive_customers:
 *                   type: integer
 *                   example: 5
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/customers/count', verifyToken, getCustomerCount);
router.post('/create-sample-games', verifyToken, createSampleGames);

// 🆕 Level Management Endpoints
router.post('/users/update-levels', verifyToken, updateUserLevels);
router.post('/users/recalculate-all-levels', verifyToken, recalculateAllLevels);

export default router; 