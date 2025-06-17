import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const Achievement = sequelize.define('Achievement', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    category: {
        type: DataTypes.ENUM('performance', 'progress', 'social', 'consistency', 'special', 'difficulty'),
        allowNull: false,
        defaultValue: 'progress'
    },
    badge_color: {
        type: DataTypes.STRING(7),
        allowNull: true,
        defaultValue: '#4CAF50',
        comment: 'Hex color code for achievement badge'
    },
    points: {
        type: DataTypes.INTEGER,
        defaultValue: 100,
        comment: 'Achievement points awarded'
    },
    coin_reward: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Coins awarded for completing achievement'
    },
    experience_reward: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Experience points awarded'
    },
    // Condition fields for automatic achievement checking
    condition_type: {
        type: DataTypes.ENUM(
            'games_played', 'total_score', 'best_score', 'accuracy_percentage',
            'speed_average', 'consecutive_correct', 'consecutive_days', 'total_time',
            'followers_count', 'likes_received', 'comments_made', 'level_reached',
            'coins_accumulated', 'achievements_unlocked', 'special_event'
        ),
        allowNull: false,
        comment: 'Type of condition to check for achievement'
    },
    condition_value: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Target value for the condition'
    },
    condition_operator: {
        type: DataTypes.ENUM('>=', '>', '=', '<', '<='),
        allowNull: false,
        defaultValue: '>=',
        comment: 'Comparison operator for condition'
    },
    // Progressive achievement fields
    max_progress: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Maximum progress value for progressive achievements'
    },
    progress_increment: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: 'How much progress increases per qualifying action'
    },
    // Time-based conditions
    time_frame: {
        type: DataTypes.ENUM('none', 'daily', 'weekly', 'monthly'),
        defaultValue: 'none',
        comment: 'Time frame for achievement completion'
    },
    start_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Start date for time-limited achievements'
    },
    end_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'End date for time-limited achievements'
    },
    // Metadata
    is_hidden: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Hidden achievements not shown until unlocked'
    },
    is_secret: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Secret achievements with hidden conditions'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    created_by_admin: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID of admin who created this achievement'
    },
    unlock_message: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Custom message shown when achievement is unlocked'
    }
}, {
    tableName: 'achievements',
    timestamps: true,
    indexes: [
        {
            fields: ['is_active']
        },
        {
            fields: ['category']
        },
        {
            fields: ['condition_type']
        },
        {
            fields: ['start_date', 'end_date']
        }
    ]
});

export default Achievement; 