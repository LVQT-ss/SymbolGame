import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const GameSession = sequelize.define('GameSession', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    difficulty_level: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    number_of_rounds: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
    },
    total_time: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    correct_answers: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    score: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    is_public: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    likes_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    comments_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    recording_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    recording_duration: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
    },
    // Admin-created session tracking
    created_by_admin: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Admin user ID who created this session for the customer'
    },
    admin_instructions: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Special instructions from admin to customer'
    },
}, {
    tableName: 'game_sessions',
    timestamps: true,
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['completed']
        },
        {
            fields: ['score']
        },
        {
            fields: ['difficulty_level', 'score']
        },
        {
            fields: ['createdAt']
        },
        {
            fields: ['likes_count']
        },
        {
            fields: ['is_public', 'score']
        },
        {
            fields: ['created_by_admin']
        },
        {
            fields: ['created_by_admin', 'completed']
        }
    ]
});

export default GameSession; 