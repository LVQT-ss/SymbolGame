import redis from '../config/redis.config.js';
import User from '../model/user.model.js';
import UserStatistics from '../model/user-statistics.model.js';
import LeaderboardCache from '../model/leaderboard-cache.model.js';
import sequelize from '../database/db.js';
import { Op } from 'sequelize';

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

// Monthly reward amounts - ONLY for global leaderboard
const MONTHLY_REWARDS = {
    1: 1000, // 1st place: 1000 coins
    2: 500,  // 2nd place: 500 coins
    3: 200   // 3rd place: 200 coins
};

class RedisLeaderboardService {
    // Generate Redis key for leaderboard
    static generateLeaderboardKey(region, difficulty, period) {
        return `leaderboard:${region}:${difficulty}:${period}`;
    }

    // Generate Redis key for user data in leaderboard
    static generateUserKey(userId, difficulty) {
        return `user:${userId}:${difficulty}`;
    }

    // Add or update user score in Redis leaderboard
    static async updateUserScore(userId, difficulty, score, totalTime, userData) {
        try {
            let user;
            if (userData && userData.is_active !== undefined) {
                // User data provided with all required fields
                user = userData;
                console.log(`🔄 Redis: Using provided user data for ${userId} (${userData.username})`);
            } else {
                // Need to fetch user data from database
                console.log(`🔍 Redis: Fetching user data for ${userId} from database...`);
                user = await User.findByPk(userId, {
                    attributes: ['id', 'username', 'full_name', 'avatar', 'current_level', 'country', 'is_active']
                });
                console.log(`📋 Redis: Database lookup result for ${userId}:`, user ? `Found ${user.username}` : 'Not found');
            }

            if (!user || !user.is_active) {
                throw new Error(`User ${userId} not found or inactive`);
            }

            const region = REGION_MAPPING[user.country] || 'others';

            // CHECK EXISTING BEST SCORE BEFORE UPDATE
            const userKey = this.generateUserKey(userId, difficulty);
            const existingData = await redis.hgetall(userKey);

            let shouldUpdate = false;
            let updateReason = '';

            if (!existingData || !existingData.best_score) {
                // No existing data, this is the first score
                shouldUpdate = true;
                updateReason = 'first score';
            } else {
                const existingScore = parseInt(existingData.best_score) || 0;
                const existingTime = parseFloat(existingData.best_time) || 999999;

                if (score > existingScore) {
                    // New score is higher - definite update
                    shouldUpdate = true;
                    updateReason = `higher score (${existingScore} → ${score})`;
                } else if (score === existingScore && totalTime < existingTime) {
                    // Same score but faster time - update
                    shouldUpdate = true;
                    updateReason = `same score, faster time (${existingTime}s → ${totalTime}s)`;
                } else {
                    // Score is lower or same score with slower time - no update
                    shouldUpdate = false;
                    updateReason = `no improvement (current: ${existingScore}/${existingTime}s, new: ${score}/${totalTime}s)`;
                }
            }

            if (!shouldUpdate) {
                console.log(`⏹️ Redis: No update for user ${userId} - ${updateReason}`);
                return false; // Return false to indicate no update
            }

            console.log(`🚀 Redis: Updating user ${userId} - ${updateReason}`);

            // Store user data in Redis hash with new best score
            await redis.hmset(userKey, {
                id: userId,
                username: user.username,
                full_name: user.full_name,
                avatar: user.avatar || '',
                current_level: user.current_level,
                country: user.country || '',
                region: region,
                best_score: score,
                best_time: totalTime,
                last_updated: new Date().toISOString()
            });

            // Set expiration for user data (1 year)
            await redis.expire(userKey, 365 * 24 * 60 * 60);

            // Update sorted sets for different leaderboard views
            const timestamp = Date.now();

            // Global leaderboards
            await redis.zadd(this.generateLeaderboardKey('global', difficulty, 'alltime'), score, userId);
            await redis.zadd(this.generateLeaderboardKey('global', difficulty, 'monthly'), score, userId);

            // Regional leaderboards
            await redis.zadd(this.generateLeaderboardKey(region, difficulty, 'alltime'), score, userId);
            await redis.zadd(this.generateLeaderboardKey(region, difficulty, 'monthly'), score, userId);

            // Store time as secondary sort criteria (faster time is better for same score)
            await redis.zadd(`${this.generateLeaderboardKey('global', difficulty, 'alltime')}:time`, totalTime, userId);
            await redis.zadd(`${this.generateLeaderboardKey('global', difficulty, 'monthly')}:time`, totalTime, userId);
            await redis.zadd(`${this.generateLeaderboardKey(region, difficulty, 'alltime')}:time`, totalTime, userId);
            await redis.zadd(`${this.generateLeaderboardKey(region, difficulty, 'monthly')}:time`, totalTime, userId);

            console.log(`✅ Updated Redis leaderboard for user ${userId}, difficulty ${difficulty}, score ${score}, time ${totalTime}s`);
            return true;
        } catch (error) {
            console.error('Error updating user score in Redis:', error);
            throw error;
        }
    }

    // Get leaderboard from Redis
    static async getLeaderboard(region = 'global', difficulty = 1, period = 'alltime', limit = 100, monthYear = null) {
        try {
            const leaderboardKey = this.generateLeaderboardKey(region, difficulty, period);
            const timeKey = `${leaderboardKey}:time`;

            // Get top scores (highest to lowest)
            const topUserIds = await redis.zrevrange(leaderboardKey, 0, limit - 1);

            if (topUserIds.length === 0) {
                return [];
            }

            // Get user data and times for each user
            const pipeline = redis.pipeline();
            const timePipeline = redis.pipeline();

            topUserIds.forEach(userId => {
                pipeline.hgetall(this.generateUserKey(userId, difficulty));
                timePipeline.zscore(timeKey, userId);
            });

            const [userDataResults, timeResults] = await Promise.all([
                pipeline.exec(),
                timePipeline.exec()
            ]);

            // Process results and build leaderboard with user data
            const leaderboard = [];
            for (let i = 0; i < topUserIds.length; i++) {
                const userData = userDataResults[i][1];
                const userTime = timeResults[i][1] || 0;

                if (userData && userData.id) {
                    // Use provided month_year or calculate current month_year for monthly leaderboards
                    let responseMonthYear = null;
                    if (period === 'monthly') {
                        if (monthYear) {
                            responseMonthYear = monthYear; // Use provided month_year
                        } else {
                            // Calculate current month_year if not provided
                            const currentDate = new Date();
                            responseMonthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
                        }
                    }

                    leaderboard.push({
                        user_id: parseInt(userData.id),
                        full_name: userData.full_name,
                        username: userData.username,
                        avatar: userData.avatar,
                        current_level: parseInt(userData.current_level),
                        score: parseInt(userData.best_score),
                        total_time: parseFloat(userTime),
                        region: userData.region,
                        country: userData.country,
                        month_year: responseMonthYear, // Add month_year field
                        countryFlag: userData.country ? this.getCountryFlag(userData.country) : null
                    });
                }
            }

            // 🚨 CRITICAL FIX: Sort by score (DESC) then by time (ASC) for equal scores
            leaderboard.sort((a, b) => {
                // First sort by score (highest to lowest)
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                // If scores are equal, sort by time (lowest to highest - faster time wins)
                return a.total_time - b.total_time;
            });

            // Add rank positions and medals AFTER sorting
            const rankedLeaderboard = leaderboard.map((player, index) => ({
                ...player,
                rank_position: index + 1,
                medal: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null,
                isTopThree: index < 3
            }));

            return rankedLeaderboard;
        } catch (error) {
            console.error('Error getting leaderboard from Redis:', error);
            throw error;
        }
    }

    // Flexible backup to PostgreSQL (manual or scheduled)
    static async backupToDatabase(options = {}) {
        const {
            includeRewards = false,
            clearMonthlyData = false,
            difficulty_levels = [1, 2, 3],
            regions = ['global', 'asia', 'america', 'europe', 'oceania', 'africa', 'others'],
            leaderboardType = 'monthly'
        } = options;

        try {
            console.log('💾 Starting Redis backup to PostgreSQL...');
            console.log(`📋 Options: rewards=${includeRewards}, clear=${clearMonthlyData}, type=${leaderboardType}`);

            // Get current month/year for monthly leaderboards
            const currentDate = new Date();
            const monthYear = leaderboardType === 'monthly'
                ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
                : null;

            console.log(`📅 Processing data for month: ${monthYear}`);

            const rewardedUsers = []; // Track users who got rewards
            let totalEntriesStored = 0;

            // Process each difficulty level
            for (const difficulty of difficulty_levels) {
                console.log(`📊 Processing difficulty level ${difficulty}...`);

                // Clear existing cache for this specific month/type/difficulty in PostgreSQL
                const clearWhereClause = {
                    leaderboard_type: leaderboardType,
                    difficulty_level: difficulty
                };
                if (monthYear) {
                    clearWhereClause.month_year = monthYear;
                }

                await LeaderboardCache.destroy({ where: clearWhereClause });
                console.log(`🧹 Cleared existing ${leaderboardType} cache for difficulty ${difficulty}`);

                // Handle rewards ONLY if requested and for global leaderboard
                if (includeRewards) {
                    const globalTop3 = await this.getLeaderboard('global', difficulty, 'monthly', 3);

                    // Award coins to global top 3 players
                    for (let rank = 0; rank < Math.min(3, globalTop3.length); rank++) {
                        const player = globalTop3[rank];
                        const rewardAmount = MONTHLY_REWARDS[rank + 1];

                        if (rewardAmount && player.user_id) {
                            try {
                                // Add coins to user account
                                await User.increment('coins', {
                                    by: rewardAmount,
                                    where: { id: player.user_id }
                                });

                                rewardedUsers.push({
                                    user_id: player.user_id,
                                    username: player.username,
                                    rank: rank + 1,
                                    difficulty: difficulty,
                                    coins_awarded: rewardAmount,
                                    score: player.score
                                });

                                console.log(`💰 Awarded ${rewardAmount} coins to ${player.username} (Rank ${rank + 1}, Difficulty ${difficulty})`);
                            } catch (rewardError) {
                                console.error(`Failed to award coins to user ${player.user_id}:`, rewardError);
                            }
                        }
                    }
                }

                // Get data for all requested regions to persist to PostgreSQL
                for (const region of regions) {
                    const dataToStore = await this.getLeaderboard(region, difficulty, leaderboardType, 500);

                    // Prepare cache entries - need to find UserStatistics IDs for each user
                    const cacheEntries = [];

                    for (const player of dataToStore) {
                        try {
                            // Find the UserStatistics record for this user and difficulty
                            const userStats = await UserStatistics.findOne({
                                where: {
                                    user_id: player.user_id,
                                    difficulty_level: difficulty
                                }
                            });

                            if (userStats) {
                                cacheEntries.push({
                                    leaderboard_type: leaderboardType,
                                    month_year: monthYear,
                                    region: region === 'global' ? null : region,
                                    difficulty_level: difficulty,
                                    user_statistics_id: userStats.id, // Use the UserStatistics.id instead of user_id
                                    rank_position: player.rank_position,
                                    score: player.score,
                                    total_time: player.total_time,
                                    full_name: player.full_name,
                                    avatar: player.avatar,
                                    current_level: player.current_level,
                                    country: player.country,
                                    total_games: 0, // Could be enhanced to get from UserStatistics
                                    last_updated: new Date()
                                });
                            } else {
                                console.warn(`⚠️ No UserStatistics found for user ${player.user_id} with difficulty ${difficulty}`);
                            }
                        } catch (statsError) {
                            console.error(`Error finding UserStatistics for user ${player.user_id}:`, statsError);
                        }
                    }

                    if (cacheEntries.length > 0) {
                        // Insert entries one by one to handle any remaining conflicts
                        let successfulInserts = 0;
                        for (const entry of cacheEntries) {
                            try {
                                // Use findOrCreate to avoid duplicates
                                const [createdEntry, wasCreated] = await LeaderboardCache.findOrCreate({
                                    where: {
                                        leaderboard_type: entry.leaderboard_type,
                                        month_year: entry.month_year,
                                        user_statistics_id: entry.user_statistics_id,
                                        region: entry.region,
                                        difficulty_level: entry.difficulty_level
                                    },
                                    defaults: entry
                                });

                                if (!wasCreated) {
                                    // Update existing record
                                    await createdEntry.update({
                                        rank_position: entry.rank_position,
                                        score: entry.score,
                                        total_time: entry.total_time,
                                        full_name: entry.full_name,
                                        avatar: entry.avatar,
                                        current_level: entry.current_level,
                                        country: entry.country,
                                        total_games: entry.total_games,
                                        last_updated: entry.last_updated
                                    });
                                    console.log(`📝 Updated existing entry: ID=${createdEntry.id}, type=${createdEntry.leaderboard_type}, month_year=${createdEntry.month_year}`);
                                } else {
                                    console.log(`✨ Created new entry: ID=${createdEntry.id}, type=${createdEntry.leaderboard_type}, month_year=${createdEntry.month_year}, user_stats_id=${createdEntry.user_statistics_id}`);
                                }

                                successfulInserts++;
                            } catch (entryError) {
                                console.warn(`⚠️ Failed to insert/update entry for user_statistics_id ${entry.user_statistics_id}:`, entryError.message);
                            }
                        }

                        totalEntriesStored += successfulInserts;
                        console.log(`✅ Stored ${successfulInserts}/${cacheEntries.length} entries for ${region} difficulty ${difficulty}`);
                    }
                }

                // Clear Redis data ONLY if requested
                if (clearMonthlyData) {
                    console.log(`🧹 Clearing Redis data for difficulty ${difficulty}...`);

                    // Clear ALL leaderboard data for this difficulty (both monthly and alltime)
                    const keysToDelete = [
                        `leaderboard:*:${difficulty}:monthly`,
                        `leaderboard:*:${difficulty}:monthly:time`,
                        `leaderboard:*:${difficulty}:alltime`,
                        `leaderboard:*:${difficulty}:alltime:time`,
                        `user:*:difficulty:${difficulty}` // Clear user data for this difficulty
                    ];

                    let totalKeysCleared = 0;
                    for (const pattern of keysToDelete) {
                        const keys = await redis.keys(pattern);
                        if (keys.length > 0) {
                            await redis.del(...keys);
                            totalKeysCleared += keys.length;
                            console.log(`🧹 Cleared ${keys.length} Redis keys matching ${pattern}`);
                        }
                    }

                    console.log(`✅ Cleared total of ${totalKeysCleared} Redis keys for difficulty ${difficulty}`);
                }
            }

            console.log('🎉 Redis backup to PostgreSQL completed successfully!');
            console.log(`📊 Total entries stored: ${totalEntriesStored}`);
            if (includeRewards) {
                console.log(`💎 Total users rewarded: ${rewardedUsers.length}`);
            }

            return {
                success: true,
                totalEntriesStored,
                rewardedUsers,
                options,
                message: 'Redis backup to PostgreSQL completed successfully'
            };
        } catch (error) {
            console.error('Error in Redis backup to PostgreSQL:', error);
            throw error;
        }
    }

    // Monthly persistence to PostgreSQL with rewards for global top 3
    static async persistMonthlyLeaderboard() {
        try {
            console.log('🏆 Starting monthly leaderboard persistence and rewards...');

            // Use the flexible backup method with monthly persistence options
            const result = await this.backupToDatabase({
                includeRewards: true,      // Give rewards to top 3 global players
                clearMonthlyData: true,    // Clear ALL Redis data after backup (monthly + alltime)
                difficulty_levels: DIFFICULTY_LEVELS,
                regions: ['global', 'asia', 'america', 'europe', 'oceania', 'africa', 'others'],
                leaderboardType: 'monthly'
            });

            console.log('🎉 Monthly persistence completed successfully!');
            console.log(`💎 Total users rewarded: ${result.rewardedUsers.length}`);

            return {
                success: true,
                rewardedUsers: result.rewardedUsers,
                totalEntriesStored: result.totalEntriesStored,
                message: 'Monthly leaderboard persisted and rewards distributed'
            };
        } catch (error) {
            console.error('Error in monthly persistence:', error);
            throw error;
        }
    }

    // Sync all UserStatistics to Redis (UserStatistics is source of truth)
    static async syncHistoricalScoresToRedis() {
        try {
            console.log('🔄 Starting sync of UserStatistics to Redis (UserStatistics = source of truth)...');

            // Use raw SQL query to get ALL UserStatistics with User data
            const userStatsQuery = `
                SELECT 
                    us.user_id,
                    us.difficulty_level,
                    us.best_score,
                    us.best_score_time,
                    us.games_played,
                    us.total_score,
                    u.username,
                    u.full_name,
                    u.avatar,
                    u.current_level,
                    u.country,
                    u.is_active
                FROM user_statistics us
                JOIN users u ON us.user_id = u.id
                WHERE us.best_score > 0 AND u.is_active = true
                ORDER BY us.difficulty_level ASC, us.best_score DESC
            `;

            const userStats = await sequelize.query(userStatsQuery, {
                type: sequelize.QueryTypes.SELECT
            });

            console.log(`📊 Found ${userStats.length} UserStatistics records to sync to Redis`);

            let syncedCount = 0;
            let skippedCount = 0;

            // Process each UserStatistics record
            for (const stat of userStats) {
                try {
                    // Create user object from the query result
                    const user = {
                        id: stat.user_id,
                        username: stat.username,
                        full_name: stat.full_name,
                        avatar: stat.avatar,
                        current_level: stat.current_level,
                        country: stat.country,
                        is_active: stat.is_active
                    };

                    // Sync UserStatistics best score to Redis
                    // This forces Redis to use UserStatistics data as the source of truth
                    const updated = await this.updateUserScore(
                        stat.user_id,
                        stat.difficulty_level,
                        stat.best_score,
                        stat.best_score_time || 0,
                        user // Pass user data to avoid extra database lookup
                    );

                    if (updated) {
                        syncedCount++;
                        console.log(`✅ Synced: ${user.username} - Difficulty ${stat.difficulty_level}, Score ${stat.best_score} (${stat.games_played} games)`);
                    } else {
                        console.log(`📊 Already synced: ${user.username} - Redis matches UserStatistics`);
                        skippedCount++;
                    }

                } catch (userError) {
                    console.error(`❌ Error syncing user ${stat.username}:`, userError.message);
                    skippedCount++;
                }
            }

            console.log('\n🎯 UserStatistics → Redis Sync Summary:');
            console.log(`✅ Successfully synced: ${syncedCount} scores`);
            console.log(`📊 Already up to date: ${skippedCount} scores`);
            console.log(`📊 Total processed: ${userStats.length} records`);
            console.log(`🏆 Redis leaderboard now reflects UserStatistics data`);

            // Get final leaderboard stats
            const finalStats = await this.getLeaderboardStats();
            console.log('\n📈 Final Redis Leaderboard Stats:');

            for (const [difficulty, regions] of Object.entries(finalStats)) {
                console.log(`\n${difficulty}:`);
                for (const [region, counts] of Object.entries(regions)) {
                    console.log(`  ${region}: ${counts.alltime_players} players`);
                }
            }

            return {
                success: true,
                totalProcessed: userStats.length,
                synced: syncedCount,
                skipped: skippedCount,
                message: 'UserStatistics synced to Redis successfully (UserStatistics is source of truth)'
            };

        } catch (error) {
            console.error('❌ Error syncing UserStatistics to Redis:', error);
            throw error;
        }
    }

    // Get best scores from GameHistory as alternative method (more comprehensive)
    static async syncBestScoresFromGameHistory() {
        try {
            console.log('🔄 Starting sync of best scores from GameHistory to Redis...');

            // Get best scores per user per difficulty from GameHistory + GameSessions
            const bestScoresQuery = `
                SELECT 
                    gh.user_id,
                    gs.difficulty_level,
                    MAX(gh.score) as best_score,
                    MIN(gh.total_time) as best_time,
                    MAX(gh.completed_at) as achieved_at,
                    COUNT(*) as total_games
                FROM game_history gh
                JOIN game_sessions gs ON gh.game_session_id = gs.id
                WHERE gh.completed = true 
                  AND gs.difficulty_level IS NOT NULL
                GROUP BY gh.user_id, gs.difficulty_level
                HAVING MAX(gh.score) > 0
                ORDER BY gs.difficulty_level ASC, MAX(gh.score) DESC
            `;

            const bestScores = await sequelize.query(bestScoresQuery, {
                type: sequelize.QueryTypes.SELECT
            });

            console.log(`📊 Found ${bestScores.length} best scores from GameHistory`);

            let syncedCount = 0;
            let skippedCount = 0;

            // Process each best score record
            for (const scoreRecord of bestScores) {
                try {
                    // Get user data
                    const user = await User.findByPk(scoreRecord.user_id, {
                        attributes: ['id', 'username', 'full_name', 'avatar', 'current_level', 'country', 'is_active']
                    });

                    if (!user || !user.is_active) {
                        console.log(`⚠️ Skipping user_id ${scoreRecord.user_id} - user not found or inactive`);
                        skippedCount++;
                        continue;
                    }

                    // Use the existing updateUserScore method
                    const updated = await this.updateUserScore(
                        scoreRecord.user_id,
                        scoreRecord.difficulty_level,
                        scoreRecord.best_score,
                        scoreRecord.best_time || 0,
                        user
                    );

                    if (updated) {
                        syncedCount++;
                        console.log(`✅ Synced: ${user.username} - Difficulty ${scoreRecord.difficulty_level}, Score ${scoreRecord.best_score} (${scoreRecord.total_games} games)`);
                    } else {
                        console.log(`📊 Skipped: ${user.username} - Redis already has better score`);
                        skippedCount++;
                    }

                } catch (userError) {
                    console.error(`❌ Error syncing user ${scoreRecord.user_id}:`, userError.message);
                    skippedCount++;
                }
            }

            console.log('\n🎯 GameHistory Sync Summary:');
            console.log(`✅ Successfully synced: ${syncedCount} scores`);
            console.log(`⏩ Skipped (no improvement): ${skippedCount} scores`);
            console.log(`📊 Total processed: ${bestScores.length} records`);

            return {
                success: true,
                totalProcessed: bestScores.length,
                synced: syncedCount,
                skipped: skippedCount,
                message: 'Best scores from GameHistory synced to Redis successfully'
            };

        } catch (error) {
            console.error('❌ Error syncing GameHistory scores to Redis:', error);
            throw error;
        }
    }

    // Get country flag emoji
    static getCountryFlag(countryCode) {
        if (!countryCode || countryCode.length !== 2) return null;

        const flagOffset = 0x1F1E6;
        const asciiOffset = 0x41;
        const firstChar = countryCode.codePointAt(0) - asciiOffset + flagOffset;
        const secondChar = countryCode.codePointAt(1) - asciiOffset + flagOffset;

        return String.fromCodePoint(firstChar, secondChar);
    }

    // Clear all Redis leaderboard data (for testing/maintenance)
    static async clearAllLeaderboards() {
        try {
            const keys = await redis.keys('leaderboard:*');
            const userKeys = await redis.keys('user:*');

            if (keys.length > 0) {
                await redis.del(...keys);
            }
            if (userKeys.length > 0) {
                await redis.del(...userKeys);
            }

            console.log(`🧹 Cleared ${keys.length + userKeys.length} Redis keys`);
            return true;
        } catch (error) {
            console.error('Error clearing Redis leaderboards:', error);
            throw error;
        }
    }

    // Check Redis leaderboard health and stats
    static async getLeaderboardStats() {
        try {
            const stats = {};

            for (const difficulty of DIFFICULTY_LEVELS) {
                stats[`difficulty_${difficulty}`] = {};

                const regions = ['global', 'asia', 'america', 'europe', 'oceania', 'africa', 'others'];
                for (const region of regions) {
                    const alltimeKey = this.generateLeaderboardKey(region, difficulty, 'alltime');
                    const monthlyKey = this.generateLeaderboardKey(region, difficulty, 'monthly');

                    const alltimeCount = await redis.zcard(alltimeKey);
                    const monthlyCount = await redis.zcard(monthlyKey);

                    stats[`difficulty_${difficulty}`][region] = {
                        alltime_players: alltimeCount,
                        monthly_players: monthlyCount
                    };
                }
            }

            return stats;
        } catch (error) {
            console.error('Error getting leaderboard stats:', error);
            throw error;
        }
    }
}

export default RedisLeaderboardService; 