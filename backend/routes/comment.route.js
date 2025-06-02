import express from 'express';
import {
    createComment,
    getComments,
    updateComment,
    deleteComment
} from '../controllers/comment.controller.js';
import {
    likeSession,
    unlikeSession,
    getSessionLikes
} from '../controllers/like.controller.js';
import { verifyToken } from '../middleware/verifyUser.js';

const router = express.Router();

/**
 * @swagger
 * /api/game/sessions/{sessionId}/comments:
 *   post:
 *     tags:
 *     - Comment Controller
 *     summary: Create a comment on a game session
 *     description: Add a comment to a completed public game session. Customers can only comment on their own admin-assigned sessions.
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - name: sessionId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the game session to comment on
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Great job on this game! Your accuracy was impressive."
 *                 description: The comment content (max 1000 characters)
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Comment created successfully
 *                 comment:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 45
 *                     game_session_id:
 *                       type: integer
 *                       example: 123
 *                     content:
 *                       type: string
 *                       example: Great job on this game!
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         username:
 *                           type: string
 *                         full_name:
 *                           type: string
 *                         avatar:
 *                           type: string
 *       400:
 *         description: Bad request - missing or invalid content
 *       403:
 *         description: Forbidden - customers can only comment on their own admin-assigned sessions
 *       404:
 *         description: Game session not found or not available for comments
 *       500:
 *         description: Server error
 */
router.post('/sessions/:sessionId/comments', verifyToken, createComment);

/**
 * @swagger
 * /api/game/sessions/{sessionId}/comments:
 *   get:
 *     tags:
 *     - Comment Controller
 *     summary: Get comments for a game session
 *     description: Retrieve paginated comments for a completed public game session
 *     parameters:
 *       - name: sessionId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the game session
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
 *         description: Comments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Comments retrieved successfully
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
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 45
 *                       content:
 *                         type: string
 *                         example: Great job on this game!
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
 *                           avatar:
 *                             type: string
 *                           current_level:
 *                             type: integer
 *       404:
 *         description: Game session not found or not available for comments
 *       500:
 *         description: Server error
 */
router.get('/sessions/:sessionId/comments', getComments);

/**
 * @swagger
 * /api/game/sessions/{sessionId}/comments/{commentId}:
 *   put:
 *     tags:
 *     - Comment Controller
 *     summary: Update a comment
 *     description: Update your own comment or any comment if you're an admin
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - name: sessionId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the game session
 *       - name: commentId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the comment to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Updated comment content here"
 *                 description: The updated comment content
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Comment updated successfully
 *                 comment:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     content:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - missing or invalid content
 *       403:
 *         description: Forbidden - you can only edit your own comments
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 */
router.put('/sessions/:sessionId/comments/:commentId', verifyToken, updateComment);

/**
 * @swagger
 * /api/game/sessions/{sessionId}/comments/{commentId}:
 *   delete:
 *     tags:
 *     - Comment Controller
 *     summary: Delete a comment
 *     description: Delete your own comment or any comment if you're an admin
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - name: sessionId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the game session
 *       - name: commentId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the comment to delete
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Comment deleted successfully
 *       403:
 *         description: Forbidden - you can only delete your own comments
 *       404:
 *         description: Comment not found
 *       500:
 *         description: Server error
 */
router.delete('/sessions/:sessionId/comments/:commentId', verifyToken, deleteComment);

/**
 * @swagger
 * /api/game/sessions/{sessionId}/like:
 *   post:
 *     tags:
 *     - Like Controller
 *     summary: Like a game session
 *     description: Add a like to any game session
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - name: sessionId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the game session to like
 *     responses:
 *       201:
 *         description: Session liked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Session liked successfully
 *                 like:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     game_session_id:
 *                       type: integer
 *                     user_id:
 *                       type: integer
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                 new_likes_count:
 *                   type: integer
 *                   example: 15
 *       400:
 *         description: Bad request - already liked
 *       404:
 *         description: Game session not found
 *       500:
 *         description: Server error
 */
router.post('/sessions/:sessionId/like', verifyToken, likeSession);

/**
 * @swagger
 * /api/game/sessions/{sessionId}/like:
 *   delete:
 *     tags:
 *     - Like Controller
 *     summary: Unlike a game session
 *     description: Remove your like from a game session
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - name: sessionId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the game session to unlike
 *     responses:
 *       200:
 *         description: Session unliked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Session unliked successfully
 *                 new_likes_count:
 *                   type: integer
 *                   example: 14
 *       404:
 *         description: Like not found - you have not liked this session
 *       500:
 *         description: Server error
 */
router.delete('/sessions/:sessionId/like', verifyToken, unlikeSession);

/**
 * @swagger
 * /api/game/sessions/{sessionId}/likes:
 *   get:
 *     tags:
 *     - Like Controller
 *     summary: Get likes for a game session
 *     description: Retrieve paginated list of users who liked any game session
 *     parameters:
 *       - name: sessionId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the game session
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
 *         description: Session likes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Session likes retrieved successfully
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
 *                 likes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
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
 *                           avatar:
 *                             type: string
 *                           current_level:
 *                             type: integer
 *       404:
 *         description: Game session not found
 *       500:
 *         description: Server error
 */
router.get('/sessions/:sessionId/likes', getSessionLikes);

export default router; 