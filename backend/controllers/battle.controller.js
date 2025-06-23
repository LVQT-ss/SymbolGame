import BattleSession from '../model/battle-sessions.model.js';
import BattleRoundDetail from '../model/battle-round-details.model.js';
import User from '../model/user.model.js';
import sequelize from '../database/db.js';
import { Op } from 'sequelize';
import socketService from '../services/socketService.js';

// Helper function to generate unique battle code
function generateBattleCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Helper function to generate rounds for battle
function generateBattleRounds(numberOfRounds) {
    const rounds = [];
    const maxNumber = 50; // Fixed max number for all battles

    for (let i = 0; i < numberOfRounds; i++) {
        const first_number = Math.floor(Math.random() * maxNumber) + 1;
        const second_number = Math.floor(Math.random() * maxNumber) + 1;

        let correct_symbol;
        if (first_number > second_number) {
            correct_symbol = '>';
        } else if (first_number < second_number) {
            correct_symbol = '<';
        } else {
            correct_symbol = '=';
        }

        rounds.push({
            round_number: i + 1,
            first_number,
            second_number,
            correct_symbol
        });
    }
    return rounds;
}

// POST /api/battle/create - Create new battle session
export const createBattle = async (req, res) => {
    const creatorId = req.userId;
    const {
        number_of_rounds = 10,
        time_limit = 600,
        is_public = true
    } = req.body;

    try {
        // Validate input
        if (number_of_rounds < 1 || number_of_rounds > 20) {
            return res.status(400).json({
                message: 'Number of rounds must be between 1 and 20.'
            });
        }

        // Get creator info
        const creator = await User.findByPk(creatorId, {
            attributes: ['id', 'username', 'full_name', 'current_level', 'avatar']
        });

        if (!creator) {
            return res.status(404).json({
                message: 'Creator not found.'
            });
        }

        // Generate unique battle code
        let battle_code;
        let isUnique = false;
        let attempts = 0;

        while (!isUnique && attempts < 10) {
            battle_code = generateBattleCode();
            const existingBattle = await BattleSession.findOne({
                where: { battle_code }
            });
            isUnique = !existingBattle;
            attempts++;
        }

        if (!isUnique) {
            return res.status(500).json({
                message: 'Failed to generate unique battle code. Please try again.'
            });
        }

        // Create battle session
        const battleSession = await BattleSession.create({
            battle_code,
            creator_id: creatorId,
            number_of_rounds,
            time_limit,
            is_public
        });

        // Generate rounds
        const rounds = generateBattleRounds(number_of_rounds);
        const battleRounds = [];

        for (const round of rounds) {
            const battleRound = await BattleRoundDetail.create({
                battle_session_id: battleSession.id,
                round_number: round.round_number,
                first_number: round.first_number,
                second_number: round.second_number,
                correct_symbol: round.correct_symbol
            });
            battleRounds.push(battleRound);
        }

        res.status(201).json({
            message: 'Battle created successfully! Share the battle code with your opponent.',
            battle_session: {
                id: battleSession.id,
                battle_code: battleSession.battle_code,
                number_of_rounds: battleSession.number_of_rounds,
                time_limit: battleSession.time_limit,
                is_public: battleSession.is_public,
                created_at: battleSession.createdAt
            },
            creator: {
                id: creator.id,
                username: creator.username,
                full_name: creator.full_name,
                current_level: creator.current_level,
                avatar: creator.avatar
            },
            rounds: battleRounds.map(round => ({
                round_number: round.round_number,
                first_number: round.first_number,
                second_number: round.second_number
                // Note: correct_symbol not included for security
            }))
        });

    } catch (err) {
        console.error('Error creating battle:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/battle/join - Join a battle using battle code
export const joinBattle = async (req, res) => {
    const opponentId = req.userId;
    const { battle_code } = req.body;

    try {
        console.log(`🎮 Join battle request - User: ${opponentId}, Code: ${battle_code}`);

        if (!battle_code) {
            return res.status(400).json({
                message: 'Battle code is required.'
            });
        }

        // Find battle session
        const battleSession = await BattleSession.findOne({
            where: { battle_code },
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'username', 'full_name', 'current_level', 'avatar']
                },
                {
                    model: User,
                    as: 'opponent',
                    attributes: ['id', 'username', 'full_name', 'current_level', 'avatar']
                },
                {
                    model: BattleRoundDetail,
                    as: 'battleRounds',
                    attributes: ['round_number', 'first_number', 'second_number']
                }
            ]
        });

        if (!battleSession) {
            console.log(`❌ Battle not found for code: ${battle_code}`);
            return res.status(404).json({
                message: 'Battle not found. Please check the battle code.'
            });
        }

        console.log(`📊 Battle found - ID: ${battleSession.id}, Creator: ${battleSession.creator.username}, Opponent: ${battleSession.opponent?.username || 'None'}, User joining: ${opponentId}`);
        console.log(`📊 Battle state - Creator ID: ${battleSession.creator_id}, Opponent ID: ${battleSession.opponent_id}, Completed: ${battleSession.completed}`);


        // Check if battle is available to join (no opponent and not completed)
        if (battleSession.completed) {
            return res.status(409).json({
                message: 'This battle has already been completed.'
            });
        }

        // Check if user is trying to join their own battle
        if (battleSession.creator_id === opponentId) {
            // Creator is trying to "join" their own battle, redirect them to battle screen
            console.log(`Creator ${opponentId} is trying to join their own battle ${battleSession.id}, redirecting`);

            return res.status(200).json({
                message: 'This is your battle. Redirecting to battle screen...',
                battle_session: {
                    id: battleSession.id,
                    battle_code: battleSession.battle_code,
                    number_of_rounds: battleSession.number_of_rounds,
                    time_limit: battleSession.time_limit,
                    started_at: battleSession.started_at
                },
                creator: battleSession.creator,
                opponent: battleSession.opponent ? {
                    id: battleSession.opponent.id,
                    username: battleSession.opponent.username,
                    full_name: battleSession.opponent.full_name,
                    current_level: battleSession.opponent.current_level,
                    avatar: battleSession.opponent.avatar
                } : null,
                rounds: battleSession.battleRounds?.map(round => ({
                    round_number: round.round_number,
                    first_number: round.first_number,
                    second_number: round.second_number
                })) || [],
                is_creator: true  // Flag to indicate this user is the creator
            });
        }

        // Check if user is already the opponent of this battle
        if (battleSession.opponent_id === opponentId) {
            // User is already the opponent, allow them to "rejoin" (return battle data)
            console.log(`User ${opponentId} is already opponent of battle ${battleSession.id}, allowing rejoin`);

            return res.status(200).json({
                message: 'You are already part of this battle. Resuming...',
                battle_session: {
                    id: battleSession.id,
                    battle_code: battleSession.battle_code,
                    number_of_rounds: battleSession.number_of_rounds,
                    time_limit: battleSession.time_limit,
                    started_at: battleSession.started_at
                },
                creator: battleSession.creator,
                opponent: {
                    id: opponentId,
                    username: opponent?.username || 'Unknown',
                    full_name: opponent?.full_name || 'Unknown',
                    current_level: opponent?.current_level || 1,
                    avatar: opponent?.avatar || null
                },
                rounds: battleSession.battleRounds?.map(round => ({
                    round_number: round.round_number,
                    first_number: round.first_number,
                    second_number: round.second_number
                })) || []
            });
        }

        // Check if opponent slot is already taken by someone else
        if (battleSession.opponent_id && battleSession.opponent_id !== opponentId) {
            return res.status(409).json({
                message: 'This battle already has an opponent.'
            });
        }

        // Get opponent info
        const opponent = await User.findByPk(opponentId, {
            attributes: ['id', 'username', 'full_name', 'current_level', 'avatar']
        });

        if (!opponent) {
            return res.status(404).json({
                message: 'Opponent not found.'
            });
        }

        // Join the battle
        await battleSession.update({
            opponent_id: opponentId,
            started_at: new Date()
        });

        // Emit Socket.IO event to notify creator that opponent joined
        socketService.emitToBattle(battleSession.id, 'opponent-joined', {
            battleId: battleSession.id,
            opponent: {
                id: opponent.id,
                username: opponent.username,
                full_name: opponent.full_name,
                current_level: opponent.current_level,
                avatar: opponent.avatar
            },
            started_at: battleSession.started_at
        });

        // Don't auto-start countdown anymore - wait for creator to click start button

        res.status(200).json({
            message: 'Successfully joined battle! The battle has started.',
            battle_session: {
                id: battleSession.id,
                battle_code: battleSession.battle_code,
                number_of_rounds: battleSession.number_of_rounds,
                time_limit: battleSession.time_limit,
                started_at: battleSession.started_at
            },
            creator: battleSession.creator,
            opponent: {
                id: opponent.id,
                username: opponent.username,
                full_name: opponent.full_name,
                current_level: opponent.current_level,
                avatar: opponent.avatar
            },
            rounds: battleSession.battleRounds?.map(round => ({
                round_number: round.round_number,
                first_number: round.first_number,
                second_number: round.second_number
            })) || []
        });

    } catch (err) {
        console.error('Error joining battle:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/battle/start - Creator starts the battle (triggers countdown)
export const startBattle = async (req, res) => {
    const creatorId = req.userId;
    const { battle_id } = req.body;

    try {
        if (!battle_id) {
            return res.status(400).json({
                message: 'Battle ID is required.'
            });
        }

        const battleSession = await BattleSession.findByPk(battle_id, {
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'username', 'full_name', 'current_level', 'avatar']
                },
                {
                    model: User,
                    as: 'opponent',
                    attributes: ['id', 'username', 'full_name', 'current_level', 'avatar']
                }
            ]
        });

        if (!battleSession) {
            return res.status(404).json({
                message: 'Battle not found.'
            });
        }

        if (battleSession.creator_id !== creatorId) {
            return res.status(403).json({
                message: 'Only the battle creator can start the battle.'
            });
        }

        if (!battleSession.opponent_id) {
            return res.status(400).json({
                message: 'Cannot start battle: no opponent has joined yet.'
            });
        }

        if (battleSession.completed_at) {
            return res.status(400).json({
                message: 'Battle has already been completed.'
            });
        }

        socketService.emitToBattle(battle_id, 'creator-started-battle', {
            battleId: battle_id,
            message: 'Creator started the battle! Get ready...',
            creator: {
                id: battleSession.creator.id,
                username: battleSession.creator.username
            },
            opponent: {
                id: battleSession.opponent.id,
                username: battleSession.opponent.username
            }
        });

        // Start synchronized countdown
        socketService.startSynchronizedCountdown(battle_id);

        res.status(200).json({
            message: 'Battle started successfully! Countdown beginning...',
            battle_id: battle_id,
            status: 'countdown_started'
        });

    } catch (err) {
        console.error('Error starting battle:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/battle/submit-round - Submit round answer
export const submitBattleRound = async (req, res) => {
    const userId = req.userId;
    const { battle_session_id, round_number, user_symbol, response_time } = req.body;

    try {
        // Validate input
        if (!battle_session_id || !round_number || !user_symbol) {
            return res.status(400).json({
                message: 'Battle session ID, round number, and user symbol are required.'
            });
        }

        if (!['>', '<', '='].includes(user_symbol)) {
            return res.status(400).json({
                message: 'Invalid symbol. Must be >, <, or =.'
            });
        }

        // Find battle session
        const battleSession = await BattleSession.findByPk(battle_session_id);
        if (!battleSession) {
            return res.status(404).json({
                message: 'Battle session not found.'
            });
        }

        // Check if user is part of this battle
        if (battleSession.creator_id !== userId && battleSession.opponent_id !== userId) {
            return res.status(403).json({
                message: 'You are not part of this battle.'
            });
        }

        // Check if battle is active (has opponent and not completed)
        if (!battleSession.opponent_id || battleSession.completed) {
            return res.status(409).json({
                message: 'Battle is not active.'
            });
        }

        // Find the round
        const battleRound = await BattleRoundDetail.findOne({
            where: {
                battle_session_id,
                round_number
            }
        });

        if (!battleRound) {
            return res.status(404).json({
                message: 'Round not found.'
            });
        }

        // Determine if user is creator or opponent
        const isCreator = battleSession.creator_id === userId;
        const fieldPrefix = isCreator ? 'creator' : 'opponent';

        // Check if user already answered this round
        const existingAnswer = battleRound[`${fieldPrefix}_symbol`];
        if (existingAnswer) {
            return res.status(409).json({
                message: 'You have already answered this round.'
            });
        }

        // Check if answer is correct
        const isCorrect = user_symbol === battleRound.correct_symbol;

        // Update round with user's answer
        const updateData = {
            [`${fieldPrefix}_symbol`]: user_symbol,
            [`${fieldPrefix}_response_time`]: response_time || 0,
            [`${fieldPrefix}_is_correct`]: isCorrect,
            [`${fieldPrefix}_answered_at`]: new Date()
        };

        await battleRound.update(updateData);

        // Determine round winner if both players have answered
        const creatorAnswered = battleRound.creator_symbol !== null;
        const opponentAnswered = battleRound.opponent_symbol !== null;

        if (creatorAnswered && opponentAnswered) {
            let roundWinner = 'tie';

            if (battleRound.creator_is_correct && !battleRound.opponent_is_correct) {
                roundWinner = 'creator';
            } else if (!battleRound.creator_is_correct && battleRound.opponent_is_correct) {
                roundWinner = 'opponent';
            } else if (battleRound.creator_is_correct && battleRound.opponent_is_correct) {
                // Both correct, winner determined by response time
                if (battleRound.creator_response_time < battleRound.opponent_response_time) {
                    roundWinner = 'creator';
                } else if (battleRound.opponent_response_time < battleRound.creator_response_time) {
                    roundWinner = 'opponent';
                }
                // If times are equal, it remains a tie
            }

            await battleRound.update({ round_winner: roundWinner });
        }

        // Emit Socket.IO event for round submission
        socketService.emitToBattle(battle_session_id, 'round-submitted', {
            battleId: battle_session_id,
            roundNumber: round_number,
            userId: userId,
            userSymbol: user_symbol,
            responseTime: response_time || 0,
            isCorrect: isCorrect,
            bothAnswered: creatorAnswered && opponentAnswered,
            roundWinner: battleRound.round_winner
        });

        res.status(200).json({
            message: 'Round answer submitted successfully',
            round_result: {
                round_number: battleRound.round_number,
                your_answer: user_symbol,
                correct_answer: battleRound.correct_symbol,
                is_correct: isCorrect,
                response_time: response_time || 0,
                both_answered: creatorAnswered && opponentAnswered,
                round_winner: battleRound.round_winner
            }
        });

    } catch (err) {
        console.error('Error submitting battle round:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/battle/complete - Complete battle session
export const completeBattle = async (req, res) => {
    const userId = req.userId;
    const { battle_session_id, total_time } = req.body;

    try {
        if (!battle_session_id) {
            return res.status(400).json({
                message: 'Battle session ID is required.'
            });
        }

        // Find battle session
        const battleSession = await BattleSession.findByPk(battle_session_id, {
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'username', 'full_name', 'avatar']
                },
                {
                    model: User,
                    as: 'opponent',
                    attributes: ['id', 'username', 'full_name', 'avatar']
                },
                {
                    model: BattleRoundDetail,
                    as: 'battleRounds'
                }
            ]
        });

        if (!battleSession) {
            return res.status(404).json({
                message: 'Battle session not found.'
            });
        }

        // Check if user is part of this battle
        if (battleSession.creator_id !== userId && battleSession.opponent_id !== userId) {
            return res.status(403).json({
                message: 'You are not part of this battle.'
            });
        }

        const isCreator = battleSession.creator_id === userId;
        const fieldPrefix = isCreator ? 'creator' : 'opponent';

        // Mark user as completed
        const updateData = {
            [`${fieldPrefix}_completed`]: true,
            [`${fieldPrefix}_total_time`]: total_time || 0
        };

        // Calculate user's score and correct answers
        let correctAnswers = 0;
        let score = 0;

        for (const round of battleSession.battleRounds) {
            if (round[`${fieldPrefix}_is_correct`]) {
                correctAnswers++;
                // Base score + time bonus
                const timeBonus = Math.max(0, 60 - (round[`${fieldPrefix}_response_time`] || 60));
                score += 100 + Math.floor(timeBonus);
            }
        }

        updateData[`${fieldPrefix}_correct_answers`] = correctAnswers;
        updateData[`${fieldPrefix}_score`] = score;

        await battleSession.update(updateData);

        // Reload battle session to get updated values
        await battleSession.reload();

        // Check if both players completed
        const bothCompleted = battleSession.creator_completed && battleSession.opponent_completed;

        if (bothCompleted) {
            // Determine overall winner using new rules:
            // 1. Higher total points wins
            // 2. If equal points, lower total time wins
            // 3. If equal points and equal time, opponent wins
            let winnerId = null;
            let winReason = '';

            const creatorScore = battleSession.creator_score;
            const opponentScore = battleSession.opponent_score;
            const creatorTime = battleSession.creator_total_time || 0;
            const opponentTime = battleSession.opponent_total_time || 0;

            if (creatorScore > opponentScore) {
                winnerId = battleSession.creator_id;
                winReason = 'Higher total points';
            } else if (opponentScore > creatorScore) {
                winnerId = battleSession.opponent_id;
                winReason = 'Higher total points';
            } else {
                // Equal points - compare time (lower time wins)
                if (creatorTime < opponentTime) {
                    winnerId = battleSession.creator_id;
                    winReason = 'Equal points, faster time';
                } else if (opponentTime < creatorTime) {
                    winnerId = battleSession.opponent_id;
                    winReason = 'Equal points, faster time';
                } else {
                    // Equal points and equal time - opponent wins
                    winnerId = battleSession.opponent_id;
                    winReason = 'Equal points and time, opponent wins by default';
                }
            }

            await battleSession.update({
                winner_id: winnerId,
                completed: true,
                completed_at: new Date()
            });

            console.log(`🏆 Battle ${battleSession.id} completed. Winner: ${winnerId} (${winReason})`);
        }

        // Fetch updated battle session for response
        const updatedBattle = await BattleSession.findByPk(battle_session_id, {
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'username', 'full_name', 'avatar']
                },
                {
                    model: User,
                    as: 'opponent',
                    attributes: ['id', 'username', 'full_name', 'avatar']
                },
                {
                    model: User,
                    as: 'winner',
                    attributes: ['id', 'username', 'full_name', 'avatar']
                }
            ]
        });

        // Emit Socket.IO events
        if (bothCompleted) {
            // Battle is fully completed, emit final results
            console.log(`🎉 Emitting battle-completed event for battle ${battle_session_id}`);
            socketService.emitToBattle(battle_session_id, 'battle-completed', {
                battleId: battle_session_id,
                winner: updatedBattle.winner,
                results: {
                    creator: {
                        ...updatedBattle.creator.toJSON(),
                        score: updatedBattle.creator_score,
                        correct_answers: updatedBattle.creator_correct_answers,
                        total_time: updatedBattle.creator_total_time
                    },
                    opponent: {
                        ...updatedBattle.opponent.toJSON(),
                        score: updatedBattle.opponent_score,
                        correct_answers: updatedBattle.opponent_correct_answers,
                        total_time: updatedBattle.opponent_total_time
                    }
                },
                completed_at: updatedBattle.completed_at
            });
        } else {
            // One player completed, notify opponent
            console.log(`⏳ Emitting player-completed event for battle ${battle_session_id}, user ${userId}`);
            socketService.emitToBattle(battle_session_id, 'player-completed', {
                battleId: battle_session_id,
                userId: userId,
                username: isCreator ? updatedBattle.creator.username : updatedBattle.opponent.username,
                message: `Player has completed all rounds`
            });
        }

        res.status(200).json({
            message: bothCompleted ? 'Battle completed successfully!' : 'Your part of the battle completed. Waiting for opponent.',
            battle_completed: bothCompleted,
            your_results: {
                score: score,
                correct_answers: correctAnswers,
                total_time: total_time || 0,
                completed: true
            },
            battle_results: bothCompleted ? {
                battle_id: updatedBattle.id,
                battle_code: updatedBattle.battle_code,
                winner: updatedBattle.winner,
                creator: {
                    ...updatedBattle.creator.toJSON(),
                    score: updatedBattle.creator_score,
                    correct_answers: updatedBattle.creator_correct_answers,
                    total_time: updatedBattle.creator_total_time
                },
                opponent: {
                    ...updatedBattle.opponent.toJSON(),
                    score: updatedBattle.opponent_score,
                    correct_answers: updatedBattle.opponent_correct_answers,
                    total_time: updatedBattle.opponent_total_time
                },
                completed_at: updatedBattle.completed_at
            } : null
        });

    } catch (err) {
        console.error('Error completing battle:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/battle/:id - Get battle session details
export const getBattleSession = async (req, res) => {
    const userId = req.userId;
    const { id } = req.params;

    try {
        const battleSession = await BattleSession.findByPk(id, {
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'username', 'full_name', 'avatar', 'current_level']
                },
                {
                    model: User,
                    as: 'opponent',
                    attributes: ['id', 'username', 'full_name', 'avatar', 'current_level']
                },
                {
                    model: User,
                    as: 'winner',
                    attributes: ['id', 'username', 'full_name', 'avatar']
                },
                {
                    model: BattleRoundDetail,
                    as: 'battleRounds',
                    attributes: ['round_number', 'first_number', 'second_number', 'correct_symbol',
                        'creator_symbol', 'creator_response_time', 'creator_is_correct',
                        'opponent_symbol', 'opponent_response_time', 'opponent_is_correct',
                        'round_winner']
                }
            ]
        });

        if (!battleSession) {
            return res.status(404).json({
                message: 'Battle session not found.'
            });
        }

        // Check if user has access to this battle
        if (battleSession.creator_id !== userId &&
            battleSession.opponent_id !== userId &&
            !battleSession.is_public) {
            return res.status(403).json({
                message: 'Access denied to this private battle.'
            });
        }

        res.status(200).json({
            message: 'Battle session retrieved successfully',
            battle_session: {
                id: battleSession.id,
                battle_code: battleSession.battle_code,
                number_of_rounds: battleSession.number_of_rounds,
                time_limit: battleSession.time_limit,
                creator_score: battleSession.creator_score,
                opponent_score: battleSession.opponent_score,
                creator_correct_answers: battleSession.creator_correct_answers,
                opponent_correct_answers: battleSession.opponent_correct_answers,
                creator_total_time: battleSession.creator_total_time,
                opponent_total_time: battleSession.opponent_total_time,
                creator_completed: battleSession.creator_completed,
                opponent_completed: battleSession.opponent_completed,
                started_at: battleSession.started_at,
                completed_at: battleSession.completed_at,
                is_public: battleSession.is_public,
                winner_id: battleSession.winner_id
            },
            creator: battleSession.creator,
            opponent: battleSession.opponent,
            winner: battleSession.winner,
            rounds: battleSession.battleRounds
        });

    } catch (err) {
        console.error('Error getting battle session:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/battle/my-battles - Get user's battle history
export const getMyBattles = async (req, res) => {
    const userId = req.userId;
    const { page = 1, limit = 20, status } = req.query;

    try {
        const offset = (page - 1) * limit;
        const whereCondition = {
            [Op.or]: [
                { creator_id: userId },
                { opponent_id: userId }
            ]
        };

        if (status) {
            // Map status to completed field logic
            if (status === 'completed') {
                whereCondition.completed = true;
            } else if (status === 'waiting') {
                whereCondition.completed = false;
                whereCondition.opponent_id = null;
            } else if (status === 'active') {
                whereCondition.completed = false;
                whereCondition.opponent_id = { [Op.ne]: null };
            }
        }

        const battles = await BattleSession.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'username', 'full_name', 'avatar']
                },
                {
                    model: User,
                    as: 'opponent',
                    attributes: ['id', 'username', 'full_name', 'avatar']
                },
                {
                    model: User,
                    as: 'winner',
                    attributes: ['id', 'username', 'full_name', 'avatar']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });

        res.status(200).json({
            message: 'Battle history retrieved successfully',
            battles: battles.rows.map(battle => ({
                id: battle.id,
                battle_code: battle.battle_code,
                number_of_rounds: battle.number_of_rounds,
                creator: battle.creator,
                opponent: battle.opponent,
                winner: battle.winner,
                your_role: battle.creator_id === userId ? 'creator' : 'opponent',
                your_score: battle.creator_id === userId ? battle.creator_score : battle.opponent_score,
                opponent_score: battle.creator_id === userId ? battle.opponent_score : battle.creator_score,
                started_at: battle.started_at,
                completed_at: battle.completed_at,
                created_at: battle.createdAt
            })),
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(battles.count / limit),
                total_battles: battles.count,
                per_page: parseInt(limit)
            }
        });

    } catch (err) {
        console.error('Error getting user battles:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/battle/all - Get available battles (waiting status only)
export const getAllBattles = async (req, res) => {
    const {
        page = 1,
        limit = 30
    } = req.query;

    try {
        const offset = (page - 1) * limit;

        // Only show battles that are not completed and are public
        const whereCondition = {
            completed: false,
            is_public: true
        };

        const battles = await BattleSession.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'username', 'full_name', 'avatar', 'current_level']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });

        const formattedBattles = battles.rows.map(battle => ({
            id: battle.id,
            battle_code: battle.battle_code,
            number_of_rounds: battle.number_of_rounds,
            time_limit: battle.time_limit,
            creator: battle.creator,
            created_at: battle.createdAt,
            // Time since creation for display
            time_since_created: Math.round((new Date() - new Date(battle.createdAt)) / 1000)
        }));

        res.status(200).json({
            message: 'Available battles retrieved successfully',
            battles: formattedBattles,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(battles.count / limit),
                total_available: battles.count,
                per_page: parseInt(limit)
            }
        });

    } catch (err) {
        console.error('Error getting available battles:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/battle/available - Get available battles (not completed and can be joined)
export const getAvailableBattles = async (req, res) => {
    const {
        page = 1,
        limit = 30
    } = req.query;

    try {
        const offset = (page - 1) * limit;

        // Show battles that are not completed and are public
        // This includes both waiting battles (no opponent) and active battles that aren't finished
        const whereCondition = {
            completed: false,
            is_public: true
        };

        const battles = await BattleSession.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'username', 'full_name', 'avatar', 'current_level']
                },
                {
                    model: User,
                    as: 'opponent',
                    attributes: ['id', 'username', 'full_name', 'avatar', 'current_level']
                },
                {
                    model: User,
                    as: 'winner',
                    attributes: ['id', 'username', 'full_name', 'avatar']
                },
                {
                    model: BattleRoundDetail,
                    as: 'battleRounds',
                    attributes: [
                        'round_number', 'first_number', 'second_number', 'correct_symbol',
                        'creator_symbol', 'creator_response_time', 'creator_is_correct',
                        'opponent_symbol', 'opponent_response_time', 'opponent_is_correct',
                        'round_winner', 'createdAt'
                    ]
                }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: offset
        });

        const formattedBattles = battles.rows.map(battle => {
            // Calculate progress and statistics
            const totalRounds = battle.number_of_rounds;
            const completedRounds = battle.battleRounds.filter(round =>
                round.creator_symbol && round.opponent_symbol
            ).length;
            const creatorCompletedRounds = battle.battleRounds.filter(round =>
                round.creator_symbol
            ).length;
            const opponentCompletedRounds = battle.battleRounds.filter(round =>
                round.opponent_symbol
            ).length;

            // Calculate time since creation
            const timeSinceCreated = Math.round((new Date() - new Date(battle.createdAt)) / 1000);

            return {
                // Basic battle info
                id: battle.id,
                battle_code: battle.battle_code,
                number_of_rounds: battle.number_of_rounds,
                time_limit: battle.time_limit,
                is_public: battle.is_public,

                // Players
                creator: battle.creator,
                opponent: battle.opponent,
                winner: battle.winner,

                // Status
                can_join: !battle.opponent_id && !battle.completed,
                is_active: battle.opponent_id && !battle.completed,
                completed: battle.completed,

                // Scores and completion
                creator_score: battle.creator_score,
                opponent_score: battle.opponent_score,
                creator_correct_answers: battle.creator_correct_answers,
                opponent_correct_answers: battle.opponent_correct_answers,
                creator_completed: battle.creator_completed,
                opponent_completed: battle.opponent_completed,

                // Progress tracking
                progress: {
                    total_rounds: totalRounds,
                    completed_rounds: completedRounds,
                    creator_completed_rounds: creatorCompletedRounds,
                    opponent_completed_rounds: opponentCompletedRounds,
                    progress_percentage: totalRounds > 0 ? Math.round((completedRounds / totalRounds) * 100) : 0
                },

                // Timing info
                created_at: battle.createdAt,
                started_at: battle.started_at,
                completed_at: battle.completed_at,
                time_since_created: timeSinceCreated,

                // Battle rounds (hide correct answers for ongoing battles)
                rounds: battle.battleRounds.map(round => ({
                    round_number: round.round_number,
                    first_number: round.first_number,
                    second_number: round.second_number,
                    // Only show correct answer if battle is completed or both players answered
                    correct_symbol: (battle.completed || (round.creator_symbol && round.opponent_symbol))
                        ? round.correct_symbol
                        : null,
                    // Creator's response
                    creator_answered: !!round.creator_symbol,
                    creator_symbol: round.creator_symbol,
                    creator_response_time: round.creator_response_time,
                    creator_is_correct: round.creator_is_correct,
                    // Opponent's response  
                    opponent_answered: !!round.opponent_symbol,
                    opponent_symbol: round.opponent_symbol,
                    opponent_response_time: round.opponent_response_time,
                    opponent_is_correct: round.opponent_is_correct,
                    // Round result
                    round_winner: round.round_winner,
                    both_answered: !!(round.creator_symbol && round.opponent_symbol)
                })),

                // Battle statistics
                statistics: {
                    creator_avg_response_time: battle.battleRounds.length > 0 ?
                        battle.battleRounds
                            .filter(r => r.creator_response_time)
                            .reduce((sum, r) => sum + r.creator_response_time, 0) /
                        Math.max(1, battle.battleRounds.filter(r => r.creator_response_time).length) : 0,
                    opponent_avg_response_time: battle.battleRounds.length > 0 ?
                        battle.battleRounds
                            .filter(r => r.opponent_response_time)
                            .reduce((sum, r) => sum + r.opponent_response_time, 0) /
                        Math.max(1, battle.battleRounds.filter(r => r.opponent_response_time).length) : 0,
                    creator_fastest_response: battle.battleRounds.length > 0 ?
                        Math.min(...battle.battleRounds
                            .filter(r => r.creator_response_time)
                            .map(r => r.creator_response_time)) : null,
                    opponent_fastest_response: battle.battleRounds.length > 0 ?
                        Math.min(...battle.battleRounds
                            .filter(r => r.opponent_response_time)
                            .map(r => r.opponent_response_time)) : null
                }
            };
        });

        res.status(200).json({
            message: 'Available battles retrieved successfully',
            battles: formattedBattles,
            pagination: {
                current_page: parseInt(page),
                total_pages: Math.ceil(battles.count / limit),
                total_available: battles.count,
                per_page: parseInt(limit)
            }
        });

    } catch (err) {
        console.error('Error getting available battles:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};



