import User from '../model/user.model.js';
import GameSession from '../model/game-sessions.model.js';
import GameSessionComment from '../model/game-session-comments.model.js';

// POST /api/game/sessions/{sessionId}/comments
export const createComment = async (req, res) => {
    const userId = req.userId; // From JWT token
    const { sessionId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: 'Comment content is required' });
    }

    if (content.length > 1000) {
        return res.status(400).json({ message: 'Comment content cannot exceed 1000 characters' });
    }

    try {
        // Check if game session exists and is public
        const gameSession = await GameSession.findOne({
            where: {
                id: sessionId,
                completed: true, // Only allow comments on completed sessions
                is_public: true
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'full_name']
                }
            ]
        });

        if (!gameSession) {
            return res.status(404).json({
                message: 'Game session not found or not available for comments'
            });
        }

        // Get commenting user
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // For customers, only allow comments on admin-assigned sessions they completed
        if (user.usertype === 'Customer') {
            if (gameSession.user_id !== userId || !gameSession.created_by_admin) {
                return res.status(403).json({
                    message: 'Customers can only comment on their own admin-assigned completed sessions'
                });
            }
        }

        // Create the comment
        const comment = await GameSessionComment.create({
            game_session_id: sessionId,
            user_id: userId,
            content: content.trim()
        });

        // Update comments count on game session
        await gameSession.increment('comments_count');

        // Get the comment with user information
        const commentWithUser = await GameSessionComment.findByPk(comment.id, {
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'full_name', 'avatar']
                }
            ]
        });

        res.status(201).json({
            message: 'Comment created successfully',
            comment: commentWithUser
        });
    } catch (err) {
        console.error('Error creating comment:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/game/sessions/{sessionId}/comments
export const getComments = async (req, res) => {
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
                message: 'Game session not found or not available for comments'
            });
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await GameSessionComment.findAndCountAll({
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
            message: 'Comments retrieved successfully',
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            },
            comments: rows
        });
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// PUT /api/game/sessions/{sessionId}/comments/{commentId}
export const updateComment = async (req, res) => {
    const userId = req.userId; // From JWT token
    const { sessionId, commentId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: 'Comment content is required' });
    }

    if (content.length > 1000) {
        return res.status(400).json({ message: 'Comment content cannot exceed 1000 characters' });
    }

    try {
        // Find the comment
        const comment = await GameSessionComment.findOne({
            where: {
                id: commentId,
                game_session_id: sessionId
            },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'full_name', 'avatar']
                }
            ]
        });

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if user can edit this comment (owner or admin)
        const user = await User.findByPk(userId);
        if (comment.user_id !== userId && user.usertype !== 'Admin') {
            return res.status(403).json({
                message: 'You can only edit your own comments'
            });
        }

        // Update the comment
        await comment.update({
            content: content.trim()
        });

        res.status(200).json({
            message: 'Comment updated successfully',
            comment: comment
        });
    } catch (err) {
        console.error('Error updating comment:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// DELETE /api/game/sessions/{sessionId}/comments/{commentId}
export const deleteComment = async (req, res) => {
    const userId = req.userId; // From JWT token
    const { sessionId, commentId } = req.params;

    try {
        // Find the comment
        const comment = await GameSessionComment.findOne({
            where: {
                id: commentId,
                game_session_id: sessionId
            }
        });

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Check if user can delete this comment (owner or admin)
        const user = await User.findByPk(userId);
        if (comment.user_id !== userId && user.usertype !== 'Admin') {
            return res.status(403).json({
                message: 'You can only delete your own comments'
            });
        }

        // Delete the comment
        await comment.destroy();

        // Update comments count on game session
        const gameSession = await GameSession.findByPk(sessionId);
        if (gameSession && gameSession.comments_count > 0) {
            await gameSession.decrement('comments_count');
        }

        res.status(200).json({
            message: 'Comment deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting comment:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
}; 