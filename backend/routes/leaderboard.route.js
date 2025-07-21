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