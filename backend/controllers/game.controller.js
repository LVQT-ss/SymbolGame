import GameSession from '../model/game-sessions.model.js';
import RoundDetail from '../model/round-details.model.js';
import GameHistory from '../model/game-history.model.js';
import UserRoundResponse from '../model/user-round-responses.model.js';
import User from '../model/user.model.js';
import UserStatistics from '../model/user-statistics.model.js';
import sequelize from '../database/db.js';
import { Op } from 'sequelize';
import { updateUserLevelAfterGame } from '../services/levelService.js';

// POST /api/game/start - Create new game session (ADMIN ONLY)
export const startGame = async (req, res) => {
    const adminId = req.userId;
    const { difficulty_level = 1, number_of_rounds = 10, admin_instructions, rounds } = req.body;

    try {
        // Verify admin permissions
        const admin = await User.findByPk(adminId);
        if (!admin || admin.usertype !== 'Admin') {
            return res.status(403).json({
                message: 'Access denied. Admin privileges required to create game sessions.'
            });
        }

        // Validate difficulty level
        if (difficulty_level < 1 || difficulty_level > 3) {
            return res.status(400).json({
                message: 'Difficulty level must be between 1 and 3.'
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
            difficulty_level,
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
                difficulty_level: gameSession.difficulty_level,
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

        // Permission check removed - everyone can access any game session

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

            if (difficulty_level < 1 || difficulty_level > 3) {
                return res.status(400).json({
                    message: 'Difficulty level must be between 1 and 3.'
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

        // Calculate final score with time bonus (same as battle system)
        let finalScore = 0;
        for (let i = 0; i < processedRounds.length; i++) {
            const roundData = processedRounds[i];
            const userRound = rounds[i];

            if (roundData.is_correct) {
                // Base score + time bonus (0.5-10 seconds range in 0.5 increments)
                const rawResponseTime = userRound.response_time || roundData.response_time || 10;
                const responseTime = Math.min(10, Math.max(0.5, Math.round(rawResponseTime * 2) / 2));
                const timeBonus = Math.max(0, (10 - responseTime) * 5);
                finalScore += 100 + Math.floor(timeBonus);
            }
        }
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
                // Calculate points earned with time bonus (same as battle system)
                let pointsEarned = 0;
                if (roundData.is_correct) {
                    const rawResponseTime = userRound.response_time || roundData.response_time || 10;
                    const responseTime = Math.min(10, Math.max(0.5, Math.round(rawResponseTime * 2) / 2));
                    const timeBonus = Math.max(0, (10 - responseTime) * 5);
                    pointsEarned = 100 + Math.floor(timeBonus);
                }

                await UserRoundResponse.create({
                    round_detail_id: roundDetail.id,
                    game_history_id: gameHistory.id,
                    user_id: userId,
                    user_symbol: userRound.user_symbol || roundData.your_answer,
                    response_time: userRound.response_time || roundData.response_time,
                    is_correct: roundData.is_correct,
                    points_earned: pointsEarned,
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

        // Update user coins (XP and level will be updated by level service)
        await user.update({
            coins: user.coins + coinsEarned
        });

        // 🆕 UPDATE USER STATISTICS after game completion (per difficulty level)
        try {
            // Get the difficulty level from the game session
            const gameDifficulty = gameSession.difficulty_level || difficulty_level || 1;
            console.log(`📊 Updating UserStatistics for user ${userId} (${user.username}) at difficulty ${gameDifficulty}...`);

            // Find or create user statistics record for this difficulty level
            let userStats = await UserStatistics.findOne({
                where: {
                    user_id: userId,
                    difficulty_level: gameDifficulty
                }
            });

            if (!userStats) {
                console.log(`   ⚠️  UserStatistics record not found for difficulty ${gameDifficulty}, creating new one...`);
                userStats = await UserStatistics.create({
                    user_id: userId,
                    difficulty_level: gameDifficulty,
                    games_played: 0,
                    best_score: 0,
                    total_score: 0
                });
                console.log(`   ✅ Created UserStatistics record for user ${userId} at difficulty ${gameDifficulty}`);
            }

            // SIMPLIFIED APPROACH: Get statistics directly using raw queries to avoid association issues

            // Get best score and its time from GameHistory for this difficulty
            const bestScoreQuery = await sequelize.query(`
                SELECT gh.score as best_score, gh.total_time as best_score_time, gh.completed_at as best_score_achieved_at
                FROM game_history gh 
                JOIN game_sessions gs ON gh.game_session_id = gs.id 
                WHERE gh.user_id = :userId 
                AND gh.completed = true 
                AND gs.difficulty_level = :difficulty
                ORDER BY gh.score DESC, gh.total_time ASC
                LIMIT 1
            `, {
                replacements: { userId, difficulty: gameDifficulty },
                type: sequelize.QueryTypes.SELECT
            });
            const bestScoreData = bestScoreQuery[0];
            const currentBestScore = bestScoreData?.best_score || 0;
            const bestScoreTime = bestScoreData?.best_score_time || null;
            const bestScoreAchievedAt = bestScoreData?.best_score_achieved_at || null;

            // Get total games played from GameHistory for this difficulty
            const gamesPlayedQuery = await sequelize.query(`
                SELECT COUNT(*) as games_played 
                FROM game_history gh 
                JOIN game_sessions gs ON gh.game_session_id = gs.id 
                WHERE gh.user_id = :userId 
                AND gh.completed = true 
                AND gs.difficulty_level = :difficulty
            `, {
                replacements: { userId, difficulty: gameDifficulty },
                type: sequelize.QueryTypes.SELECT
            });
            const totalGamesPlayed = parseInt(gamesPlayedQuery[0]?.games_played || 0);

            // Get total score from GameHistory for this difficulty
            const totalScoreQuery = await sequelize.query(`
                SELECT SUM(gh.score) as total_score 
                FROM game_history gh 
                JOIN game_sessions gs ON gh.game_session_id = gs.id 
                WHERE gh.user_id = :userId 
                AND gh.completed = true 
                AND gs.difficulty_level = :difficulty
            `, {
                replacements: { userId, difficulty: gameDifficulty },
                type: sequelize.QueryTypes.SELECT
            });
            const totalScore = parseInt(totalScoreQuery[0]?.total_score || 0);

            console.log(`   📈 Calculated stats for difficulty ${gameDifficulty} - Games: ${totalGamesPlayed}, Best: ${currentBestScore} (Time: ${bestScoreTime}s), Total: ${totalScore}`);

            // Update the statistics for this difficulty level
            await userStats.update({
                games_played: totalGamesPlayed,
                best_score: currentBestScore,
                best_score_time: bestScoreTime,
                best_score_achieved_at: bestScoreAchievedAt,
                total_score: totalScore
            });

            console.log(`   ✅ Successfully updated UserStatistics for ${user.username} at difficulty ${gameDifficulty}: ${totalGamesPlayed} games, best: ${currentBestScore} (${bestScoreTime}s), total: ${totalScore}`);

            // 🆕 UPDATE LEADERBOARD CACHE after statistics update
            console.log(`🏆 Triggering leaderboard cache update after game completion...`);

            try {
                // Import the leaderboard controller
                const { default: LeaderboardController } = await import('./leaderboard.controller.js');

                // Create mock request/response objects for the leaderboard update
                const mockReq = {};
                const mockRes = {
                    status: (code) => ({
                        json: (data) => {
                            console.log(`   📈 Leaderboard cache update result (${code}): ${data.message}`);
                            return { status: code, json: data };
                        }
                    })
                };

                // Trigger the leaderboard cache update
                await LeaderboardController.updateLeaderboardCache(mockReq, mockRes);
                console.log(`   🏆 Leaderboard cache updated successfully after game completion`);

            } catch (leaderboardError) {
                console.error(`   ❌ Error updating leaderboard cache:`, leaderboardError.message);
                // Don't fail the main request if leaderboard update fails
            }

        } catch (statsError) {
            console.error(`❌ Error updating UserStatistics for user ${userId}:`, statsError);
            console.error(`   Full error details:`, statsError);
            // Don't fail the whole request if stats update fails, but log the actual error
        }

        // 🆕 Update user level using the new progressive system BEFORE sending response
        const levelUpdateResult = await updateUserLevelAfterGame(userId);

        // Get the updated user data to include in response
        const updatedUser = await User.findByPk(userId, {
            attributes: ['current_level', 'experience_points', 'level_progress']
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
                    level_before: levelUpdateResult.old_level,
                    level_after: levelUpdateResult.new_level,
                    level_up: levelUpdateResult.leveled_up,
                    levels_gained: levelUpdateResult.levels_gained
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
                next_suggestion: isNewSession && difficulty_level < 3 && accuracy >= 80 ?
                    `Try difficulty level ${difficulty_level + 1} next!` :
                    isNewSession && difficulty_level > 1 && accuracy < 50 ?
                        `Try difficulty level ${difficulty_level - 1} next!` :
                        'Keep playing to improve!'
            },
            // 🆕 Updated user info for instant frontend state update
            updated_user_info: {
                current_level: updatedUser.current_level,
                experience_points: updatedUser.experience_points,
                level_progress: updatedUser.level_progress,
                coins: user.coins + coinsEarned
            }
        });

        // Level update is now done synchronously above and included in response

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

        if (difficulty_level < 1 || difficulty_level > 3) {
            return res.status(400).json({
                message: 'Difficulty level must be between 1 and 3.'
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

        if (difficulty_level < 1 || difficulty_level > 3) {
            return res.status(400).json({
                message: 'Difficulty level must be between 1 and 3.'
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

        // Calculate final score with time bonus (same as battle system)
        let finalScore = 0;
        for (let i = 0; i < processedRounds.length; i++) {
            const roundData = processedRounds[i];

            if (roundData.is_correct) {
                // Base score + time bonus (0.5-10 seconds range in 0.5 increments)
                const rawResponseTime = roundData.response_time || 10;
                const responseTime = Math.min(10, Math.max(0.5, Math.round(rawResponseTime * 2) / 2));
                const timeBonus = Math.max(0, (10 - responseTime) * 5);
                finalScore += 100 + Math.floor(timeBonus);
            }
        }
        const accuracy = Math.round((correctAnswers / number_of_rounds) * 100);

        await gameSession.update({
            correct_answers: correctAnswers,
            score: finalScore
        });

        // Calculate rewards
        const experienceGained = Math.floor(finalScore * 0.1); // 10% of score as XP
        const coinsEarned = correctAnswers; // 1 coin per correct answer

        // Update user coins (XP and level will be updated by level service)
        await user.update({
            coins: user.coins + coinsEarned
        });

        // 🆕 UPDATE USER STATISTICS after game completion (submitWholeGame - per difficulty level)
        try {
            console.log(`📊 Updating UserStatistics for user ${userId} (${user.username}) after submitWholeGame at difficulty ${difficulty_level}...`);

            // Find or create user statistics record for this difficulty level
            let userStats = await UserStatistics.findOne({
                where: {
                    user_id: userId,
                    difficulty_level: difficulty_level
                }
            });

            if (!userStats) {
                console.log(`   ⚠️  UserStatistics record not found for difficulty ${difficulty_level}, creating new one...`);
                userStats = await UserStatistics.create({
                    user_id: userId,
                    difficulty_level: difficulty_level,
                    games_played: 0,
                    best_score: 0,
                    total_score: 0
                });
                console.log(`   ✅ Created UserStatistics record for user ${userId} at difficulty ${difficulty_level}`);
            }

            // Get best score and its time from GameSessions for this difficulty (for submitWholeGame)
            const bestScoreData = await GameSession.findOne({
                where: {
                    user_id: userId,
                    completed: true,
                    difficulty_level: difficulty_level
                },
                order: [['score', 'DESC'], ['total_time', 'ASC']],
                attributes: ['score', 'total_time', 'updatedAt']
            });

            const currentBestScore = bestScoreData?.score || 0;
            const bestScoreTime = bestScoreData?.total_time || null;
            const bestScoreAchievedAt = bestScoreData?.updatedAt || null;

            // Get total games played from GameSessions for this difficulty
            const totalGamesPlayed = await GameSession.count({
                where: {
                    user_id: userId,
                    completed: true,
                    difficulty_level: difficulty_level
                }
            });

            // Get total score from GameSessions for this difficulty
            const totalScore = await GameSession.sum('score', {
                where: {
                    user_id: userId,
                    completed: true,
                    difficulty_level: difficulty_level
                }
            }) || 0;

            console.log(`   📈 Calculated stats from GameSessions for difficulty ${difficulty_level} - Games: ${totalGamesPlayed}, Best: ${currentBestScore} (Time: ${bestScoreTime}s), Total: ${totalScore}`);

            // Update the statistics for this difficulty level
            await userStats.update({
                games_played: totalGamesPlayed,
                best_score: currentBestScore,
                best_score_time: bestScoreTime,
                best_score_achieved_at: bestScoreAchievedAt,
                total_score: totalScore
            });

            console.log(`   ✅ Successfully updated UserStatistics for ${user.username} at difficulty ${difficulty_level}: ${totalGamesPlayed} games, best: ${currentBestScore} (${bestScoreTime}s), total: ${totalScore}`);

            // 🆕 UPDATE LEADERBOARD CACHE after statistics update
            console.log(`🏆 Triggering leaderboard cache update after submitWholeGame...`);

            try {
                // Import the leaderboard controller
                const { default: LeaderboardController } = await import('./leaderboard.controller.js');

                // Create mock request/response objects for the leaderboard update
                const mockReq = {};
                const mockRes = {
                    status: (code) => ({
                        json: (data) => {
                            console.log(`   📈 Leaderboard cache update result (${code}): ${data.message}`);
                            return { status: code, json: data };
                        }
                    })
                };

                // Trigger the leaderboard cache update
                await LeaderboardController.updateLeaderboardCache(mockReq, mockRes);
                console.log(`   🏆 Leaderboard cache updated successfully after submitWholeGame`);

            } catch (leaderboardError) {
                console.error(`   ❌ Error updating leaderboard cache:`, leaderboardError.message);
                // Don't fail the main request if leaderboard update fails
            }

        } catch (statsError) {
            console.error(`❌ Error updating UserStatistics for user ${userId}:`, statsError);
            console.error(`   Full error details:`, statsError);
            // Don't fail the whole request if stats update fails, but log the actual error
        }

        // 🆕 Update user level using the new progressive system BEFORE sending response
        const levelUpdateResult = await updateUserLevelAfterGame(userId);

        // Get the updated user data to include in response
        const updatedUser = await User.findByPk(userId, {
            attributes: ['current_level', 'experience_points', 'level_progress']
        });

        console.log(`✅ Game ${gameSession.id} completed: ${correctAnswers}/${number_of_rounds} correct, ${finalScore} points`);

        // Return comprehensive results
        res.status(201).json({
            message: 'Game created and completed successfully!',
            game_result: {
                game_id: gameSession.id,
                player: {
                    username: user.username,
                    level_before: levelUpdateResult.old_level,
                    level_after: levelUpdateResult.new_level,
                    level_up: levelUpdateResult.leveled_up,
                    levels_gained: levelUpdateResult.levels_gained
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
                next_suggestion: difficulty_level < 3 && accuracy >= 80 ?
                    `Try difficulty level ${difficulty_level + 1} next!` :
                    difficulty_level > 1 && accuracy < 50 ?
                        `Try difficulty level ${difficulty_level - 1} next!` :
                        'Keep playing to improve!'
            },
            // 🆕 Updated user info for instant frontend state update
            updated_user_info: {
                current_level: updatedUser.current_level,
                experience_points: updatedUser.experience_points,
                level_progress: updatedUser.level_progress,
                coins: user.coins + coinsEarned
            }
        });

        // Level update is now done synchronously above and included in response

    } catch (err) {
        console.error('❌ Error in submit whole game:', err);
        res.status(500).json({
            message: 'Server error while processing game',
            error: err.message
        });
    }
};









