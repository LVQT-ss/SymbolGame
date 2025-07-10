import express from 'express';
import LeaderboardController from '../controllers/leaderboard.controller.js';
import RedisLeaderboardService from '../services/redisLeaderboardService.js';
import MonthlyLeaderboardJob from '../services/monthlyLeaderboardJob.js';
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
 * /api/leaderboard/redis:
 *   get:
 *     tags:
 *       - Leaderboard
 *     summary: Get Leaderboard from Redis Only
 *     description: |
 *       Retrieve leaderboard rankings directly from Redis cache with no PostgreSQL fallback.
 *       This endpoint provides real-time Redis performance metrics and ensures data comes
 *       exclusively from Redis for testing and performance analysis.
 *       
 *       **Key Differences from Standard Leaderboard:**
 *       - No PostgreSQL fallback if Redis fails
 *       - Returns detailed Redis performance metrics
 *       - Shows actual Redis key names and statistics
 *       - Includes query execution time
 *       - Returns error if Redis is unavailable
 *       
 *       **Use Cases:**
 *       - Testing Redis performance
 *       - Verifying Redis data integrity
 *       - Debugging Redis connectivity issues
 *       - Performance benchmarking
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
 *         name: time_period
 *         schema:
 *           type: string
 *           enum: [alltime, monthly]
 *           default: alltime
 *         description: |
 *           Time period filter:
 *           - alltime: All-time rankings
 *           - monthly: Current month rankings only
 *         example: "alltime"
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

// ==== NEW REDIS ENDPOINTS ====

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

// Store Redis data to database without rewards or clearing (manual backup)
router.post('/backup-to-database', verifyToken, async (req, res) => {
    try {
        const {
            includeRewards = false,
            clearMonthlyData = false,
            difficulty_levels = [1, 2, 3],
            regions = ['global', 'asia', 'america', 'europe', 'oceania', 'africa', 'others']
        } = req.body;

        console.log('💾 Manual Redis backup to database triggered by user:', req.userId);
        console.log(`📋 Options: rewards=${includeRewards}, clear=${clearMonthlyData}`);

        const result = await RedisLeaderboardService.backupToDatabase({
            includeRewards,
            clearMonthlyData,
            difficulty_levels,
            regions
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
 *       - Clears monthly Redis data (preserves all-time data)
 *       - Tests the complete end-of-month workflow
 *       
 *       **Important Notes:**
 *       - Only works in development mode (NODE_ENV !== 'production')
 *       - Awards go to GLOBAL top 3 players only (not regional)
 *       - Uses real database operations (coins are actually awarded)
 *       - Clears current monthly leaderboard data in Redis
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
 *                           description: Number of monthly Redis keys cleared
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
            message: 'Monthly rewards test completed'
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

export default router; 