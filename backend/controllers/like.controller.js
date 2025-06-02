import User from '../model/user.model.js';
import GameSession from '../model/game-sessions.model.js';
import GameSessionLike from '../model/game-session-likes.model.js';

// POST /api/game/sessions/{sessionId}/like
export const likeSession = async (req, res) => {
    const userId = req.userId; // From JWT token
    const { sessionId } = req.params;

    try {
        // Check if game session exists and is public
        const gameSession = await GameSession.findOne({
            where: {
                id: sessionId,
                completed: true, // Only allow likes on completed sessions
                is_public: true
            }
        });

        if (!gameSession) {
            return res.status(404).json({
                message: 'Game session not found or not available for likes'
            });
        }

        // Check if user already liked this session
        const existingLike = await GameSessionLike.findOne({
            where: {
                game_session_id: sessionId,
                user_id: userId
            }
        });

        if (existingLike) {
            return res.status(400).json({
                message: 'You have already liked this session'
            });
        }

        // Get user info for access control
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // For customers, only allow likes on admin-assigned sessions they can see
        if (user.usertype === 'Customer') {
            // Allow customers to like any public completed session (for social interaction)
            // This is less restrictive than comments to encourage social engagement
        }

        // Create the like
        const like = await GameSessionLike.create({
            game_session_id: sessionId,
            user_id: userId
        });

        // Update likes count on game session
        await gameSession.increment('likes_count');

        res.status(201).json({
            message: 'Session liked successfully',
            like: {
                id: like.id,
                game_session_id: sessionId,
                user_id: userId,
                created_at: like.createdAt
            },
            new_likes_count: gameSession.likes_count + 1
        });
    } catch (err) {
        console.error('Error liking session:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// DELETE /api/game/sessions/{sessionId}/like
export const unlikeSession = async (req, res) => {
    const userId = req.userId; // From JWT token
    const { sessionId } = req.params;

    try {
        // Check if like exists
        const like = await GameSessionLike.findOne({
            where: {
                game_session_id: sessionId,
                user_id: userId
            }
        });

        if (!like) {
            return res.status(404).json({
                message: 'Like not found - you have not liked this session'
            });
        }

        // Delete the like
        await like.destroy();

        // Update likes count on game session
        const gameSession = await GameSession.findByPk(sessionId);
        if (gameSession && gameSession.likes_count > 0) {
            await gameSession.decrement('likes_count');
        }

        res.status(200).json({
            message: 'Session unliked successfully',
            new_likes_count: Math.max(0, (gameSession?.likes_count || 1) - 1)
        });
    } catch (err) {
        console.error('Error unliking session:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/game/sessions/{sessionId}/likes
export const getSessionLikes = async (req, res) => {
    const { sessionId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    try {
        // Check if game session exists and is public
        const gameSession = await GameSession.findOne({
            where: {
                id: sessionId,
                completed: true,
                is_public: true
            }
        });

        if (!gameSession) {
            return res.status(404).json({
                message: 'Game session not found or not available'
            });
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await GameSessionLike.findAndCountAll({
            where: { game_session_id: sessionId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'full_name', 'avatar', 'current_level']
                }
            ],
            limit: parseInt(limit),
            offset: offset,
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            message: 'Session likes retrieved successfully',
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            },
            likes: rows
        });
    } catch (err) {
        console.error('Error fetching session likes:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
}; 