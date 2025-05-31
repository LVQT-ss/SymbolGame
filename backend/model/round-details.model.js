import { DataTypes } from 'sequelize';
import sequelize from '../database/db.js';

const RoundDetail = sequelize.define('RoundDetail', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    game_session_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    round_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
    user_symbol: {
        type: DataTypes.STRING(1),
        allowNull: true,
        validate: {
            isIn: [['>', '<', '=']]
        }
    },
    response_time: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    is_correct: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    tableName: 'round_details',
    timestamps: true,
    indexes: [
        {
            fields: ['game_session_id']
        },
        {
            unique: true,
            fields: ['game_session_id', 'round_number']
        }
    ]
});

export default RoundDetail; 