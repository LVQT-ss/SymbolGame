import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const LeaderboardEntry = sequelize.define('LeaderboardEntry', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    period_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            isIn: [['daily', 'weekly', 'monthly', 'all_time']]
        }
    },
    total_score: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    games_played: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    games_won: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    rank: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
}, {
    tableName: 'leaderboard_entries',
    timestamps: true,
    indexes: [
        {
            fields: ['period_type', 'rank']
        },
        {
            fields: ['period_type', 'total_score']
        }
    ]
});

export default LeaderboardEntry; 