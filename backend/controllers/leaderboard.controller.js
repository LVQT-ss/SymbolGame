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
    // Get Global or Regional Leaderboard (Redis-powered)
    getLeaderboard: async (req, res) => {
        try {
            const {
                difficulty_level = 1,
                region = 'global',
                time_period = 'allTime',
                limit = 100
            } = req.query;

            // Validate difficulty level
            if (!DIFFICULTY_LEVELS.includes(parseInt(difficulty_level))) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid difficulty level. Must be 1 (Easy), 2 (Medium), or 3 (Hard)'
                });
            }

            console.log(`🏆 Getting leaderboard: region=${region}, difficulty=${difficulty_level}, period=${time_period}`);

            // Get leaderboard from Redis
            const leaderboard = await RedisLeaderboardService.getLeaderboard(
                region,
                parseInt(difficulty_level),
                time_period,
                parseInt(limit)
            );

            // If Redis is empty and it's a fallback request, try PostgreSQL
            if (leaderboard.length === 0) {
                console.log('⚠️ Redis leaderboard empty, falling back to PostgreSQL...');

                const whereClause = {
                    difficulty_level: parseInt(difficulty_level),
                    leaderboard_type: time_period === 'monthly' ? 'monthly' : 'allTime'
                };

                // Add region filter if not global
                if (region !== 'global') {
                    whereClause.region = region;
                }

                const fallbackLeaderboard = await LeaderboardCache.findAll({
                    where: whereClause,
                    order: [['score', 'DESC'], ['total_time', 'ASC']],
                    limit: parseInt(limit),
                    attributes: [
                        'rank_position', 'full_name', 'avatar', 'current_level',
                        'score', 'total_time', 'total_games', 'region', 'country'
                    ]
                });

                const finalFallbackLeaderboard = fallbackLeaderboard.map((player, index) => ({
                    ...player.toJSON(),
                    rank_position: index + 1,
                    medal: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null,
                    isTopThree: index < 3,
                    countryFlag: player.country ? getCountryFlag(player.country) : null
                }));

                return res.status(200).json({
                    success: true,
                    data: finalFallbackLeaderboard,
                    metadata: {
                        difficulty_level: parseInt(difficulty_level),
                        region,
                        time_period,
                        total_players: finalFallbackLeaderboard.length,
                        source: 'postgresql_fallback'
                    },
                    message: 'Leaderboard retrieved successfully (PostgreSQL fallback)'
                });
            }

            res.status(200).json({
                success: true,
                data: leaderboard,
                metadata: {
                    difficulty_level: parseInt(difficulty_level),
                    region,
                    time_period,
                    total_players: leaderboard.length,
                    source: 'redis'
                },
                message: 'Leaderboard retrieved successfully'
            });
        } catch (error) {
            console.error('Get leaderboard error:', error);

            // Emergency fallback to PostgreSQL on Redis error
            try {
                console.log('🆘 Redis error, emergency fallback to PostgreSQL...');
                const {
                    difficulty_level = 1,
                    region = 'global',
                    time_period = 'allTime',
                    limit = 100
                } = req.query;

                const whereClause = {
                    difficulty_level: parseInt(difficulty_level),
                    leaderboard_type: time_period === 'monthly' ? 'monthly' : 'allTime'
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
                        time_period,
                        total_players: finalEmergencyLeaderboard.length,
                        source: 'postgresql_emergency'
                    },
                    message: 'Leaderboard retrieved successfully (emergency fallback)'
                });
            } catch (fallbackError) {
                console.error('Emergency fallback also failed:', fallbackError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to get leaderboard from both Redis and PostgreSQL',
                    error: error.message
                });
            }
        }
    },

    // Get Leaderboard directly from Redis (No PostgreSQL fallback)
    getRedisLeaderboard: async (req, res) => {
        try {
            const startTime = Date.now();

            const {
                difficulty_level = 1,
                region = 'global',
                time_period = 'alltime',
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

            // Validate time period
            const validPeriods = ['alltime', 'monthly'];
            if (!validPeriods.includes(time_period)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid time period. Must be one of: ${validPeriods.join(', ')}`
                });
            }

            console.log(`🔴 Getting REDIS-ONLY leaderboard: region=${region}, difficulty=${difficulty_level}, period=${time_period}`);

            // Get leaderboard ONLY from Redis (no fallback)
            const leaderboard = await RedisLeaderboardService.getLeaderboard(
                region,
                parseInt(difficulty_level),
                time_period,
                parseInt(limit)
            );

            const endTime = Date.now();
            const queryTime = endTime - startTime;

            // Check Redis connection status
            const redisStatus = await redis.ping();

            // Get additional Redis metadata
            const redisKey = RedisLeaderboardService.generateLeaderboardKey(region, parseInt(difficulty_level), time_period);
            const totalPlayersInRedis = await redis.zcard(redisKey);

            res.status(200).json({
                success: true,
                data: leaderboard,
                metadata: {
                    difficulty_level: parseInt(difficulty_level),
                    region,
                    time_period,
                    total_players: leaderboard.length,
                    total_players_in_redis: totalPlayersInRedis,
                    source: 'redis_only',
                    redis_status: redisStatus,
                    query_time_ms: queryTime,
                    redis_key: redisKey,
                    timestamp: new Date().toISOString()
                },
                message: 'Redis leaderboard retrieved successfully (Redis only, no fallback)'
            });
        } catch (error) {
            console.error('❌ Redis leaderboard error (no fallback):', error);

            // Return error immediately - NO PostgreSQL fallback
            return res.status(500).json({
                success: false,
                message: 'Redis leaderboard failed - no fallback available',
                error: {
                    message: error.message,
                    type: error.name || 'RedisError',
                    timestamp: new Date().toISOString()
                },
                metadata: {
                    source: 'redis_only',
                    fallback_used: false,
                    redis_available: false
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
                        last_updated: new Date()
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
    }
};

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