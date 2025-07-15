import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';
import User from './user.model.js';

const GameHistoryStatisticCurrentMonth = sequelize.define('GameHistoryStatisticCurrentMonth', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    difficulty_level: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    best_score: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    best_score_time: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
    },
    games_played: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    total_score: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    month_year: {
        type: DataTypes.STRING(7), // 'YYYY-MM'
        allowNull: false,
    },
}, {
    tableName: 'game_history_statistic_current_month',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'difficulty_level', 'month_year'],
            name: 'unique_user_difficulty_month'
        }
    ]
});

GameHistoryStatisticCurrentMonth.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

export default GameHistoryStatisticCurrentMonth; 