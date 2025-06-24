import LeaderboardCache from '../model/leaderboard-cache.model.js';
import User from '../model/user.model.js';
import UserStatistics from '../model/user-statistics.model.js';
import GameHistory from '../model/game-history.model.js';
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

const LeaderboardController = {
    // Get Regional Leaderboard (Top 10 from all regions)
    getRegionalLeaderboard: async (req, res) => {
        try {
            const { difficulty_level } = req.query;

            const whereClause = {
                leaderboard_type: 'regional',
                rank_position: { [Op.lte]: 10 }
            };

            if (difficulty_level) {
                whereClause.difficulty_level = difficulty_level;
            }

            const leaderboard = await LeaderboardCache.findAll({
                where: whereClause,
                order: [['region', 'ASC'], ['rank_position', 'ASC']],
                attributes: [
                    'rank_position', 'full_name', 'avatar', 'current_level',
                    'score', 'total_games', 'region', 'country'
                ]
            });

            // Group by region
            const groupedByRegion = leaderboard.reduce((acc, player) => {
                if (!acc[player.region]) {
                    acc[player.region] = [];
                }
                acc[player.region].push({
                    ...player.toJSON(),
                    medal: player.rank_position === 1 ? '🥇' :
                        player.rank_position === 2 ? '🥈' :
                            player.rank_position === 3 ? '🥉' : null,
                    isTopThree: player.rank_position <= 3
                });
                return acc;
            }, {});

            res.status(200).json({
                success: true,
                data: groupedByRegion,
                message: 'Regional leaderboard retrieved successfully'
            });
        } catch (error) {
            console.error('Get regional leaderboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get regional leaderboard',
                error: error.message
            });
        }
    },

    // Get Monthly Global Leaderboard
    getMonthlyLeaderboard: async (req, res) => {
        try {
            const { difficulty_level, limit = 10 } = req.query;

            const whereClause = {
                leaderboard_type: 'monthly',
                region: null
            };

            if (difficulty_level) {
                whereClause.difficulty_level = difficulty_level;
            }

            const leaderboard = await LeaderboardCache.findAll({
                where: whereClause,
                order: [['rank_position', 'ASC']],
                limit: parseInt(limit),
                attributes: [
                    'rank_position', 'full_name', 'avatar', 'current_level',
                    'score', 'total_games', 'country'
                ]
            });

            const formattedLeaderboard = leaderboard.map((player, index) => ({
                ...player.toJSON(),
                medal: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null,
                isTopThree: index < 3
            }));

            res.status(200).json({
                success: true,
                data: formattedLeaderboard,
                message: 'Monthly leaderboard retrieved successfully'
            });
        } catch (error) {
            console.error('Get monthly leaderboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to get monthly leaderboard',
                error: error.message
            });
        }
    },

    // Update Regional Leaderboard Cache
    updateRegionalLeaderboard: async (req, res) => {
        try {
            // Clear existing regional cache
            await LeaderboardCache.destroy({
                where: { leaderboard_type: 'regional' }
            });

            // Get regions
            const regions = ['asia', 'america', 'europe', 'oceania', 'africa'];

            for (const region of regions) {
                // Get countries for this region
                const countriesInRegion = Object.keys(REGION_MAPPING).filter(
                    country => REGION_MAPPING[country] === region
                );

                // Get top players from this region
                const topPlayers = await User.findAll({
                    include: [{
                        model: UserStatistics,
                        as: 'statistics',
                        required: true
                    }],
                    where: {
                        country: { [Op.in]: countriesInRegion },
                        is_active: true
                    },
                    order: [['statistics', 'best_score', 'DESC']],
                    limit: 100 // Get top 100 to rank them
                });

                // Create cache entries
                const cacheEntries = topPlayers.map((user, index) => ({
                    leaderboard_type: 'regional',
                    region: region,
                    difficulty_level: null,
                    user_id: user.id,
                    rank_position: index + 1,
                    score: user.statistics.best_score,
                    full_name: user.full_name || user.username,
                    avatar: user.avatar,
                    current_level: user.current_level,
                    country: user.country,
                    total_games: user.statistics.games_played,
                    last_updated: new Date()
                }));

                await LeaderboardCache.bulkCreate(cacheEntries);
            }

            res.status(200).json({
                success: true,
                message: 'Regional leaderboard cache updated successfully'
            });
        } catch (error) {
            console.error('Update regional leaderboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update regional leaderboard',
                error: error.message
            });
        }
    },

    // Update Monthly Leaderboard Cache
    updateMonthlyLeaderboard: async (req, res) => {
        try {
            // Clear existing monthly cache
            await LeaderboardCache.destroy({
                where: { leaderboard_type: 'monthly' }
            });

            // Get top players this month based on game history
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const topPlayersThisMonth = await User.findAll({
                include: [
                    {
                        model: GameHistory,
                        as: 'gameHistories',
                        where: {
                            completed_at: { [Op.gte]: startOfMonth },
                            completed: true
                        },
                        required: true
                    },
                    {
                        model: UserStatistics,
                        as: 'statistics',
                        required: true
                    }
                ],
                where: { is_active: true },
                order: [[{ model: GameHistory, as: 'gameHistories' }, 'score', 'DESC']],
                limit: 100
            });

            // Process and rank players
            const playerScores = {};
            topPlayersThisMonth.forEach(user => {
                const bestScore = Math.max(...user.gameHistories.map(game => game.score));
                if (!playerScores[user.id] || playerScores[user.id].score < bestScore) {
                    playerScores[user.id] = {
                        user,
                        score: bestScore,
                        gamesThisMonth: user.gameHistories.length
                    };
                }
            });

            // Sort by score and create cache entries
            const sortedPlayers = Object.values(playerScores)
                .sort((a, b) => b.score - a.score);

            const cacheEntries = sortedPlayers.map((playerData, index) => ({
                leaderboard_type: 'monthly',
                region: null,
                difficulty_level: null,
                user_id: playerData.user.id,
                rank_position: index + 1,
                score: playerData.score,
                full_name: playerData.user.full_name || playerData.user.username,
                avatar: playerData.user.avatar,
                current_level: playerData.user.current_level,
                country: playerData.user.country,
                total_games: playerData.gamesThisMonth,
                last_updated: new Date()
            }));

            await LeaderboardCache.bulkCreate(cacheEntries);

            res.status(200).json({
                success: true,
                message: 'Monthly leaderboard cache updated successfully'
            });
        } catch (error) {
            console.error('Update monthly leaderboard error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update monthly leaderboard',
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

export default LeaderboardController; 