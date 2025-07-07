import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const GameHistory = sequelize.define('GameHistory', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    game_session_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'game_sessions',
            key: 'id'
        }
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    total_time: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Total completion time in seconds'
    },
    correct_answers: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    score: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    started_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When user actually started playing'
    },
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When user completed the game session'
    },
    recording_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'URL to game recording'
    },
    recording_duration: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
        comment: 'Recording duration in seconds'
    }
}, {
    tableName: 'game_history',
    timestamps: true,
    indexes: [
        {
            fields: ['game_session_id']
        },
        {
            fields: ['user_id']
        },

        {
            fields: ['score']
        },
        {
            fields: ['game_session_id', 'score']
        },
        {
            fields: ['user_id', 'game_session_id']
        },
        {
            fields: ['completed']
        },
        {
            fields: ['started_at']
        }
    ]
});

export default GameHistory; 