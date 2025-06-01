import Achievement from '../model/achievements.model.js';
import UserAchievement from '../model/user-achievements.model.js';

// GET /api/achievements
export const getAllAchievements = async (req, res) => {
    const { category } = req.query;

    try {
        const whereCondition = {};
        if (category) {
            whereCondition.category = category;
        }

        const achievements = await Achievement.findAll({
            where: whereCondition,
            order: [['category', 'ASC'], ['points_required', 'ASC']]
        });

        // Group achievements by category
        const categorizedAchievements = achievements.reduce((acc, achievement) => {
            if (!acc[achievement.category]) {
                acc[achievement.category] = [];
            }
            acc[achievement.category].push(achievement);
            return acc;
        }, {});

        res.status(200).json({
            message: 'Achievements retrieved successfully',
            total: achievements.length,
            categories: Object.keys(categorizedAchievements),
            achievements: categorizedAchievements
        });
    } catch (err) {
        console.error('Error fetching achievements:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/achievements/me
export const getUserAchievements = async (req, res) => {
    const userId = req.userId; // From JWT token
    const { earned_only = false } = req.query;

    try {
        // Get all achievements
        const allAchievements = await Achievement.findAll({
            order: [['category', 'ASC'], ['points_required', 'ASC']]
        });

        // Get user's earned achievements
        const userAchievements = await UserAchievement.findAll({
            where: { user_id: userId },
            include: [
                {
                    model: Achievement,
                    as: 'achievement'
                }
            ]
        });

        // Create a map of earned achievements
        const earnedMap = userAchievements.reduce((acc, ua) => {
            acc[ua.achievement_id] = {
                earned_at: ua.earned_at,
                progress: ua.progress
            };
            return acc;
        }, {});

        let resultAchievements;

        if (earned_only === 'true') {
            // Return only earned achievements
            resultAchievements = userAchievements.map(ua => ({
                ...ua.achievement.toJSON(),
                earned_at: ua.earned_at,
                progress: ua.progress,
                is_earned: true
            }));
        } else {
            // Return all achievements with earned status
            resultAchievements = allAchievements.map(achievement => ({
                ...achievement.toJSON(),
                is_earned: !!earnedMap[achievement.id],
                earned_at: earnedMap[achievement.id]?.earned_at || null,
                progress: earnedMap[achievement.id]?.progress || 0
            }));
        }

        // Group by category
        const categorizedAchievements = resultAchievements.reduce((acc, achievement) => {
            if (!acc[achievement.category]) {
                acc[achievement.category] = [];
            }
            acc[achievement.category].push(achievement);
            return acc;
        }, {});

        // Calculate statistics
        const totalAchievements = allAchievements.length;
        const earnedAchievements = userAchievements.length;
        const completionPercentage = Math.round((earnedAchievements / totalAchievements) * 100);

        res.status(200).json({
            message: 'User achievements retrieved successfully',
            statistics: {
                total_achievements: totalAchievements,
                earned_achievements: earnedAchievements,
                completion_percentage: completionPercentage
            },
            categories: Object.keys(categorizedAchievements),
            achievements: categorizedAchievements
        });
    } catch (err) {
        console.error('Error fetching user achievements:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
}; 