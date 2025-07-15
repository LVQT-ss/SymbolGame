import express from 'express';
import LeaderboardController from '../controllers/leaderboard.controller.js';
import RedisLeaderboardService from '../services/redisLeaderboardService.js';
import MonthlyLeaderboardJob from '../services/monthlyLeaderboardJob.js';
import { verifyToken } from '../middleware/verifyUser.js';
import redis from '../config/redis.config.js';

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
 *         month_year:
 *           type: string
 *           description: Month and year this leaderboard entry belongs to (YYYY-MM format, only for monthly leaderboards)
 *           example: "2024-12"
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
 *     summary: Get Monthly Leaderboard
 *     description: |
 *       Retrieve monthly leaderboard rankings with various filters including difficulty level, 
 *       region, and specific month/year. Returns players ranked by highest score, with 
 *       fastest completion time as tiebreaker.
 *       
 *       **Features:**
 *       - Filter by 3 difficulty levels (1=Easy, 2=Medium, 3=Hard)
 *       - Regional filtering (Global, Asia, America, Europe, Others)
 *       - Month/Year specific querying (for monthly leaderboards)
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
 *         name: month_year
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-(0[1-9]|1[0-2])$'
 *         description: |
 *           Specific month and year for monthly leaderboards (YYYY-MM format).
 *           If not provided, defaults to current month.
 *           Examples: "2024-01", "2024-12", "2025-01"
 *         example: "2024-12"
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
 * /api/leaderboard/redis:
 *   get:
 *     tags:
 *       - Leaderboard
 *     summary: Get Current Redis Leaderboard Data Only
 *     description: |
 *       Retrieve current leaderboard rankings directly from Redis cache with NO PostgreSQL fallback.
 *       This endpoint provides real-time Redis performance metrics and ensures data comes
 *       exclusively from Redis for testing and performance analysis.
 *       
 *       **Key Features:**
 *       - Redis-only data source (no database fallback)
 *       - Returns detailed Redis performance metrics
 *       - Shows actual Redis key names and statistics
 *       - Includes query execution time
 *       - Returns empty if Redis is unavailable or has no data
 *       
 *       **Use Cases:**
 *       - Testing Redis performance
 *       - Verifying Redis data integrity
 *       - Debugging Redis connectivity issues
 *       - Performance benchmarking
 *       - Getting live current month data only
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
 *           enum: [global, asia, america, europe, oceania, africa, others]
 *           default: global
 *         description: |
 *           Region filter:
 *           - global: All regions combined
 *           - asia: Asian countries
 *           - america: American countries
 *           - europe: European countries
 *           - oceania: Oceanic countries
 *           - africa: African countries
 *           - others: All other regions
 *         example: "global"
 *       - in: query
 *         name: month_year
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-(0[1-9]|1[0-2])$'
 *         description: |
 *           Specific month and year for Redis leaderboard (YYYY-MM format).
 *           If not provided, defaults to current month.
 *           Examples: "2024-01", "2024-12", "2025-01"
 *         example: "2024-12"
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
 *         description: Redis leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaderboardEntry'
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     difficulty_level:
 *                       type: integer
 *                       example: 1
 *                     region:
 *                       type: string
 *                       example: "global"
 *                     time_period:
 *                       type: string
 *                       example: "alltime"
 *                     total_players:
 *                       type: integer
 *                       description: Number of players returned
 *                       example: 50
 *                     total_players_in_redis:
 *                       type: integer
 *                       description: Total players available in Redis
 *                       example: 1250
 *                     source:
 *                       type: string
 *                       example: "redis_only"
 *                     redis_status:
 *                       type: string
 *                       example: "PONG"
 *                     query_time_ms:
 *                       type: integer
 *                       description: Query execution time in milliseconds
 *                       example: 15
 *                     redis_key:
 *                       type: string
 *                       description: Actual Redis key used
 *                       example: "leaderboard:global:1:alltime"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-09T10:30:00.000Z"
 *                 message:
 *                   type: string
 *                   example: "Redis leaderboard retrieved successfully (Redis only, no fallback)"
 *       400:
 *         description: Invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Redis connection failed - no fallback
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Redis leaderboard failed - no fallback available"
 *                 error:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "connect ECONNREFUSED"
 *                     type:
 *                       type: string
 *                       example: "RedisError"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     source:
 *                       type: string
 *                       example: "redis_only"
 *                     fallback_used:
 *                       type: boolean
 *                       example: false
 *                     redis_available:
 *                       type: boolean
 *                       example: false
 */

// Get leaderboard from Redis only (no PostgreSQL fallback)
router.get('/redis', LeaderboardController.getRedisLeaderboard);

/**
 * @swagger
 * /api/leaderboard/available-months:
 *   get:
 *     tags:
 *       - Leaderboard
 *     summary: Get available months for monthly leaderboards
 *     description: Returns a list of all months (YYYY-MM) for which monthly leaderboard data is available. Useful for populating month selectors in the UI.
 *     responses:
 *       200:
 *         description: List of available months retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month_year:
 *                         type: string
 *                         example: "2024-05"
 *                       display_name:
 *                         type: string
 *                         example: "May 2024"
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     total_months:
 *                       type: integer
 *                       example: 5
 *                 message:
 *                   type: string
 *                   example: "Available months retrieved successfully"
 *             examples:
 *               successful_response:
 *                 summary: Example response
 *                 value:
 *                   success: true
 *                   data:
 *                     - month_year: "2024-05"
 *                       display_name: "May 2024"
 *                     - month_year: "2024-04"
 *                       display_name: "April 2024"
 *                   metadata:
 *                     total_months: 2
 *                   message: "Available months retrieved successfully"
 *       500:
 *         description: Failed to get available months
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               error_response:
 *                 summary: Example error
 *                 value:
 *                   success: false
 *                   message: "Failed to get available months"
 *                   error: "Database error message"
 */

// Get available historical months for leaderboards  
router.get('/available-months', LeaderboardController.getAvailableMonths);

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

/**
 * @swagger
 * /api/leaderboard/monthly-persistence:
 *   post:
 *     tags:
 *       - Leaderboard
 *     summary: Manually Trigger Monthly Leaderboard Persistence
 *     description: |
 *       Manually triggers the monthly leaderboard persistence process. This endpoint:
 *       1. Persists current Redis leaderboard data to the database
 *       2. Processes rewards for global top 3 players
 *       3. Prepares the leaderboard for the new month
 *       
 *       **Features:**
 *       - Saves current month's leaderboard data
 *       - Awards rewards to top performers
 *       - Cleans up Redis for new month
 *       
 *       **Note:** Requires authentication token with appropriate permissions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly persistence completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     persisted_entries:
 *                       type: integer
 *                       example: 150
 *                     rewards_processed:
 *                       type: integer
 *                       example: 3
 *                     month_year:
 *                       type: string
 *                       example: "2024-03"
 *                 message:
 *                   type: string
 *                   example: "Monthly persistence and rewards completed"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Manual monthly persistence with rewards for global top 3
router.post('/monthly-persistence', verifyToken, async (req, res) => {
    try {
        console.log('🔧 Manual monthly persistence triggered by user:', req.userId);
        const result = await MonthlyLeaderboardJob.runManually();

        res.status(200).json({
            success: true,
            data: result,
            message: 'Monthly persistence and rewards completed'
        });
    } catch (error) {
        console.error('Error in manual monthly persistence:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to run monthly persistence',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/leaderboard/backup-to-database:
 *   post:
 *     tags:
 *       - Leaderboard
 *     summary: Backup Redis Leaderboard Data to Database
 *     description: |
 *       Manually triggers a backup of Redis leaderboard data to the database without processing rewards.
 *       This endpoint is useful for data persistence and backup purposes.
 *       
 *       **Features:**
 *       - Flexible backup options
 *       - Support for specific difficulty levels and regions
 *       - Optional rewards processing
 *       - Optional monthly data clearing
 *       
 *       **Note:** Requires authentication token with appropriate permissions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               includeRewards:
 *                 type: boolean
 *                 description: Whether to process rewards during backup
 *                 default: false
 *               clearMonthlyData:
 *                 type: boolean
 *                 description: Whether to clear monthly data after backup
 *                 default: false
 *               difficulty_levels:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   enum: [1, 2, 3]
 *                 description: Array of difficulty levels to backup
 *                 default: [1, 2, 3]
 *               regions:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [global, asia, america, europe, oceania, africa, others]
 *                 description: Array of regions to backup
 *               leaderboardType:
 *                 type: string
 *                 enum: [monthly, allTime]
 *                 description: Type of leaderboard data to backup
 *                 default: monthly
 *     responses:
 *       200:
 *         description: Backup completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     entries_backed_up:
 *                       type: integer
 *                       example: 250
 *                     difficulty_levels_processed:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: [1, 2, 3]
 *                     regions_processed:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["global", "asia", "america"]
 *                 message:
 *                   type: string
 *                   example: "Redis data backed up to database successfully"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Store Redis data to database without rewards or clearing (manual backup)
router.post('/backup-to-database', verifyToken, async (req, res) => {
    try {
        const {
            includeRewards = false,
            clearMonthlyData = false,
            difficulty_levels = [1, 2, 3],
            regions = ['global', 'asia', 'america', 'europe', 'oceania', 'africa', 'others'],
            leaderboardType = 'monthly'  // Add leaderboardType parameter for month_year support
        } = req.body;

        console.log('💾 Manual Redis backup to database triggered by user:', req.userId);
        console.log(`📋 Options: rewards=${includeRewards}, clear=${clearMonthlyData}, type=${leaderboardType}`);

        const result = await RedisLeaderboardService.backupToDatabase({
            includeRewards,
            clearMonthlyData,
            difficulty_levels,
            regions,
            leaderboardType  // Pass leaderboardType to enable month_year support
        });

        res.status(200).json({
            success: true,
            data: result,
            message: 'Redis data backed up to database successfully'
        });
    } catch (error) {
        console.error('Error in manual Redis backup:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to backup Redis data to database',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/leaderboard/monthly-job-status:
 *   get:
 *     tags:
 *       - Leaderboard
 *     summary: Get Monthly Job Status
 *     description: |
 *       Retrieves the current status of the monthly leaderboard persistence job.
 *       This endpoint provides information about the last run, next scheduled run,
 *       and any errors that may have occurred.
 *       
 *       **Features:**
 *       - Last run timestamp
 *       - Next scheduled run
 *       - Success/failure status
 *       - Error details if any
 *       
 *       **Note:** Requires authentication token with appropriate permissions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly job status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     last_run:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-03-01T00:00:00.000Z"
 *                     next_scheduled_run:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-04-01T00:00:00.000Z"
 *                     last_run_status:
 *                       type: string
 *                       enum: [success, failed, pending]
 *                       example: "success"
 *                     last_error:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     is_running:
 *                       type: boolean
 *                       example: false
 *                 message:
 *                   type: string
 *                   example: "Monthly job status retrieved"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

// Get monthly job status
router.get('/monthly-job-status', verifyToken, async (req, res) => {
    try {
        const status = MonthlyLeaderboardJob.getStatus();
        res.status(200).json({
            success: true,
            data: status,
            message: 'Monthly job status retrieved'
        });
    } catch (error) {
        console.error('Error getting monthly job status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get monthly job status',
            error: error.message
        });
    }
});

// Get Redis leaderboard statistics
router.get('/redis-stats', verifyToken, async (req, res) => {
    try {
        const stats = await RedisLeaderboardService.getLeaderboardStats();
        res.status(200).json({
            success: true,
            data: stats,
            message: 'Redis leaderboard statistics retrieved'
        });
    } catch (error) {
        console.error('Error getting Redis stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get Redis statistics',
            error: error.message
        });
    }
});

// Clear all Redis leaderboard data (admin only)
router.delete('/redis-clear', verifyToken, async (req, res) => {
    try {
        // Additional admin check could be added here
        console.log('🧹 Clearing all Redis leaderboard data - triggered by user:', req.userId);

        await RedisLeaderboardService.clearAllLeaderboards();

        res.status(200).json({
            success: true,
            message: 'All Redis leaderboard data cleared successfully'
        });
    } catch (error) {
        console.error('Error clearing Redis data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear Redis data',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/leaderboard/test-monthly-rewards:
 *   post:
 *     tags:
 *       - Leaderboard (Development)
 *     summary: Test End-of-Month Rewards Scenario
 *     description: |
 *       **🧪 DEVELOPMENT ONLY ENDPOINT**
 *       
 *       Simulates the end-of-month scenario to test the monthly rewards system.
 *       This endpoint is only available in development/testing environments.
 *       
 *       **What This Test Does:**
 *       - Identifies global top 3 players across all difficulty levels
 *       - Awards coins: 1st = 1000 coins, 2nd = 500 coins, 3rd = 200 coins
 *       - Simulates monthly persistence to PostgreSQL database
 *       - Clears ALL Redis data (monthly + alltime) to simulate fresh start
 *       - Tests the complete end-of-month workflow
 *       
 *       **Important Notes:**
 *       - Only works in development mode (NODE_ENV !== 'production')
 *       - Awards go to GLOBAL top 3 players only (not regional)
 *       - Uses real database operations (coins are actually awarded)
 *       - Clears ALL Redis leaderboard data (monthly + alltime)
 *       
 *       **Use Cases:**
 *       - Testing monthly reward distribution logic
 *       - Verifying end-of-month cleanup process
 *       - Development environment testing
 *       - QA validation of monthly features
 *     security:
 *       - Authorization: []
 *     responses:
 *       200:
 *         description: Monthly rewards test completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     winners:
 *                       type: array
 *                       description: List of global top 3 winners who received rewards
 *                       items:
 *                         type: object
 *                         properties:
 *                           rank:
 *                             type: integer
 *                             description: Winner's global rank position
 *                             example: 1
 *                           userId:
 *                             type: integer
 *                             description: Winner's user ID
 *                             example: 123
 *                           full_name:
 *                             type: string
 *                             description: Winner's display name
 *                             example: "John Doe"
 *                           coins_awarded:
 *                             type: integer
 *                             description: Number of coins awarded
 *                             example: 1000
 *                           previous_coins:
 *                             type: integer
 *                             description: Coins before reward
 *                             example: 2500
 *                           new_total_coins:
 *                             type: integer
 *                             description: Total coins after reward
 *                             example: 3500
 *                           highest_score:
 *                             type: integer
 *                             description: Player's highest score
 *                             example: 15420
 *                     persistence_stats:
 *                       type: object
 *                       description: Statistics about data persistence
 *                       properties:
 *                         monthly_records_saved:
 *                           type: integer
 *                           description: Number of monthly records saved to PostgreSQL
 *                           example: 150
 *                         redis_keys_cleared:
 *                           type: integer
 *                           description: Number of Redis keys cleared (all data)
 *                           example: 45
 *                         processing_time:
 *                           type: string
 *                           description: Time taken to complete the operation
 *                           example: "1.2 seconds"
 *                     test_environment:
 *                       type: object
 *                       description: Test environment information
 *                       properties:
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                           description: When the test was executed
 *                           example: "2024-01-01T02:00:00.000Z"
 *                         triggered_by:
 *                           type: integer
 *                           description: User ID who triggered the test
 *                           example: 1
 *                         mode:
 *                           type: string
 *                           description: Test mode indicator
 *                           example: "manual_test"
 *                 message:
 *                   type: string
 *                   example: "Monthly rewards test completed"
 *             examples:
 *               successful_test:
 *                 summary: Successful monthly rewards test
 *                 value:
 *                   success: true
 *                   data:
 *                     winners:
 *                       - rank: 1
 *                         userId: 123
 *                         full_name: "Alice Smith"
 *                         coins_awarded: 1000
 *                         previous_coins: 2500
 *                         new_total_coins: 3500
 *                         highest_score: 15420
 *                       - rank: 2
 *                         userId: 456
 *                         full_name: "Bob Johnson"
 *                         coins_awarded: 500
 *                         previous_coins: 1800
 *                         new_total_coins: 2300
 *                         highest_score: 14850
 *                       - rank: 3
 *                         userId: 789
 *                         full_name: "Carol Wilson"
 *                         coins_awarded: 200
 *                         previous_coins: 1200
 *                         new_total_coins: 1400
 *                         highest_score: 14200
 *                     persistence_stats:
 *                       monthly_records_saved: 150
 *                       redis_keys_cleared: 45
 *                       processing_time: "1.2 seconds"
 *                     test_environment:
 *                       timestamp: "2024-01-01T02:00:00.000Z"
 *                       triggered_by: 1
 *                       mode: "manual_test"
 *                   message: "Monthly rewards test completed"
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
 *         description: Forbidden - Production environment or insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Test endpoints not available in production"
 *             examples:
 *               production_blocked:
 *                 summary: Test endpoint blocked in production
 *                 value:
 *                   success: false
 *                   message: "Test endpoints not available in production"
 *               insufficient_permissions:
 *                 summary: Insufficient permissions
 *                 value:
 *                   success: false
 *                   message: "Access denied. Insufficient permissions."
 *       500:
 *         description: Internal server error during test execution
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               test_failed:
 *                 summary: Test execution failed
 *                 value:
 *                   success: false
 *                   message: "Failed to run monthly rewards test"
 *                   error: "Redis connection timeout"
 */

// Test endpoint for end-of-month scenario (development only)
router.post('/test-monthly-rewards', verifyToken, async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                success: false,
                message: 'Test endpoints not available in production'
            });
        }

        console.log('🧪 Testing monthly rewards - triggered by user:', req.userId);
        const result = await MonthlyLeaderboardJob.testEndOfMonth();

        res.status(200).json({
            success: true,
            data: result,
            message: 'Monthly rewards test completed. Note: Run /sync-historical-scores to restore Redis functionality for game completion.'
        });
    } catch (error) {
        console.error('Error in monthly rewards test:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to run monthly rewards test',
            error: error.message
        });
    }
});

// Restore Redis functionality after monthly test (development helper)
router.post('/restore-redis-after-monthly', verifyToken, async (req, res) => {
    try {
        console.log('🔧 Restoring Redis functionality after monthly test - triggered by user:', req.userId);

        // Sync historical scores to restore Redis data
        const syncResult = await RedisLeaderboardService.syncHistoricalScoresToRedis();

        res.status(200).json({
            success: true,
            data: syncResult,
            message: 'Redis functionality restored. Game completion should work normally now.'
        });
    } catch (error) {
        console.error('Error restoring Redis functionality:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to restore Redis functionality',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/leaderboard/test-clear-redis:
 *   post:
 *     tags:
 *       - Leaderboard
 *     summary: Test Redis Clearing (Development Only)
 *     description: |
 *       Test endpoint to clear Redis leaderboard data for specified difficulties.
 *       This simulates the Redis clearing process that happens during monthly resets
 *       without the backup/reward distribution. Useful for testing fresh leaderboard
 *       state. Only available in development environment.
 *       
 *       **What gets cleared:**
 *       - Monthly leaderboard data
 *       - Alltime leaderboard data  
 *       - User score cache data
 *       - Time ranking data
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               difficulty_level:
 *                 type: integer
 *                 enum: [1, 2, 3]
 *                 description: Specific difficulty to clear (if not provided, clears all difficulties)
 *                 example: 1
 *           example:
 *             difficulty_level: 1
 *     responses:
 *       200:
 *         description: Redis clearing test completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalKeysCleared:
 *                       type: integer
 *                       description: Total number of Redis keys cleared
 *                       example: 45
 *                     difficultiesProcessed:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       description: List of difficulty levels processed
 *                       example: [1]
 *                     clearResults:
 *                       type: object
 *                       description: Detailed clearing results per difficulty
 *                       example:
 *                         difficulty_1:
 *                           keysCleared: 15
 *                           patterns:
 *                             "leaderboard:*:1:monthly": 5
 *                             "leaderboard:*:1:alltime": 10
 *                             "user:*:difficulty:1": 0
 *                 message:
 *                   type: string
 *                   example: "Redis clearing test completed - cleared 45 keys"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Production environment
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Test endpoints not available in production"
 *       500:
 *         description: Internal server error during Redis clearing
 */

// Test endpoint for clearing Redis data only (development only)
router.post('/test-clear-redis', verifyToken, async (req, res) => {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({
                success: false,
                message: 'Test endpoints not available in production'
            });
        }

        const { difficulty_level } = req.body;
        const difficulties = difficulty_level ? [parseInt(difficulty_level)] : [1, 2, 3];

        console.log(`🧪 Testing Redis clearing for difficulties: ${difficulties.join(', ')} - triggered by user:`, req.userId);

        let totalKeysCleared = 0;
        const clearResults = {};

        for (const difficulty of difficulties) {
            console.log(`🧹 Clearing Redis data for difficulty ${difficulty}...`);

            // Clear ALL leaderboard data for this difficulty (both monthly and alltime)
            const keysToDelete = [
                `leaderboard:*:${difficulty}:monthly`,
                `leaderboard:*:${difficulty}:monthly:time`,
                `leaderboard:*:${difficulty}:alltime`,
                `leaderboard:*:${difficulty}:alltime:time`,
                `user:*:difficulty:${difficulty}` // Clear user data for this difficulty
            ];

            let difficultyKeysCleared = 0;
            const patternResults = {};

            for (const pattern of keysToDelete) {
                const keys = await redis.keys(pattern);
                if (keys.length > 0) {
                    await redis.del(...keys);
                    difficultyKeysCleared += keys.length;
                    patternResults[pattern] = keys.length;
                    console.log(`🧹 Cleared ${keys.length} Redis keys matching ${pattern}`);
                } else {
                    patternResults[pattern] = 0;
                }
            }

            totalKeysCleared += difficultyKeysCleared;
            clearResults[`difficulty_${difficulty}`] = {
                keysCleared: difficultyKeysCleared,
                patterns: patternResults
            };

            console.log(`✅ Cleared total of ${difficultyKeysCleared} Redis keys for difficulty ${difficulty}`);
        }

        res.status(200).json({
            success: true,
            data: {
                totalKeysCleared,
                difficultiesProcessed: difficulties,
                clearResults
            },
            message: `Redis clearing test completed - cleared ${totalKeysCleared} keys`
        });
    } catch (error) {
        console.error('Error in Redis clearing test:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to run Redis clearing test',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/leaderboard/sync-historical-scores:
 *   post:
 *     tags:
 *       - Leaderboard
 *     summary: Sync Historical Best Scores to Redis
 *     description: |
 *       Syncs all historical best scores from UserStatistics table to Redis leaderboard.
 *       This populates Redis with existing player best scores so the leaderboard shows
 *       historical data, not just new games. Only updates Redis if the score is better
 *       than what's currently stored.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Historical scores synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProcessed:
 *                       type: integer
 *                       description: Total number of records processed
 *                       example: 150
 *                     synced:
 *                       type: integer
 *                       description: Number of scores actually synced to Redis
 *                       example: 120
 *                     skipped:
 *                       type: integer
 *                       description: Number of scores skipped (Redis had better)
 *                       example: 30
 *                 message:
 *                   type: string
 *                   example: "Historical scores synced to Redis successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/sync-historical-scores', verifyToken, LeaderboardController.syncHistoricalScores);

/**
 * @swagger
 * /api/leaderboard/sync-gamehistory-scores:
 *   post:
 *     tags:
 *       - Leaderboard
 *     summary: Sync Best Scores from GameHistory to Redis
 *     description: |
 *       Syncs best scores calculated from GameHistory + GameSessions to Redis leaderboard.
 *       This is more comprehensive than UserStatistics sync as it calculates actual
 *       best scores per user per difficulty from raw game data. Only updates Redis
 *       if the score is better than what's currently stored.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: GameHistory best scores synced successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProcessed:
 *                       type: integer
 *                       description: Total number of best score records processed
 *                       example: 200
 *                     synced:
 *                       type: integer
 *                       description: Number of scores actually synced to Redis
 *                       example: 185
 *                     skipped:
 *                       type: integer
 *                       description: Number of scores skipped (Redis had better)
 *                       example: 15
 *                 message:
 *                   type: string
 *                   example: "GameHistory best scores synced to Redis successfully"
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/sync-gamehistory-scores', verifyToken, LeaderboardController.syncGameHistoryScores);

/**
 * @swagger
 * /api/leaderboard/monthly-leaderboard:
 *   get:
 *     tags:
 *     - Leaderboard
 *     summary: Get monthly leaderboard from Database
 *     description: Retrieve the top players for the current month based on game performance from the database table game_history_statistic_current_month.
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: query
 *         name: difficulty_level
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3]
 *           default: 1
 *         required: false
 *         description: Difficulty level (1=Easy, 2=Medium, 3=Hard)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         required: false
 *         description: Number of top users to return
 *       - in: query
 *         name: month_year
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-(0[1-9]|1[0-2])$'
 *         required: false
 *         description: Month and year in format YYYY-MM - defaults to current month
 *         example: "2024-12"
 *     responses:
 *       200:
 *         description: Monthly leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 month_year:
 *                   type: string
 *                   example: "2024-12"
 *                 difficulty_level:
 *                   type: integer
 *                   example: 1
 *                 leaderboard:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: integer
 *                         example: 123
 *                       username:
 *                         type: string
 *                         example: "player123"
 *                       full_name:
 *                         type: string
 *                         example: "John Doe"
 *                       avatar:
 *                         type: string
 *                         example: "https://example.com/avatar.jpg"
 *                       country:
 *                         type: string
 *                         example: "VN"
 *                       current_level:
 *                         type: integer
 *                         example: 25
 *                       best_score:
 *                         type: integer
 *                         example: 15420
 *                       best_score_time:
 *                         type: number
 *                         format: float
 *                         example: 125.5
 *                       games_played:
 *                         type: integer
 *                         example: 42
 *                       total_score:
 *                         type: integer
 *                         example: 50000
 *                       month_year:
 *                         type: string
 *                         example: "2024-12"
 *                       rank:
 *                         type: integer
 *                         example: 1
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/monthly-leaderboard', LeaderboardController.getMonthlyLeaderboard);

/**
 * @swagger
 * /api/leaderboard/monthly-leaderboard-redis:
 *   get:
 *     tags:
 *     - Leaderboard
 *     summary: Get monthly leaderboard from Redis
 *     description: Retrieve the top players for the current month based on game performance from Redis sorted sets.
 *     security:
 *       - Authorization: []
 *     parameters:
 *       - in: query
 *         name: difficulty_level
 *         schema:
 *           type: integer
 *           enum: [1, 2, 3]
 *           default: 1
 *         required: false
 *         description: Difficulty level (1=Easy, 2=Medium, 3=Hard)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         required: false
 *         description: Number of top users to return
 *       - in: query
 *         name: month_year
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-(0[1-9]|1[0-2])$'
 *         required: false
 *         description: Month and year in format YYYY-MM - defaults to current month
 *         example: "2024-12"
 *     responses:
 *       200:
 *         description: Monthly leaderboard retrieved successfully from Redis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 month_year:
 *                   type: string
 *                   example: "2024-12"
 *                 difficulty_level:
 *                   type: integer
 *                   example: 1
 *                 leaderboard:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       user_id:
 *                         type: string
 *                         example: "123"
 *                       username:
 *                         type: string
 *                         example: "player123"
 *                       full_name:
 *                         type: string
 *                         example: "John Doe"
 *                       avatar:
 *                         type: string
 *                         example: "https://example.com/avatar.jpg"
 *                       country:
 *                         type: string
 *                         example: "VN"
 *                       current_level:
 *                         type: integer
 *                         example: 25
 *                       rank:
 *                         type: integer
 *                         example: 1
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/monthly-leaderboard-redis', LeaderboardController.getMonthlyLeaderboardFromRedis);

export default router; 