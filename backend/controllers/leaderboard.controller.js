import LeaderboardCache from '../model/leaderboard-cache.model.js';
import User from '../model/user.model.js';
import UserStatistics from '../model/user-statistics.model.js';
import GameHistory from '../model/game-history.model.js';
import GameSession from '../model/game-sessions.model.js';
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

const LeaderboardController = {
    // Get Global or Regional Leaderboard
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

            const whereClause = {
                difficulty_level: parseInt(difficulty_level),
                leaderboard_type: time_period === 'monthly' ? 'monthly' : 'allTime'
            };

            // Add region filter if not global
            if (region !== 'global') {
                whereClause.region = region;
            }

            // For monthly leaderboard, filter by current month
            if (time_period === 'monthly') {
                const startOfMonth = new Date();
                startOfMonth.setDate(1);
                startOfMonth.setHours(0, 0, 0, 0);
                whereClause.last_updated = { [Op.gte]: startOfMonth };
            }

            const leaderboard = await LeaderboardCache.findAll({
                where: whereClause,
                order: [['score', 'DESC'], ['total_time', 'ASC']], // Highest score first, then fastest time
                limit: parseInt(limit),
                attributes: [
                    'rank_position',
                    'full_name',
                    'avatar',
                    'current_level',
                    'score',
                    'total_time',
                    'total_games',
                    'region',
                    'country'
                ]
            });

            // Format response with medals and rankings
            const formattedLeaderboard = leaderboard.map((player, index) => ({
                ...player.toJSON(),
                medal: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null,
                isTopThree: index < 3,
                countryFlag: player.country ? getCountryFlag(player.country) : null
            }));

            res.status(200).json({
                success: true,
                data: formattedLeaderboard,
                metadata: {
                    difficulty_level: parseInt(difficulty_level),
                    region,
                    time_period,
                    total_players: formattedLeaderboard.length
                },
                message: 'Leaderboard retrieved successfully'
            });
        } catch (error) {
            console.error('Get leaderboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get leaderboard',
                error: error.message
            });
        }
    },

    // Update Leaderboard Cache
    updateLeaderboardCache: async (req, res) => {
        try {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            // Clear existing cache
            await LeaderboardCache.destroy({
                where: {}
            });

            // Process each difficulty level
            for (const difficulty_level of DIFFICULTY_LEVELS) {
                // Get all active users with their game sessions and history
                const users = await User.findAll({
                    include: [
                        {
                            model: GameHistory,
                            as: 'gameHistories',
                            include: [{
                                model: GameSession,
                                as: 'gameSession',
                                where: {
                                    difficulty_level,
                                    completed: true
                                },
                                required: true
                            }],
                            required: true
                        },
                        {
                            model: UserStatistics,
                            as: 'statistics',
                            required: false
                        }
                    ],
                    where: { is_active: true }
                });

                // Process users for different time periods and regions
                const processedUsers = users.map(user => {
                    // Get all completed games for this difficulty
                    const completedGames = user.gameHistories.filter(
                        history => history.gameSession && history.completed
                    );

                    if (completedGames.length === 0) {
                        return null; // Skip users with no completed games
                    }

                    // Calculate highest score and total time
                    const allTimeHighestScore = Math.max(...completedGames.map(game => game.score));
                    const totalTime = completedGames.reduce((sum, game) => sum + (game.total_time || 0), 0);

                    // Monthly calculations
                    const monthlyGames = completedGames.filter(
                        game => new Date(game.completed_at) >= startOfMonth
                    );
                    const monthlyHighestScore = monthlyGames.length > 0
                        ? Math.max(...monthlyGames.map(game => game.score))
                        : 0;
                    const monthlyTotalTime = monthlyGames.reduce((sum, game) => sum + (game.total_time || 0), 0);

                    return {
                        user,
                        allTimeScore: allTimeHighestScore,
                        allTimeTotalTime: totalTime,
                        monthlyScore: monthlyHighestScore,
                        monthlyTotalTime: monthlyTotalTime,
                        totalGames: completedGames.length,
                        monthlyGames: monthlyGames.length,
                        region: REGION_MAPPING[user.country] || 'others'
                    };
                }).filter(Boolean); // Remove null entries

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
                        user_id: data.user.id,
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
                        user_id: data.user.id,
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
                }
                if (monthlyEntries.length > 0) {
                    await LeaderboardCache.bulkCreate(monthlyEntries);
                }
            }

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