import Achievement from '../model/achievements.model.js';
import UserAchievement from '../model/user-achievements.model.js';
import User from '../model/user.model.js';
import UserStatistics from '../model/user-statistics.model.js';
import Notification from '../model/notifications.model.js';
import sequelize from '../database/db.js';
import { Op } from 'sequelize';

// POST /api/achievements/create - Create new achievement (ADMIN ONLY)
export const createAchievement = async (req, res) => {
    const adminId = req.userId;

    try {
        // Verify admin permissions
        const admin = await User.findByPk(adminId);
        if (!admin || admin.usertype !== 'Admin') {
            return res.status(403).json({
                message: 'Access denied. Admin privileges required to create achievements.'
            });
        }

        const {
            name, description, category,
            points, coin_reward, experience_reward, condition_value,
            unlock_message
        } = req.body;

        // Validate required fields - simplified
        if (!name || !description || condition_value === undefined) {
            return res.status(400).json({
                message: 'Required fields: name, description, condition_value'
            });
        }

        // Create achievement with existing model fields only
        const achievement = await Achievement.create({
            name,
            description,
            category: category || 'progress',
            points: points || 100,
            coin_reward: coin_reward || 0,
            experience_reward: experience_reward || 0,
            condition_value,
            time_frame: 'none',
            unlock_message
        });

        res.status(201).json({
            message: 'Achievement created successfully',
            achievement
        });

    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                message: 'Achievement name already exists. Please choose a different name.'
            });
        }
        console.error('Error creating achievement:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/achievements - Get all achievements with user progress
export const getAllAchievements = async (req, res) => {
    const userId = req.userId;
    const { category, completed, showcased } = req.query;

    try {
        const whereClause = { is_active: true };

        // Add filters
        if (category) whereClause.category = category;

        // Get achievements with user progress
        const achievements = await Achievement.findAll({
            where: whereClause,
            include: [
                {
                    model: UserAchievement,
                    as: 'userAchievements',
                    where: { user_id: userId },
                    required: false,
                    ...(completed !== undefined && {
                        where: {
                            user_id: userId,
                            is_completed: completed === 'true'
                        }
                    }),
                    ...(showcased !== undefined && {
                        where: {
                            user_id: userId,
                            is_showcased: showcased === 'true'
                        }
                    })
                }
            ],
            order: [['category', 'ASC'], ['createdAt', 'ASC']]
        });

        // Filter out hidden achievements that aren't unlocked
        const visibleAchievements = achievements.filter(achievement => {
            if (!achievement.is_hidden) return true;
            return achievement.userAchievements?.length > 0 &&
                achievement.userAchievements[0].is_completed;
        });

        // Format response
        const formattedAchievements = visibleAchievements.map(achievement => {
            const userProgress = achievement.userAchievements?.[0];

            return {
                id: achievement.id,
                name: achievement.name,
                description: achievement.description,
                category: achievement.category,
                badge_color: achievement.badge_color,
                points: achievement.points,
                coin_reward: achievement.coin_reward,
                experience_reward: achievement.experience_reward,
                condition_type: achievement.is_secret && !userProgress?.is_completed ? 'hidden' : achievement.condition_type,
                condition_value: achievement.is_secret && !userProgress?.is_completed ? null : achievement.condition_value,
                max_progress: achievement.max_progress,
                time_frame: achievement.time_frame,
                unlock_message: achievement.unlock_message,
                is_completed: userProgress?.is_completed || false,
                current_progress: userProgress?.current_progress || 0,
                completion_percentage: userProgress?.completion_percentage || 0,
                acquired_at: userProgress?.acquired_at,
                is_showcased: userProgress?.is_showcased || false,
                streak_count: userProgress?.streak_count || 0,
                best_streak: userProgress?.best_streak || 0
            };
        });

        res.status(200).json({
            message: 'Achievements retrieved successfully',
            achievements: formattedAchievements,
            total: formattedAchievements.length
        });

    } catch (err) {
        console.error('Error getting achievements:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/achievements/user/:userId - Get user's achievements
export const getUserAchievements = async (req, res) => {
    const { userId } = req.params;
    const { completed, showcased } = req.query;

    try {
        // Check if user exists
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username', 'full_name', 'avatar', 'current_level']
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const whereClause = { user_id: userId };
        if (completed !== undefined) whereClause.is_completed = completed === 'true';
        if (showcased !== undefined) whereClause.is_showcased = showcased === 'true';

        const userAchievements = await UserAchievement.findAll({
            where: whereClause,
            include: [
                {
                    model: Achievement,
                    as: 'achievement',
                    where: { is_active: true }
                }
            ],
            order: [['acquired_at', 'DESC']]
        });

        // Format response
        const formattedAchievements = userAchievements.map(item => ({
            id: item.achievement.id,
            name: item.achievement.name,
            description: item.achievement.description,
            category: item.achievement.category,
            badge_color: item.achievement.badge_color,
            points: item.achievement.points,
            coin_reward: item.achievement.coin_reward,
            experience_reward: item.achievement.experience_reward,
            condition_type: item.achievement.is_secret && !item.is_completed ? 'hidden' : item.achievement.condition_type,
            condition_value: item.achievement.is_secret && !item.is_completed ? null : item.achievement.condition_value,
            max_progress: item.achievement.max_progress,
            time_frame: item.achievement.time_frame,
            unlock_message: item.achievement.unlock_message,
            is_completed: item.is_completed,
            current_progress: item.current_progress,
            completion_percentage: item.completion_percentage,
            acquired_at: item.acquired_at,
            is_showcased: item.is_showcased,
            streak_count: item.streak_count,
            best_streak: item.best_streak
        }));

        // Calculate statistics
        const totalAchievements = await Achievement.count({ where: { is_active: true } });
        const completedCount = formattedAchievements.filter(a => a.is_completed).length;
        const showcasedCount = formattedAchievements.filter(a => a.is_showcased).length;

        // Group achievements by category
        const achievementsByCategory = formattedAchievements.reduce((acc, achievement) => {
            if (!acc[achievement.category]) {
                acc[achievement.category] = [];
            }
            acc[achievement.category].push(achievement);
            return acc;
        }, {});

        res.status(200).json({
            message: 'User achievements retrieved successfully',
            user: {
                id: user.id,
                username: user.username,
                full_name: user.full_name,
                avatar: user.avatar,
                current_level: user.current_level
            },
            achievements: formattedAchievements,
            statistics: {
                total: totalAchievements,
                completed: completedCount,
                showcased: showcasedCount,
                completion_percentage: totalAchievements > 0 ? (completedCount / totalAchievements) * 100 : 0
            },
            by_category: achievementsByCategory
        });

    } catch (err) {
        console.error('Error getting user achievements:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/achievements/check - Check and award achievements for user
export const checkUserAchievements = async (req, res) => {
    const userId = req.userId;
    const { session_data } = req.body;

    try {
        const user = await User.findByPk(userId, {
            include: [
                {
                    model: UserStatistics,
                    as: 'statistics'
                }
            ]
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get all active achievements that user hasn't completed
        const achievements = await Achievement.findAll({
            where: {
                is_active: true,
                [Op.or]: [
                    { end_date: null },
                    { end_date: { [Op.gte]: new Date() } }
                ]
            },
            include: [
                {
                    model: UserAchievement,
                    as: 'userAchievements',
                    where: { user_id: userId },
                    required: false
                }
            ]
        });

        const newlyUnlocked = [];
        const progressUpdated = [];

        for (const achievement of achievements) {
            const userAchievement = achievement.userAchievements?.[0];

            // Skip if already completed
            if (userAchievement?.is_completed) continue;

            // Check achievement condition
            const currentValue = await getConditionValue(user, achievement.condition_type, session_data);
            const shouldAward = checkCondition(currentValue, achievement.condition_operator, achievement.condition_value);

            if (achievement.type === 'progressive' && achievement.max_progress) {
                // Handle progressive achievements
                const newProgress = Math.min(currentValue, achievement.max_progress);

                if (!userAchievement) {
                    // Create new user achievement record
                    const newUserAchievement = await UserAchievement.create({
                        user_id: userId,
                        achievement_id: achievement.id,
                        current_progress: newProgress,
                        max_progress: achievement.max_progress,
                        game_session_id: session_data?.game_session_id || null
                    });

                    if (newUserAchievement.is_completed) {
                        newlyUnlocked.push({
                            achievement,
                            userAchievement: newUserAchievement
                        });
                    } else {
                        progressUpdated.push({
                            achievement,
                            userAchievement: newUserAchievement
                        });
                    }
                } else if (newProgress > userAchievement.current_progress) {
                    // Update existing progress
                    const wasCompleted = userAchievement.is_completed;
                    await userAchievement.update({
                        current_progress: newProgress,
                        game_session_id: session_data?.game_session_id || userAchievement.game_session_id
                    });

                    if (!wasCompleted && userAchievement.is_completed) {
                        newlyUnlocked.push({
                            achievement,
                            userAchievement
                        });
                    } else {
                        progressUpdated.push({
                            achievement,
                            userAchievement
                        });
                    }
                }
            } else if (shouldAward && !userAchievement) {
                // Single achievement - award immediately
                const newUserAchievement = await UserAchievement.create({
                    user_id: userId,
                    achievement_id: achievement.id,
                    current_progress: achievement.max_progress || currentValue,
                    max_progress: achievement.max_progress,
                    is_completed: true,
                    acquired_at: new Date(),
                    game_session_id: session_data?.game_session_id || null,
                    unlock_data: session_data || null
                });

                newlyUnlocked.push({
                    achievement,
                    userAchievement: newUserAchievement
                });
            }
        }

        // Award rewards for newly unlocked achievements
        for (const { achievement } of newlyUnlocked) {
            await awardAchievementRewards(userId, achievement);
            await createAchievementNotification(userId, achievement);
        }

        res.status(200).json({
            message: 'Achievement check completed',
            newly_unlocked: newlyUnlocked.length,
            progress_updated: progressUpdated.length,
            achievements: {
                unlocked: newlyUnlocked.map(item => ({
                    id: item.achievement.id,
                    name: item.achievement.name,
                    description: item.achievement.description,
                    rarity: item.achievement.rarity,
                    points: item.achievement.points,
                    coin_reward: item.achievement.coin_reward,
                    experience_reward: item.achievement.experience_reward,
                    unlock_message: item.achievement.unlock_message
                })),
                updated: progressUpdated.map(item => ({
                    id: item.achievement.id,
                    name: item.achievement.name,
                    current_progress: item.userAchievement.current_progress,
                    max_progress: item.userAchievement.max_progress,
                    completion_percentage: item.userAchievement.completion_percentage
                }))
            }
        });

    } catch (err) {
        console.error('Error checking achievements:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// PUT /api/achievements/:id/showcase - Toggle showcase status
export const toggleShowcase = async (req, res) => {
    const userId = req.userId;
    const { id: achievementId } = req.params;

    try {
        const userAchievement = await UserAchievement.findOne({
            where: {
                user_id: userId,
                achievement_id: achievementId,
                is_completed: true
            }
        });

        if (!userAchievement) {
            return res.status(404).json({
                message: 'Achievement not found or not completed by user'
            });
        }

        await userAchievement.update({
            is_showcased: !userAchievement.is_showcased
        });

        res.status(200).json({
            message: `Achievement showcase ${userAchievement.is_showcased ? 'enabled' : 'disabled'}`,
            is_showcased: userAchievement.is_showcased
        });

    } catch (err) {
        console.error('Error toggling showcase:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/achievements/leaderboard - Achievement leaderboard
export const getAchievementLeaderboard = async (req, res) => {
    const { period = 'all_time', limit = 50 } = req.query;

    try {
        let dateFilter = {};

        if (period !== 'all_time') {
            const now = new Date();
            switch (period) {
                case 'daily': {
                    dateFilter.acquired_at = {
                        [Op.gte]: new Date(now.setHours(0, 0, 0, 0))
                    };
                    break;
                }
                case 'weekly': {
                    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
                    dateFilter.acquired_at = { [Op.gte]: weekStart };
                    break;
                }
                case 'monthly': {
                    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    dateFilter.acquired_at = { [Op.gte]: monthStart };
                    break;
                }
            }
        }

        const leaderboard = await User.findAll({
            attributes: [
                'id', 'username', 'full_name', 'avatar', 'current_level',
                [sequelize.fn('COUNT', sequelize.col('userAchievements.id')), 'achievement_count'],
                [sequelize.fn('SUM', sequelize.col('userAchievements->achievement.points')), 'total_points']
            ],
            include: [
                {
                    model: UserAchievement,
                    as: 'userAchievements',
                    where: {
                        is_completed: true,
                        ...dateFilter
                    },
                    include: [
                        {
                            model: Achievement,
                            as: 'achievement',
                            attributes: ['points', 'rarity']
                        }
                    ]
                }
            ],
            group: ['User.id'],
            having: sequelize.literal('COUNT(userAchievements.id) > 0'),
            order: [
                [sequelize.literal('total_points'), 'DESC'],
                [sequelize.literal('achievement_count'), 'DESC']
            ],
            limit: parseInt(limit)
        });

        res.status(200).json({
            message: 'Achievement leaderboard retrieved successfully',
            period,
            leaderboard
        });

    } catch (err) {
        console.error('Error getting achievement leaderboard:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/achievements/public - Get public achievements
export const getPublicAchievements = async (req, res) => {
    const { category, limit = 50, offset = 0 } = req.query;

    try {
        const whereClause = { is_active: true };
        if (category) whereClause.category = category;

        const achievements = await Achievement.findAndCountAll({
            where: whereClause,
            attributes: [
                'id', 'name', 'description', 'category',
                'badge_color', 'points', 'coin_reward', 'experience_reward',
                'max_progress', 'time_frame', 'createdAt'
            ],
            order: [['category', 'ASC'], ['createdAt', 'ASC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Format response
        const formattedAchievements = achievements.rows.map(achievement => ({
            id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            category: achievement.category,
            badge_color: achievement.badge_color,
            points: achievement.points,
            coin_reward: achievement.coin_reward,
            experience_reward: achievement.experience_reward,
            max_progress: achievement.max_progress,
            time_frame: achievement.time_frame,
            created_at: achievement.createdAt
        }));

        // Group achievements by category
        const achievementsByCategory = formattedAchievements.reduce((acc, achievement) => {
            if (!acc[achievement.category]) {
                acc[achievement.category] = [];
            }
            acc[achievement.category].push(achievement);
            return acc;
        }, {});

        res.status(200).json({
            message: 'Public achievements retrieved successfully',
            achievements: formattedAchievements,
            achievements_by_category: achievementsByCategory,
            statistics: {
                total: achievements.count,
                returned: formattedAchievements.length,
                categories: Object.keys(achievementsByCategory).length
            },
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                has_more: offset + formattedAchievements.length < achievements.count
            }
        });

    } catch (err) {
        console.error('Error getting public achievements:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// Helper functions
async function getConditionValue(user, conditionType, sessionData = {}) {
    const stats = user.statistics;

    switch (conditionType) {
        case 'games_played':
            return stats?.games_played || 0;
        case 'total_score':
            return stats?.total_score || 0;
        case 'best_score':
            return stats?.best_score || 0;
        case 'level_reached':
            return user.current_level || 1;
        case 'coins_accumulated':
            return user.coins || 0;
        case 'followers_count':
            return user.followers_count || 0;
        case 'experience_points':
            return user.experience_points || 0;
        case 'consecutive_correct':
            return sessionData.consecutive_correct || 0;
        case 'speed_average':
            return sessionData.average_response_time || 0;
        case 'accuracy_percentage':
            return sessionData.accuracy_percentage || 0;
        default:
            return 0;
    }
}

function checkCondition(currentValue, operator, targetValue) {
    switch (operator) {
        case '>=': return currentValue >= targetValue;
        case '>': return currentValue > targetValue;
        case '=': return currentValue === targetValue;
        case '<': return currentValue < targetValue;
        case '<=': return currentValue <= targetValue;
        default: return false;
    }
}

async function awardAchievementRewards(userId, achievement) {
    const updates = {};

    if (achievement.coin_reward > 0) {
        updates.coins = sequelize.literal(`coins + ${achievement.coin_reward}`);
    }

    if (achievement.experience_reward > 0) {
        updates.experience_points = sequelize.literal(`experience_points + ${achievement.experience_reward}`);
    }

    if (Object.keys(updates).length > 0) {
        await User.update(updates, { where: { id: userId } });
    }
}

async function createAchievementNotification(userId, achievement) {
    await Notification.create({
        user_id: userId,
        type: 'achievement_unlocked',
        title: 'Achievement Unlocked!',
        message: `You've unlocked "${achievement.name}": ${achievement.description}`,
        related_achievement_id: achievement.id,
        is_read: false
    });
} 