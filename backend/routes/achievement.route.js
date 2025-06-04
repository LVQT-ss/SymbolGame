import express from 'express';
import { verifyToken } from '../middleware/verifyUser.js';
import {
    createAchievement,
    getAllAchievements,
    getUserAchievements,
    checkUserAchievements,
    toggleShowcase,
    getAchievementLeaderboard,
    getPublicAchievements
} from '../controllers/achievement.controller.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Achievement:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Achievement ID
 *         name:
 *           type: string
 *           description: Achievement name
 *         description:
 *           type: string
 *           description: Achievement description
 *         category:
 *           type: string
 *           enum: [performance, progress, social, consistency, special, difficulty]
 *           description: Achievement category
 *         badge_color:
 *           type: string
 *           description: Hex color code for badge
 *         points:
 *           type: integer
 *           description: Points awarded for achievement
 *         coin_reward:
 *           type: integer
 *           description: Coins awarded for achievement
 *         experience_reward:
 *           type: integer
 *           description: Experience points awarded
 *         condition_type:
 *           type: string
 *           description: Type of condition to check
 *         condition_value:
 *           type: integer
 *           description: Target value for condition
 *         condition_operator:
 *           type: string
 *           enum: ['>=', '>', '=', '<', '<=']
 *           description: Comparison operator
 *         max_progress:
 *           type: integer
 *           description: Maximum progress for progressive achievements
 *         is_hidden:
 *           type: boolean
 *           description: Whether achievement is hidden until unlocked
 *         is_secret:
 *           type: boolean
 *           description: Whether achievement conditions are secret
 */

/**
 * @swagger
 * /api/achievements/public:
 *   get:
 *     summary: Get all public achievements (no authentication required)
 *     tags: [Achievements]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [performance, progress, social, consistency, special, difficulty]
 *         description: Filter by achievement category
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Number of achievements to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of achievements to skip
 *     responses:
 *       200:
 *         description: Public achievements retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 achievements:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Achievement'
 *                 achievements_by_category:
 *                   type: object
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     returned:
 *                       type: integer
 *                     categories:
 *                       type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     has_more:
 *                       type: boolean
 */
router.get('/public', getPublicAchievements);

/**
 * @swagger
 * /api/achievements/create:
 *   post:
 *     summary: Create a new achievement (Admin only)
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - condition_type
 *               - condition_value
 *             properties:
 *               name:
 *                 type: string
 *                 description: Achievement name
 *               description:
 *                 type: string
 *                 description: Achievement description
 *               category:
 *                 type: string
 *                 enum: [performance, progress, social, consistency, special, difficulty]
 *               points:
 *                 type: integer
 *                 minimum: 0
 *               coin_reward:
 *                 type: integer
 *                 minimum: 0
 *               experience_reward:
 *                 type: integer
 *                 minimum: 0
 *               condition_type:
 *                 type: string
 *                 description: Type of condition to check
 *               condition_value:
 *                 type: integer
 *                 description: Target value for condition
 *               condition_operator:
 *                 type: string
 *                 enum: ['>=', '>', '=', '<', '<=']
 *               max_progress:
 *                 type: integer
 *                 description: For progressive achievements
 *               is_hidden:
 *                 type: boolean
 *               is_secret:
 *                 type: boolean
 *               unlock_message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Achievement created successfully
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Admin privileges required
 *       409:
 *         description: Achievement name already exists
 */
router.post('/create', verifyToken, createAchievement);

/**
 * @swagger
 * /api/achievements:
 *   get:
 *     summary: Get all achievements with user progress
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [performance, progress, social, consistency, special, difficulty]
 *         description: Filter by achievement category
 *       - in: query
 *         name: rarity
 *         schema:
 *           type: string
 *           enum: [common, rare, epic, legendary]
 *         description: Filter by achievement rarity
 *       - in: query
 *         name: completed
 *         schema:
 *           type: boolean
 *         description: Filter by completion status
 *       - in: query
 *         name: showcased
 *         schema:
 *           type: boolean
 *         description: Filter by showcase status
 *     responses:
 *       200:
 *         description: Achievements retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 achievements:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Achievement'
 *                 total:
 *                   type: integer
 */
router.get('/', verifyToken, getAllAchievements);

/**
 * @swagger
 * /api/achievements/user/{userId}:
 *   get:
 *     summary: Get user's achievements and statistics
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *       - in: query
 *         name: completed
 *         schema:
 *           type: boolean
 *         description: Filter by completion status
 *       - in: query
 *         name: showcased
 *         schema:
 *           type: boolean
 *         description: Filter by showcase status
 *     responses:
 *       200:
 *         description: User achievements retrieved successfully
 *       404:
 *         description: User not found
 */
router.get('/user/:userId', verifyToken, getUserAchievements);

/**
 * @swagger
 * /api/achievements/check:
 *   post:
 *     summary: Check and award achievements for user
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               session_data:
 *                 type: object
 *                 properties:
 *                   game_session_id:
 *                     type: integer
 *                   consecutive_correct:
 *                     type: integer
 *                   accuracy_percentage:
 *                     type: number
 *                   average_response_time:
 *                     type: number
 *                   total_score:
 *                     type: integer
 *     responses:
 *       200:
 *         description: Achievement check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 newly_unlocked:
 *                   type: integer
 *                 progress_updated:
 *                   type: integer
 *                 achievements:
 *                   type: object
 *                   properties:
 *                     unlocked:
 *                       type: array
 *                       items:
 *                         type: object
 *                     updated:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.post('/check', verifyToken, checkUserAchievements);

/**
 * @swagger
 * /api/achievements/{id}/showcase:
 *   put:
 *     summary: Toggle achievement showcase status
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Achievement ID
 *     responses:
 *       200:
 *         description: Showcase status updated
 *       404:
 *         description: Achievement not found or not completed
 */
router.put('/:id/showcase', verifyToken, toggleShowcase);

/**
 * @swagger
 * /api/achievements/leaderboard:
 *   get:
 *     summary: Get achievement leaderboard
 *     tags: [Achievements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, all_time]
 *           default: all_time
 *         description: Time period for leaderboard
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           minimum: 1
 *           maximum: 100
 *         description: Number of top users to return
 *     responses:
 *       200:
 *         description: Achievement leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 period:
 *                   type: string
 *                 leaderboard:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       username:
 *                         type: string
 *                       full_name:
 *                         type: string
 *                       avatar:
 *                         type: string
 *                       current_level:
 *                         type: integer
 *                       achievement_count:
 *                         type: integer
 *                       total_points:
 *                         type: integer
 */
router.get('/leaderboard', verifyToken, getAchievementLeaderboard);

export default router; 