import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const BattleSession = sequelize.define('BattleSession', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    battle_code: {
        type: DataTypes.STRING(8),
        unique: true,
        allowNull: false,
        comment: 'Unique 8-character code for players to join battle'
    },
    creator_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'User who created the battle'
    },
    opponent_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'User who joined the battle'
    },
    number_of_rounds: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
        validate: {
            min: 1,
            max: 20
        }
    },
    winner_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'ID of the winner, null if tie or not completed'
    },
    creator_score: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    opponent_score: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    creator_correct_answers: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    opponent_correct_answers: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    creator_total_time: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        comment: 'Total time taken by creator in seconds'
    },
    opponent_total_time: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        comment: 'Total time taken by opponent in seconds'
    },
    creator_completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    opponent_completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    started_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When both players started the battle'
    },
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the battle was completed'
    },
    completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'True when both creator and opponent have completed the battle'
    },
    time_limit: {
        type: DataTypes.INTEGER,
        defaultValue: 600,
        comment: 'Battle time limit in seconds (default: 10 minutes)'
    },
    is_public: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Whether battle results are public'
    }
}, {
    tableName: 'battle_sessions',
    timestamps: true,
    indexes: [
        {
            fields: ['battle_code']
        },
        {
            fields: ['creator_id']
        },
        {
            fields: ['opponent_id']
        },
        {
            fields: ['winner_id']
        },
        {
            fields: ['started_at']
        },
        {
            fields: ['completed_at']
        },
        {
            fields: ['completed']
        }
    ]
});

export default BattleSession; 