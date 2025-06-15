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
        allowNull: true
    },
    current_progress: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    max_progress: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    is_completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    completion_percentage: {
        type: DataTypes.FLOAT,
        defaultValue: 0.0
    },
    acquired_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    started_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    last_updated: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    // For time-based achievements
    reset_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    streak_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    best_streak: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    // Metadata
    unlock_data: {
        type: DataTypes.JSON,
        allowNull: true
    },
    is_showcased: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    notification_sent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
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