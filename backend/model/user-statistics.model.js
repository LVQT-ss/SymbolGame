import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const UserStatistics = sequelize.define('UserStatistics', {
    user_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
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