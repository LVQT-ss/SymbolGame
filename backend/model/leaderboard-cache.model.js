import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const LeaderboardCache = sequelize.define('LeaderboardCache', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    leaderboard_type: {
        type: DataTypes.ENUM('regional', 'monthly', 'allTime'),
        allowNull: false,
        comment: 'Type of leaderboard: regional, monthly, or allTime'
    },
    region: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'Region code: asia, america, europe, oceania, africa. null for monthly global'
    },
    difficulty_level: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Difficulty level filter, null for all difficulties'
    },
    user_statistics_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'user_statistics',
            key: 'id'
        },
        comment: 'References the specific UserStatistics record this leaderboard entry represents'
    },
    rank_position: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Current rank in this leaderboard'
    },
    score: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Score used for ranking'
    },
    total_time: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Total time spent playing (in seconds)'
    },
    full_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    avatar: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    current_level: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    country: {
        type: DataTypes.STRING(3),
        allowNull: true,
        comment: 'Player country code (VN, US, JP, etc.)'
    },

    total_games: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Total games played'
    },
    last_updated: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        comment: 'When this cache entry was last updated'
    }
}, {
    tableName: 'leaderboard_cache',
    timestamps: true,
    indexes: [
        {
            fields: ['leaderboard_type', 'region', 'difficulty_level', 'rank_position'],
            name: 'idx_leaderboard_fast_query'
        },
        {
            unique: true,
            fields: ['leaderboard_type', 'user_id'],
            name: 'idx_leaderboard_user_unique'
        },
        {
            fields: ['last_updated'],
            name: 'idx_leaderboard_last_updated'
        }
    ]
});

export default LeaderboardCache; 