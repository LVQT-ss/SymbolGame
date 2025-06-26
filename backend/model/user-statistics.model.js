import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const UserStatistics = sequelize.define('UserStatistics', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    difficulty_level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            isIn: [[1, 2, 3]] // Only allow difficulty levels 1, 2, 3
        },
        comment: 'Difficulty level: 1=Easy, 2=Medium, 3=Hard'
    },
    games_played: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    best_score: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    best_score_time: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Time taken to achieve the best score (in seconds)'
    },
    best_score_achieved_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the best score was achieved'
    },
    total_score: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
}, {
    tableName: 'user_statistics',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'difficulty_level'],
            name: 'unique_user_difficulty'
        },
        {
            fields: ['best_score'],
            name: 'idx_best_score'
        }
    ]
});

export default UserStatistics; 