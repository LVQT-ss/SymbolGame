import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const UserStatistics = sequelize.define('UserStatistics', {
    user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
    },
    difficulty_level: {
        type: DataTypes.INTEGER,
        primaryKey: true,
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
    total_score: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
}, {
    tableName: 'user_statistics',
    timestamps: true,
});

export default UserStatistics; 