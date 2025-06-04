import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const UserAchievement = sequelize.define('UserAchievement', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    achievement_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    game_session_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Game session that triggered the achievement (if applicable)'
    },
    current_progress: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Current progress toward achievement completion'
    },
    max_progress: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Maximum progress needed (copied from achievement for tracking)'
    },
    is_completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether the achievement has been completed'
    },
    completion_percentage: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0,
        comment: 'Percentage of achievement completion (0-100)'
    },
    acquired_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the achievement was completed (null if not completed)'
    },
    started_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        comment: 'When progress on this achievement started'
    },
    last_updated: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        comment: 'Last time progress was updated'
    },
    // For time-based achievements
    reset_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Next reset date for recurring achievements'
    },
    streak_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Current streak for streak-based achievements'
    },
    best_streak: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Best streak achieved'
    },
    // Metadata
    unlock_data: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Additional data about how achievement was unlocked'
    },
    is_showcased: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether user has chosen to showcase this achievement'
    },
    notification_sent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether unlock notification has been sent'
    }
}, {
    tableName: 'user_achievements',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'achievement_id']
        },
        {
            fields: ['user_id']
        },
        {
            fields: ['achievement_id']
        },
        {
            fields: ['is_completed']
        },
        {
            fields: ['acquired_at']
        },
        {
            fields: ['is_showcased']
        },
        {
            fields: ['user_id', 'is_completed']
        }
    ],
    hooks: {
        beforeUpdate: (userAchievement) => {
            userAchievement.last_updated = new Date();

            // Calculate completion percentage
            if (userAchievement.max_progress && userAchievement.max_progress > 0) {
                userAchievement.completion_percentage = Math.min(
                    100,
                    (userAchievement.current_progress / userAchievement.max_progress) * 100
                );

                // Check if achievement is completed
                if (userAchievement.current_progress >= userAchievement.max_progress && !userAchievement.is_completed) {
                    userAchievement.is_completed = true;
                    userAchievement.acquired_at = new Date();
                }
            }
        },
        beforeCreate: (userAchievement) => {
            // Calculate initial completion percentage
            if (userAchievement.max_progress && userAchievement.max_progress > 0) {
                userAchievement.completion_percentage = Math.min(
                    100,
                    (userAchievement.current_progress / userAchievement.max_progress) * 100
                );

                // Check if achievement is completed on creation
                if (userAchievement.current_progress >= userAchievement.max_progress) {
                    userAchievement.is_completed = true;
                    userAchievement.acquired_at = new Date();
                }
            }
        }
    }
});

export default UserAchievement; 