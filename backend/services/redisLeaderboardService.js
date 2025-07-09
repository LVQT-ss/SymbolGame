import redis from '../config/redis.config.js';
import User from '../model/user.model.js';
import UserStatistics from '../model/user-statistics.model.js';
import LeaderboardCache from '../model/leaderboard-cache.model.js';
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

            // Store user data in Redis hash
            const userKey = this.generateUserKey(userId, difficulty);
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

            console.log(`✅ Updated Redis leaderboard for user ${userId}, difficulty ${difficulty}, score ${score}`);
            return true;
        } catch (error) {
            console.error('Error updating user score in Redis:', error);
            throw error;
        }
    }

    // Get leaderboard from Redis
    static async getLeaderboard(region = 'global', difficulty = 1, period = 'alltime', limit = 100) {
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

            // Process results
            const leaderboard = [];
            for (let i = 0; i < topUserIds.length; i++) {
                const userData = userDataResults[i][1];
                const userTime = timeResults[i][1] || 0;

                if (userData && userData.id) {
                    leaderboard.push({
                        rank_position: i + 1,
                        user_id: parseInt(userData.id),
                        full_name: userData.full_name,
                        username: userData.username,
                        avatar: userData.avatar,
                        current_level: parseInt(userData.current_level),
                        score: parseInt(userData.best_score),
                        total_time: parseFloat(userTime),
                        region: userData.region,
                        country: userData.country,
                        medal: i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null,
                        isTopThree: i < 3,
                        countryFlag: userData.country ? this.getCountryFlag(userData.country) : null
                    });
                }
            }

            return leaderboard;
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

            // Clear existing cache of the specified type in PostgreSQL
            await LeaderboardCache.destroy({
                where: {
                    leaderboard_type: leaderboardType
                }
            });

            const rewardedUsers = []; // Track users who got rewards
            let totalEntriesStored = 0;

            // Process each difficulty level
            for (const difficulty of difficulty_levels) {
                console.log(`📊 Processing difficulty level ${difficulty}...`);

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

                    // Save to PostgreSQL LeaderboardCache
                    const cacheEntries = dataToStore.map(player => ({
                        leaderboard_type: leaderboardType,
                        region: region === 'global' ? null : region,
                        difficulty_level: difficulty,
                        user_statistics_id: player.user_id,
                        rank_position: player.rank_position,
                        score: player.score,
                        total_time: player.total_time,
                        full_name: player.full_name,
                        avatar: player.avatar,
                        current_level: player.current_level,
                        country: player.country,
                        total_games: 0, // Could be enhanced to get from UserStatistics
                        last_updated: new Date()
                    }));

                    if (cacheEntries.length > 0) {
                        await LeaderboardCache.bulkCreate(cacheEntries);
                        totalEntriesStored += cacheEntries.length;
                        console.log(`✅ Stored ${cacheEntries.length} entries for ${region} difficulty ${difficulty}`);
                    }
                }

                // Clear Redis data ONLY if requested
                if (clearMonthlyData) {
                    const keysToDelete = [
                        `leaderboard:*:${difficulty}:${leaderboardType}`,
                        `leaderboard:*:${difficulty}:${leaderboardType}:time`
                    ];

                    for (const pattern of keysToDelete) {
                        const keys = await redis.keys(pattern);
                        if (keys.length > 0) {
                            await redis.del(...keys);
                            console.log(`🧹 Cleared ${keys.length} Redis keys matching ${pattern}`);
                        }
                    }
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
                clearMonthlyData: true,    // Clear monthly Redis data after backup
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