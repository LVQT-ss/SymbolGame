import User from '../model/user.model.js';
import UserStatistics from '../model/user-statistics.model.js';
import FollowerRelationship from '../model/follower-relationships.model.js';

// GET /api/users/{userId}/stats
export const getUserStats = async (req, res) => {
    const { userId } = req.params;

    if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({ message: 'Valid user ID is required' });
    }

    try {
        const user = await User.findByPk(parseInt(userId), {
            include: [
                {
                    model: UserStatistics,
                    as: 'statistics'
                }
            ],
            attributes: ['id', 'username', 'full_name', 'avatar', 'coins', 'followers_count', 'following_count', 'experience_points', 'current_level', 'level_progress']
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'User statistics retrieved successfully',
            user: user
        });
    } catch (err) {
        console.error('Error fetching user stats:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/users/{userId}/follow
export const followUser = async (req, res) => {
    const { userId } = req.params;
    const followerId = req.userId; // From JWT token

    if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({ message: 'Valid user ID is required' });
    }

    if (parseInt(userId) === followerId) {
        return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    try {
        // Check if target user exists
        const targetUser = await User.findByPk(parseInt(userId));
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if already following
        const existingFollow = await FollowerRelationship.findOne({
            where: {
                follower_id: followerId,
                followed_id: parseInt(userId)
            }
        });

        if (existingFollow) {
            return res.status(409).json({ message: 'Already following this user' });
        }

        // Create follow relationship
        await FollowerRelationship.create({
            follower_id: followerId,
            followed_id: parseInt(userId)
        });

        // Update counters
        await User.increment('followers_count', { where: { id: parseInt(userId) } });
        await User.increment('following_count', { where: { id: followerId } });

        res.status(201).json({
            message: 'Successfully followed user',
            followed_user: {
                id: targetUser.id,
                username: targetUser.username,
                full_name: targetUser.full_name
            }
        });
    } catch (err) {
        console.error('Error following user:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// DELETE /api/users/{userId}/unfollow
export const unfollowUser = async (req, res) => {
    const { userId } = req.params;
    const followerId = req.userId; // From JWT token

    if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({ message: 'Valid user ID is required' });
    }

    try {
        // Find and delete follow relationship
        const followRelationship = await FollowerRelationship.findOne({
            where: {
                follower_id: followerId,
                followed_id: parseInt(userId)
            }
        });

        if (!followRelationship) {
            return res.status(404).json({ message: 'Not following this user' });
        }

        await followRelationship.destroy();

        // Update counters
        await User.decrement('followers_count', { where: { id: parseInt(userId) } });
        await User.decrement('following_count', { where: { id: followerId } });

        res.status(200).json({
            message: 'Successfully unfollowed user'
        });
    } catch (err) {
        console.error('Error unfollowing user:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/users/{userId}/followers
export const getUserFollowers = async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({ message: 'Valid user ID is required' });
    }

    try {
        const offset = (page - 1) * limit;

        const { count, rows } = await FollowerRelationship.findAndCountAll({
            where: { followed_id: parseInt(userId) },
            include: [
                {
                    model: User,
                    as: 'follower',
                    attributes: ['id', 'username', 'full_name', 'avatar', 'current_level', 'experience_points']
                }
            ],
            limit: parseInt(limit),
            offset: offset,
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            message: 'Followers retrieved successfully',
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            },
            followers: rows.map(rel => rel.follower)
        });
    } catch (err) {
        console.error('Error fetching followers:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/users/{userId}/following
export const getUserFollowing = async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({ message: 'Valid user ID is required' });
    }

    try {
        const offset = (page - 1) * limit;

        const { count, rows } = await FollowerRelationship.findAndCountAll({
            where: { follower_id: parseInt(userId) },
            include: [
                {
                    model: User,
                    as: 'followed',
                    attributes: ['id', 'username', 'full_name', 'avatar', 'current_level', 'experience_points']
                }
            ],
            limit: parseInt(limit),
            offset: offset,
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            message: 'Following retrieved successfully',
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            },
            following: rows.map(rel => rel.followed)
        });
    } catch (err) {
        console.error('Error fetching following:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
}; 