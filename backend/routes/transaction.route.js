import express from 'express';
import { verifyToken } from '../middleware/verifyUser.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         user_id:
 *           type: integer
 *         type:
 *           type: string
 *           enum: [coin_purchase, reward_claim, achievement_bonus]
 *         amount:
 *           type: integer
 *         description:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/transaction/history:
 *   get:
 *     tags:
 *     - Transaction
 *     summary: Get user transaction history
 *     security:
 *       - Authorization: []
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/history', verifyToken, getUserTransactionHistory);

/**
 * @swagger
 * /api/transaction/create:
 *   post:
 *     tags:
 *     - Transaction
 *     summary: Create new transaction
 *     security:
 *       - Authorization: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [coin_purchase, reward_claim, achievement_bonus]
 *               amount:
 *                 type: integer
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       400:
 *         description: Invalid transaction data
 */
router.post('/create', verifyToken, createTransaction);

// Placeholder controller functions - TODO: Implement in controller
async function getUserTransactionHistory(req, res) {
    res.status(501).json({
        message: 'Transaction history endpoint not implemented yet',
        status: 'TODO'
    });
}

async function createTransaction(req, res) {
    res.status(501).json({
        message: 'Create transaction endpoint not implemented yet',
        status: 'TODO'
    });
}

export default router;
