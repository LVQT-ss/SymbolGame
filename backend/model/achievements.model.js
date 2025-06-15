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
        allowNull: true,
    },
    category: {
        type: DataTypes.ENUM('performance', 'progress', 'social', 'consistency', 'special', 'difficulty'),
        allowNull: false,
        defaultValue: 'progress'
    },
    points: {
        type: DataTypes.INTEGER,
        defaultValue: 100
    },
    coin_reward: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    experience_reward: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    condition_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'count'
    },
    condition_value: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    condition_operator: {
        type: DataTypes.STRING(10),
        defaultValue: '>='
    },
    max_progress: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    progress_increment: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    badge_color: {
        type: DataTypes.STRING(7),
        defaultValue: '#4CAF50'
    },
    is_hidden: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_secret: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    created_by_admin: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    // Time-based conditions
    time_frame: {
        type: DataTypes.ENUM('none', 'daily', 'weekly', 'monthly'),
        defaultValue: 'none',
        allowNull: false
    },
    start_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    end_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    unlock_message: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'achievements',
    timestamps: true,
    indexes: [
        {
            fields: ['category']
        },
        {
            fields: ['time_frame']
        },
        {
            fields: ['start_date', 'end_date']
        }
    ]
});

export default Achievement;