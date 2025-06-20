import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const UserRoundResponse = sequelize.define('UserRoundResponse', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    round_detail_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'round_details',
            key: 'id'
        }
    },
    game_history_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'game_history',
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
    user_symbol: {
        type: DataTypes.STRING(1),
        allowNull: true,
        validate: {
            isIn: [['>', '<', '=']]
        },
        comment: 'Symbol entered by user: >, <, or ='
    },
    response_time: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Response time in seconds'
    },
    is_correct: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    points_earned: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    answered_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the user answered this round'
    }
}, {
    tableName: 'user_round_responses',
    timestamps: true,
    indexes: [
        {
            fields: ['round_detail_id']
        },
        {
            fields: ['game_history_id']
        },
        {
            fields: ['user_id']
        },
        {
            unique: true,
            fields: ['round_detail_id', 'game_history_id'],
            name: 'unique_round_response'
        },
        {
            fields: ['user_id', 'is_correct']
        },
        {
            fields: ['response_time']
        },
        {
            fields: ['is_correct']
        },
        {
            fields: ['points_earned']
        }
    ]
});

export default UserRoundResponse; 