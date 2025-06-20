import GameSession from '../model/game-sessions.model.js';
import RoundDetail from '../model/round-details.model.js';
import GameHistory from '../model/game-history.model.js';
import UserRoundResponse from '../model/user-round-responses.model.js';
import User from '../model/user.model.js';
import sequelize from '../database/db.js';
import { Op } from 'sequelize';

// POST /api/game/start - Create new game session (ADMIN ONLY)
export const startGame = async (req, res) => {
    const adminId = req.userId;
    const { number_of_rounds = 10, admin_instructions, rounds } = req.body;

    try {
        // Verify admin permissions
        const admin = await User.findByPk(adminId);
        if (!admin || admin.usertype !== 'Admin') {
            return res.status(403).json({
                message: 'Access denied. Admin privileges required to create game sessions.'
            });
        }

        // Validate number of rounds
        if (number_of_rounds < 1 || number_of_rounds > 50) {
            return res.status(400).json({
                message: 'Number of rounds must be between 1 and 50.'
            });
        }

        // Validate rounds data if provided
        if (rounds && rounds.length !== number_of_rounds) {
            return res.status(400).json({
                message: `Rounds data must contain exactly ${number_of_rounds} rounds.`
            });
        }

        // Create game session
        const gameSession = await GameSession.create({
            user_id: null, // Will be set when user joins
            number_of_rounds,
            total_time: 0,
            correct_answers: 0,
            score: 0,
            completed: false,
            is_public: true,
            created_by_admin: adminId,
            admin_instructions: admin_instructions || null
        });

        // Create round details
        const roundsData = rounds || generateRandomRounds(number_of_rounds);
        const roundDetails = [];

        for (let i = 0; i < number_of_rounds; i++) {
            const round = roundsData[i];
            const first_number = round?.first_number || Math.floor(Math.random() * 50) + 1;
            const second_number = round?.second_number || Math.floor(Math.random() * 50) + 1;

            let correct_symbol;
            if (first_number > second_number) {
                correct_symbol = '>';
            } else if (first_number < second_number) {
                correct_symbol = '<';
            } else {
                correct_symbol = '=';
            }

            const roundDetail = await RoundDetail.create({
                game_session_id: gameSession.id,
                round_number: i + 1,
                first_number,
                second_number,
                correct_symbol,
                user_symbol: null,
                response_time: null,
                is_correct: false
            });

            roundDetails.push(roundDetail);
        }

        res.status(201).json({
            message: 'Game session created successfully',
            admin: {
                id: admin.id,
                username: admin.username,
                full_name: admin.full_name
            },
            game_session: {
                id: gameSession.id,
                number_of_rounds: gameSession.number_of_rounds,
                admin_instructions: gameSession.admin_instructions,
                created_at: gameSession.createdAt
            },
            rounds: roundDetails.map(round => ({
                round_number: round.round_number,
                first_number: round.first_number,
                second_number: round.second_number,
                correct_symbol: round.correct_symbol
            }))
        });

    } catch (err) {
        console.error('Error creating game session:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/game/join - Join a game session
export const joinGame = async (req, res) => {
    const userId = req.userId;
    const { game_session_id } = req.body;

    try {
        // Validate game session ID
        if (!game_session_id) {
            return res.status(400).json({
                message: 'Game session ID is required.'
            });
        }

        // Find the game session
        const gameSession = await GameSession.findByPk(game_session_id, {
            include: [
                {
                    model: RoundDetail,
                    as: 'rounds',
                    attributes: ['round_number', 'first_number', 'second_number']
                }
            ]
        });

        if (!gameSession) {
            return res.status(404).json({
                message: 'Game session not found.'
            });
        }

        // Check if session is already assigned to a user
        if (gameSession.user_id && gameSession.user_id !== userId) {
            return res.status(409).json({
                message: 'This game session is already assigned to another user.'
            });
        }

        // Check if session is already completed
        if (gameSession.completed) {
            return res.status(409).json({
                message: 'This game session has already been completed.'
            });
        }

        // Assign user to the game session if not already assigned
        if (!gameSession.user_id) {
            await gameSession.update({
                user_id: userId
            });
        }

        // Get user info
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'full_name', 'current_level', 'avatar']
        });

        // Get admin info if session was created by admin
        let adminInfo = null;
        if (gameSession.created_by_admin) {
            const admin = await User.findByPk(gameSession.created_by_admin, {
                attributes: ['id', 'username', 'full_name']
            });
            adminInfo = admin;
        }

        res.status(200).json({
            message: 'Successfully joined game session',
            user: user,
            admin: adminInfo,
            game_session: {
                id: gameSession.id,
                number_of_rounds: gameSession.number_of_rounds,
                admin_instructions: gameSession.admin_instructions,
                time_limit: 600, // 10 minutes in seconds
                round_time_limit: 60, // 60 seconds per round
                points_per_correct: 100
            },
            rounds: gameSession.rounds?.map(round => ({
                round_number: round.round_number,
                first_number: round.first_number,
                second_number: round.second_number
                // Note: correct_symbol is not included for security
            })) || []
        });

    } catch (err) {
        console.error('Error joining game session:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/game/:id - Get specific game session
export const getGameSession = async (req, res) => {
    const userId = req.userId;
    const { id } = req.params;

    try {
        // Find the game session
        const gameSession = await GameSession.findByPk(id, {
            include: [
                {
                    model: RoundDetail,
                    as: 'rounds',
                    attributes: ['id', 'round_number', 'first_number', 'second_number', 'user_symbol', 'response_time', 'is_correct'],
                    order: [['round_number', 'ASC']]
                },
                {
                    model: User,
                    as: 'adminCreator',
                    attributes: ['id', 'username', 'full_name']
                }
            ]
        });

        if (!gameSession) {
            return res.status(404).json({
                message: 'Game session not found.'
            });
        }

        // Check if session is assigned to user or available to join
        if (gameSession.user_id && gameSession.user_id !== userId) {
            return res.status(403).json({
                message: 'This game session is not accessible to you.'
            });
        }

        // Get current round (first incomplete round)
        const currentRound = gameSession.rounds.find(round => !round.user_symbol) || null;
        const completedRounds = gameSession.rounds.filter(round => round.user_symbol).length;

        res.status(200).json({
            message: 'Game session retrieved successfully',
            game_session: {
                id: gameSession.id,
                number_of_rounds: gameSession.number_of_rounds,
                completed: gameSession.completed,
                score: gameSession.score,
                correct_answers: gameSession.correct_answers,
                total_time: gameSession.total_time,
                admin_instructions: gameSession.admin_instructions,
                created_by_admin: !!gameSession.created_by_admin,
                admin_creator: gameSession.adminCreator
            },
            rounds: gameSession.rounds.map(round => ({
                id: round.id,
                round_number: round.round_number,
                first_number: round.first_number,
                second_number: round.second_number,
                user_symbol: round.user_symbol,
                response_time: round.response_time,
                is_correct: round.is_correct
                // Note: correct_symbol is not included for security unless round is completed
            })),
            progress: {
                current_round_number: currentRound ? currentRound.round_number : null,
                completed_rounds: completedRounds,
                total_rounds: gameSession.number_of_rounds,
                is_completed: gameSession.completed
            },
            current_round: currentRound ? {
                round_number: currentRound.round_number,
                first_number: currentRound.first_number,
                second_number: currentRound.second_number
                // Note: correct_symbol is not included for security
            } : null
        });

    } catch (err) {
        console.error('Error retrieving game session:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/game/:id/submit-round - Submit a single round
export const submitRound = async (req, res) => {
    const userId = req.userId;
    const { id } = req.params;
    const { round_number, user_symbol, response_time } = req.body;

    try {
        // Validate required fields
        if (!round_number || !user_symbol || !response_time) {
            return res.status(400).json({
                message: 'round_number, user_symbol, and response_time are required.'
            });
        }

        // Find the game session
        const gameSession = await GameSession.findByPk(id);
        if (!gameSession) {
            return res.status(404).json({
                message: 'Game session not found.'
            });
        }

        // Auto-assign if not assigned
        if (!gameSession.user_id) {
            await gameSession.update({ user_id: userId });
        }

        // Check if session belongs to user
        if (gameSession.user_id !== userId) {
            return res.status(403).json({
                message: 'This game session is not accessible to you.'
            });
        }

        // Check if session is already completed
        if (gameSession.completed) {
            return res.status(409).json({
                message: 'This game session has already been completed.'
            });
        }

        // Find the specific round
        const round = await RoundDetail.findOne({
            where: {
                game_session_id: id,
                round_number: round_number
            }
        });

        if (!round) {
            return res.status(404).json({
                message: `Round ${round_number} not found.`
            });
        }

        // Check if round is already completed
        if (round.user_symbol) {
            return res.status(409).json({
                message: `Round ${round_number} has already been completed.`
            });
        }

        // Check if answer is correct
        const isCorrect = user_symbol === round.correct_symbol;

        // Update the round
        await round.update({
            user_symbol: user_symbol,
            response_time: response_time,
            is_correct: isCorrect
        });

        // Get next round
        const nextRound = await RoundDetail.findOne({
            where: {
                game_session_id: id,
                round_number: round_number + 1,
                user_symbol: null
            }
        });

        // Check if this was the last round
        const completedRounds = await RoundDetail.count({
            where: {
                game_session_id: id,
                user_symbol: { [Op.ne]: null }
            }
        });

        const isGameComplete = completedRounds >= gameSession.number_of_rounds;

        res.status(200).json({
            message: 'Round submitted successfully',
            round_result: {
                round_number: round_number,
                user_symbol: user_symbol,
                correct_symbol: round.correct_symbol,
                is_correct: isCorrect,
                response_time: response_time
            },
            progress: {
                completed_rounds: completedRounds,
                total_rounds: gameSession.number_of_rounds,
                is_game_complete: isGameComplete
            },
            next_round: nextRound ? {
                round_number: nextRound.round_number,
                first_number: nextRound.first_number,
                second_number: nextRound.second_number
            } : null
        });

    } catch (err) {
        console.error('Error submitting round:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/game/history - View completed games
export const getGameHistory = async (req, res) => {
    const userId = req.userId;
    const { page = 1, limit = 20, completed_only = 'true' } = req.query;

    try {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        // Build where clause
        const whereClause = { user_id: userId };
        if (completed_only === 'true') {
            whereClause.completed = true;
        }

        // Get total count
        const totalGames = await GameSession.count({
            where: whereClause
        });

        // Get games with pagination
        const games = await GameSession.findAll({
            where: whereClause,
            include: [
                {
                    model: RoundDetail,
                    as: 'rounds',
                    attributes: [
                        'round_number',
                        'first_number',
                        'second_number',
                        'correct_symbol',
                        'user_symbol',
                        'response_time',
                        'is_correct'
                    ]
                },
                {
                    model: User,
                    as: 'adminCreator',
                    attributes: ['id', 'username', 'full_name'],
                    required: false
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: limitNum,
            offset: offset
        });

        // Calculate statistics
        const stats = {
            total_games: totalGames,
            completed_games: await GameSession.count({
                where: { user_id: userId, completed: true }
            }),
            total_score: await GameSession.sum('score', {
                where: { user_id: userId, completed: true }
            }) || 0,
            best_score: await GameSession.max('score', {
                where: { user_id: userId, completed: true }
            }) || 0
        };

        res.status(200).json({
            message: 'Game history retrieved successfully',
            pagination: {
                total: totalGames,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(totalGames / limitNum)
            },
            statistics: stats,
            games: games.map(game => ({
                id: game.id,
                number_of_rounds: game.number_of_rounds,
                total_time: game.total_time,
                correct_answers: game.correct_answers,
                score: game.score,
                completed: game.completed,
                admin_instructions: game.admin_instructions,
                created_at: game.createdAt,
                completed_at: game.updatedAt,
                admin: game.adminCreator,
                rounds: game.rounds || [],
                accuracy: game.number_of_rounds > 0 ?
                    Math.round((game.correct_answers / game.number_of_rounds) * 100) : 0
            }))
        });

    } catch (err) {
        console.error('Error retrieving game history:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/admin/game/create-with-custom-rounds - Create game with fully customized rounds (ADMIN ONLY)
export const createGameWithCustomRounds = async (req, res) => {
    const adminId = req.userId;
    const {
        user_id = null,          // Optional - for assignment to specific user, null means anyone can join
        admin_instructions,
        custom_rounds           // Array of custom round objects
    } = req.body;

    try {
        // Verify admin permissions
        const admin = await User.findByPk(adminId);
        if (!admin || admin.usertype !== 'Admin') {
            return res.status(403).json({
                message: 'Access denied. Admin privileges required to create game sessions.'
            });
        }

        // Validate custom rounds
        if (!custom_rounds || !Array.isArray(custom_rounds) || custom_rounds.length === 0) {
            return res.status(400).json({
                message: 'custom_rounds array is required and must contain at least 1 round.'
            });
        }

        if (custom_rounds.length > 50) {
            return res.status(400).json({
                message: 'Maximum 50 rounds allowed per game session.'
            });
        }

        // Validate each round
        for (let i = 0; i < custom_rounds.length; i++) {
            const round = custom_rounds[i];

            if (typeof round.first_number !== 'number' || typeof round.second_number !== 'number') {
                return res.status(400).json({
                    message: `Round ${i + 1}: first_number and second_number must be valid numbers.`
                });
            }

            // Validate expected_symbol if provided
            if (round.expected_symbol && !['>', '<', '='].includes(round.expected_symbol)) {
                return res.status(400).json({
                    message: `Round ${i + 1}: expected_symbol must be '>', '<', or '='.`
                });
            }
        }

        // Validate user assignment if provided
        let assignedUser = null;
        if (user_id) {
            const targetUser = await User.findByPk(user_id);
            if (!targetUser) {
                return res.status(404).json({
                    message: 'Target user not found.'
                });
            }
            if (targetUser.usertype !== 'Customer') {
                return res.status(400).json({
                    message: 'Can only assign game sessions to Customer users.'
                });
            }
            if (!targetUser.is_active) {
                return res.status(400).json({
                    message: 'Cannot assign to inactive user.'
                });
            }
            assignedUser = {
                id: targetUser.id,
                username: targetUser.username,
                full_name: targetUser.full_name,
                current_level: targetUser.current_level
            };
        }

        // Create game session (user_id will be null if not assigned to specific user)
        const gameSession = await GameSession.create({
            user_id: user_id,  // null means anyone can join, specific ID means assigned
            number_of_rounds: custom_rounds.length,
            total_time: 0,
            correct_answers: 0,
            score: 0,
            completed: false,
            is_public: true,
            created_by_admin: adminId,
            admin_instructions: admin_instructions || null
        });

        // Create custom round details
        const roundDetails = [];
        for (let i = 0; i < custom_rounds.length; i++) {
            const round = custom_rounds[i];

            // Calculate correct symbol if not provided
            let correct_symbol = round.expected_symbol;
            if (!correct_symbol) {
                if (round.first_number > round.second_number) {
                    correct_symbol = '>';
                } else if (round.first_number < round.second_number) {
                    correct_symbol = '<';
                } else {
                    correct_symbol = '=';
                }
            }

            const roundDetail = await RoundDetail.create({
                game_session_id: gameSession.id,
                round_number: i + 1,
                first_number: round.first_number,
                second_number: round.second_number,
                correct_symbol: correct_symbol,
                user_symbol: null,
                response_time: null,
                is_correct: false
            });

            roundDetails.push(roundDetail);
        }

        res.status(201).json({
            message: 'Custom game session created successfully',
            admin: {
                id: admin.id,
                username: admin.username,
                full_name: admin.full_name
            },
            assigned_user: assignedUser,
            game_session: {
                id: gameSession.id,
                number_of_rounds: gameSession.number_of_rounds,
                admin_instructions: gameSession.admin_instructions,
                created_at: gameSession.createdAt,
                assigned_to: user_id ? 'specific_user' : 'open_to_all',
                join_instructions: user_id ?
                    `Assigned to ${assignedUser.username}` :
                    `Game ID: ${gameSession.id} - Anyone can join using /api/game/join`
            },
            rounds: roundDetails.map(round => ({
                round_number: round.round_number,
                first_number: round.first_number,
                second_number: round.second_number,
                correct_symbol: round.correct_symbol
            }))
        });

    } catch (err) {
        console.error('Error creating custom game session:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/admin/game/dashboard - Admin dashboard with complete game session overview
export const getAdminGameDashboard = async (req, res) => {
    const adminId = req.userId;
    const {
        status = 'all',        // all, active, completed
        user_id = null,        // filter by specific student
        page = 1,
        limit = 20,
        sort_by = 'created_at', // created_at, completed_at, score, user_name
        sort_order = 'DESC'     // ASC, DESC
    } = req.query;

    try {
        // Verify admin permissions
        const admin = await User.findByPk(adminId);
        if (!admin || admin.usertype !== 'Admin') {
            return res.status(403).json({
                message: 'Access denied. Admin privileges required.'
            });
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        // Build where clause for sessions created by this admin
        const whereClause = { created_by_admin: adminId };

        // Add status filter
        if (status === 'active') {
            whereClause.completed = false;
        } else if (status === 'completed') {
            whereClause.completed = true;
        }

        // Add user filter
        if (user_id) {
            whereClause.user_id = user_id;
        }

        // Build order clause
        let orderClause;
        switch (sort_by) {
            case 'completed_at':
                orderClause = [['updatedAt', sort_order]];
                break;
            case 'score':
                orderClause = [['score', sort_order]];
                break;
            case 'user_name':
                orderClause = [[{ model: User, as: 'user' }, 'username', sort_order]];
                break;
            default:
                orderClause = [['createdAt', sort_order]];
        }

        // Get total count
        const totalSessions = await GameSession.count({
            where: whereClause
        });

        // Get sessions with pagination
        const sessions = await GameSession.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'full_name', 'current_level', 'avatar'],
                    required: false
                },
                {
                    model: RoundDetail,
                    as: 'rounds',
                    attributes: ['round_number', 'first_number', 'second_number', 'correct_symbol', 'user_symbol', 'response_time', 'is_correct']
                }
            ],
            order: orderClause,
            limit: limitNum,
            offset: offset
        });

        // Calculate admin statistics
        const adminStats = {
            total_sessions_created: await GameSession.count({
                where: { created_by_admin: adminId }
            }),
            active_sessions: await GameSession.count({
                where: { created_by_admin: adminId, completed: false }
            }),
            completed_sessions: await GameSession.count({
                where: { created_by_admin: adminId, completed: true }
            }),
            total_students_assigned: await GameSession.count({
                where: { created_by_admin: adminId, user_id: { [sequelize.Op.ne]: null } },
                distinct: true,
                col: 'user_id'
            }),
            average_score: await GameSession.findOne({
                where: { created_by_admin: adminId, completed: true },
                attributes: [[sequelize.fn('AVG', sequelize.col('score')), 'avg_score']]
            }),
            highest_score: await GameSession.max('score', {
                where: { created_by_admin: adminId, completed: true }
            }) || 0
        };

        // Format sessions data
        const formattedSessions = sessions.map(session => {
            const accuracy = session.number_of_rounds > 0 ?
                Math.round((session.correct_answers / session.number_of_rounds) * 100) : 0;

            return {
                id: session.id,
                assigned_user: session.user,
                number_of_rounds: session.number_of_rounds,
                total_time: session.total_time,
                correct_answers: session.correct_answers,
                score: session.score,
                accuracy: accuracy,
                completed: session.completed,
                admin_instructions: session.admin_instructions,
                created_at: session.createdAt,
                completed_at: session.completed ? session.updatedAt : null,
                rounds_summary: {
                    total_rounds: session.rounds.length,
                    completed_rounds: session.rounds.filter(r => r.user_symbol !== null).length,
                    correct_rounds: session.rounds.filter(r => r.is_correct).length
                }
            };
        });

        res.status(200).json({
            message: 'Admin game dashboard retrieved successfully',
            admin: {
                id: admin.id,
                username: admin.username,
                full_name: admin.full_name
            },
            statistics: {
                ...adminStats,
                average_score: adminStats.average_score?.get('avg_score') || 0
            },
            pagination: {
                total: totalSessions,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(totalSessions / limitNum)
            },
            filters: {
                status,
                user_id,
                sort_by,
                sort_order
            },
            sessions: formattedSessions
        });

    } catch (err) {
        console.error('Error retrieving admin game dashboard:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/game/complete - Complete a game session or create a new one
export const completeGame = async (req, res) => {
    const userId = req.userId;
    const {
        game_session_id,
        total_time,
        rounds,
        recording_url,
        difficulty_level = 1
    } = req.body;

    try {
        // Validate required fields
        if (!total_time || !rounds || !Array.isArray(rounds)) {
            return res.status(400).json({
                message: 'total_time and rounds array are required.'
            });
        }

        let gameSession;
        let isNewSession = false;
        let processedRounds = [];
        let correctAnswers = 0;

        // Get user info
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'full_name', 'current_level', 'experience_points', 'coins']
        });

        if (!user) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        if (game_session_id) {
            // EXISTING SESSION MODE: Complete an existing game session
            gameSession = await GameSession.findByPk(game_session_id, {
                include: [
                    {
                        model: RoundDetail,
                        as: 'rounds',
                        attributes: ['id', 'round_number', 'first_number', 'second_number', 'correct_symbol']
                    },
                    {
                        model: User,
                        as: 'user',
                        attributes: ['id', 'username', 'usertype']
                    }
                ]
            });

            if (!gameSession) {
                return res.status(404).json({
                    message: 'Game session not found.'
                });
            }

            // REMOVED: User assignment restriction - anyone can complete any game
            // This allows users to join and complete any available game session

            // Check if session is already completed
            if (gameSession.completed) {
                return res.status(409).json({
                    message: 'This game session has already been completed.'
                });
            }

            // Record who completed this game (for history tracking)
            await gameSession.update({
                user_id: userId  // Track which user completed this game
            });

            // Validate rounds data
            if (rounds.length !== gameSession.number_of_rounds) {
                return res.status(400).json({
                    message: `Expected ${gameSession.number_of_rounds} rounds, but received ${rounds.length}.`
                });
            }

            // Process existing session rounds
            for (let i = 0; i < rounds.length; i++) {
                const submittedRound = rounds[i];
                const dbRound = gameSession.rounds.find(r => r.round_number === (i + 1));

                if (!dbRound) {
                    return res.status(400).json({
                        message: `Round ${i + 1} not found in database.`
                    });
                }

                // Validate round data
                if (!submittedRound.first_number || !submittedRound.second_number ||
                    !submittedRound.user_symbol || !submittedRound.response_time) {
                    return res.status(400).json({
                        message: `Round ${i + 1}: Missing required fields.`
                    });
                }

                // Verify numbers match
                if (submittedRound.first_number !== dbRound.first_number ||
                    submittedRound.second_number !== dbRound.second_number) {
                    return res.status(400).json({
                        message: `Round ${i + 1}: Numbers don't match expected values.`
                    });
                }

                // Check if answer is correct
                const isCorrect = submittedRound.user_symbol === dbRound.correct_symbol;
                if (isCorrect) {
                    correctAnswers++;
                }

                // Update round detail in database
                await RoundDetail.update({
                    user_symbol: submittedRound.user_symbol,
                    response_time: submittedRound.response_time,
                    is_correct: isCorrect
                }, {
                    where: { id: dbRound.id }
                });

                processedRounds.push({
                    round_number: i + 1,
                    question: `${dbRound.first_number} ? ${dbRound.second_number}`,
                    your_answer: submittedRound.user_symbol,
                    correct_answer: dbRound.correct_symbol,
                    is_correct: isCorrect,
                    response_time: submittedRound.response_time
                });
            }

        } else {
            // NEW SESSION MODE: Create a new game session (like submit-whole-game)
            isNewSession = true;

            // Validate input ranges
            if (rounds.length < 1 || rounds.length > 50) {
                return res.status(400).json({
                    message: 'Number of rounds must be between 1 and 50.'
                });
            }

            if (difficulty_level < 1 || difficulty_level > 10) {
                return res.status(400).json({
                    message: 'Difficulty level must be between 1 and 10.'
                });
            }

            // Generate rounds data (server creates the questions)
            const gameRounds = generateDifficultyBasedRounds(rounds.length, difficulty_level);

            // Create new game session
            gameSession = await GameSession.create({
                user_id: userId,
                difficulty_level: difficulty_level,
                number_of_rounds: rounds.length,
                total_time: total_time,
                correct_answers: 0, // Will be calculated
                score: 0, // Will be calculated
                completed: true, // Game is completed immediately
                is_public: true,
                created_by_admin: null,
                admin_instructions: null
            });

            console.log(`🎮 Created new game session ${gameSession.id} for user ${user.username}`);

            // Process new session rounds
            for (let i = 0; i < rounds.length; i++) {
                const userRound = rounds[i];
                const gameRound = gameRounds[i];

                // Validate user round data
                if (!userRound.user_symbol || !userRound.response_time) {
                    return res.status(400).json({
                        message: `Round ${i + 1}: user_symbol and response_time are required.`
                    });
                }

                // Validate symbol
                if (!['>', '<', '='].includes(userRound.user_symbol)) {
                    return res.status(400).json({
                        message: `Round ${i + 1}: user_symbol must be '>', '<', or '='.`
                    });
                }

                // Calculate correct symbol for this round
                let correct_symbol;
                if (gameRound.first_number > gameRound.second_number) {
                    correct_symbol = '>';
                } else if (gameRound.first_number < gameRound.second_number) {
                    correct_symbol = '<';
                } else {
                    correct_symbol = '=';
                }

                // Check if answer is correct
                const isCorrect = userRound.user_symbol === correct_symbol;
                if (isCorrect) {
                    correctAnswers++;
                }

                // Create round detail in database
                await RoundDetail.create({
                    game_session_id: gameSession.id,
                    round_number: i + 1,
                    first_number: gameRound.first_number,
                    second_number: gameRound.second_number,
                    correct_symbol: correct_symbol,
                    user_symbol: userRound.user_symbol,
                    response_time: userRound.response_time,
                    is_correct: isCorrect
                });

                processedRounds.push({
                    round_number: i + 1,
                    question: `${gameRound.first_number} ? ${gameRound.second_number}`,
                    your_answer: userRound.user_symbol,
                    correct_answer: correct_symbol,
                    is_correct: isCorrect,
                    response_time: userRound.response_time
                });
            }
        }

        // Calculate final score
        const finalScore = correctAnswers * 100; // 100 points per correct answer
        const accuracy = Math.round((correctAnswers / gameSession.number_of_rounds) * 100);

        // Prepare update data - NEVER change the completed status of GameSession
        const updateData = {
            total_time: total_time,
            correct_answers: correctAnswers,
            score: finalScore,
            recording_url: recording_url || null
            // NOTE: Intentionally NOT setting completed field to preserve current status
        };

        console.log(`⚠️ NOT changing completed status for GameSession ${gameSession.id} (keeping as is)`);

        // Update game session with final results
        await gameSession.update(updateData);

        // ALWAYS CREATE A NEW GAME HISTORY RECORD for each game completion
        const gameHistory = await GameHistory.create({
            game_session_id: gameSession.id,
            user_id: userId,
            total_time: total_time,
            correct_answers: correctAnswers,
            score: finalScore,
            completed: true,
            started_at: new Date(Date.now() - (total_time * 1000)), // Estimate start time
            completed_at: new Date()
        });
        console.log(`📝 Created NEW GameHistory record ${gameHistory.id} for GameSession ${gameSession.id} (User: ${user.username})`);

        // CREATE USER ROUND RESPONSES for detailed tracking (for both new and existing sessions)
        console.log(`📝 Creating UserRoundResponse records for GameHistory ${gameHistory.id}...`);

        // Clear any existing UserRoundResponse records for this game history to avoid duplicates
        await UserRoundResponse.destroy({
            where: {
                game_history_id: gameHistory.id,
                user_id: userId
            }
        });

        // Create UserRoundResponse records for all rounds
        for (let i = 0; i < processedRounds.length; i++) {
            const roundData = processedRounds[i];
            const userRound = rounds[i];

            // Find the corresponding RoundDetail
            let roundDetail;
            if (isNewSession) {
                // For new sessions, find by round number
                roundDetail = await RoundDetail.findOne({
                    where: {
                        game_session_id: gameSession.id,
                        round_number: i + 1
                    }
                });
            } else {
                // For existing sessions, use the rounds from the game session
                roundDetail = gameSession.rounds.find(r => r.round_number === (i + 1));
            }

            if (roundDetail) {
                await UserRoundResponse.create({
                    round_detail_id: roundDetail.id,
                    game_history_id: gameHistory.id,
                    user_id: userId,
                    user_symbol: userRound.user_symbol || roundData.your_answer,
                    response_time: userRound.response_time || roundData.response_time,
                    is_correct: roundData.is_correct,
                    points_earned: roundData.is_correct ? 100 : 0,
                    answered_at: new Date()
                });
                console.log(`✅ Created UserRoundResponse for Round ${i + 1}: ${roundData.your_answer} (${roundData.is_correct ? 'Correct' : 'Wrong'})`);
            } else {
                console.error(`❌ Could not find RoundDetail for round ${i + 1} in session ${gameSession.id}`);
            }
        }
        console.log(`📝 Created ${processedRounds.length} UserRoundResponse records for GameHistory ${gameHistory.id}`);

        // Calculate rewards (experience and coins)
        const experienceGained = Math.floor(finalScore * 0.1); // 10% of score as XP
        const coinsEarned = correctAnswers; // 1 coin per correct answer

        // Update user stats
        const newExperience = user.experience_points + experienceGained;
        const newLevel = Math.floor(newExperience / 1000) + 1;

        await user.update({
            experience_points: newExperience,
            coins: user.coins + coinsEarned,
            current_level: newLevel
        });

        console.log(`✅ Game ${gameSession.id} completed by user ${user.username}: ${correctAnswers}/${gameSession.number_of_rounds} correct, ${finalScore} points`);

        // Return comprehensive results
        res.status(isNewSession ? 201 : 200).json({
            message: isNewSession ? 'Game created and completed successfully!' : 'Game completed successfully!',
            session_info: {
                mode: isNewSession ? 'new_session' : 'existing_session',
                game_id: gameSession.id,
                game_history_id: gameHistory.id,
                completed_by: user.username
            },
            game_result: {
                game_id: gameSession.id,
                player: {
                    username: user.username,
                    level_before: user.current_level,
                    level_after: newLevel,
                    level_up: newLevel > user.current_level
                },
                performance: {
                    total_rounds: gameSession.number_of_rounds,
                    correct_answers: correctAnswers,
                    wrong_answers: gameSession.number_of_rounds - correctAnswers,
                    accuracy: accuracy,
                    total_time: total_time,
                    average_time_per_round: Math.round((total_time / gameSession.number_of_rounds) * 10) / 10
                },
                scoring: {
                    final_score: finalScore,
                    points_per_correct: 100,
                    experience_gained: experienceGained,
                    coins_earned: coinsEarned
                },
                session_type: gameSession.created_by_admin ? 'admin_assigned' : 'self_created'
            },
            detailed_rounds: processedRounds,
            game_history_info: {
                history_id: gameHistory.id,
                view_detailed_responses: `GET /api/game/history-details/${gameHistory.id}`,
                note: "Use the above endpoint to see detailed round-by-round user inputs and analysis"
            },
            summary: {
                result: correctAnswers >= (gameSession.number_of_rounds * 0.7) ? '🎉 Great job!' :
                    correctAnswers >= (gameSession.number_of_rounds * 0.5) ? '👍 Good effort!' :
                        '💪 Keep practicing!',
                next_suggestion: isNewSession && difficulty_level < 10 && accuracy >= 80 ?
                    `Try difficulty level ${difficulty_level + 1} next!` :
                    isNewSession && difficulty_level > 1 && accuracy < 50 ?
                        `Try difficulty level ${difficulty_level - 1} next!` :
                        'Keep playing to improve!'
            }
        });

    } catch (err) {
        console.error('❌ Error in complete game:', err);
        res.status(500).json({
            message: 'Server error while processing game',
            error: err.message
        });
    }
};

// GET /api/game/stats/summary - Get comprehensive game statistics
export const getGameStatsSummary = async (req, res) => {
    const userId = req.userId;

    try {
        // Get user info
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'full_name', 'usertype', 'current_level', 'experience_points', 'coins']
        });

        if (!user) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        // Build where clause based on user type
        const whereClause = { user_id: userId };
        // Removed customer restriction - now all users can see all their game sessions
        // if (user.usertype === 'Customer') {
        //     // Customers only see admin-assigned sessions
        //     whereClause.created_by_admin = { [Op.ne]: null };
        // }

        // Get overall statistics
        const overallStats = {
            games_played: await GameSession.count({
                where: { ...whereClause, completed: true }
            }),
            best_score: await GameSession.max('score', {
                where: { ...whereClause, completed: true }
            }) || 0,
            total_score: await GameSession.sum('score', {
                where: { ...whereClause, completed: true }
            }) || 0,
            current_level: user.current_level,
            experience_points: user.experience_points,
            level_progress: (user.experience_points % 1000) / 1000, // Assuming 1000 XP per level
            coins: user.coins
        };

        // Get recent performance (last 10 games)
        const recentGames = await GameSession.findAll({
            where: { ...whereClause, completed: true },
            order: [['updatedAt', 'DESC']],
            limit: 10,
            attributes: ['score', 'correct_answers', 'number_of_rounds', 'total_time', 'updatedAt']
        });

        const recentPerformance = {
            average_score: recentGames.length > 0 ?
                Math.round(recentGames.reduce((sum, game) => sum + game.score, 0) / recentGames.length) : 0,
            average_accuracy: recentGames.length > 0 ?
                Math.round(recentGames.reduce((sum, game) => sum + (game.correct_answers / game.number_of_rounds * 100), 0) / recentGames.length) : 0,
            average_time: recentGames.length > 0 ?
                Math.round(recentGames.reduce((sum, game) => sum + game.total_time, 0) / recentGames.length) : 0,
            games_analyzed: recentGames.length
        };

        // Format recent games
        const formattedRecentGames = recentGames.map(game => ({
            score: game.score,
            accuracy: Math.round((game.correct_answers / game.number_of_rounds) * 100),
            total_time: game.total_time,
            completed_at: game.updatedAt
        }));

        res.status(200).json({
            message: 'Game statistics summary retrieved successfully',
            summary: {
                overall: overallStats,
                recent_performance: recentPerformance,
                recent_games: formattedRecentGames,
                user_type: user.usertype,
                access_level: 'full_access'
            }
        });

    } catch (err) {
        console.error('Error retrieving game statistics summary:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/game/assigned - Get assigned game sessions (CUSTOMER ONLY)
export const getAssignedSessions = async (req, res) => {
    const userId = req.userId;
    const { page = 1, limit = 10, status = 'all' } = req.query;

    try {
        // Get user info to verify they are a customer
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'usertype']
        });

        if (!user) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        if (user.usertype !== 'Customer') {
            return res.status(403).json({
                message: 'This endpoint is for Customer users only.'
            });
        }

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        // Build where clause for admin-assigned sessions
        const whereClause = {
            user_id: userId,
            created_by_admin: { [Op.ne]: null }
        };

        // Add status filter
        if (status === 'active') {
            whereClause.completed = false;
        } else if (status === 'completed') {
            whereClause.completed = true;
        }

        // Get total count
        const totalSessions = await GameSession.count({
            where: whereClause
        });

        // Get sessions with pagination
        const sessions = await GameSession.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'adminCreator',
                    attributes: ['id', 'username', 'full_name'],
                    required: true
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: limitNum,
            offset: offset
        });

        res.status(200).json({
            message: 'Assigned game sessions retrieved successfully',
            pagination: {
                total: totalSessions,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(totalSessions / limitNum)
            },
            sessions: sessions.map(session => ({
                id: session.id,
                number_of_rounds: session.number_of_rounds,
                completed: session.completed,
                score: session.score,
                admin_instructions: session.admin_instructions,
                created_at: session.createdAt,
                assigned_by: session.adminCreator
            }))
        });

    } catch (err) {
        console.error('Error retrieving assigned game sessions:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/game/available - Get all available (unassigned) game sessions that anyone can join
export const getAvailableGames = async (req, res) => {
    const { page = 1, limit = 10, admin_id = null } = req.query;

    try {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        console.log('🎮 Getting available games with params:', { page: pageNum, limit: limitNum, admin_id });

        // First, let's see what game sessions exist in the database
        const allSessions = await GameSession.findAll({
            attributes: ['id', 'user_id', 'completed', 'is_public', 'created_by_admin', 'admin_instructions'],
            limit: 10
        });
        console.log('📋 All game sessions in database:', allSessions);

        // Build where clause for unassigned public sessions
        let whereClause = {
            completed: false         // Only active sessions
        };

        // Only filter by user_id if we want to be strict
        // For debugging, let's be more flexible
        if (admin_id) {
            whereClause.created_by_admin = admin_id;
        } else {
            // Show sessions that are either unassigned OR available
            whereClause = {
                completed: false,
                [Op.or]: [
                    { user_id: null },           // Unassigned sessions
                    { is_public: true }          // Public sessions
                ]
            };
        }

        console.log('🔍 Where clause:', whereClause);

        // Get total count
        const totalGames = await GameSession.count({
            where: whereClause
        });

        console.log('📊 Total games found:', totalGames);

        // Get available game sessions
        const availableGames = await GameSession.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'adminCreator',
                    attributes: ['id', 'username', 'full_name'],
                    required: false  // Changed from true to false to allow sessions without admin
                },
                {
                    model: RoundDetail,
                    as: 'rounds',
                    attributes: ['round_number'],
                    required: false
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: limitNum,
            offset: offset
        });

        console.log('🎯 Available games retrieved:', availableGames.length);

        // Format the response
        const formattedGames = availableGames.map(game => {
            const adminCreator = game.adminCreator || {
                id: 1,
                username: 'system',
                full_name: 'System Admin'
            };

            return {
                id: game.id,
                number_of_rounds: game.number_of_rounds,
                admin_instructions: game.admin_instructions || 'Complete the mathematical challenges',
                created_at: game.createdAt,
                created_by: adminCreator,
                time_limit: '10 minutes per session',
                round_time_limit: '60 seconds per round',
                points_per_correct: 100,
                status: 'available_to_join',
                progress: {
                    is_user_assigned: false,
                    is_assigned_to_someone: false
                }
            };
        });

        res.status(200).json({
            message: 'Available game sessions retrieved successfully',
            pagination: {
                total: totalGames,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(totalGames / limitNum)
            },
            available_games: formattedGames
        });

    } catch (err) {
        console.error('❌ Error retrieving available game sessions:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Helper function to generate random rounds
function generateRandomRounds(numberOfRounds) {
    const rounds = [];
    for (let i = 0; i < numberOfRounds; i++) {
        rounds.push({
            first_number: Math.floor(Math.random() * 50) + 1,
            second_number: Math.floor(Math.random() * 50) + 1
        });
    }
    return rounds;
}

// POST /api/game/create-instant - Create instant game for any user (QUICK PLAY)
export const createInstantGame = async (req, res) => {
    const userId = req.userId;
    const {
        difficulty_level = 1,
        number_of_rounds = 10,
        custom_rounds = null
    } = req.body;

    try {
        // Validate input
        if (number_of_rounds < 1 || number_of_rounds > 50) {
            return res.status(400).json({
                message: 'Number of rounds must be between 1 and 50.'
            });
        }

        if (difficulty_level < 1 || difficulty_level > 10) {
            return res.status(400).json({
                message: 'Difficulty level must be between 1 and 10.'
            });
        }

        // Get user info
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'full_name', 'current_level', 'experience_points']
        });

        if (!user) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        // Create game session for the user
        const gameSession = await GameSession.create({
            user_id: userId,
            difficulty_level: difficulty_level,
            number_of_rounds: number_of_rounds,
            total_time: 0,
            correct_answers: 0,
            score: 0,
            completed: false,
            is_public: true,
            created_by_admin: null, // This is a user-created instant game
            admin_instructions: null
        });

        console.log(`🎮 Created instant game session ${gameSession.id} for user ${user.username}`);

        // Generate rounds data
        const roundsData = custom_rounds || generateDifficultyBasedRounds(number_of_rounds, difficulty_level);
        const roundDetails = [];

        // Create round details
        for (let i = 0; i < number_of_rounds; i++) {
            const round = roundsData[i];
            let first_number, second_number;

            // Adjust difficulty based on level
            const maxNumber = Math.min(10 + (difficulty_level * 10), 100);

            if (round) {
                first_number = round.first_number;
                second_number = round.second_number;
            } else {
                first_number = Math.floor(Math.random() * maxNumber) + 1;
                second_number = Math.floor(Math.random() * maxNumber) + 1;
            }

            // Calculate correct symbol
            let correct_symbol;
            if (first_number > second_number) {
                correct_symbol = '>';
            } else if (first_number < second_number) {
                correct_symbol = '<';
            } else {
                correct_symbol = '=';
            }

            const roundDetail = await RoundDetail.create({
                game_session_id: gameSession.id,
                round_number: i + 1,
                first_number,
                second_number,
                correct_symbol,
                user_symbol: null,
                response_time: null,
                is_correct: false
            });

            roundDetails.push({
                round_number: roundDetail.round_number,
                first_number: roundDetail.first_number,
                second_number: roundDetail.second_number
                // Note: correct_symbol is not included for security
            });
        }

        console.log(`📝 Created ${roundDetails.length} rounds for game session ${gameSession.id}`);

        // Response with game data ready to play
        res.status(201).json({
            message: 'Instant game created successfully! You can start playing immediately.',
            player: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                current_level: user.current_level
            },
            game_session: {
                id: gameSession.id,
                difficulty_level: gameSession.difficulty_level,
                number_of_rounds: gameSession.number_of_rounds,
                time_limit: 600, // 10 minutes total
                round_time_limit: 60, // 60 seconds per round
                points_per_correct: 100,
                created_at: gameSession.createdAt,
                status: 'ready_to_play'
            },
            rounds: roundDetails,
            instructions: {
                how_to_play: "Compare the two numbers and choose the correct symbol: > (greater than), < (less than), or = (equal to)",
                scoring: "100 points per correct answer",
                time_limit: "60 seconds per round, 10 minutes total",
                next_steps: [
                    `Use POST /api/game/${gameSession.id}/submit-round to submit each round`,
                    `Use POST /api/game/complete to finish the game when all rounds are done`,
                    `Use GET /api/game/${gameSession.id} to check current progress`
                ]
            }
        });

    } catch (err) {
        console.error('❌ Error creating instant game:', err);
        res.status(500).json({
            message: 'Server error while creating instant game',
            error: err.message
        });
    }
};

// Helper function to generate difficulty-based random rounds
function generateDifficultyBasedRounds(numberOfRounds, difficultyLevel = 1) {
    const rounds = [];
    const maxNumber = Math.min(10 + (difficultyLevel * 10), 100);

    for (let i = 0; i < numberOfRounds; i++) {
        rounds.push({
            first_number: Math.floor(Math.random() * maxNumber) + 1,
            second_number: Math.floor(Math.random() * maxNumber) + 1
        });
    }
    return rounds;
}

// POST /api/game/submit-whole-game - Create and submit entire game in one call
export const submitWholeGame = async (req, res) => {
    const userId = req.userId;
    const {
        difficulty_level = 1,
        number_of_rounds = 10,
        total_time,
        rounds // Array of user answers
    } = req.body;

    try {
        // Validate required fields
        if (!total_time || !rounds || !Array.isArray(rounds)) {
            return res.status(400).json({
                message: 'total_time and rounds array are required.'
            });
        }

        // Validate input ranges
        if (number_of_rounds < 1 || number_of_rounds > 50) {
            return res.status(400).json({
                message: 'Number of rounds must be between 1 and 50.'
            });
        }

        if (difficulty_level < 1 || difficulty_level > 10) {
            return res.status(400).json({
                message: 'Difficulty level must be between 1 and 10.'
            });
        }

        // Validate rounds count
        if (rounds.length !== number_of_rounds) {
            return res.status(400).json({
                message: `Expected ${number_of_rounds} rounds, but received ${rounds.length}.`
            });
        }

        // Get user info
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'full_name', 'current_level', 'experience_points', 'coins']
        });

        if (!user) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        // Generate rounds data (server creates the questions)
        const gameRounds = generateDifficultyBasedRounds(number_of_rounds, difficulty_level);

        // Create game session
        const gameSession = await GameSession.create({
            user_id: userId,
            difficulty_level: difficulty_level,
            number_of_rounds: number_of_rounds,
            total_time: total_time,
            correct_answers: 0, // Will be calculated
            score: 0, // Will be calculated
            completed: true, // Game is completed immediately
            is_public: true,
            created_by_admin: null,
            admin_instructions: null
        });

        console.log(`🎮 Created whole game session ${gameSession.id} for user ${user.username}`);

        // Process all rounds
        let correctAnswers = 0;
        const processedRounds = [];

        for (let i = 0; i < number_of_rounds; i++) {
            const userRound = rounds[i];
            const gameRound = gameRounds[i];

            // Validate user round data
            if (!userRound.user_symbol || !userRound.response_time) {
                return res.status(400).json({
                    message: `Round ${i + 1}: user_symbol and response_time are required.`
                });
            }

            // Validate symbol
            if (!['>', '<', '='].includes(userRound.user_symbol)) {
                return res.status(400).json({
                    message: `Round ${i + 1}: user_symbol must be '>', '<', or '='.`
                });
            }

            // Calculate correct symbol for this round
            let correct_symbol;
            if (gameRound.first_number > gameRound.second_number) {
                correct_symbol = '>';
            } else if (gameRound.first_number < gameRound.second_number) {
                correct_symbol = '<';
            } else {
                correct_symbol = '=';
            }

            // Check if answer is correct
            const isCorrect = userRound.user_symbol === correct_symbol;
            if (isCorrect) {
                correctAnswers++;
            }

            // Create round detail in database
            await RoundDetail.create({
                game_session_id: gameSession.id,
                round_number: i + 1,
                first_number: gameRound.first_number,
                second_number: gameRound.second_number,
                correct_symbol: correct_symbol,
                user_symbol: userRound.user_symbol,
                response_time: userRound.response_time,
                is_correct: isCorrect
            });

            processedRounds.push({
                round_number: i + 1,
                question: `${gameRound.first_number} ? ${gameRound.second_number}`,
                your_answer: userRound.user_symbol,
                correct_answer: correct_symbol,
                is_correct: isCorrect,
                response_time: userRound.response_time
            });
        }

        // Calculate final score and update game session
        const finalScore = correctAnswers * 100; // 100 points per correct answer
        const accuracy = Math.round((correctAnswers / number_of_rounds) * 100);

        await gameSession.update({
            correct_answers: correctAnswers,
            score: finalScore
        });

        // Calculate rewards
        const experienceGained = Math.floor(finalScore * 0.1); // 10% of score as XP
        const coinsEarned = correctAnswers; // 1 coin per correct answer

        // Update user stats
        const newExperience = user.experience_points + experienceGained;
        const newLevel = Math.floor(newExperience / 1000) + 1;

        await user.update({
            experience_points: newExperience,
            coins: user.coins + coinsEarned,
            current_level: newLevel
        });

        console.log(`✅ Game ${gameSession.id} completed: ${correctAnswers}/${number_of_rounds} correct, ${finalScore} points`);

        // Return comprehensive results
        res.status(201).json({
            message: 'Game created and completed successfully!',
            game_result: {
                game_id: gameSession.id,
                player: {
                    username: user.username,
                    level_before: user.current_level,
                    level_after: newLevel,
                    level_up: newLevel > user.current_level
                },
                performance: {
                    total_rounds: number_of_rounds,
                    correct_answers: correctAnswers,
                    wrong_answers: number_of_rounds - correctAnswers,
                    accuracy: accuracy,
                    total_time: total_time,
                    average_time_per_round: Math.round((total_time / number_of_rounds) * 10) / 10
                },
                scoring: {
                    final_score: finalScore,
                    points_per_correct: 100,
                    experience_gained: experienceGained,
                    coins_earned: coinsEarned
                },
                difficulty: {
                    level: difficulty_level,
                    number_range: `1-${Math.min(10 + (difficulty_level * 10), 100)}`
                }
            },
            detailed_rounds: processedRounds,
            summary: {
                result: correctAnswers >= (number_of_rounds * 0.7) ? '🎉 Great job!' :
                    correctAnswers >= (number_of_rounds * 0.5) ? '👍 Good effort!' :
                        '💪 Keep practicing!',
                next_suggestion: difficulty_level < 10 && accuracy >= 80 ?
                    `Try difficulty level ${difficulty_level + 1} next!` :
                    difficulty_level > 1 && accuracy < 50 ?
                        `Try difficulty level ${difficulty_level - 1} next!` :
                        'Keep playing to improve!'
            }
        });

    } catch (err) {
        console.error('❌ Error in submit whole game:', err);
        res.status(500).json({
            message: 'Server error while processing game',
            error: err.message
        });
    }
};

// POST /api/game/replay/{gameId} - Replay a completed game with same questions
export const replayGame = async (req, res) => {
    const userId = req.userId;
    const gameId = req.params.gameId;

    try {
        // Find the original completed game
        const originalGame = await GameSession.findByPk(gameId, {
            include: [
                {
                    model: RoundDetail,
                    as: 'rounds',
                    attributes: [
                        'round_number',
                        'first_number',
                        'second_number',
                        'correct_symbol'
                    ],
                    order: [['round_number', 'ASC']]
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username']
                }
            ]
        });

        if (!originalGame) {
            return res.status(404).json({
                message: 'Original game not found.'
            });
        }

        if (!originalGame.completed) {
            return res.status(400).json({
                message: 'Can only replay completed games.'
            });
        }

        // Get user info
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'full_name', 'current_level']
        });

        if (!user) {
            return res.status(404).json({
                message: 'User not found.'
            });
        }

        // Create new game session for replay
        const replaySession = await GameSession.create({
            user_id: userId,
            difficulty_level: originalGame.difficulty_level || 1,
            number_of_rounds: originalGame.number_of_rounds,
            total_time: 0,
            correct_answers: 0,
            score: 0,
            completed: false,
            is_public: true,
            created_by_admin: null,
            admin_instructions: `🔁 Replay of Game #${originalGame.id} (Originally played by ${originalGame.user?.username || 'Unknown'})`,
            original_game_id: originalGame.id  // Reference to original game
        });

        // Create round details with same questions
        const roundDetails = [];
        for (const originalRound of originalGame.rounds) {
            const roundDetail = await RoundDetail.create({
                game_session_id: replaySession.id,
                round_number: originalRound.round_number,
                first_number: originalRound.first_number,
                second_number: originalRound.second_number,
                correct_symbol: originalRound.correct_symbol,
                user_symbol: null,
                response_time: null,
                is_correct: false
            });

            roundDetails.push({
                round_number: roundDetail.round_number,
                first_number: roundDetail.first_number,
                second_number: roundDetail.second_number
                // Note: correct_symbol is not included for security
            });
        }

        res.status(201).json({
            message: 'Replay game created successfully! Same questions, new challenge!',
            replay_info: {
                original_game_id: originalGame.id,
                original_score: originalGame.score,
                original_accuracy: Math.round((originalGame.correct_answers / originalGame.number_of_rounds) * 100),
                original_player: originalGame.user?.username || 'Unknown'
            },
            player: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                current_level: user.current_level
            },
            game_session: {
                id: replaySession.id,
                number_of_rounds: replaySession.number_of_rounds,
                admin_instructions: replaySession.admin_instructions,
                time_limit: 600, // 10 minutes
                round_time_limit: 60, // 60 seconds per round
                points_per_correct: 100
            },
            rounds: roundDetails,
            challenge: {
                message: originalGame.score > 0 ?
                    `🎯 Can you beat the original score of ${originalGame.score} points?` :
                    `🎮 Try to get a better score this time!`,
                target_score: originalGame.score,
                target_accuracy: Math.round((originalGame.correct_answers / originalGame.number_of_rounds) * 100)
            }
        });

    } catch (err) {
        console.error('Error creating replay game:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/game/history/{gameId}/details - Get detailed history of a specific game
export const getGameDetails = async (req, res) => {
    const userId = req.userId;
    const gameId = req.params.gameId;

    try {
        // Find the game with all details
        const game = await GameSession.findByPk(gameId, {
            include: [
                {
                    model: RoundDetail,
                    as: 'rounds',
                    attributes: [
                        'round_number',
                        'first_number',
                        'second_number',
                        'correct_symbol',
                        'user_symbol',
                        'response_time',
                        'is_correct'
                    ],
                    order: [['round_number', 'ASC']]
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'full_name']
                },
                {
                    model: User,
                    as: 'adminCreator',
                    attributes: ['id', 'username', 'full_name']
                }
            ]
        });

        if (!game) {
            return res.status(404).json({
                message: 'Game not found.'
            });
        }

        // Check if user has access to this game
        if (game.user_id !== userId) {
            // Get user to check if they're admin
            const user = await User.findByPk(userId);
            if (!user || user.usertype !== 'Admin') {
                return res.status(403).json({
                    message: 'Access denied. You can only view your own games.'
                });
            }
        }

        // Calculate detailed statistics
        const rounds = game.rounds || [];
        const correctRounds = rounds.filter(r => r.is_correct);
        const averageResponseTime = rounds.length > 0 ?
            rounds.reduce((sum, r) => sum + (r.response_time || 0), 0) / rounds.length : 0;

        const fastestCorrect = correctRounds.length > 0 ?
            Math.min(...correctRounds.map(r => r.response_time)) : 0;

        const slowestCorrect = correctRounds.length > 0 ?
            Math.max(...correctRounds.map(r => r.response_time)) : 0;

        res.status(200).json({
            message: 'Game details retrieved successfully',
            game: {
                id: game.id,
                player: game.user,
                admin_creator: game.adminCreator,
                session_info: {
                    number_of_rounds: game.number_of_rounds,
                    total_time: game.total_time,
                    completed: game.completed,
                    is_public: game.is_public,
                    admin_instructions: game.admin_instructions,
                    created_at: game.createdAt,
                    completed_at: game.updatedAt
                },
                performance: {
                    score: game.score,
                    correct_answers: game.correct_answers,
                    wrong_answers: game.number_of_rounds - game.correct_answers,
                    accuracy: Math.round((game.correct_answers / game.number_of_rounds) * 100),
                    average_response_time: Math.round(averageResponseTime * 100) / 100,
                    fastest_correct_time: fastestCorrect,
                    slowest_correct_time: slowestCorrect
                },
                rounds: rounds.map(round => ({
                    round_number: round.round_number,
                    question: `${round.first_number} ? ${round.second_number}`,
                    correct_answer: round.correct_symbol,
                    your_answer: round.user_symbol,
                    is_correct: round.is_correct,
                    response_time: round.response_time,
                    result: round.is_correct ? '✅ Correct' : '❌ Wrong'
                })),
                replay_available: game.completed
            }
        });

    } catch (err) {
        console.error('Error retrieving game details:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/game/join-session/{sessionId} - Join a game session and create game history record
export const joinGameSession = async (req, res) => {
    const userId = req.userId;
    const sessionId = req.params.sessionId;

    try {
        // Find the game session
        const gameSession = await GameSession.findByPk(sessionId, {
            include: [
                {
                    model: RoundDetail,
                    as: 'rounds',
                    attributes: ['id', 'round_number', 'first_number', 'second_number'],
                    order: [['round_number', 'ASC']]
                },
                {
                    model: User,
                    as: 'adminCreator',
                    attributes: ['id', 'username', 'full_name'],
                    required: false
                }
            ]
        });

        if (!gameSession) {
            return res.status(404).json({
                message: 'Game session not found.'
            });
        }

        // Check if session is completed
        if (gameSession.completed) {
            return res.status(409).json({
                message: 'This game session has already been completed.'
            });
        }

        // Check if user already joined this session
        const existingHistory = await GameHistory.findOne({
            where: {
                game_session_id: sessionId,
                user_id: userId
            }
        });

        if (existingHistory) {
            // User has already joined - return existing data without changing anything
            console.log(`👥 User ${userId} re-accessing already joined game session ${sessionId}, history ID: ${existingHistory.id}`);

            // Get user info for response
            const user = await User.findByPk(userId, {
                attributes: ['id', 'username', 'full_name', 'current_level', 'avatar']
            });

            return res.status(200).json({
                message: 'You have already joined this game session. Returning existing data.',
                user: user,
                admin_creator: gameSession.adminCreator,
                game_session: {
                    id: gameSession.id,
                    difficulty_level: gameSession.difficulty_level,
                    number_of_rounds: gameSession.number_of_rounds,
                    admin_instructions: gameSession.admin_instructions,
                    is_public: gameSession.is_public,
                    created_by_admin: gameSession.created_by_admin,
                    completed: gameSession.completed // Return current status without changing it
                },
                game_history: {
                    id: existingHistory.id,
                    started_at: existingHistory.started_at,
                    completed: existingHistory.completed,
                    score: existingHistory.score,
                    correct_answers: existingHistory.correct_answers
                },
                rounds: gameSession.rounds?.map(round => ({
                    id: round.id,
                    round_number: round.round_number,
                    first_number: round.first_number,
                    second_number: round.second_number
                    // Note: correct_symbol is not included for security
                })) || [],
                note: "Existing session data returned. No changes made to completed status."
            });
        }

        // Get user info
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'full_name', 'current_level', 'avatar']
        });

        // Create game history record
        const gameHistory = await GameHistory.create({
            game_session_id: sessionId,
            user_id: userId,
            started_at: new Date()
        });

        console.log(`🎮 User ${user.username} joined game session ${sessionId}, created history record ${gameHistory.id}`);

        res.status(201).json({
            message: 'Successfully joined game session!',
            user: user,
            admin_creator: gameSession.adminCreator,
            game_session: {
                id: gameSession.id,
                difficulty_level: gameSession.difficulty_level,
                number_of_rounds: gameSession.number_of_rounds,
                admin_instructions: gameSession.admin_instructions,
                is_public: gameSession.is_public,
                created_by_admin: gameSession.created_by_admin
            },
            game_history: {
                id: gameHistory.id,
                started_at: gameHistory.started_at
            },
            rounds: gameSession.rounds?.map(round => ({
                id: round.id,
                round_number: round.round_number,
                first_number: round.first_number,
                second_number: round.second_number
                // Note: correct_symbol is not included for security
            })) || []
        });

    } catch (err) {
        console.error('Error joining game session:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/game/complete-session - Complete a game session using game history (NEW API)
export const completeGameSession = async (req, res) => {
    const userId = req.userId;
    const {
        game_history_id,
        total_time,
        round_responses // Array of user responses to each round
    } = req.body;

    try {
        // Validate required fields
        if (!game_history_id || !total_time || !round_responses || !Array.isArray(round_responses)) {
            return res.status(400).json({
                message: 'game_history_id, total_time and round_responses array are required.'
            });
        }

        // Find the game history record
        const gameHistory = await GameHistory.findByPk(game_history_id, {
            include: [
                {
                    model: GameSession,
                    as: 'gameSession',
                    include: [
                        {
                            model: RoundDetail,
                            as: 'rounds',
                            attributes: ['id', 'round_number', 'first_number', 'second_number', 'correct_symbol'],
                            order: [['round_number', 'ASC']]
                        },
                        {
                            model: User,
                            as: 'adminCreator',
                            attributes: ['id', 'username', 'full_name'],
                            required: false
                        }
                    ]
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'full_name', 'current_level', 'experience_points', 'coins']
                }
            ]
        });

        if (!gameHistory) {
            return res.status(404).json({
                message: 'Game history record not found.'
            });
        }

        // Check if this game history belongs to the user
        if (gameHistory.user_id !== userId) {
            return res.status(403).json({
                message: 'This game history record does not belong to you.'
            });
        }

        // Check if already completed
        if (gameHistory.completed) {
            return res.status(409).json({
                message: 'This game session has already been completed.'
            });
        }

        const gameSession = gameHistory.gameSession;
        const user = gameHistory.user;
        const rounds = gameSession.rounds;

        // Validate round responses count
        if (round_responses.length !== rounds.length) {
            return res.status(400).json({
                message: `Expected ${rounds.length} round responses, but received ${round_responses.length}.`
            });
        }

        // Process all round responses
        let correctAnswers = 0;
        let totalScore = 0;
        const processedRounds = [];

        for (let i = 0; i < round_responses.length; i++) {
            const userResponse = round_responses[i];
            const roundDetail = rounds[i];

            // Validate user response data
            if (!userResponse.user_symbol || userResponse.response_time === undefined) {
                return res.status(400).json({
                    message: `Round ${i + 1}: user_symbol and response_time are required.`
                });
            }

            // Validate symbol
            if (!['>', '<', '='].includes(userResponse.user_symbol)) {
                return res.status(400).json({
                    message: `Round ${i + 1}: user_symbol must be '>', '<', or '='.`
                });
            }

            // Check if answer is correct
            const isCorrect = userResponse.user_symbol === roundDetail.correct_symbol;
            const pointsEarned = isCorrect ? 100 : 0; // Default 100 points per correct answer

            if (isCorrect) {
                correctAnswers++;
            }
            totalScore += pointsEarned;

            // Create user round response record
            await UserRoundResponse.create({
                round_detail_id: roundDetail.id,
                game_history_id: gameHistory.id,
                user_id: userId,
                user_symbol: userResponse.user_symbol,
                response_time: userResponse.response_time,
                is_correct: isCorrect,
                points_earned: pointsEarned,
                answered_at: new Date()
            });

            processedRounds.push({
                round_number: roundDetail.round_number,
                question: `${roundDetail.first_number} ? ${roundDetail.second_number}`,
                your_answer: userResponse.user_symbol,
                correct_answer: roundDetail.correct_symbol,
                is_correct: isCorrect,
                points_earned: pointsEarned,
                response_time: userResponse.response_time
            });
        }

        // Calculate final results
        const accuracy = Math.round((correctAnswers / rounds.length) * 100);

        // Update game history with final results
        await gameHistory.update({
            total_time: total_time,
            correct_answers: correctAnswers,
            score: totalScore,
            completed: true,
            completed_at: new Date()
        });

        // Calculate rewards (experience and coins)
        const experienceGained = Math.floor(totalScore * 0.1); // 10% of score as XP
        const coinsEarned = correctAnswers; // 1 coin per correct answer

        // Update user stats
        const newExperience = user.experience_points + experienceGained;
        const newLevel = Math.floor(newExperience / 1000) + 1;

        await user.update({
            experience_points: newExperience,
            coins: user.coins + coinsEarned,
            current_level: newLevel
        });

        console.log(`✅ Game session ${gameSession.id} completed by user ${user.username}: ${correctAnswers}/${rounds.length} correct, ${totalScore} points`);

        // Return comprehensive results
        res.status(200).json({
            message: 'Game session completed successfully!',
            session_info: {
                game_session_id: gameSession.id,
                game_history_id: gameHistory.id,
                completed_by: user.username,
                admin_creator: gameSession.adminCreator
            },
            game_result: {
                player: {
                    username: user.username,
                    level_before: user.current_level,
                    level_after: newLevel,
                    level_up: newLevel > user.current_level
                },
                performance: {
                    total_rounds: rounds.length,
                    correct_answers: correctAnswers,
                    wrong_answers: rounds.length - correctAnswers,
                    accuracy: accuracy,
                    total_time: total_time,
                    average_time_per_round: Math.round((total_time / rounds.length) * 10) / 10
                },
                scoring: {
                    final_score: totalScore,
                    total_points_possible: rounds.length * 100, // 100 points per round
                    experience_gained: experienceGained,
                    coins_earned: coinsEarned
                },
                session_details: {
                    difficulty_level: gameSession.difficulty_level,
                    admin_instructions: gameSession.admin_instructions,
                    created_by_admin: gameSession.created_by_admin
                }
            },
            detailed_rounds: processedRounds,
            summary: {
                result: correctAnswers >= (rounds.length * 0.7) ? '🎉 Excellent performance!' :
                    correctAnswers >= (rounds.length * 0.5) ? '👍 Good effort!' :
                        '💪 Keep practicing to improve!',
                recommendation: accuracy >= 80 ? 'Try a higher difficulty level next time!' :
                    accuracy < 50 ? 'Consider reviewing the basics and trying again.' :
                        'Keep practicing to build consistency!'
            }
        });

    } catch (err) {
        console.error('❌ Error in complete game session:', err);
        res.status(500).json({
            message: 'Server error while processing game completion',
            error: err.message
        });
    }
};

// GET /api/game/my-history - Get user's game history across all sessions
export const getUserGameHistory = async (req, res) => {
    const userId = req.userId;
    const { page = 1, limit = 20, completed_only = 'true' } = req.query;

    try {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        // Build where clause
        const whereClause = { user_id: userId };
        if (completed_only === 'true') {
            whereClause.completed = true;
        }

        // Get total count
        const totalHistory = await GameHistory.count({
            where: whereClause
        });

        // Get game history with pagination
        const gameHistories = await GameHistory.findAll({
            where: whereClause,
            include: [
                {
                    model: GameSession,
                    as: 'gameSession',
                    attributes: ['id', 'difficulty_level', 'number_of_rounds', 'admin_instructions', 'created_by_admin'],
                    include: [
                        {
                            model: User,
                            as: 'adminCreator',
                            attributes: ['id', 'username', 'full_name'],
                            required: false
                        }
                    ]
                },
                {
                    model: UserRoundResponse,
                    as: 'roundResponses',
                    attributes: ['round_detail_id', 'user_symbol', 'response_time', 'is_correct', 'points_earned', 'answered_at'],
                    include: [
                        {
                            model: RoundDetail,
                            as: 'roundDetail',
                            attributes: ['round_number', 'first_number', 'second_number', 'correct_symbol']
                        }
                    ],
                    required: false
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: limitNum,
            offset: offset
        });

        // Calculate statistics
        const stats = {
            total_sessions_joined: totalHistory,
            completed_sessions: await GameHistory.count({
                where: { user_id: userId, completed: true }
            }),
            total_score: await GameHistory.sum('score', {
                where: { user_id: userId, completed: true }
            }) || 0,
            best_score: await GameHistory.max('score', {
                where: { user_id: userId, completed: true }
            }) || 0
        };

        res.status(200).json({
            message: 'Game history retrieved successfully',
            pagination: {
                total: totalHistory,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(totalHistory / limitNum)
            },
            statistics: stats,
            game_histories: gameHistories.map(history => ({
                id: history.id,
                game_session: history.gameSession,
                total_time: history.total_time,
                correct_answers: history.correct_answers,
                score: history.score,
                completed: history.completed,
                accuracy: history.gameSession && history.gameSession.number_of_rounds > 0 ?
                    Math.round((history.correct_answers / history.gameSession.number_of_rounds) * 100) : 0,
                started_at: history.started_at,
                completed_at: history.completed_at,
                round_responses_count: history.roundResponses ? history.roundResponses.length : 0,
                detailed_rounds: history.roundResponses ? history.roundResponses.map(response => ({
                    round_number: response.roundDetail ? response.roundDetail.round_number : null,
                    question: response.roundDetail ?
                        `${response.roundDetail.first_number} ? ${response.roundDetail.second_number}` : 'Unknown',
                    user_answer: response.user_symbol,
                    correct_answer: response.roundDetail ? response.roundDetail.correct_symbol : null,
                    is_correct: response.is_correct,
                    response_time: response.response_time,
                    points_earned: response.points_earned,
                    answered_at: response.answered_at
                })).sort((a, b) => a.round_number - b.round_number) : []
            }))
        });

    } catch (err) {
        console.error('Error retrieving user game history:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/game/history-details/{historyId} - Get detailed round-by-round data for specific game history
export const getGameHistoryDetails = async (req, res) => {
    const userId = req.userId;
    const historyId = req.params.historyId;

    try {
        // Find the game history record with all related data
        const gameHistory = await GameHistory.findByPk(historyId, {
            include: [
                {
                    model: GameSession,
                    as: 'gameSession',
                    attributes: ['id', 'difficulty_level', 'number_of_rounds', 'admin_instructions', 'created_by_admin'],
                    include: [
                        {
                            model: User,
                            as: 'adminCreator',
                            attributes: ['id', 'username', 'full_name'],
                            required: false
                        }
                    ]
                },
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'full_name', 'current_level']
                },
                {
                    model: UserRoundResponse,
                    as: 'roundResponses',
                    attributes: ['id', 'user_symbol', 'response_time', 'is_correct', 'points_earned', 'answered_at'],
                    include: [
                        {
                            model: RoundDetail,
                            as: 'roundDetail',
                            attributes: ['round_number', 'first_number', 'second_number', 'correct_symbol']
                        }
                    ],
                    order: [['roundDetail', 'round_number', 'ASC']]
                }
            ]
        });

        if (!gameHistory) {
            return res.status(404).json({
                message: 'Game history not found.'
            });
        }

        // Check if this history belongs to the user
        if (gameHistory.user_id !== userId) {
            return res.status(403).json({
                message: 'Access denied. You can only view your own game history.'
            });
        }

        // Format the detailed round responses
        const detailedRounds = gameHistory.roundResponses.map(response => ({
            round_number: response.roundDetail.round_number,
            question: `${response.roundDetail.first_number} ? ${response.roundDetail.second_number}`,
            user_answer: response.user_symbol,
            correct_answer: response.roundDetail.correct_symbol,
            is_correct: response.is_correct,
            response_time: response.response_time,
            points_earned: response.points_earned,
            answered_at: response.answered_at,
            result_emoji: response.is_correct ? '✅' : '❌'
        }));

        // Calculate performance metrics
        const accuracy = gameHistory.gameSession.number_of_rounds > 0 ?
            Math.round((gameHistory.correct_answers / gameHistory.gameSession.number_of_rounds) * 100) : 0;

        res.status(200).json({
            message: 'Game history details retrieved successfully',
            game_history: {
                id: gameHistory.id,
                user: gameHistory.user,
                game_session: gameHistory.gameSession,
                performance: {
                    total_rounds: gameHistory.gameSession.number_of_rounds,
                    correct_answers: gameHistory.correct_answers,
                    wrong_answers: gameHistory.gameSession.number_of_rounds - gameHistory.correct_answers,
                    accuracy: accuracy,
                    total_time: gameHistory.total_time,
                    average_time_per_round: gameHistory.total_time && gameHistory.gameSession.number_of_rounds > 0 ?
                        Math.round((gameHistory.total_time / gameHistory.gameSession.number_of_rounds) * 10) / 10 : 0,
                    final_score: gameHistory.score
                },
                timeline: {
                    started_at: gameHistory.started_at,
                    completed_at: gameHistory.completed_at,
                    completed: gameHistory.completed
                }
            },
            detailed_rounds: detailedRounds,
            summary: {
                fastest_correct_time: detailedRounds
                    .filter(r => r.is_correct)
                    .reduce((min, r) => Math.min(min, r.response_time), Infinity),
                slowest_correct_time: detailedRounds
                    .filter(r => r.is_correct)
                    .reduce((max, r) => Math.max(max, r.response_time), 0),
                most_common_mistake: detailedRounds
                    .filter(r => !r.is_correct)
                    .reduce((acc, r) => {
                        const mistake = `Expected ${r.correct_answer}, answered ${r.user_answer}`;
                        acc[mistake] = (acc[mistake] || 0) + 1;
                        return acc;
                    }, {}),
                performance_trend: detailedRounds.map((round, index) => ({
                    round_number: round.round_number,
                    is_correct: round.is_correct,
                    cumulative_accuracy: Math.round(
                        (detailedRounds.slice(0, index + 1).filter(r => r.is_correct).length / (index + 1)) * 100
                    )
                }))
            }
        });

    } catch (err) {
        console.error('Error retrieving game history details:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
