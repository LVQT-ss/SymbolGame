import express from 'express';
import {
    getFollowNotifications,
    markNotificationAsRead
} from '../controllers/notification.controller.js';
import { verifyToken } from '../middleware/verifyUser.js';

const router = express.Router();

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     tags:
 *     - Notification Controller
 *     summary: Get follow notifications
 *     description: Retrieve follow notifications for the authenticated user
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
 *       - name: unread_only
 *         in: query
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Show only unread notifications
 *     responses:
 *       200:
 *         description: Follow notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Follow notifications retrieved successfully
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
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       type:
 *                         type: string
 *                         example: follow
 *                       message:
 *                         type: string
 *                         example: John Doe started following you
 *                       is_read:
 *                         type: boolean
 *                         example: false
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       actor:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           username:
 *                             type: string
 *                           full_name:
 *                             type: string
 *                           avatar:
 *                             type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', verifyToken, getFollowNotifications);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     tags:
 *     - Notification Controller
 *     summary: Mark notification as read
 *     description: Mark a specific notification as read for the authenticated user
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *         description: ID of the notification to mark as read
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Notification marked as read successfully
 *                 notification:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     is_read:
 *                       type: boolean
 *                       example: true
 *                     read_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid notification ID
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.put('/:id/read', verifyToken, markNotificationAsRead);

export default router; 