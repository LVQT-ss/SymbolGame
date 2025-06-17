import GameSession from '../model/game-sessions.model.js';
import RoundDetail from '../model/round-details.model.js';
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

// POST /api/game/complete - Complete a game session
export const completeGame = async (req, res) => {
    const userId = req.userId;
    const { game_session_id, total_time, rounds, recording_url } = req.body;

    try {
        // Validate required fields
        if (!game_session_id || !total_time || !rounds || !Array.isArray(rounds)) {
            return res.status(400).json({
                message: 'game_session_id, total_time, and rounds array are required.'
            });
        }

        // Find the game session
        const gameSession = await GameSession.findByPk(game_session_id, {
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

        // Check if session belongs to user or auto-assign if unassigned
        if (gameSession.user_id && gameSession.user_id !== userId) {
            return res.status(403).json({
                message: 'This game session is already assigned to another user.'
            });
        }

        // Track if game needs auto-assignment
        const wasAutoAssigned = !gameSession.user_id;

        // Auto-assign unassigned game sessions to current user
        if (!gameSession.user_id) {
            await gameSession.update({
                user_id: userId
            });
            // Refresh the gameSession object to include the updated user_id
            await gameSession.reload({
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
        }

        // Check if session is already completed
        if (gameSession.completed) {
            return res.status(409).json({
                message: 'This game session has already been completed.'
            });
        }

        // Validate rounds data
        if (rounds.length !== gameSession.number_of_rounds) {
            return res.status(400).json({
                message: `Expected ${gameSession.number_of_rounds} rounds, but received ${rounds.length}.`
            });
        }

        // Process and validate each round
        let correctAnswers = 0;
        const processedRounds = [];

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
                correct: isCorrect
            });
        }

        // Calculate final score
        const finalScore = correctAnswers * 100; // 100 points per correct answer
        const accuracy = Math.round((correctAnswers / gameSession.number_of_rounds) * 100);

        // Update game session
        await gameSession.update({
            total_time: total_time,
            correct_answers: correctAnswers,
            score: finalScore,
            completed: true,
            recording_url: recording_url || null
        });

        // Calculate rewards (experience and coins)
        const experienceGained = Math.floor(finalScore * 0.1); // 10% of score as XP
        const coinsEarned = correctAnswers; // 1 coin per correct answer

        // Update user stats
        const user = await User.findByPk(userId);
        if (user) {
            await user.update({
                experience_points: user.experience_points + experienceGained,
                coins: user.coins + coinsEarned,
                current_level: Math.floor((user.experience_points + experienceGained) / 1000) + 1
            });
        }

        res.status(200).json({
            message: wasAutoAssigned ? 'Game assigned and completed successfully' : 'Game completed successfully',
            game_result: {
                score: finalScore,
                correct_answers: correctAnswers,
                total_rounds: gameSession.number_of_rounds,
                accuracy: accuracy,
                experience_gained: experienceGained,
                coins_earned: coinsEarned,
                session_type: gameSession.created_by_admin ? 'admin_assigned' : 'self_created',
                auto_assigned: wasAutoAssigned
            }
        });

    } catch (err) {
        console.error('Error completing game session:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
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

        // Build where clause for unassigned public sessions
        const whereClause = {
            user_id: null,           // No specific user assigned
            completed: false,        // Only active sessions
            is_public: true,         // Public sessions only
            created_by_admin: { [Op.ne]: null }  // Must be created by admin
        };

        // Add admin filter if specified
        if (admin_id) {
            whereClause.created_by_admin = admin_id;
        }

        // Get total count
        const totalGames = await GameSession.count({
            where: whereClause
        });

        // Get available game sessions
        const availableGames = await GameSession.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: 'adminCreator',
                    attributes: ['id', 'username', 'full_name'],
                    required: true
                },
                {
                    model: RoundDetail,
                    as: 'rounds',
                    attributes: ['round_number'],  // Only count, don't show actual rounds for security
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: limitNum,
            offset: offset
        });

        res.status(200).json({
            message: 'Available game sessions retrieved successfully',
            pagination: {
                total: totalGames,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(totalGames / limitNum)
            },
            available_games: availableGames.map(game => ({
                id: game.id,
                number_of_rounds: game.number_of_rounds,
                admin_instructions: game.admin_instructions,
                created_at: game.createdAt,
                created_by: game.adminCreator,
                time_limit: '10 minutes per session',
                round_time_limit: '60 seconds per round',
                points_per_correct: 100,
                status: 'available_to_join'
            }))
        });

    } catch (err) {
        console.error('Error retrieving available game sessions:', err);
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
