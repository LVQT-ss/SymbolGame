import User from '../model/user.model.js';
import UserStatistics from '../model/user-statistics.model.js';
import GameSession from '../model/game-sessions.model.js';
import RoundDetail from '../model/round-details.model.js';
import { Op } from 'sequelize';

// POST /api/game/start - ADMIN ONLY
export const startGame = async (req, res) => {
    const userId = req.userId; // From JWT token
    const { difficulty_level = 1, number_of_rounds = 10 } = req.body;

    try {
        // Check if user is Admin
        const user = await User.findByPk(userId);
        if (!user || user.usertype !== 'Admin') {
            return res.status(403).json({
                message: 'Only Admin users can create game sessions. Customers can only play admin-assigned sessions.'
            });
        }

        // Create new game session (Admin creating for themselves for testing purposes)
        const gameSession = await GameSession.create({
            user_id: userId,
            difficulty_level,
            number_of_rounds,
            total_time: 0,
            correct_answers: 0,
            score: 0,
            completed: false,
            is_public: true
        });

        res.status(201).json({
            message: 'Game session started successfully (Admin)',
            game_session: {
                id: gameSession.id,
                difficulty_level: gameSession.difficulty_level,
                number_of_rounds: gameSession.number_of_rounds,
                started_at: gameSession.createdAt
            }
        });
    } catch (err) {
        console.error('Error starting game:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/game/assigned - CUSTOMER ONLY (view assigned sessions)
export const getAssignedSessions = async (req, res) => {
    const userId = req.userId; // From JWT token
    const { page = 1, limit = 10, status = 'all' } = req.query;

    try {
        // Check if user is Customer
        const user = await User.findByPk(userId);
        if (!user || user.usertype !== 'Customer') {
            return res.status(403).json({
                message: 'This endpoint is for Customer users only'
            });
        }

        const offset = (page - 1) * limit;
        const whereCondition = {
            user_id: userId,
            created_by_admin: { [Op.ne]: null } // Only admin-created sessions
        };

        if (status === 'active') {
            whereCondition.completed = false;
        } else if (status === 'completed') {
            whereCondition.completed = true;
        }

        const { count, rows } = await GameSession.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: User,
                    as: 'adminCreator', // Admin who created this session
                    attributes: ['id', 'username', 'full_name']
                }
            ],
            limit: parseInt(limit),
            offset: offset,
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            message: 'Assigned game sessions retrieved successfully',
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            },
            sessions: rows.map(session => ({
                id: session.id,
                difficulty_level: session.difficulty_level,
                number_of_rounds: session.number_of_rounds,
                completed: session.completed,
                score: session.score,
                admin_instructions: session.admin_instructions,
                created_at: session.createdAt,
                assigned_by: session.adminCreator
            }))
        });
    } catch (err) {
        console.error('Error fetching assigned sessions:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/game/complete - Updated for admin-created sessions
export const completeGame = async (req, res) => {
    const userId = req.userId; // From JWT token
    const {
        game_session_id,
        total_time,
        rounds,
        recording_url
    } = req.body;

    if (!game_session_id || !total_time || !rounds || !Array.isArray(rounds)) {
        return res.status(400).json({
            message: 'game_session_id, total_time, and rounds array are required'
        });
    }

    try {
        // Find the game session
        const gameSession = await GameSession.findOne({
            where: {
                id: game_session_id,
                user_id: userId,
                completed: false
            }
        });

        if (!gameSession) {
            return res.status(404).json({ message: 'Game session not found or already completed' });
        }

        // Check if user is customer and session was created by admin
        const user = await User.findByPk(userId);
        if (user.usertype === 'Customer' && !gameSession.created_by_admin) {
            return res.status(403).json({
                message: 'Customers can only complete admin-assigned game sessions'
            });
        }

        // Calculate score and correct answers
        let correctAnswers = 0;
        let score = 0;

        // Save round details
        for (let i = 0; i < rounds.length; i++) {
            const round = rounds[i];
            const isCorrect = round.user_symbol === round.correct_symbol;

            if (isCorrect) {
                correctAnswers++;
                // Score calculation: base points + bonus for speed
                const basePoints = 100;
                const speedBonus = Math.max(0, 50 - Math.floor(round.response_time));
                score += basePoints + speedBonus;
            }

            await RoundDetail.create({
                game_session_id: game_session_id,
                round_number: i + 1,
                first_number: round.first_number,
                second_number: round.second_number,
                correct_symbol: round.correct_symbol,
                user_symbol: round.user_symbol,
                response_time: round.response_time,
                is_correct: isCorrect
            });
        }

        // Update game session
        await gameSession.update({
            total_time,
            correct_answers: correctAnswers,
            score,
            completed: true,
            recording_url: recording_url || null
        });

        // Update user statistics
        const userStats = await UserStatistics.findOne({ where: { user_id: userId } });
        if (userStats) {
            const newBestScore = Math.max(userStats.best_score, score);
            await userStats.update({
                games_played: userStats.games_played + 1,
                best_score: newBestScore,
                total_score: userStats.total_score + score
            });
        }

        // Update user experience and level
        if (user) {
            const experienceGained = Math.floor(score / 10); // 1 XP per 10 points
            const newXP = user.experience_points + experienceGained;
            const newLevel = Math.floor(newXP / 1000) + 1; // 1000 XP per level
            const levelProgress = (newXP % 1000) / 1000;

            await user.update({
                experience_points: newXP,
                current_level: newLevel,
                level_progress: levelProgress,
                coins: user.coins + Math.floor(score / 100) // 1 coin per 100 points
            });
        }

        res.status(200).json({
            message: 'Game completed successfully',
            game_result: {
                score,
                correct_answers: correctAnswers,
                total_rounds: rounds.length,
                accuracy: Math.round((correctAnswers / rounds.length) * 100),
                experience_gained: Math.floor(score / 10),
                coins_earned: Math.floor(score / 100),
                session_type: gameSession.created_by_admin ? 'admin_assigned' : 'self_created'
            }
        });
    } catch (err) {
        console.error('Error completing game:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/game/history - Updated to show only relevant sessions
export const getGameHistory = async (req, res) => {
    const userId = req.userId; // From JWT token
    const { page = 1, limit = 10 } = req.query;

    try {
        const offset = (page - 1) * limit;
        const user = await User.findByPk(userId);

        let whereCondition = {
            user_id: userId,
            completed: true
        };

        // If customer, only show admin-created sessions
        if (user.usertype === 'Customer') {
            whereCondition.created_by_admin = { [Op.ne]: null };
        }

        const { count, rows } = await GameSession.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: RoundDetail,
                    as: 'rounds',
                    attributes: ['round_number', 'is_correct', 'response_time']
                },
                {
                    model: User,
                    as: 'adminCreator',
                    attributes: ['id', 'username', 'full_name'],
                    required: false
                }
            ],
            limit: parseInt(limit),
            offset: offset,
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            message: 'Game history retrieved successfully',
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            },
            games: rows.map(game => ({
                ...game.toJSON(),
                session_type: game.created_by_admin ? 'admin_assigned' : 'self_created',
                assigned_by: game.adminCreator
            }))
        });
    } catch (err) {
        console.error('Error fetching game history:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/game/stats/summary - Same as before
export const getGameStatsSummary = async (req, res) => {
    const userId = req.userId; // From JWT token

    try {
        // Get user statistics
        const userStats = await UserStatistics.findOne({ where: { user_id: userId } });

        // Get recent games performance
        const user = await User.findByPk(userId);
        let whereCondition = {
            user_id: userId,
            completed: true
        };

        // If customer, only show admin-created sessions
        if (user.usertype === 'Customer') {
            whereCondition.created_by_admin = { [Op.ne]: null };
        }

        const recentGames = await GameSession.findAll({
            where: whereCondition,
            limit: 10,
            order: [['createdAt', 'DESC']],
            attributes: ['score', 'correct_answers', 'number_of_rounds', 'total_time', 'createdAt']
        });

        // Calculate average performance
        const avgScore = recentGames.length > 0
            ? Math.round(recentGames.reduce((sum, game) => sum + game.score, 0) / recentGames.length)
            : 0;

        const avgAccuracy = recentGames.length > 0
            ? Math.round(recentGames.reduce((sum, game) => sum + (game.correct_answers / game.number_of_rounds), 0) / recentGames.length * 100)
            : 0;

        const avgTime = recentGames.length > 0
            ? Math.round(recentGames.reduce((sum, game) => sum + game.total_time, 0) / recentGames.length)
            : 0;

        res.status(200).json({
            message: 'Game statistics summary retrieved successfully',
            summary: {
                overall: {
                    games_played: userStats?.games_played || 0,
                    best_score: userStats?.best_score || 0,
                    total_score: userStats?.total_score || 0,
                    current_level: user?.current_level || 1,
                    experience_points: user?.experience_points || 0,
                    level_progress: user?.level_progress || 0,
                    coins: user?.coins || 0
                },
                recent_performance: {
                    average_score: avgScore,
                    average_accuracy: avgAccuracy,
                    average_time: avgTime,
                    games_analyzed: recentGames.length
                },
                recent_games: recentGames,
                user_type: user.usertype,
                access_level: user.usertype === 'Customer' ? 'admin_assigned_only' : 'full_access'
            }
        });
    } catch (err) {
        console.error('Error fetching game stats summary:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
}; 