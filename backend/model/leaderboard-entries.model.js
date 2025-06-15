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
    leaderboard_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            isIn: [[
                'overall_score', 'best_single_game', 'speed_masters', 'accuracy_kings',
                'experience_leaders', 'level_champions', 'most_followed', 'most_liked',
                'most_active', 'community_stars', 'achievement_hunters', 'consistency_rating',
                'improvement_rate', 'streak_masters'
            ]]
        }
    },
    time_period: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'all_time',
        validate: {
            isIn: [['daily', 'weekly', 'monthly', 'all_time']]
        }
    },
    period_start: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    period_end: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    rank_position: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    previous_rank: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    score_value: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    secondary_value: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    tier: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: {
            isIn: [['bronze', 'silver', 'gold', 'platinum', 'diamond']]
        }
    },
    // Metadata for ranking
    games_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    last_game_date: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    trend: {
        type: DataTypes.STRING(20),
        defaultValue: 'new',
        validate: {
            isIn: [['up', 'down', 'stable', 'new']]
        }
    },
    points_change: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    rank_change: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    // Special achievements
    is_season_best: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    is_personal_best: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    is_record_holder: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    // Additional data
    extra_data: {
        type: DataTypes.JSON,
        allowNull: true,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    last_updated: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    }
}, {
    tableName: 'leaderboard_entries',
    timestamps: true,
    indexes: [
        {
            fields: ['user_id']
        },
        {
            fields: ['leaderboard_type']
        },
        {
            fields: ['time_period']
        },
        {
            fields: ['rank_position']
        },
        {
            fields: ['leaderboard_type', 'time_period']
        },
        {
            fields: ['leaderboard_type', 'time_period', 'rank_position']
        },
        {
            fields: ['user_id', 'leaderboard_type', 'time_period']
        },
        {
            fields: ['period_start', 'period_end']
        },
        {
            fields: ['tier']
        },
        {
            fields: ['is_active']
        },
        {
            fields: ['score_value']
        }
    ],
    hooks: {
        beforeUpdate: (entry) => {
            entry.last_updated = new Date();

            // Calculate rank change
            if (entry.previous_rank && entry.rank_position) {
                entry.rank_change = entry.previous_rank - entry.rank_position;

                // Determine trend
                if (entry.rank_change > 0) {
                    entry.trend = 'up';
                } else if (entry.rank_change < 0) {
                    entry.trend = 'down';
                } else {
                    entry.trend = 'stable';
                }
            }
        },
        beforeCreate: (entry) => {
            // Set initial trend for new entries
            if (!entry.previous_rank) {
                entry.trend = 'new';
            }
        }
    }
});

export default LeaderboardEntry; 