import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import BattleSession from '../model/battle-sessions.model.js';
import BattleRoundDetail from '../model/battle-round-details.model.js';
import User from '../model/user.model.js';

class SocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // userId -> socketId
        this.battleRooms = new Map(); // battleId -> Set of socketIds
    }

    initialize(server) {
        this.io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
                credentials: true
            },
            transports: ['polling', 'websocket'],
            upgrade: true,
            pingTimeout: 60000,
            pingInterval: 25000,
            allowEIO3: true
        });

        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                if (!token) {
                    return next(new Error('Authentication error'));
                }

                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                // Fix: Use userId instead of id for consistency with JWT token structure
                const userId = decoded.userId || decoded.id;
                const user = await User.findByPk(userId);

                if (!user) {
                    console.error(`User not found for ID: ${userId}`, {
                        decodedToken: decoded,
                        hasUserId: !!decoded.userId,
                        hasId: !!decoded.id
                    });
                    return next(new Error('User not found'));
                }

                socket.userId = user.id;
                socket.username = user.username;
                next();
            } catch (error) {
                console.error('Socket authentication error:', error);
                next(new Error('Authentication error'));
            }
        });

        this.io.on('connection', (socket) => {
            console.log(`🔗 User ${socket.username} (ID: ${socket.userId}) connected`);

            // Store user connection
            this.connectedUsers.set(socket.userId, socket.id);

            // Join user to their active battles
            this.joinUserToBattles(socket);

            // Handle battle events
            socket.on('join-battle', (data) => this.handleJoinBattle(socket, data));
            socket.on('submit-round', (data) => this.handleSubmitRound(socket, data));
            socket.on('complete-battle', (data) => this.handleCompleteBattle(socket, data));
            socket.on('leave-battle', (data) => this.handleLeaveBattle(socket, data));

            socket.on('disconnect', () => {
                console.log(`🔌 User ${socket.username} disconnected`);
                this.connectedUsers.delete(socket.userId);
                this.removeFromAllBattleRooms(socket);
            });
        });

        console.log('🚀 Socket.IO server initialized');
    }

    async joinUserToBattles(socket) {
        try {
            // Find all active battles for this user
            const activeBattles = await BattleSession.findAll({
                where: {
                    [Op.or]: [
                        { creator_id: socket.userId },
                        { opponent_id: socket.userId }
                    ],
                    completed_at: null
                }
            });

            // Join socket to each battle room
            for (const battle of activeBattles) {
                const battleRoom = `battle_${battle.id}`;
                socket.join(battleRoom);

                if (!this.battleRooms.has(battle.id)) {
                    this.battleRooms.set(battle.id, new Set());
                }
                this.battleRooms.get(battle.id).add(socket.id);

                console.log(`📱 User ${socket.username} joined battle room: ${battleRoom}`);
            }
        } catch (error) {
            console.error('Error joining user to battles:', error);
        }
    }

    handleJoinBattle(socket, data) {
        const { battleId } = data;
        const battleRoom = `battle_${battleId}`;

        socket.join(battleRoom);

        if (!this.battleRooms.has(battleId)) {
            this.battleRooms.set(battleId, new Set());
        }
        this.battleRooms.get(battleId).add(socket.id);

        console.log(`⚔️ User ${socket.username} joined battle ${battleId}`);

        // Notify other players in the battle
        socket.to(battleRoom).emit('player-joined', {
            userId: socket.userId,
            username: socket.username,
            battleId
        });
    }

    async handleSubmitRound(socket, data) {
        try {
            const { battleId, roundNumber, userSymbol, responseTime } = data;
            const battleRoom = `battle_${battleId}`;

            console.log(`🎯 Round submission: Battle ${battleId}, Round ${roundNumber}, User ${socket.username}, Answer: ${userSymbol}`);

            // Emit to all players in the battle that this user submitted
            this.io.to(battleRoom).emit('round-submitted', {
                userId: socket.userId,
                username: socket.username,
                battleId,
                roundNumber,
                userSymbol,
                responseTime,
                timestamp: Date.now()
            });

            // Check if both players have submitted this round
            const battle = await BattleSession.findByPk(battleId);
            if (battle) {
                const roundDetails = await BattleRoundDetail.findAll({
                    where: {
                        battle_session_id: battleId,
                        round_number: roundNumber
                    }
                });

                // If both players submitted, emit round complete
                if (roundDetails.length === 2) {
                    const roundResults = this.calculateRoundResults(roundDetails, battle);

                    this.io.to(battleRoom).emit('round-completed', {
                        battleId,
                        roundNumber,
                        results: roundResults,
                        timestamp: Date.now()
                    });
                }
            }
        } catch (error) {
            console.error('Error handling round submission:', error);
            socket.emit('error', { message: 'Failed to submit round' });
        }
    }

    async handleCompleteBattle(socket, data) {
        try {
            const { battleId } = data;
            const battleRoom = `battle_${battleId}`;

            console.log(`🏁 Battle completion: Battle ${battleId}, User ${socket.username}`);

            // Check if battle is fully completed
            const battle = await BattleSession.findByPk(battleId, {
                include: [
                    { model: User, as: 'creator' },
                    { model: User, as: 'opponent' }
                ]
            });

            if (battle && battle.creator_completed && battle.opponent_completed) {
                // Battle is fully completed, emit final results
                const finalResults = await this.calculateFinalResults(battle);

                this.io.to(battleRoom).emit('battle-completed', {
                    battleId,
                    results: finalResults,
                    timestamp: Date.now()
                });

                // Clean up battle room
                this.battleRooms.delete(battleId);
            } else {
                // One player completed, notify others
                this.io.to(battleRoom).emit('player-completed', {
                    userId: socket.userId,
                    username: socket.username,
                    battleId,
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            console.error('Error handling battle completion:', error);
            socket.emit('error', { message: 'Failed to complete battle' });
        }
    }

    handleLeaveBattle(socket, data) {
        const { battleId } = data;
        const battleRoom = `battle_${battleId}`;

        socket.leave(battleRoom);

        if (this.battleRooms.has(battleId)) {
            this.battleRooms.get(battleId).delete(socket.id);
            if (this.battleRooms.get(battleId).size === 0) {
                this.battleRooms.delete(battleId);
            }
        }

        console.log(`🚪 User ${socket.username} left battle ${battleId}`);

        // Notify other players
        socket.to(battleRoom).emit('player-left', {
            userId: socket.userId,
            username: socket.username,
            battleId
        });
    }

    removeFromAllBattleRooms(socket) {
        // Remove socket from all battle rooms
        for (const [battleId, socketIds] of this.battleRooms.entries()) {
            if (socketIds.has(socket.id)) {
                socketIds.delete(socket.id);
                if (socketIds.size === 0) {
                    this.battleRooms.delete(battleId);
                }
            }
        }
    }

    calculateRoundResults(roundDetails, battle) {
        // Calculate results for a completed round
        const creatorRound = roundDetails.find(r => r.user_id === battle.creator_id);
        const opponentRound = roundDetails.find(r => r.user_id === battle.opponent_id);

        return {
            creator: {
                symbol: creatorRound?.user_symbol,
                responseTime: creatorRound?.response_time,
                isCorrect: creatorRound?.is_correct,
                score: creatorRound?.score_earned || 0
            },
            opponent: {
                symbol: opponentRound?.user_symbol,
                responseTime: opponentRound?.response_time,
                isCorrect: opponentRound?.is_correct,
                score: opponentRound?.score_earned || 0
            },
            correctAnswer: creatorRound?.round_details?.correct_symbol || opponentRound?.round_details?.correct_symbol
        };
    }

    async calculateFinalResults(battle) {
        // Calculate final battle results
        const roundDetails = await BattleRoundDetail.findAll({
            where: { battle_session_id: battle.id },
            order: [['round_number', 'ASC']]
        });

        const creatorRounds = roundDetails.filter(r => r.user_id === battle.creator_id);
        const opponentRounds = roundDetails.filter(r => r.user_id === battle.opponent_id);

        const creatorScore = creatorRounds.reduce((sum, r) => sum + (r.score_earned || 0), 0);
        const opponentScore = opponentRounds.reduce((sum, r) => sum + (r.score_earned || 0), 0);

        let winner = null;
        if (creatorScore > opponentScore) {
            winner = battle.creator;
        } else if (opponentScore > creatorScore) {
            winner = battle.opponent;
        }

        return {
            creator: {
                user: battle.creator,
                score: creatorScore,
                correctAnswers: creatorRounds.filter(r => r.is_correct).length,
                total_time: battle.creator_total_time
            },
            opponent: {
                user: battle.opponent,
                score: opponentScore,
                correctAnswers: opponentRounds.filter(r => r.is_correct).length,
                total_time: battle.opponent_total_time
            },
            winner,
            totalRounds: Math.max(creatorRounds.length, opponentRounds.length)
        };
    }

    // Public methods for emitting events from controllers
    emitToBattle(battleId, event, data) {
        const battleRoom = `battle_${battleId}`;
        this.io.to(battleRoom).emit(event, data);
    }

    emitToUser(userId, event, data) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.io.to(socketId).emit(event, data);
        }
    }

    isUserConnected(userId) {
        return this.connectedUsers.has(userId);
    }

    getBattleRoomSize(battleId) {
        return this.battleRooms.get(battleId)?.size || 0;
    }
}

export default new SocketService(); 