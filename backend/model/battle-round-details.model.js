import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const BattleRoundDetail = sequelize.define('BattleRoundDetail', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    battle_session_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'battle_sessions',
            key: 'id'
        }
    },
    round_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1
        }
    },
    first_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    second_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    correct_symbol: {
        type: DataTypes.STRING(1),
        allowNull: false,
        validate: {
            isIn: [['>', '<', '=']]
        }
    },
    // Creator's response
    creator_symbol: {
        type: DataTypes.STRING(1),
        allowNull: true,
        validate: {
            isIn: [['>', '<', '=']]
        }
    },
    creator_response_time: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Creator response time in seconds'
    },
    creator_is_correct: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    creator_answered_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    // Opponent's response
    opponent_symbol: {
        type: DataTypes.STRING(1),
        allowNull: true,
        validate: {
            isIn: [['>', '<', '=']]
        }
    },
    opponent_response_time: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Opponent response time in seconds'
    },
    opponent_is_correct: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    opponent_answered_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    // Round result
    round_winner: {
        type: DataTypes.ENUM('creator', 'opponent', 'tie'),
        allowNull: true,
        comment: 'Winner of this specific round'
    }
}, {
    tableName: 'battle_round_details',
    timestamps: true,
    indexes: [
        {
            fields: ['battle_session_id']
        },
        {
            unique: true,
            fields: ['battle_session_id', 'round_number']
        },
        {
            fields: ['round_winner']
        }
    ]
});

export default BattleRoundDetail; 