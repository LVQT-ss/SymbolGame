import User from '../model/user.model.js';
import LeaderboardEntry from '../model/leaderboard-entries.model.js';
import { Op } from 'sequelize';

// GET /api/leaderboard/daily
export const getDailyLeaderboard = async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    try {
        const offset = (page - 1) * limit;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { count, rows } = await LeaderboardEntry.findAndCountAll({
            where: {
                period: 'daily',
                period_start: {
                    [Op.gte]: today,
                    [Op.lt]: tomorrow
                }
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'full_name', 'avatar', 'current_level']
                }
            ],
            limit: parseInt(limit),
            offset: offset,
            order: [['rank', 'ASC']]
        });

        res.status(200).json({
            message: 'Daily leaderboard retrieved successfully',
            period: 'daily',
            date: today.toISOString().split('T')[0],
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            },
            leaderboard: rows
        });
    } catch (err) {
        console.error('Error fetching daily leaderboard:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/leaderboard/weekly
export const getWeeklyLeaderboard = async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    try {
        const offset = (page - 1) * limit;
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        const { count, rows } = await LeaderboardEntry.findAndCountAll({
            where: {
                period: 'weekly',
                period_start: {
                    [Op.gte]: startOfWeek,
                    [Op.lt]: endOfWeek
                }
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'full_name', 'avatar', 'current_level']
                }
            ],
            limit: parseInt(limit),
            offset: offset,
            order: [['rank', 'ASC']]
        });

        res.status(200).json({
            message: 'Weekly leaderboard retrieved successfully',
            period: 'weekly',
            week_start: startOfWeek.toISOString().split('T')[0],
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            },
            leaderboard: rows
        });
    } catch (err) {
        console.error('Error fetching weekly leaderboard:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/leaderboard/monthly
export const getMonthlyLeaderboard = async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    try {
        const offset = (page - 1) * limit;
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

        const { count, rows } = await LeaderboardEntry.findAndCountAll({
            where: {
                period: 'monthly',
                period_start: {
                    [Op.gte]: startOfMonth,
                    [Op.lt]: endOfMonth
                }
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'full_name', 'avatar', 'current_level']
                }
            ],
            limit: parseInt(limit),
            offset: offset,
            order: [['rank', 'ASC']]
        });

        res.status(200).json({
            message: 'Monthly leaderboard retrieved successfully',
            period: 'monthly',
            month: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            },
            leaderboard: rows
        });
    } catch (err) {
        console.error('Error fetching monthly leaderboard:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/leaderboard/all-time
export const getAllTimeLeaderboard = async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    try {
        const offset = (page - 1) * limit;

        const { count, rows } = await LeaderboardEntry.findAndCountAll({
            where: {
                period: 'all-time'
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'full_name', 'avatar', 'current_level']
                }
            ],
            limit: parseInt(limit),
            offset: offset,
            order: [['rank', 'ASC']]
        });

        res.status(200).json({
            message: 'All-time leaderboard retrieved successfully',
            period: 'all-time',
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            },
            leaderboard: rows
        });
    } catch (err) {
        console.error('Error fetching all-time leaderboard:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/leaderboard/user/me/positions
export const getUserLeaderboardPositions = async (req, res) => {
    const userId = req.userId; // From JWT token

    try {
        // Get user's positions in all leaderboards
        const dailyPosition = await LeaderboardEntry.findOne({
            where: {
                user_id: userId,
                period: 'daily',
                period_start: {
                    [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
                }
            },
            order: [['period_start', 'DESC']]
        });

        const weeklyPosition = await LeaderboardEntry.findOne({
            where: {
                user_id: userId,
                period: 'weekly'
            },
            order: [['period_start', 'DESC']]
        });

        const monthlyPosition = await LeaderboardEntry.findOne({
            where: {
                user_id: userId,
                period: 'monthly'
            },
            order: [['period_start', 'DESC']]
        });

        const allTimePosition = await LeaderboardEntry.findOne({
            where: {
                user_id: userId,
                period: 'all-time'
            }
        });

        // Get user info
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'full_name', 'avatar', 'current_level', 'experience_points']
        });

        res.status(200).json({
            message: 'User leaderboard positions retrieved successfully',
            user: user,
            positions: {
                daily: {
                    rank: dailyPosition?.rank || null,
                    score: dailyPosition?.score || 0,
                    games_played: dailyPosition?.games_played || 0
                },
                weekly: {
                    rank: weeklyPosition?.rank || null,
                    score: weeklyPosition?.score || 0,
                    games_played: weeklyPosition?.games_played || 0
                },
                monthly: {
                    rank: monthlyPosition?.rank || null,
                    score: monthlyPosition?.score || 0,
                    games_played: monthlyPosition?.games_played || 0
                },
                'all-time': {
                    rank: allTimePosition?.rank || null,
                    score: allTimePosition?.score || 0,
                    games_played: allTimePosition?.games_played || 0
                }
            }
        });
    } catch (err) {
        console.error('Error fetching user leaderboard positions:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
}; 