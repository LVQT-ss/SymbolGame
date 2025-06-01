import Notification from '../model/notifications.model.js';
import User from '../model/user.model.js';

// GET /api/notifications (follow notifications only)
export const getFollowNotifications = async (req, res) => {
    const userId = req.userId; // From JWT token
    const { page = 1, limit = 20, unread_only = false } = req.query;

    try {
        const offset = (page - 1) * limit;

        // Build where condition
        const whereCondition = {
            recipient_user_id: userId,
            type: 'follow'
        };

        if (unread_only === 'true') {
            whereCondition.is_read = false;
        }

        const { count, rows } = await Notification.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: User,
                    as: 'actor',
                    attributes: ['id', 'username', 'full_name', 'avatar']
                }
            ],
            limit: parseInt(limit),
            offset: offset,
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            message: 'Follow notifications retrieved successfully',
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            },
            notifications: rows
        });
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// PUT /api/notifications/{id}/read
export const markNotificationAsRead = async (req, res) => {
    const { id } = req.params;
    const userId = req.userId; // From JWT token

    if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ message: 'Valid notification ID is required' });
    }

    try {
        const notification = await Notification.findOne({
            where: {
                id: parseInt(id),
                recipient_user_id: userId
            }
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notification.is_read) {
            return res.status(200).json({
                message: 'Notification already marked as read',
                notification: notification
            });
        }

        await notification.update({
            is_read: true,
            read_at: new Date()
        });

        res.status(200).json({
            message: 'Notification marked as read successfully',
            notification: notification
        });
    } catch (err) {
        console.error('Error marking notification as read:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
}; 