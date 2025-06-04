import User from '../model/user.model.js';
import LeaderboardEntry from '../model/leaderboard-entries.model.js';
import UserStatistics from '../model/user-statistics.model.js';
import UserAchievement from '../model/user-achievements.model.js';
import sequelize from '../database/db.js';
import { Op } from 'sequelize';

// GET /api/leaderboard - Get leaderboard for specific type and period
export const getLeaderboard = async (req, res) => {
    const {
        type = 'overall_score',
        period = 'all_time',
        limit = 50,
        offset = 0
    } = req.query;
    const userId = req.userId;

    try {
        // Validate leaderboard type
        const validTypes = [
            'overall_score', 'best_single_game', 'speed_masters', 'accuracy_kings',
            'experience_leaders', 'level_champions', 'most_followed', 'most_liked',
            'most_active', 'community_stars', 'achievement_hunters', 'consistency_rating'
        ];

        if (!validTypes.includes(type)) {
            return res.status(400).json({
                message: 'Invalid leaderboard type',
                valid_types: validTypes
            });
        }

        // Calculate date range for period
        const { periodStart, periodEnd } = getPeriodRange(period);

        // Get or generate leaderboard entries
        let leaderboardEntries = await LeaderboardEntry.findAll({
            where: {
                leaderboard_type: type,
                time_period: period,
                is_active: true,
                ...(periodStart && { period_start: { [Op.gte]: periodStart } }),
                ...(periodEnd && { period_end: { [Op.lte]: periodEnd } })
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'full_name', 'avatar', 'current_level', 'is_active'],
                    where: { is_active: true }
                }
            ],
            order: [['rank_position', 'ASC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // If no entries found, generate them
        if (leaderboardEntries.length === 0) {
            await generateLeaderboardEntries(type, period);

            // Fetch again after generation
            leaderboardEntries = await LeaderboardEntry.findAll({
                where: {
                    leaderboard_type: type,
                    time_period: period,
                    is_active: true
                },
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'username', 'full_name', 'avatar', 'current_level', 'is_active'],
                        where: { is_active: true }
                    }
                ],
                order: [['rank_position', 'ASC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
        }

        // Find current user's rank
        const userRank = await LeaderboardEntry.findOne({
            where: {
                user_id: userId,
                leaderboard_type: type,
                time_period: period,
                is_active: true
            }
        });

        // Format response
        const formattedEntries = leaderboardEntries.map(entry => ({
            rank: entry.rank_position,
            user: {
                id: entry.user.id,
                username: entry.user.username,
                full_name: entry.user.full_name,
                avatar: entry.user.avatar,
                level: entry.user.current_level
            },
            score: entry.score_value,
            secondary_score: entry.secondary_value,
            tier: entry.tier,
            trend: entry.trend,
            rank_change: entry.rank_change,
            games_count: entry.games_count,
            last_game_date: entry.last_game_date,
            is_personal_best: entry.is_personal_best,
            is_season_best: entry.is_season_best,
            extra_data: entry.extra_data
        }));

        res.status(200).json({
            message: 'Leaderboard retrieved successfully',
            leaderboard_type: type,
            time_period: period,
            period_info: {
                start: periodStart,
                end: periodEnd
            },
            total_entries: leaderboardEntries.length,
            user_rank: userRank ? {
                position: userRank.rank_position,
                score: userRank.score_value,
                tier: userRank.tier,
                trend: userRank.trend
            } : null,
            entries: formattedEntries
        });

    } catch (err) {
        console.error('Error getting leaderboard:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/leaderboard/types - Get all available leaderboard types
export const getLeaderboardTypes = async (req, res) => {
    try {
        const leaderboardTypes = [
            {
                type: 'overall_score',
                name: 'Overall Score Leaders',
                description: 'Total accumulated points across all games',
                category: 'performance',
                icon: '🏆'
            },
            {
                type: 'best_single_game',
                name: 'Best Single Game',
                description: 'Highest score achieved in a single game session',
                category: 'performance',
                icon: '⭐'
            },
            {
                type: 'speed_masters',
                name: 'Speed Masters',
                description: 'Fastest average response times',
                category: 'performance',
                icon: '⚡'
            },
            {
                type: 'accuracy_kings',
                name: 'Accuracy Kings',
                description: 'Highest accuracy percentages',
                category: 'performance',
                icon: '🎯'
            },
            {
                type: 'experience_leaders',
                name: 'Experience Leaders',
                description: 'Most experience points earned',
                category: 'progress',
                icon: '📈'
            },
            {
                type: 'level_champions',
                name: 'Level Champions',
                description: 'Highest current levels',
                category: 'progress',
                icon: '🥇'
            },
            {
                type: 'most_followed',
                name: 'Most Followed',
                description: 'Users with the most followers',
                category: 'social',
                icon: '👥'
            },
            {
                type: 'most_liked',
                name: 'Most Liked',
                description: 'Players whose games receive the most likes',
                category: 'social',
                icon: '❤️'
            },
            {
                type: 'most_active',
                name: 'Most Active',
                description: 'Users with the most game sessions played',
                category: 'activity',
                icon: '🎮'
            },
            {
                type: 'achievement_hunters',
                name: 'Achievement Hunters',
                description: 'Most achievements unlocked',
                category: 'achievements',
                icon: '🏅'
            }
        ];

        res.status(200).json({
            message: 'Leaderboard types retrieved successfully',
            types: leaderboardTypes
        });

    } catch (err) {
        console.error('Error getting leaderboard types:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/leaderboard/user/:userId - Get user's ranks across all leaderboards
export const getUserRanks = async (req, res) => {
    const { userId } = req.params;
    const { period = 'all_time' } = req.query;

    try {
        // Check if user exists
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'full_name', 'avatar', 'current_level']
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get all user's leaderboard entries
        const userRanks = await LeaderboardEntry.findAll({
            where: {
                user_id: userId,
                time_period: period,
                is_active: true
            },
            order: [['rank_position', 'ASC']]
        });

        // Calculate user's best ranks
        const bestRanks = userRanks.reduce((acc, entry) => {
            if (!acc[entry.leaderboard_type] || entry.rank_position < acc[entry.leaderboard_type].rank_position) {
                acc[entry.leaderboard_type] = entry;
            }
            return acc;
        }, {});

        // Get user statistics
        const userStats = await UserStatistics.findOne({
            where: { user_id: userId }
        });

        const achievementCount = await UserAchievement.count({
            where: { user_id: userId, is_completed: true }
        });

        res.status(200).json({
            message: 'User ranks retrieved successfully',
            user,
            period,
            statistics: {
                games_played: userStats?.games_played || 0,
                best_score: userStats?.best_score || 0,
                total_score: userStats?.total_score || 0,
                achievements_unlocked: achievementCount
            },
            ranks: Object.values(bestRanks).map(entry => ({
                leaderboard_type: entry.leaderboard_type,
                rank_position: entry.rank_position,
                score_value: entry.score_value,
                tier: entry.tier,
                trend: entry.trend,
                rank_change: entry.rank_change,
                is_personal_best: entry.is_personal_best,
                last_updated: entry.last_updated
            })),
            best_overall_rank: userRanks.length > 0 ? Math.min(...userRanks.map(r => r.rank_position)) : null
        });

    } catch (err) {
        console.error('Error getting user ranks:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/leaderboard/update - Update leaderboards (Admin or system)
export const updateLeaderboards = async (req, res) => {
    const adminId = req.userId;
    const { types, periods } = req.body;

    try {
        // Verify admin permissions
        const admin = await User.findByPk(adminId);
        if (!admin || admin.usertype !== 'Admin') {
            return res.status(403).json({
                message: 'Access denied. Admin privileges required to update leaderboards.'
            });
        }

        const typesToUpdate = types || [
            'overall_score', 'best_single_game', 'speed_masters', 'accuracy_kings',
            'experience_leaders', 'level_champions', 'most_followed', 'most_liked',
            'most_active', 'achievement_hunters'
        ];

        const periodsToUpdate = periods || ['daily', 'weekly', 'monthly', 'all_time'];

        let updatedCount = 0;

        for (const type of typesToUpdate) {
            for (const period of periodsToUpdate) {
                await generateLeaderboardEntries(type, period);
                updatedCount++;
            }
        }

        res.status(200).json({
            message: 'Leaderboards updated successfully',
            updated_count: updatedCount,
            types_updated: typesToUpdate,
            periods_updated: periodsToUpdate
        });

    } catch (err) {
        console.error('Error updating leaderboards:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Helper functions
function getPeriodRange(period) {
    const now = new Date();
    let periodStart = null;
    let periodEnd = null;

    switch (period) {
        case 'daily':
            periodStart = new Date(now.setHours(0, 0, 0, 0));
            periodEnd = new Date(now.setHours(23, 59, 59, 999));
            break;
        case 'weekly': {
            const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
            periodStart = weekStart;
            periodEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
            break;
        }
        case 'monthly':
            periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
            periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
        case 'all_time':
        default:
            // No date restrictions for all-time
            break;
    }

    return { periodStart, periodEnd };
}

async function generateLeaderboardEntries(type, period) {
    const { periodStart, periodEnd } = getPeriodRange(period);

    // Clear existing entries for this type and period
    await LeaderboardEntry.destroy({
        where: {
            leaderboard_type: type,
            time_period: period
        }
    });

    let query;

    switch (type) {
        case 'overall_score': {
            query = `
                SELECT 
                    u.id as user_id,
                    COALESCE(us.total_score, 0) as score_value,
                    COALESCE(us.games_played, 0) as games_count,
                    MAX(gs.createdAt) as last_game_date,
                    COALESCE(us.best_score, 0) as secondary_value
                FROM users u
                LEFT JOIN user_statistics us ON u.id = us.user_id
                LEFT JOIN game_sessions gs ON u.id = gs.user_id
                WHERE u.is_active = true
                ${periodStart ? `AND gs.createdAt >= '${periodStart.toISOString()}'` : ''}
                ${periodEnd ? `AND gs.createdAt <= '${periodEnd.toISOString()}'` : ''}
                GROUP BY u.id, us.total_score, us.games_played, us.best_score
                ORDER BY score_value DESC, games_count DESC
                LIMIT 1000
            `;
            break;
        }

        case 'best_single_game': {
            query = `
                SELECT 
                    u.id as user_id,
                    COALESCE(us.best_score, 0) as score_value,
                    COALESCE(us.games_played, 0) as games_count,
                    MAX(gs.createdAt) as last_game_date,
                    COALESCE(us.total_score, 0) as secondary_value
                FROM users u
                LEFT JOIN user_statistics us ON u.id = us.user_id
                LEFT JOIN game_sessions gs ON u.id = gs.user_id
                WHERE u.is_active = true
                ${periodStart ? `AND gs.createdAt >= '${periodStart.toISOString()}'` : ''}
                ${periodEnd ? `AND gs.createdAt <= '${periodEnd.toISOString()}'` : ''}
                GROUP BY u.id, us.best_score, us.games_played, us.total_score
                ORDER BY score_value DESC, secondary_value DESC
                LIMIT 1000
            `;
            break;
        }

        case 'experience_leaders': {
            query = `
                SELECT 
                    u.id as user_id,
                    u.experience_points as score_value,
                    u.current_level as secondary_value,
                    COALESCE(us.games_played, 0) as games_count,
                    MAX(gs.createdAt) as last_game_date
                FROM users u
                LEFT JOIN user_statistics us ON u.id = us.user_id
                LEFT JOIN game_sessions gs ON u.id = gs.user_id
                WHERE u.is_active = true
                ${periodStart ? `AND gs.createdAt >= '${periodStart.toISOString()}'` : ''}
                ${periodEnd ? `AND gs.createdAt <= '${periodEnd.toISOString()}'` : ''}
                GROUP BY u.id, u.experience_points, u.current_level, us.games_played
                ORDER BY score_value DESC, secondary_value DESC
                LIMIT 1000
            `;
            break;
        }

        case 'level_champions': {
            query = `
                SELECT 
                    u.id as user_id,
                    u.current_level as score_value,
                    u.experience_points as secondary_value,
                    COALESCE(us.games_played, 0) as games_count,
                    MAX(gs.createdAt) as last_game_date
                FROM users u
                LEFT JOIN user_statistics us ON u.id = us.user_id
                LEFT JOIN game_sessions gs ON u.id = gs.user_id
                WHERE u.is_active = true
                ${periodStart ? `AND gs.createdAt >= '${periodStart.toISOString()}'` : ''}
                ${periodEnd ? `AND gs.createdAt <= '${periodEnd.toISOString()}'` : ''}
                GROUP BY u.id, u.current_level, u.experience_points, us.games_played
                ORDER BY score_value DESC, secondary_value DESC
                LIMIT 1000
            `;
            break;
        }

        case 'most_followed': {
            query = `
                SELECT 
                    u.id as user_id,
                    u.followers_count as score_value,
                    u.following_count as secondary_value,
                    COALESCE(us.games_played, 0) as games_count,
                    MAX(gs.createdAt) as last_game_date
                FROM users u
                LEFT JOIN user_statistics us ON u.id = us.user_id
                LEFT JOIN game_sessions gs ON u.id = gs.user_id
                WHERE u.is_active = true
                GROUP BY u.id, u.followers_count, u.following_count, us.games_played
                ORDER BY score_value DESC, secondary_value DESC
                LIMIT 1000
            `;
            break;
        }

        case 'most_active': {
            query = `
                SELECT 
                    u.id as user_id,
                    COALESCE(us.games_played, 0) as score_value,
                    COALESCE(us.total_score, 0) as secondary_value,
                    COALESCE(us.games_played, 0) as games_count,
                    MAX(gs.createdAt) as last_game_date
                FROM users u
                LEFT JOIN user_statistics us ON u.id = us.user_id
                LEFT JOIN game_sessions gs ON u.id = gs.user_id
                WHERE u.is_active = true
                ${periodStart ? `AND gs.createdAt >= '${periodStart.toISOString()}'` : ''}
                ${periodEnd ? `AND gs.createdAt <= '${periodEnd.toISOString()}'` : ''}
                GROUP BY u.id, us.games_played, us.total_score
                ORDER BY score_value DESC, secondary_value DESC
                LIMIT 1000
            `;
            break;
        }

        case 'achievement_hunters': {
            query = `
                SELECT 
                    u.id as user_id,
                    COUNT(ua.id) as score_value,
                    SUM(a.points) as secondary_value,
                    COALESCE(us.games_played, 0) as games_count,
                    MAX(COALESCE(ua.acquired_at, gs.createdAt)) as last_game_date
                FROM users u
                LEFT JOIN user_achievements ua ON u.id = ua.user_id AND ua.is_completed = true
                LEFT JOIN achievements a ON ua.achievement_id = a.id
                LEFT JOIN user_statistics us ON u.id = us.user_id
                LEFT JOIN game_sessions gs ON u.id = gs.user_id
                WHERE u.is_active = true
                ${periodStart ? `AND ua.acquired_at >= '${periodStart.toISOString()}'` : ''}
                ${periodEnd ? `AND ua.acquired_at <= '${periodEnd.toISOString()}'` : ''}
                GROUP BY u.id, us.games_played
                ORDER BY score_value DESC, secondary_value DESC
                LIMIT 1000
            `;
            break;
        }

        default:
            return; // Skip unknown types
    }

    // Execute query
    const results = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT
    });

    // Create leaderboard entries
    const entries = results.map((result, index) => ({
        user_id: result.user_id,
        leaderboard_type: type,
        time_period: period,
        period_start: periodStart,
        period_end: periodEnd,
        rank_position: index + 1,
        score_value: parseFloat(result.score_value) || 0,
        secondary_value: parseFloat(result.secondary_value) || 0,
        games_count: parseInt(result.games_count) || 0,
        last_game_date: result.last_game_date,
        tier: calculateTier(index + 1),
        trend: 'stable',
        is_active: true
    }));

    if (entries.length > 0) {
        await LeaderboardEntry.bulkCreate(entries);
    }
}

function calculateTier(rank) {
    if (rank === 1) return 'diamond';
    if (rank <= 10) return 'platinum';
    if (rank <= 50) return 'gold';
    if (rank <= 200) return 'silver';
    return 'bronze';
} 