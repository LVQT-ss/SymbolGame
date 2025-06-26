import express from 'express';
import LeaderboardController from '../controllers/leaderboard.controller.js';
import { verifyToken } from '../middleware/verifyUser.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     LeaderboardEntry:
 *       type: object
 *       properties:
 *         rank_position:
 *           type: integer
 *           description: Player's current rank position
 *           example: 1
 *         full_name:
 *           type: string
 *           description: Player's full name or username
 *           example: "John Doe"
 *         avatar:
 *           type: string
 *           description: URL to player's avatar image
 *           example: "https://example.com/avatar.jpg"
 *         current_level:
 *           type: integer
 *           description: Player's current level
 *           example: 25
 *         score:
 *           type: integer
 *           description: Player's highest score for this difficulty
 *           example: 15420
 *         total_time:
 *           type: number
 *           format: float
 *           description: Total time spent playing in seconds
 *           example: 1245.5
 *         total_games:
 *           type: integer
 *           description: Total number of games played
 *           example: 42
 *         region:
 *           type: string
 *           description: Player's region
 *           enum: [asia, america, europe, others]
 *           example: "asia"
 *         country:
 *           type: string
 *           description: Player's country code (ISO 3166-1 alpha-2)
 *           example: "VN"
 *         medal:
 *           type: string
 *           description: Medal emoji for top 3 players
 *           example: "🥇"
 *         isTopThree:
 *           type: boolean
 *           description: Whether player is in top 3
 *           example: true
 *         countryFlag:
 *           type: string
 *           description: Country flag emoji
 *           example: "🇻🇳"
 *     LeaderboardResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/LeaderboardEntry'
 *         metadata:
 *           type: object
 *           properties:
 *             difficulty_level:
 *               type: integer
 *               description: Difficulty level (1=Easy, 2=Medium, 3=Hard)
 *               example: 1
 *             region:
 *               type: string
 *               description: Selected region filter
 *               example: "global"
 *             time_period:
 *               type: string
 *               description: Selected time period
 *               example: "allTime"
 *             total_players:
 *               type: integer
 *               description: Total number of players returned
 *               example: 50
 *         message:
 *           type: string
 *           example: "Leaderboard retrieved successfully"
 *     CacheUpdateResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Leaderboard cache updated successfully"
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Error message description"
 *         error:
 *           type: string
 *           example: "Detailed error information"
 */

/**
 * @swagger
 * /api/leaderboard:
 *   get:
 *     tags:
 *       - Leaderboard
 *     summary: Get Filtered Leaderboard
 *     description: |
 *       Retrieve leaderboard rankings with various filters including difficulty level, 
 *       region, and time period. Returns players ranked by highest score, with 
 *       fastest completion time as tiebreaker.
 *       
 *       **Features:**
 *       - Filter by 3 difficulty levels (1=Easy, 2=Medium, 3=Hard)
 *       - Regional filtering (Global, Asia, America, Europe, Others)
 *       - Time-based filtering (Monthly, All Time)
 *       - Country flags display
 *       - Medal system for top 3 players
 *       - Sorting by highest score + fastest time
 *     parameters:
 *       - in: query
 *         name: difficulty_level
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3]
 *           default: 1
 *         description: |
 *           Difficulty level filter:
 *           - 1: Easy
 *           - 2: Medium  
 *           - 3: Hard
 *         example: 1
 *       - in: query
 *         name: region
 *         schema:
 *           type: string
 *           enum: [global, asia, america, europe, others]
 *           default: global
 *         description: |
 *           Region filter:
 *           - global: All regions combined
 *           - asia: Asian countries (VN, JP, KR, CN, etc.)
 *           - america: American countries (US, CA, BR, MX, etc.)
 *           - europe: European countries (DE, FR, UK, IT, etc.)
 *           - others: All other regions
 *         example: "global"
 *       - in: query
 *         name: time_period
 *         schema:
 *           type: string
 *           enum: [monthly, allTime]
 *           default: allTime
 *         description: |
 *           Time period filter:
 *           - monthly: Current month rankings only
 *           - allTime: All-time rankings
 *         example: "allTime"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 500
 *           default: 100
 *         description: Maximum number of players to return
 *         example: 100
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LeaderboardResponse'
 *             examples:
 *               successful_response:
 *                 summary: Successful leaderboard response
 *                 value:
 *                   success: true
 *                   data:
 *                     - rank_position: 1
 *                       full_name: "SymbolMaster"
 *                       avatar: "https://i.pravatar.cc/150?img=1"
 *                       current_level: 45
 *                       score: 25400
 *                       total_time: 1245.5
 *                       total_games: 38
 *                       region: "asia"
 *                       country: "VN"
 *                       medal: "🥇"
 *                       isTopThree: true
 *                       countryFlag: "🇻🇳"
 *                     - rank_position: 2
 *                       full_name: "GameChampion"
 *                       avatar: "https://i.pravatar.cc/150?img=2"
 *                       current_level: 42
 *                       score: 24800
 *                       total_time: 1156.2
 *                       total_games: 35
 *                       region: "america"
 *                       country: "US"
 *                       medal: "🥈"
 *                       isTopThree: true
 *                       countryFlag: "🇺🇸"
 *                   metadata:
 *                     difficulty_level: 1
 *                     region: "global"
 *                     time_period: "allTime"
 *                     total_players: 2
 *                   message: "Leaderboard retrieved successfully"
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_difficulty:
 *                 summary: Invalid difficulty level
 *                 value:
 *                   success: false
 *                   message: "Invalid difficulty level. Must be 1 (Easy), 2 (Medium), or 3 (Hard)"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               server_error:
 *                 summary: Server error
 *                 value:
 *                   success: false
 *                   message: "Failed to get leaderboard"
 *                   error: "Database connection failed"
 */

// Get leaderboard with filters (difficulty, region, time period)
router.get('/', LeaderboardController.getLeaderboard);

/**
 * @swagger
 * /api/leaderboard/update-cache:
 *   post:
 *     tags:
 *       - Leaderboard
 *     summary: Update Leaderboard Cache
 *     description: |
 *       Manually trigger a complete refresh of the leaderboard cache. This endpoint 
 *       recalculates all leaderboard rankings across all difficulty levels, regions, 
 *       and time periods.
 *       
 *       **Process:**
 *       1. Clears existing cache entries
 *       2. Processes each difficulty level (1, 2, 3)
 *       3. Calculates highest scores and total times for each user
 *       4. Generates both monthly and all-time rankings
 *       5. Creates optimized cache entries for fast retrieval
 *       
 *       **Performance Notes:**
 *       - This operation can take several seconds for large datasets
 *       - Recommended to run during low-traffic periods
 *       - Automatically called after significant game events
 *       
 *       **Authorization:** Requires valid authentication token
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leaderboard cache updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CacheUpdateResponse'
 *             examples:
 *               successful_update:
 *                 summary: Successful cache update
 *                 value:
 *                   success: true
 *                   message: "Leaderboard cache updated successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               unauthorized:
 *                 summary: Missing authentication token
 *                 value:
 *                   success: false
 *                   message: "Access denied. No token provided."
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               forbidden:
 *                 summary: Insufficient permissions
 *                 value:
 *                   success: false
 *                   message: "Access denied. Insufficient permissions."
 *       500:
 *         description: Internal server error during cache update
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               update_failed:
 *                 summary: Cache update failed
 *                 value:
 *                   success: false
 *                   message: "Failed to update leaderboard cache"
 *                   error: "Database operation timed out"
 */

// Update leaderboard cache
router.post('/update-cache', verifyToken, LeaderboardController.updateLeaderboardCache);

export default router; 