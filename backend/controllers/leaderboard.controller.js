import LeaderboardCache from '../model/leaderboard-cache.model.js';
import User from '../model/user.model.js';
import UserStatistics from '../model/user-statistics.model.js';
import GameHistory from '../model/game-history.model.js';
import GameSession from '../model/game-sessions.model.js';
import RedisLeaderboardService from '../services/redisLeaderboardService.js';
import redis from '../config/redis.config.js';
import { Op } from 'sequelize';

// Import associations to ensure they are set up
import '../model/associations.js';

// Region mapping from country codes
const REGION_MAPPING = {
    // Asia
    'VN': 'asia', 'JP': 'asia', 'KR': 'asia', 'CN': 'asia', 'TH': 'asia',
    'SG': 'asia', 'MY': 'asia', 'ID': 'asia', 'PH': 'asia', 'IN': 'asia',
    // America
    'US': 'america', 'CA': 'america', 'BR': 'america', 'MX': 'america',
    'AR': 'america', 'CL': 'america', 'CO': 'america', 'PE': 'america',
    // Europe
    'DE': 'europe', 'FR': 'europe', 'UK': 'europe', 'IT': 'europe',
    'ES': 'europe', 'NL': 'europe', 'SE': 'europe', 'NO': 'europe',
    // Oceania
    'AU': 'oceania', 'NZ': 'oceania', 'FJ': 'oceania',
    // Africa
    'ZA': 'africa', 'NG': 'africa', 'EG': 'africa', 'KE': 'africa'
};

const DIFFICULTY_LEVELS = [1, 2, 3]; // 1=Easy, 2=Medium, 3=Hard

const LeaderboardController = {
    // Get Monthly Leaderboard (PostgreSQL-first, Redis fallback for current month only)
    getLeaderboard: async (req, res) => {
        try {
            const {
                difficulty_level = 1,
                region = 'global',
                month_year = null, // Format: YYYY-MM (e.g., 2024-01)
                limit = 100,
                source = 'auto' // 'auto' (PostgreSQL-first), 'redis' (Redis-first), 'postgres' (PostgreSQL-only)
            } = req.query;

            // Validate difficulty level
            if (!DIFFICULTY_LEVELS.includes(parseInt(difficulty_level))) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid difficulty level. Must be 1 (Easy), 2 (Medium), or 3 (Hard)'
                });
            }

            // Validate month_year format if provided
            if (month_year && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month_year)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid month_year format. Must be YYYY-MM (e.g., 2024-01, 2024-12)'
                });
            }

            // Calculate the month_year to use for queries and responses
            let queryMonthYear, responseMonthYear;

            if (month_year) {
                queryMonthYear = month_year;
                responseMonthYear = month_year;
            } else {
                // If no specific month requested, get current month
                const currentDate = new Date();
                const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
                queryMonthYear = currentMonth;
                responseMonthYear = currentMonth;
            }

            console.log(`🏆 Getting monthly leaderboard: region=${region}, difficulty=${difficulty_level}, month_year=${responseMonthYear}, source=${source}`);

            // Handle Redis-first if explicitly requested
            if (source === 'redis') {
                console.log('🔴 Redis-first requested, getting current live data...');
                const redisLeaderboard = await RedisLeaderboardService.getLeaderboard(
                    region,
                    parseInt(difficulty_level),
                    'monthly',
                    parseInt(limit),
                    queryMonthYear
                );

                if (redisLeaderboard.length > 0) {
                    return res.status(200).json({
                        success: true,
                        data: redisLeaderboard,
                        metadata: {
                            difficulty_level: parseInt(difficulty_level),
                            region,
                            time_period: 'monthly',
                            total_players: redisLeaderboard.length,
                            source: 'redis_requested',
                            timestamp: new Date().toISOString(),
                            month_year: responseMonthYear
                        },
                        message: 'Monthly leaderboard retrieved successfully (Redis requested)'
                    });
                }
                // If Redis is empty, continue to PostgreSQL fallback below
                console.log('⚠️ Redis empty, falling back to PostgreSQL...');
            }

            // DEFAULT FLOW: Try PostgreSQL first (stored monthly snapshots)
            const whereClause = {
                difficulty_level: parseInt(difficulty_level),
                leaderboard_type: 'monthly',
                month_year: queryMonthYear
            };

            // Add region filter if not global
            if (region !== 'global') {
                whereClause.region = region;
            }

            console.log('📊 Querying PostgreSQL leaderboard first with whereClause:', whereClause);
            const postgresLeaderboard = await LeaderboardCache.findAll({
                where: whereClause,
                order: [['score', 'DESC'], ['total_time', 'ASC']],
                limit: parseInt(limit),
                attributes: [
                    'rank_position', 'full_name', 'avatar', 'current_level',
                    'score', 'total_time', 'total_games', 'region', 'country', 'month_year'
                ]
            });

            // If PostgreSQL has data, use it (this is the normal case)
            if (postgresLeaderboard.length > 0) {
                const finalPostgresLeaderboard = postgresLeaderboard.map((player, index) => ({
                    ...player.toJSON(),
                    rank_position: index + 1,
                    month_year: responseMonthYear, // Use calculated responseMonthYear for consistency
                    medal: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null,
                    isTopThree: index < 3,
                    countryFlag: player.country ? getCountryFlag(player.country) : null
                }));

                return res.status(200).json({
                    success: true,
                    data: finalPostgresLeaderboard,
                    metadata: {
                        difficulty_level: parseInt(difficulty_level),
                        region,
                        time_period: 'monthly',
                        total_players: finalPostgresLeaderboard.length,
                        source: 'postgresql',
                        month_year: responseMonthYear,
                        timestamp: new Date().toISOString()
                    },
                    message: 'Monthly leaderboard retrieved successfully (PostgreSQL)'
                });
            }

            // FALLBACK: If PostgreSQL is empty AND source allows Redis, try Redis
            if (source === 'postgres') {
                // PostgreSQL-only mode, don't try Redis
                return res.status(200).json({
                    success: true,
                    data: [],
                    metadata: {
                        difficulty_level: parseInt(difficulty_level),
                        region,
                        time_period: 'monthly',
                        total_players: 0,
                        source: 'postgresql_only',
                        month_year: responseMonthYear,
                        timestamp: new Date().toISOString()
                    },
                    message: 'No PostgreSQL data available for the specified criteria'
                });
            }

            console.log('⚠️ PostgreSQL leaderboard empty, checking Redis for current month data...');
            const leaderboard = await RedisLeaderboardService.getLeaderboard(
                region,
                parseInt(difficulty_level),
                'monthly',
                parseInt(limit),
                queryMonthYear // Pass queryMonthYear for filtering
            );

            // If Redis has data, use it (temporary current month data)
            if (leaderboard.length > 0) {
                res.status(200).json({
                    success: true,
                    data: leaderboard,
                    metadata: {
                        difficulty_level: parseInt(difficulty_level),
                        region,
                        time_period: 'monthly',
                        total_players: leaderboard.length,
                        source: 'redis_temporary',
                        month_year: responseMonthYear,
                        timestamp: new Date().toISOString(),
                        note: 'This is temporary current month data. Will be saved to PostgreSQL at month end.'
                    },
                    message: 'Monthly leaderboard retrieved successfully (Redis temporary data)'
                });
            } else {
                // Both PostgreSQL and Redis are empty
                return res.status(200).json({
                    success: true,
                    data: [],
                    metadata: {
                        difficulty_level: parseInt(difficulty_level),
                        region,
                        time_period: 'monthly',
                        total_players: 0,
                        source: 'empty',
                        month_year: responseMonthYear,
                        timestamp: new Date().toISOString()
                    },
                    message: 'No monthly leaderboard data available for the specified criteria'
                });
            }
        } catch (error) {
            console.error('Get leaderboard error:', error);

            // Emergency fallback to PostgreSQL on Redis error
            try {
                console.log('🆘 Redis error, emergency fallback to PostgreSQL...');
                const {
                    difficulty_level = 1,
                    region = 'global',
                    month_year = null,
                    limit = 100
                } = req.query;

                // Recalculate month_year for emergency fallback
                let emergencyMonthYear;
                if (month_year && /^\d{4}-(0[1-9]|1[0-2])$/.test(month_year)) {
                    emergencyMonthYear = month_year;
                } else {
                    const currentDate = new Date();
                    emergencyMonthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
                }

                const whereClause = {
                    difficulty_level: parseInt(difficulty_level),
                    leaderboard_type: 'monthly',
                    month_year: emergencyMonthYear
                };

                if (region !== 'global') {
                    whereClause.region = region;
                }

                const emergencyLeaderboard = await LeaderboardCache.findAll({
                    where: whereClause,
                    order: [['score', 'DESC'], ['total_time', 'ASC']],
                    limit: parseInt(limit)
                });

                const finalEmergencyLeaderboard = emergencyLeaderboard.map((player, index) => ({
                    ...player.toJSON(),
                    rank_position: index + 1,
                    month_year: emergencyMonthYear, // Use calculated emergencyMonthYear
                    medal: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null,
                    isTopThree: index < 3,
                    countryFlag: player.country ? getCountryFlag(player.country) : null
                }));

                return res.status(200).json({
                    success: true,
                    data: finalEmergencyLeaderboard,
                    metadata: {
                        difficulty_level: parseInt(difficulty_level),
                        region,
                        time_period: 'monthly',
                        total_players: finalEmergencyLeaderboard.length,
                        source: 'postgresql_emergency',
                        month_year: emergencyMonthYear,
                        timestamp: new Date().toISOString()
                    },
                    message: 'Monthly leaderboard retrieved successfully (emergency fallback)'
                });
            } catch (fallbackError) {
                console.error('Emergency fallback also failed:', fallbackError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to get monthly leaderboard from both Redis and PostgreSQL',
                    error: error.message
                });
            }
        }
    },

    // Get Redis Leaderboard (Redis-only - shows current live data only, no PostgreSQL fallback)
    getRedisLeaderboard: async (req, res) => {
        try {
            const startTime = Date.now();

            const {
                difficulty_level = 1,
                region = 'global',
                month_year = null,
                limit = 100
            } = req.query;

            // Validate difficulty level
            if (!DIFFICULTY_LEVELS.includes(parseInt(difficulty_level))) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid difficulty level. Must be 1 (Easy), 2 (Medium), or 3 (Hard)'
                });
            }

            // Validate region
            const validRegions = ['global', 'asia', 'america', 'europe', 'oceania', 'africa', 'others'];
            if (!validRegions.includes(region)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid region. Must be one of: ${validRegions.join(', ')}`
                });
            }

            // Validate month_year format if provided
            if (month_year && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month_year)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid month_year format. Must be YYYY-MM (e.g., 2024-01, 2024-12)'
                });
            }

            // Calculate the month_year to use for queries and responses
            let queryMonthYear, responseMonthYear;

            if (month_year) {
                queryMonthYear = month_year;
                responseMonthYear = month_year;
            } else {
                // If no specific month requested, get current month
                const currentDate = new Date();
                const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
                queryMonthYear = currentMonth;
                responseMonthYear = currentMonth;
            }

            console.log(`🔴 Getting Redis leaderboard (Redis-only): region=${region}, difficulty=${difficulty_level}, month_year=${responseMonthYear}`);

            // REDIS-ONLY: Get current live data from Redis (no PostgreSQL fallback)
            console.log('📊 Getting current live data from Redis...');
            const leaderboard = await RedisLeaderboardService.getLeaderboard(
                region,
                parseInt(difficulty_level),
                'monthly',
                parseInt(limit),
                queryMonthYear
            );

            const endTime = Date.now();
            const queryTime = endTime - startTime;

            // Check Redis connection status
            const redisStatus = await redis.ping();

            // Get additional Redis metadata
            const redisKey = RedisLeaderboardService.generateLeaderboardKey(region, parseInt(difficulty_level), 'monthly');
            const totalPlayersInRedis = await redis.zcard(redisKey);

            // Return Redis data if available, otherwise return empty (no PostgreSQL fallback)
            return res.status(200).json({
                success: true,
                data: leaderboard,
                metadata: {
                    difficulty_level: parseInt(difficulty_level),
                    region,
                    time_period: 'monthly',
                    total_players: leaderboard.length,
                    total_players_in_redis: totalPlayersInRedis,
                    source: leaderboard.length > 0 ? 'redis_live' : 'redis_empty',
                    redis_status: redisStatus,
                    query_time_ms: queryTime,
                    redis_key: redisKey,
                    month_year: responseMonthYear,
                    timestamp: new Date().toISOString(),
                    note: leaderboard.length > 0
                        ? 'Current live leaderboard data from Redis'
                        : 'No data available in Redis for specified criteria'
                },
                message: leaderboard.length > 0
                    ? 'Redis leaderboard retrieved successfully'
                    : 'No Redis data available for specified criteria'
            });

        } catch (error) {
            console.error('❌ Redis leaderboard error:', error);

            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve Redis leaderboard',
                error: {
                    message: error.message,
                    type: error.name || 'RedisError',
                    timestamp: new Date().toISOString()
                },
                metadata: {
                    source: 'redis_error',
                    fallback_used: false
                }
            });
        }
    },

    // Update Leaderboard Cache
    updateLeaderboardCache: async (req, res) => {
        try {
            console.log('🏆 Starting leaderboard cache update...');

            // Clear existing cache
            await LeaderboardCache.destroy({
                where: {}
            });

            // Process each difficulty level
            for (const difficulty_level of DIFFICULTY_LEVELS) {
                console.log(`🎯 Processing difficulty level ${difficulty_level}...`);

                // SIMPLIFIED APPROACH: Get UserStatistics directly instead of complex joins
                const userStats = await UserStatistics.findAll({
                    where: {
                        difficulty_level: difficulty_level,
                        best_score: { [Op.gt]: 0 }
                    },
                    order: [['best_score', 'DESC']]
                });

                console.log(`  Found ${userStats.length} users with scores for difficulty ${difficulty_level}`);

                if (userStats.length === 0) {
                    console.log(`  ⚠️  No users with scores for difficulty ${difficulty_level}, skipping...`);
                    continue;
                }

                // Process each UserStatistics entry
                const processedUsers = [];
                for (const stat of userStats) {
                    // Get user details
                    const user = await User.findByPk(stat.user_id, {
                        attributes: ['id', 'username', 'full_name', 'avatar', 'current_level', 'country', 'is_active']
                    });

                    if (!user || !user.is_active) {
                        console.log(`  ⚠️  User ${stat.user_id} not found or inactive, skipping...`);
                        continue;
                    }

                    processedUsers.push({
                        user,
                        userStatistics: stat, // Include the UserStatistics record
                        allTimeScore: stat.best_score,
                        allTimeTotalTime: stat.best_score_time || 0, // Now we have the best score time!
                        monthlyScore: stat.best_score, // Same as all-time for now
                        monthlyTotalTime: stat.best_score_time || 0,
                        totalGames: stat.games_played,
                        monthlyGames: stat.games_played, // Same as all-time for now
                        region: REGION_MAPPING[user.country] || 'others'
                    });
                }

                // Create cache entries for all-time scores
                const allTimeEntries = processedUsers
                    .sort((a, b) => {
                        // Sort by score descending, then by time ascending (faster is better)
                        if (b.allTimeScore !== a.allTimeScore) {
                            return b.allTimeScore - a.allTimeScore;
                        }
                        return a.allTimeTotalTime - b.allTimeTotalTime;
                    })
                    .map((data, index) => ({
                        leaderboard_type: 'allTime',
                        difficulty_level,
                        region: data.region,
                        user_statistics_id: data.userStatistics.id, // Reference UserStatistics instead of User
                        rank_position: index + 1,
                        score: data.allTimeScore,
                        total_time: data.allTimeTotalTime,
                        full_name: data.user.full_name || data.user.username,
                        avatar: data.user.avatar,
                        current_level: data.user.current_level,
                        country: data.user.country,
                        total_games: data.totalGames,
                        last_updated: new Date()
                    }));

                // Create cache entries for monthly scores
                const monthlyEntries = processedUsers
                    .filter(data => data.monthlyScore > 0)
                    .sort((a, b) => {
                        // Sort by score descending, then by time ascending (faster is better)
                        if (b.monthlyScore !== a.monthlyScore) {
                            return b.monthlyScore - a.monthlyScore;
                        }
                        return a.monthlyTotalTime - b.monthlyTotalTime;
                    })
                    .map((data, index) => ({
                        leaderboard_type: 'monthly',
                        difficulty_level,
                        region: data.region,
                        user_statistics_id: data.userStatistics.id, // Reference UserStatistics instead of User
                        rank_position: index + 1,
                        score: data.monthlyScore,
                        total_time: data.monthlyTotalTime,
                        full_name: data.user.full_name || data.user.username,
                        avatar: data.user.avatar,
                        current_level: data.user.current_level,
                        country: data.user.country,
                        total_games: data.monthlyGames,
                        last_updated: new Date(),
                        month_year: (() => {
                            const now = new Date();
                            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                        })()
                    }));

                // Bulk create all entries
                if (allTimeEntries.length > 0) {
                    await LeaderboardCache.bulkCreate(allTimeEntries);
                    console.log(`  ✅ Created ${allTimeEntries.length} all-time leaderboard entries for difficulty ${difficulty_level}`);
                }
                if (monthlyEntries.length > 0) {
                    await LeaderboardCache.bulkCreate(monthlyEntries);
                    console.log(`  ✅ Created ${monthlyEntries.length} monthly leaderboard entries for difficulty ${difficulty_level}`);
                }
            }

            console.log('🎉 Leaderboard cache updated successfully!');

            res.status(200).json({
                success: true,
                message: 'Leaderboard cache updated successfully'
            });
        } catch (error) {
            console.error('Update leaderboard cache error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update leaderboard cache',
                error: error.message
            });
        }
    },

    // Get User's Rank in Leaderboard
    getUserRank: async (req, res) => {
        try {
            const { userId } = req.params;
            const { type = 'regional', region } = req.query;

            const whereClause = {
                leaderboard_type: type,
                user_id: userId
            };

            if (region && type === 'regional') {
                whereClause.region = region;
            } else if (type === 'monthly') {
                whereClause.region = null;
            }

            const userRank = await LeaderboardCache.findOne({
                where: whereClause,
                attributes: ['rank_position', 'score', 'full_name']
            });

            if (!userRank) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found in leaderboard'
                });
            }

            res.status(200).json({
                success: true,
                data: userRank,
                message: 'User rank retrieved successfully'
            });
        } catch (error) {
            console.error('Get user rank error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get user rank',
                error: error.message
            });
        }
    },

    // Get available historical months for leaderboards
    getAvailableMonths: async (req, res) => {
        try {
            const { difficulty_level = null, region = null } = req.query;

            console.log(`📅 Getting available months: difficulty=${difficulty_level}, region=${region}`);

            const whereClause = {
                leaderboard_type: 'monthly',
                month_year: { [Op.not]: null }
            };

            // Add filters if provided
            if (difficulty_level) {
                whereClause.difficulty_level = parseInt(difficulty_level);
            }
            if (region && region !== 'global') {
                whereClause.region = region;
            } else if (region === 'global') {
                whereClause.region = null;
            }

            const availableMonths = await LeaderboardCache.findAll({
                where: whereClause,
                attributes: ['month_year'],
                group: ['month_year'],
                order: [['month_year', 'DESC']]
            });

            const months = availableMonths.map(entry => ({
                month_year: entry.month_year,
                display_name: formatMonthDisplay(entry.month_year)
            }));

            res.status(200).json({
                success: true,
                data: months,
                metadata: {
                    total_months: months.length,
                    difficulty_level: difficulty_level ? parseInt(difficulty_level) : 'all',
                    region: region || 'all'
                },
                message: 'Available months retrieved successfully'
            });
        } catch (error) {
            console.error('Get available months error:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to get available months',
                error: error.message
            });
        }
    },

    // Sync historical best scores from UserStatistics to Redis
    syncHistoricalScores: async (req, res) => {
        try {
            console.log('🔄 Manual sync of historical scores to Redis requested...');

            const result = await RedisLeaderboardService.syncHistoricalScoresToRedis();

            res.status(200).json({
                success: true,
                data: result,
                message: 'Historical scores synced to Redis successfully'
            });
        } catch (error) {
            console.error('Sync historical scores error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to sync historical scores to Redis',
                error: error.message
            });
        }
    },

    // Sync best scores from GameHistory to Redis (more comprehensive)
    syncGameHistoryScores: async (req, res) => {
        try {
            console.log('🔄 Manual sync of GameHistory best scores to Redis requested...');

            const result = await RedisLeaderboardService.syncBestScoresFromGameHistory();

            res.status(200).json({
                success: true,
                data: result,
                message: 'GameHistory best scores synced to Redis successfully'
            });
        } catch (error) {
            console.error('Sync GameHistory scores error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to sync GameHistory scores to Redis',
                error: error.message
            });
        }
    },

    // Get Monthly Leaderboard from Database (GameHistoryStatisticCurrentMonth)
    getMonthlyLeaderboard: async (req, res) => {
        try {
            const { difficulty_level = 1, limit = 20, month_year } = req.query;
            const GameHistoryStatisticCurrentMonth = (await import('../model/game-history-statistic-current-month.model.js')).default;

            // Xác định tháng hiện tại nếu không truyền vào
            let monthYear = month_year;
            if (!monthYear) {
                const now = new Date();
                monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            }

            // Query top N user theo best_score
            const topStats = await GameHistoryStatisticCurrentMonth.findAll({
                where: {
                    difficulty_level: difficulty_level,
                    month_year: monthYear
                },
                order: [
                    ['best_score', 'DESC'],
                    ['best_score_time', 'ASC']
                ],
                limit: parseInt(limit),
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'full_name', 'avatar', 'country', 'current_level']
                }]
            });

            // Map kết quả trả về
            const leaderboard = topStats.map((stat, idx) => ({
                user_id: stat.user_id,
                username: stat.user?.username,
                full_name: stat.user?.full_name,
                avatar: stat.user?.avatar,
                country: stat.user?.country,
                current_level: stat.user?.current_level,
                best_score: stat.best_score,
                best_score_time: stat.best_score_time,
                games_played: stat.games_played,
                total_score: stat.total_score,
                month_year: stat.month_year,
                rank: idx + 1
            }));

            res.json({
                month_year: monthYear,
                difficulty_level: parseInt(difficulty_level),
                leaderboard
            });
        } catch (err) {
            console.error('❌ Error getMonthlyLeaderboard:', err);
            res.status(500).json({ message: 'Server error', error: err.message });
        }
    },

    // Get Monthly Leaderboard from Redis
    getMonthlyLeaderboardFromRedis: async (req, res) => {
        try {
            const { difficulty_level = 1, limit = 20, month_year, region = 'global' } = req.query;

            // Validate difficulty level
            if (!DIFFICULTY_LEVELS.includes(parseInt(difficulty_level))) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid difficulty level. Must be 1 (Easy), 2 (Medium), or 3 (Hard)'
                });
            }

            let monthYear = month_year;
            if (!monthYear) {
                const now = new Date();
                monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            }

            console.log(`🏆 Getting monthly leaderboard from Redis: difficulty=${difficulty_level}, region=${region}, month_year=${monthYear}`);

            // Use the proper RedisLeaderboardService to get complete data with time-based ranking
            const leaderboard = await RedisLeaderboardService.getLeaderboard(
                region,
                parseInt(difficulty_level),
                'monthly',
                parseInt(limit),
                monthYear
            );

            console.log(`📊 Retrieved ${leaderboard.length} players from Redis monthly leaderboard`);

            // Return the complete data format (same as the other endpoints)
            res.status(200).json({
                success: true,
                data: leaderboard,
                metadata: {
                    month_year: monthYear,
                    difficulty_level: parseInt(difficulty_level),
                    region: region,
                    total_players: leaderboard.length,
                    source: 'redis_monthly_leaderboard',
                    timestamp: new Date().toISOString()
                },
                message: leaderboard.length > 0
                    ? 'Monthly leaderboard retrieved successfully from Redis'
                    : 'No monthly leaderboard data available for specified criteria'
            });
        } catch (err) {
            console.error('❌ Error getMonthlyLeaderboardFromRedis:', err);
            res.status(500).json({
                success: false,
                message: 'Server error',
                error: err.message
            });
        }
    }
};

// Helper function to format month display name
function formatMonthDisplay(monthYear) {
    if (!monthYear || monthYear.length !== 7) return monthYear;

    const [year, month] = monthYear.split('-');
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const monthIndex = parseInt(month) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
        return `${monthNames[monthIndex]} ${year}`;
    }

    return monthYear;
}

// Helper function to get country flag emoji
function getCountryFlag(countryCode) {
    if (!countryCode || countryCode.length !== 2) return null;

    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt());

    return String.fromCodePoint(...codePoints);
}

export default LeaderboardController; 